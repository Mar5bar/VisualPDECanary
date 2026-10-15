// sim_wgsl.js
//
// Generates the WGSL compute shaders that timestep VisualPDE simulations on WebGPU. They
// mirror the GLSL in simulation_shaders.js: the parts that depend on how the state is stored
// (stencil fetches, the timestepping schemes, writing the result) are written here directly,
// and everything else (boundary conditions, reactions, diffusion, Dirichlet conditions and
// algebraic species) is the very GLSL that setRDEquations() assembles for WebGL, translated by
// glsl_to_wgsl.js. So both backends share one source of truth for the maths.
//
// State layout: each history slot is one storage buffer of vec4f, with the species groups
// (species 1-4, 5-8) of each node interleaved: node n of group g is element n * G + g. Nodes
// are numbered row by row from the bottom, n = j * nX + i, as in a WebGL readback.

import { translateExpression, translateStatements } from "./glsl_to_wgsl.js";

export const WORKGROUP_SIZE = [8, 8];

// The size in bytes of the Uniforms struct below, rounded up to the 256-byte alignment that
// dynamic uniform buffer offsets require.
export const UNIFORM_STRIDE = 256;

/**
 * Writes the values of the Uniforms struct into a buffer at the given byte offset.
 * @param {DataView} view
 * @param {number} offset
 * @param {Object} u - nX, nY, isTwoD, dt, dx, dy, t, L, L_x, L_y, L_min, seed and
 *   globalIntegralValues (an array of 4).
 */
export function writeUniforms(view, offset, u) {
  view.setUint32(offset + 0, u.nX, true);
  view.setUint32(offset + 4, u.nY, true);
  view.setUint32(offset + 8, u.isTwoD ? 1 : 0, true);
  view.setUint32(offset + 12, 0, true);
  const floats = [
    u.dt, u.dx, u.dy, u.t,
    u.L, u.L_x, u.L_y, u.L_min,
    u.seed, ...(u.globalIntegralValues ?? [0, 0, 0, 0]),
    u.inf ?? Infinity,
  ];
  floats.forEach((v, k) => view.setFloat32(offset + 16 + 4 * k, v, true));
}

const UNIFORMS_STRUCT = `
struct Uniforms {
  nX: u32, nY: u32, isTwoD: u32, pad0: u32,
  dt: f32, dx: f32, dy: f32, t: f32,
  L: f32, L_x: f32, L_y: f32, L_min: f32,
  seed: f32, gi1: f32, gi2: f32, gi3: f32,
  gi4: f32, inf: f32,
}`;

// The helper functions that auxiliary_GLSL_funs.js (and the erfinv defined alongside it in
// the GLSL templates) provide to WebGL shaders.
const AUXILIARY_WGSL = `
const pi = 3.141592653589793;

fn vpde_mod(x: f32, y: f32) -> f32 { return x - y * floor(x / y); }
fn vpde_isnan(x: f32) -> bool { return x != x; }
fn vpde_isinf(x: f32) -> bool { return abs(x) > 3.4028234663852886e38; }

fn H1(VALUE: f32) -> f32 { return smoothstep(-0.01, 0.01, VALUE); }
fn H2(VALUE: f32, EDGE: f32) -> f32 { return smoothstep(-0.01, 0.01, VALUE - EDGE); }

fn safetanh(VALUE: f32) -> f32 { return 1.0 - 2.0 / (1.0 + exp(2.0 * VALUE)); }

fn safepow(x: f32, y: f32) -> f32 {
  if (x >= 0.0) { return pow(x, y); }
  if (vpde_mod(round(y), 2.0) == 0.0) { return pow(-x, y); }
  return -pow(-x, y);
}

fn Gauss(x: f32, y: f32, MX: f32, MY: f32, SX: f32, SY: f32, CORR: f32) -> f32 {
  return exp(-((x-MX)*(x-MX)/(2.0*SX*SX)+(y-MY)*(y-MY)/(2.0*SY*SY)-CORR*(x-MX)*(y-MY)/(SX*SY))/(1.0-CORR*CORR))/(2.0*pi*SX*SY*sqrt(1.0-CORR*CORR));
}

fn Bump(x: f32, y: f32, MX: f32, MY: f32, MAXR: f32) -> f32 {
  var yDiff = 0.0;
  if (U.isTwoD != 0u) { yDiff = y - MY; }
  let RADIUSSQ = ((x-MX)*(x-MX)+(yDiff)*(yDiff)) / (MAXR*MAXR);
  if (RADIUSSQ < 1.0) { return exp(1.0-1.0/(1.0-RADIUSSQ)); }
  return 0.0;
}

const ALPHA = 0.147;
const INV_ALPHA = 1.0 / ALPHA;
const BETA = 2.0 / (pi * ALPHA);
fn erfinv(pERF: f32) -> f32 {
  var yERF: f32;
  if (pERF == -1.0) {
    yERF = log(1.0 - (-0.99)*(-0.99));
  } else {
    yERF = log(1.0 - pERF*pERF);
  }
  let zERF = BETA + 0.5 * yERF;
  return sqrt(sqrt(zERF*zERF - yERF * INV_ALPHA) - zERF) * sign(pERF);
}
`;

// GLSL sampler names, and which history slot (relative to the pass's inputs) and species
// group each refers to.
const SAMPLERS = {
  textureSource: [0, 0],
  textureSourceGroup1: [0, 1],
  textureSource1: [1, 0],
  textureSource1Group1: [1, 1],
  textureSource2: [2, 0],
  textureSource2Group1: [2, 1],
  textureSource3: [3, 0],
  textureSource3Group1: [3, 1],
};

/**
 * @typedef {Object} SimShaderParts - What setRDEquations() assembles, as GLSL.
 * @property {number} numGroups - 1 (up to 4 species) or 2 (5-8 species).
 * @property {[boolean, boolean][]} clamp - Per group, whether the state is clamped (rather
 *   than wrapped) at the edges in x and in y, mirroring the WebGL textures' wrap modes.
 * @property {string[]} paramNames - The kinetic parameters, in the order of the params buffer.
 * @property {string} middle - The body of computeRHS, as built for WebGL (ending with the
 *   brace that closes it).
 * @property {Object<string, string>} bot - Per pass, the code following the scheme's update:
 *   Dirichlet conditions and algebraic species.
 * @property {string} timescales - The GLSL vec4 of group 0's timescales.
 * @property {string} timescalesGroup1 - Likewise for group 1.
 * @property {string} minX - GLSL for the domain's minimum x.
 * @property {string} minY - GLSL for the domain's minimum y.
 */

function translationOptions(parts, extraCalls = {}) {
  const renames = {};
  parts.paramNames.forEach((name) => (renames[name] = "P_" + name));
  const nearest = ([tex, uv]) => {
    const sampler = SAMPLERS[tex];
    if (!sampler) throw new Error("Unknown sampler " + tex);
    return `fetchNearest(${sampler[0]}u, ${sampler[1]}u, ${uv})`;
  };
  return {
    renames,
    calls: {
      texture2D: nearest,
      texture: ([tex, uv]) => {
        if (tex == "imageSourceOne") return `textureSampleLevel(imageOne, imageSampler, ${uv}, 0.0)`;
        if (tex == "imageSourceTwo") return `textureSampleLevel(imageTwo, imageSampler, ${uv}, 0.0)`;
        return nearest([tex, uv]);
      },
      textureBilinear: ([tex, uv]) => {
        const sampler = SAMPLERS[tex];
        if (!sampler) throw new Error("Unknown sampler " + tex);
        return `fetchBilinear(${sampler[0]}u, ${sampler[1]}u, ${uv})`;
      },
      ...extraCalls,
    },
  };
}

// Declarations shared by every entry point and helper: the uniforms, parameters and the
// node-relative quantities the GLSL templates expect (x, y, textureCoords, step_x, ...).
function commonLets(parts, opts, { withT = true, clearCoords = false } = {}) {
  const params = parts.paramNames
    .map((name, k) => `  let P_${name} = params[${k >> 2}][${k & 3}];`)
    .join("\n");
  const minX = translateExpression(parts.minX, opts);
  const minY = translateExpression(parts.minY, opts);
  // The initial-condition shader positions nodes using the grid size and spatial step,
  // rather than the domain size, exactly as clear_shader.js does.
  const xy = clearCoords
    ? `  let x = ${minX} + textureCoords.x * f32(U.nX) * dx;
  let y = ${minY} + textureCoords.y * f32(U.nY) * dy;`
    : `  let x = textureCoords.x * L_x + ${minX};
  let y = textureCoords.y * L_y + ${minY};`;
  return `
  let dt = U.dt;
  let dx = U.dx;
  let dy = U.dy;
  let L = U.L;
  let L_x = U.L_x;
  let L_y = U.L_y;
  let L_min = U.L_min;
  let seed = U.seed;
  let globalIntegralValue1 = U.gi1;
  let globalIntegralValue2 = U.gi2;
  let globalIntegralValue3 = U.gi3;
  let globalIntegralValue4 = U.gi4;
  let nXDisc = i32(U.nX);
  let nYDisc = i32(U.nY);
${withT ? "  let t = U.t;" : ""}
${params}
  let textureCoords = (vec2f(f32(i), f32(j)) + 0.5) / vec2f(f32(U.nX), f32(U.nY));
  let step_x = 1.0 / f32(U.nX);
  let step_y = 1.0 / f32(U.nY);
${xy}
  let interior = f32(textureCoords.x > 0.75*step_x && textureCoords.x < 1.0 - 0.75*step_x && textureCoords.y > 0.5*step_y && textureCoords.y < 1.0 - 0.75*step_y);
  let exterior = 1.0 - interior;
`;
}

// Bindings, index helpers and fetches for a module with the given number of input slots.
function prelude(parts) {
  const G = parts.numGroups;
  const clampConsts = parts.clamp
    .map(([cx, cy], g) => `const CLAMP_X_${g} = ${cx};\nconst CLAMP_Y_${g} = ${cy};`)
    .join("\n");
  const selectSlot = [0, 1, 2, 3]
    .map((s) => `  if (slot == ${s}u) { return src${s}[k]; }`)
    .join("\n");
  return `${UNIFORMS_STRUCT}
@group(0) @binding(0) var<uniform> U: Uniforms;
@group(0) @binding(1) var<storage, read> params: array<vec4f>;
@group(0) @binding(2) var<storage, read> src0: array<vec4f>;
@group(0) @binding(3) var<storage, read> src1: array<vec4f>;
@group(0) @binding(4) var<storage, read> src2: array<vec4f>;
@group(0) @binding(5) var<storage, read> src3: array<vec4f>;
@group(0) @binding(6) var<storage, read_write> dst: array<vec4f>;
@group(0) @binding(7) var imageOne: texture_2d<f32>;
@group(0) @binding(8) var imageTwo: texture_2d<f32>;
@group(0) @binding(9) var imageSampler: sampler;

const G = ${G}u;
${clampConsts}

fn wrapIndex(k: i32, n: i32, clampIt: bool) -> i32 {
  if (clampIt) { return clamp(k, 0, n - 1); }
  return ((k % n) + n) % n;
}

// The element of a slot holding group g at node (i, j), wrapping or clamping out-of-range
// indices as the WebGL textures do.
fn element(g: u32, i: i32, j: i32) -> u32 {
  let nX = i32(U.nX);
  let nY = i32(U.nY);
  var cx = CLAMP_X_0;
  var cy = CLAMP_Y_0;
${G > 1 ? "  if (g == 1u) { cx = CLAMP_X_1; cy = CLAMP_Y_1; }" : ""}
  let ii = wrapIndex(i, nX, cx);
  let jj = wrapIndex(j, nY, cy);
  return u32(jj * nX + ii) * G + g;
}

fn fetch(slot: u32, g: u32, i: i32, j: i32) -> vec4f {
  let k = element(g, i, j);
${selectSlot}
  return vec4f(0.0);
}

// A nearest-neighbour lookup at texture coordinates uv, as a WebGL texture2D() call does.
fn fetchNearest(slot: u32, g: u32, uv: vec2f) -> vec4f {
  let size = vec2f(f32(U.nX), f32(U.nY));
  let ij = vec2i(floor(uv * size));
  return fetch(slot, g, ij.x, ij.y);
}

// Bilinear interpolation, exactly as textureBilinear() in auxiliary_GLSL_funs.js.
fn fetchBilinear(slot: u32, g: u32, uv: vec2f) -> vec4f {
  let size = vec2f(f32(U.nX), f32(U.nY));
  let st = uv * size - 0.5;
  let base = floor(st);
  var f = st - base;
  f = select(f, vec2f(0.0), f < vec2f(1e-4));
  f = select(f, vec2f(1.0), f > vec2f(1.0 - 1e-4));
  let i0 = i32(base.x);
  let j0 = i32(base.y);
  return mix(
    mix(fetch(slot, g, i0, j0), fetch(slot, g, i0 + 1, j0), f.x),
    mix(fetch(slot, g, i0, j0 + 1), fetch(slot, g, i0 + 1, j0 + 1), f.x),
    f.y
  );
}
${AUXILIARY_WGSL}`;
}

const STENCIL = [
  ["", 0, 0],
  ["L", -1, 0],
  ["R", 1, 0],
  ["T", 0, 1],
  ["B", 0, -1],
  ["LL", -2, 0],
  ["RR", 2, 0],
  ["TT", 0, 2],
  ["BB", 0, -2],
];

// Assigns the stencil locals (uvwq, uvwqL, ..., and uvwq2... for group 1) from a slot,
// optionally plus a coefficient times another slot, matching RDShaderMain's arithmetic.
function stencilFetch(G, slot, combineSlot, coefficient) {
  const lines = [];
  for (let g = 0; g < G; g++) {
    const prefix = g == 0 ? "uvwq" : "uvwq2";
    for (const [suffix, di, dj] of STENCIL) {
      const base = `fetch(${slot}u, ${g}u, i + ${di}, j + ${dj})`;
      const value =
        combineSlot == undefined
          ? base
          : `${base} + ${coefficient}*fetch(${combineSlot}u, ${g}u, i + ${di}, j + ${dj})`;
      lines.push(`  ${prefix}${suffix} = ${value};`);
    }
  }
  return lines.join("\n");
}

function stencilArgs(G) {
  const names = [];
  for (let g = 0; g < G; g++) {
    const prefix = g == 0 ? "uvwq" : "uvwq2";
    for (const [suffix] of STENCIL) names.push(prefix + suffix);
  }
  return names.join(", ");
}

function computeRHSFunction(parts, opts) {
  const G = parts.numGroups;
  const params = [];
  const copies = [];
  for (let g = 0; g < G; g++) {
    const prefix = g == 0 ? "uvwq" : "uvwq2";
    for (const [suffix] of STENCIL) {
      params.push(`${prefix}${suffix}In: vec4f`);
      copies.push(`  var ${prefix}${suffix} = ${prefix}${suffix}In;`);
    }
  }
  // The GLSL body ends by closing computeRHS, which the WGSL wrapper does instead.
  const body = parts.middle.replace(/\}\s*$/, "");
  const results = G == 1 ? "var result: vec4f;" : "var result0: vec4f;\n  var result1: vec4f;";
  const ret = G == 1 ? "RHSOut(result, vec4f(0.0))" : "RHSOut(result0, result1)";
  return `
struct RHSOut { r0: vec4f, r1: vec4f }

// srcSlot is the slot computeRHS's GLSL textureSource argument refers to, which u[x,y]
// lookups in its body read from.
fn computeRHS(srcSlot: u32, t: f32, i: i32, j: i32, ${params.join(", ")}) -> RHSOut {
${commonLets(parts, opts, { withT: false })}
${copies.join("\n")}
  let dSquared = 1.0/vec2f(dx*dx, dy*dy);
  ${results}
${translateStatements(body, {
    ...opts,
    calls: {
      ...opts.calls,
      // Inside computeRHS, "textureSource" is its argument rather than the pass's input.
      textureBilinear: ([tex, uv]) =>
        tex == "textureSource"
          ? `fetchBilinear(srcSlot, 0u, ${uv})`
          : opts.calls.textureBilinear([tex, uv]),
    },
  })}
  return ${ret};
}`;
}

// The body of each pass, after the stencils' declarations, mirroring RDShaderMain(MRT).
function schemeBody(type, G) {
  const call = (srcSlot, time, out) =>
    `  let ${out} = computeRHS(${srcSlot}u, ${time}, i, j, ${stencilArgs(G)});`;
  const centre = (slot, g) => `fetch(${slot}u, ${g}u, i, j)`;
  const lines = [];
  const each = (f) => {
    for (let g = 0; g < G; g++) lines.push(f(g, g == 0 ? "" : "2", g == 0 ? "" : "Group1"));
  };
  switch (type) {
    case "FE":
      lines.push(stencilFetch(G, 0), call(0, "t", "out1"));
      each((g, n) => `  RHS${n} = out1.r${g};`);
      each((g, n, s) => `  updated${n} = dt * RHS${n} / timescales${s} + uvwq${n};`);
      break;
    case "AB2":
      lines.push(stencilFetch(G, 0), call(0, "t", "outCur"));
      lines.push(stencilFetch(G, 1), call(1, "t - dt", "outPrev"));
      each((g, n) => `  RHS${n} = 1.5 * outCur.r${g} - 0.5 * outPrev.r${g};`);
      each((g, n, s) => `  updated${n} = dt * RHS${n} / timescales${s} + ${centre(0, g)};`);
      break;
    case "Mid1":
    case "RK41":
      lines.push(stencilFetch(G, 0), call(0, "t", "out1"));
      each((g, n) => `  RHS${n} = out1.r${g};`);
      each((g, n, s) => `  updated${n} = RHS${n} / timescales${s};`);
      break;
    case "RK42":
    case "RK43":
      lines.push(stencilFetch(G, 0, type == "RK42" ? 1 : 2, "0.5*dt"), call(0, "t", "out1"));
      each((g, n) => `  RHS${n} = out1.r${g};`);
      each((g, n, s) => `  updated${n} = RHS${n} / timescales${s};`);
      break;
    case "Mid2":
      each((g, n) => `  let uvwq${n}Last = ${centre(0, g)};`);
      lines.push(stencilFetch(G, 0, 1, "0.5*dt"), call(0, "t", "out1"));
      each((g, n) => `  RHS${n} = out1.r${g};`);
      each((g, n, s) => `  updated${n} = dt * RHS${n} / timescales${s} + uvwq${n}Last;`);
      break;
    case "RK44":
      each((g, n) => `  let uvwq${n}Last = ${centre(0, g)};`);
      lines.push(stencilFetch(G, 0, 3, "dt"), call(0, "t", "out1"));
      each(
        (g, n, s) =>
          `  RHS${n} = (timescales${s} * (${centre(1, g)} + 2.0*(${centre(2, g)} + ${centre(3, g)})) + out1.r${g}) / 6.0;`,
      );
      each((g, n, s) => `  updated${n} = dt * RHS${n} / timescales${s} + uvwq${n}Last;`);
      break;
    default:
      throw new Error("Unknown pass " + type);
  }
  return lines.join("\n");
}

/**
 * Generates the WGSL for one timestepping pass.
 * @param {string} type - "FE", "AB2", "Mid1", "Mid2", "RK41", "RK42", "RK43" or "RK44".
 * @param {SimShaderParts} parts
 * @returns {string}
 */
export function timestepShader(type, parts) {
  const G = parts.numGroups;
  const opts = translationOptions(parts);
  const declarations = [];
  for (let g = 0; g < G; g++) {
    const prefix = g == 0 ? "uvwq" : "uvwq2";
    for (const [suffix] of STENCIL) declarations.push(`  var ${prefix}${suffix}: vec4f;`);
  }
  const outputs = ["  dst[element(0u, i, j)] = updated;"];
  if (G > 1) outputs.push("  dst[element(1u, i, j)] = updated2;");
  return `${prelude(parts)}
${computeRHSFunction(parts, opts)}

@compute @workgroup_size(${WORKGROUP_SIZE.join(", ")})
fn main(@builtin(global_invocation_id) gid: vec3u) {
  if (gid.x >= U.nX || gid.y >= U.nY) { return; }
  let i = i32(gid.x);
  let j = i32(gid.y);
${commonLets(parts, opts)}
${declarations.join("\n")}
  let timescales = ${translateExpression(parts.timescales, opts)};
  var RHS: vec4f;
  var updated: vec4f;
${
  G > 1
    ? `  let timescalesGroup1 = ${translateExpression(parts.timescalesGroup1, opts)};
  var RHS2: vec4f;
  var updated2: vec4f;`
    : ""
}
${schemeBody(type, G)}
${translateStatements(parts.bot[type], opts)}
${outputs.join("\n")}
}`;
}

/**
 * @typedef {Object} ClearShaderParts
 * @property {number} numGroups
 * @property {[boolean, boolean][]} clamp
 * @property {string[]} paramNames
 * @property {string} body - The GLSL declaring u, v, w, q (and u5-u8), as setClearShader()
 *   builds it between its top and bottom templates.
 * @property {string} minX
 * @property {string} minY
 */

/**
 * Generates the WGSL that writes the initial conditions into a slot.
 * @param {ClearShaderParts} parts
 * @returns {string}
 */
export function clearShader(parts) {
  const opts = translationOptions(parts);
  const outputs = ["  dst[element(0u, i, j)] = vec4f(u, v, w, q);"];
  if (parts.numGroups > 1) outputs.push("  dst[element(1u, i, j)] = vec4f(u5, u6, u7, u8);");
  return `${prelude(parts)}
@compute @workgroup_size(${WORKGROUP_SIZE.join(", ")})
fn main(@builtin(global_invocation_id) gid: vec3u) {
  if (gid.x >= U.nX || gid.y >= U.nY) { return; }
  let i = i32(gid.x);
  let j = i32(gid.y);
${commonLets(parts, opts, { clearCoords: true })}
${translateStatements(parts.body, opts)}
${outputs.join("\n")}
}`;
}

/**
 * Generates the WGSL that enforces Dirichlet conditions on a slot, as WebGL's
 * dirichletMaterial does before each frame's timesteps (and after brush strokes).
 * @param {Object} parts - As for timestepShader, plus enforceBody: the GLSL that assigns
 *   Dirichlet values to "updated" (and "updated2"), starting from the slot's state.
 * @returns {string}
 */
export function enforceDirichletShader(parts) {
  const G = parts.numGroups;
  const opts = translationOptions(parts);
  const outputs = ["  dst[element(0u, i, j)] = updated;"];
  if (G > 1) outputs.push("  dst[element(1u, i, j)] = updated2;");
  return `${prelude(parts)}
@compute @workgroup_size(${WORKGROUP_SIZE.join(", ")})
fn main(@builtin(global_invocation_id) gid: vec3u) {
  if (gid.x >= U.nX || gid.y >= U.nY) { return; }
  let i = i32(gid.x);
  let j = i32(gid.y);
${commonLets(parts, opts)}
  var uvwq = fetch(0u, 0u, i, j);
  var updated = uvwq;
${G > 1 ? "  var uvwq2 = fetch(0u, 1u, i, j);\n  var updated2 = uvwq2;" : ""}
${translateStatements(parts.enforceBody, opts)}
${outputs.join("\n")}
}`;
}
