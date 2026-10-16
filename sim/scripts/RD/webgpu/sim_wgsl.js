// sim_wgsl.js
//
// Generates the WGSL compute shaders that timestep VisualPDE simulations on WebGPU. They
// mirror the GLSL in simulation_shaders.js: the parts that depend on how the state is stored
// (stencil fetches, the timestepping schemes, writing the result) are written here directly,
// and everything else (boundary conditions, reactions, diffusion, Dirichlet conditions and
// algebraic species) is the very GLSL that setRDEquations() assembles for WebGL, translated by
// glsl_to_wgsl.js. So both backends share one source of truth for the maths.
//
// State layout: each history slot is one rgba32float texture per species group (species 1-4,
// 5-8), with node (i, j) at texel (i, j), so row j = 0 is first, as in a WebGL readback.

import { translateExpression, translateStatements } from "./glsl_to_wgsl.js";
import { ValueLayout } from "./values.js";

// The values the brush shader reads besides the simulation uniforms.
export const BRUSH_VALUES = new ValueLayout([
  ["brushCoords", "vec2f"],
  ["brushValueModifier", "f32"],
]);

// 16 x 8 measured fastest on an Apple M2 Max: about 30% faster than 8 x 8 on large 2D grids.
export const WORKGROUP_SIZE = [16, 8];

// Binding numbers shared by the simulation kernels' bind group layouts (see
// WebGPUBackend.layout). Input slot s of group g is a texture at SOURCE_BINDING + 4g + s,
// read through the sampler at SAMPLER_BINDING + g, and a compute kernel writes group g to a
// storage texture at OUTPUT_BINDING + g.
export const SOURCE_BINDING = 10;
export const SAMPLER_BINDING = 7;
export const OUTPUT_BINDING = 20;

/**
 * The texture formats storing each species group's state, for numSpecies species: only as
 * many float32 channels as the group has species, as large grids are limited by memory
 * bandwidth. (There's no three-channel storage format, so three species take four.) Reads
 * of the missing channels give 0 (and 1 for the fourth).
 * @param {number} numSpecies
 * @returns {string[]}
 */
export function stateFormats(numSpecies) {
  const formats = [];
  for (let first = 0; first == 0 || first < numSpecies; first += 4) {
    const count = Math.min(4, numSpecies - first);
    formats.push(count == 1 ? "r32float" : count == 2 ? "rg32float" : "rgba32float");
  }
  return formats;
}

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
    1 / u.nX,
    1 / u.nY,
  ];
  floats.forEach((v, k) => view.setFloat32(offset + 16 + 4 * k, v, true));
  // The time and seed of each step of a temporally blocked pass (see blockedTimestepShader).
  for (let k = 0; k < MAX_BLOCK_STEPS; k++) {
    view.setFloat32(offset + 80 + 4 * k, u.stepT?.[k] ?? u.t, true);
    view.setFloat32(offset + 112 + 4 * k, u.stepSeed?.[k] ?? u.seed, true);
  }
}

// The most timesteps a temporally blocked pass can take.
export const MAX_BLOCK_STEPS = 8;

export const UNIFORMS_STRUCT = `
struct Uniforms {
  nX: u32, nY: u32, isTwoD: u32, pad0: u32,
  dt: f32, dx: f32, dy: f32, t: f32,
  L: f32, L_x: f32, L_y: f32, L_min: f32,
  seed: f32, gi1: f32, gi2: f32, gi3: f32,
  gi4: f32, inf: f32,
  // 1/nX and 1/nY, for turning node indices into texture coordinates.
  inverseSize: vec2f,
  // Per step of a temporally blocked pass, its time and random seed.
  stepT: array<vec4f, 2>,
  stepSeed: array<vec4f, 2>,
}`;

// The helper functions that auxiliary_GLSL_funs.js (and the erfinv defined alongside it in
// the GLSL templates) provide to WebGL shaders.
export const AUXILIARY_WGSL = `
const pi = 3.141592653589793;

fn vpde_mod(x: f32, y: f32) -> f32 { return x - y * floor(x / y); }
// By bit pattern, since WGSL implementations may assume NaNs and infinities don't occur and
// fold comparisons such as x != x away.
fn vpde_isnan(x: f32) -> bool { return (bitcast<u32>(x) & 0x7fffffffu) > 0x7f800000u; }
fn vpde_isinf(x: f32) -> bool { return (bitcast<u32>(x) & 0x7fffffffu) == 0x7f800000u; }

fn H1(VALUE: f32) -> f32 { return smoothstep(-0.01, 0.01, VALUE); }
fn H2(VALUE: f32, EDGE: f32) -> f32 { return smoothstep(-0.01, 0.01, VALUE - EDGE); }

fn safetanh(VALUE: f32) -> f32 { return 1.0 - 2.0 / (1.0 + exp(2.0 * VALUE)); }

// GLSL's round(), which users' expressions may call, as WebGL computes it on Apple GPUs:
// halves round away from zero (WGSL's round() rounds them to even).
fn vpde_round(x: f32) -> f32 {
  let t = trunc(x);
  if (abs(x - t) >= 0.5) { return t + sign(x); }
  return t;
}

// As the GLSL safepow: x^y, extended to x < 0 as even or odd in x by the parity of y
// rounded with halves away from zero.
fn safepow(x: f32, y: f32) -> f32 {
  if (x >= 0.0) { return pow(x, y); }
  if (vpde_mod(vpde_round(y), 2.0) == 0.0) { return pow(-x, y); }
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
 * @property {string[]} formats - Per group, the format of its state textures (see
 *   stateFormats()).
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
  const image = ([tex, uv]) => {
    if (tex == "imageSourceOne") return `textureSampleLevel(imageOne, imageSampler, ${uv}, 0.0)`;
    if (tex == "imageSourceTwo") return `textureSampleLevel(imageTwo, imageSampler, ${uv}, 0.0)`;
    return nearest([tex, uv]);
  };
  renames.gl_FragColor = "fragColour";
  return {
    renames,
    calls: {
      texture2D: image,
      textureSize: () => "vec2i(i32(U.nX), i32(U.nY))",
      texture: image,
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
function commonLets(
  parts,
  opts,
  { withT = true, withSeed = true, clearCoords = false, withXY = true } = {},
) {
  const params = parts.paramNames
    .map((name, k) => `  let P_${name} = params[${k >> 2}][${k & 3}];`)
    .join("\n");
  const minX = translateExpression(parts.minX, opts);
  const minY = translateExpression(parts.minY, opts);
  // The initial-condition shader positions nodes using the grid size and spatial step,
  // rather than the domain size, exactly as clear_shader.js does.
  const xy = !withXY
    ? ""
    : clearCoords
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
${withSeed ? "  let seed = U.seed;" : ""}
  let globalIntegralValue1 = globals.x;
  let globalIntegralValue2 = globals.y;
  let globalIntegralValue3 = globals.z;
  let globalIntegralValue4 = globals.w;
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

// Bindings, index helpers and fetches for a kernel, and the storage textures it writes.
function prelude(parts) {
  const G = parts.numGroups;
  const clampConsts = parts.clamp
    .map(([cx, cy], g) => `const CLAMP_X_${g} = ${cx};\nconst CLAMP_Y_${g} = ${cy};`)
    .join("\n");
  const sources = [];
  const loads = [];
  for (let g = 0; g < G; g++) {
    for (let slot = 0; slot < 4; slot++) {
      sources.push(
        `@group(0) @binding(${SOURCE_BINDING + 4 * g + slot}) var src${slot}_${g}: texture_2d<f32>;`,
      );
      loads.push(
        `  if (g == ${g}u && slot == ${slot}u) { return textureLoad(src${slot}_${g}, ij, 0); }`,
      );
    }
  }
  const samplers = Array.from(
    { length: G },
    (_, g) => `@group(0) @binding(${SAMPLER_BINDING + g}) var stateSampler${g}: sampler;`,
  ).join("\n");
  const samples = [];
  const fetchers = [];
  for (let g = 0; g < G; g++) {
    for (let slot = 0; slot < 4; slot++) {
      samples.push(`  if (g == ${g}u && slot == ${slot}u) { return fetch${slot}_${g}(i, j); }`);
      fetchers.push(
        `fn fetch${slot}_${g}(i: i32, j: i32) -> vec4f {
  return textureSampleLevel(src${slot}_${g}, stateSampler${g}, (vec2f(f32(i), f32(j)) + 0.5) * U.inverseSize, 0.0);
}`,
      );
    }
  }
  const outputs = Array.from(
    { length: G },
    (_, g) =>
      `@group(0) @binding(${OUTPUT_BINDING + g}) var dst${g}: texture_storage_2d<${parts.formats[g]}, write>;`,
  ).join("\n");
  return `${UNIFORMS_STRUCT}
@group(0) @binding(0) var<uniform> U: Uniforms;
@group(0) @binding(1) var<storage, read> params: array<vec4f>;
@group(0) @binding(2) var imageOne: texture_2d<f32>;
@group(0) @binding(3) var imageTwo: texture_2d<f32>;
@group(0) @binding(4) var imageSampler: sampler;
@group(0) @binding(5) var<storage, read> V: array<vec4f>;
// The domain integrals Int(...), computed on the GPU (see display_wgsl.js).
@group(0) @binding(6) var<storage, read> globals: vec4f;
${sources.join("\n")}
${samplers}
${outputs}

const G = ${G}u;
${clampConsts}

fn wrapIndex(k: i32, n: i32, clampIt: bool) -> i32 {
  if (clampIt) { return clamp(k, 0, n - 1); }
  return ((k % n) + n) % n;
}

// Group g of slot at texel ij.
fn load(slot: u32, g: u32, ij: vec2i) -> vec4f {
${loads.join("\n")}
  return vec4f(0.0);
}

// Group g of slot s at node (i, j), wrapping or clamping out-of-range indices as the WebGL
// textures do: fetch{s}_{g}(i, j). Like WebGL, these sample (nearest, at the node's centre,
// so exactly the node's value) through a sampler whose address modes do the wrapping or
// clamping, which is far cheaper than doing it with integer arithmetic. There's one function
// per slot and group, so that no fetch branches on which it is.
${fetchers.join("\n")}

// The same, for a slot and group only known at run time.
fn fetch(slot: u32, g: u32, i: i32, j: i32) -> vec4f {
${samples.join("\n")}
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

/**
 * Wraps a kernel's body, which computes the node (i, j)'s new value of each group into out0
 * (and out1), as a compute shader writing them to storage textures.
 */
function entryPoint(G, body) {
  const outs = Array.from({ length: G }, (_, g) => `out${g}`);
  return `
@compute @workgroup_size(${WORKGROUP_SIZE.join(", ")})
fn main(@builtin(global_invocation_id) gid: vec3u) {
  if (gid.x >= U.nX || gid.y >= U.nY) { return; }
  let i = i32(gid.x);
  let j = i32(gid.y);
${body}
${outs.map((o, g) => `  textureStore(dst${g}, vec2i(i, j), ${o});`).join("\n")}
}`;
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
      const base = `fetch${slot}_${g}(i + ${di}, j + ${dj})`;
      const value =
        combineSlot == undefined
          ? base
          : `${base} + ${coefficient}*fetch${combineSlot}_${g}(i + ${di}, j + ${dj})`;
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
fn computeRHS(srcSlot: u32, t: f32, seed: f32, i: i32, j: i32, ${params.join(", ")}) -> RHSOut {
${commonLets(parts, opts, { withT: false, withSeed: false })}
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
// The timescales are evaluated where RDShaderMain evaluates them, after the RHS, as they can
// depend on the state (e.g. on an algebraic species), so on the stencil's latest values.
function schemeBody(type, G, timescales) {
  const call = (srcSlot, time, out) =>
    `  let ${out} = computeRHS(${srcSlot}u, ${time}, seed, i, j, ${stencilArgs(G)});\n` +
    (out == "outPrev" || out == "outCur" ? "" : timescales);
  const centre = (slot, g) => `fetch${slot}_${g}(i, j)`;
  const lines = [];
  const each = (f) => {
    for (let g = 0; g < G; g++) lines.push(f(g, g == 0 ? "" : "2", g == 0 ? "" : "Group1"));
  };
  switch (type) {
    case "FE":
      lines.push(stencilFetch(G, 0), call(0, "t", "rhs1"));
      each((g, n) => `  RHS${n} = rhs1.r${g};`);
      each((g, n, s) => `  updated${n} = dt * RHS${n} / timescales${s} + uvwq${n};`);
      break;
    case "AB2":
      lines.push(stencilFetch(G, 0), call(0, "t", "outCur"));
      lines.push(stencilFetch(G, 1), call(1, "t - dt", "outPrev"), timescales);
      each((g, n) => `  RHS${n} = 1.5 * outCur.r${g} - 0.5 * outPrev.r${g};`);
      each((g, n, s) => `  updated${n} = dt * RHS${n} / timescales${s} + ${centre(0, g)};`);
      break;
    case "Mid1":
    case "RK41":
      lines.push(stencilFetch(G, 0), call(0, "t", "rhs1"));
      each((g, n) => `  RHS${n} = rhs1.r${g};`);
      each((g, n, s) => `  updated${n} = RHS${n} / timescales${s};`);
      break;
    case "RK42":
    case "RK43":
      lines.push(stencilFetch(G, 0, type == "RK42" ? 1 : 2, "0.5*dt"), call(0, "t", "rhs1"));
      each((g, n) => `  RHS${n} = rhs1.r${g};`);
      each((g, n, s) => `  updated${n} = RHS${n} / timescales${s};`);
      break;
    case "Mid2":
      each((g, n) => `  let uvwq${n}Last = ${centre(0, g)};`);
      lines.push(stencilFetch(G, 0, 1, "0.5*dt"), call(0, "t", "rhs1"));
      each((g, n) => `  RHS${n} = rhs1.r${g};`);
      each((g, n, s) => `  updated${n} = dt * RHS${n} / timescales${s} + uvwq${n}Last;`);
      break;
    case "RK44":
      each((g, n) => `  let uvwq${n}Last = ${centre(0, g)};`);
      lines.push(stencilFetch(G, 0, 3, "dt"), call(0, "t", "rhs1"));
      each(
        (g, n, s) =>
          `  RHS${n} = (timescales${s} * (${centre(1, g)} + 2.0*(${centre(2, g)} + ${centre(3, g)})) + rhs1.r${g}) / 6.0;`,
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
  const outputs = ["  let out0 = updated;"];
  if (G > 1) outputs.push("  let out1 = updated2;");
  const body = `${commonLets(parts, opts)}
${declarations.join("\n")}
  var timescales: vec4f;
  var RHS: vec4f;
  var updated: vec4f;
${
  G > 1
    ? `  var timescalesGroup1: vec4f;
  var RHS2: vec4f;
  var updated2: vec4f;`
    : ""
}
${schemeBody(
  type,
  G,
  `  timescales = ${translateExpression(parts.timescales, opts)};\n` +
    (G > 1
      ? `  timescalesGroup1 = ${translateExpression(parts.timescalesGroup1, opts)};\n`
      : ""),
)}
${translateStatements(parts.bot[type], opts)}
${outputs.join("\n")}`;
  return `${prelude(parts)}
${computeRHSFunction(parts, opts)}
${entryPoint(G, body)}`;
}

// --- Temporal blocking (1D) ------------------------------------------------------------
// In 1D, grids are small enough that a timestep's cost is mostly that of a pass, not of the
// work in it. So a temporally blocked pass has each workgroup copy a tile of the state into
// workgroup memory and take K Forward Euler steps there before writing the tile's interior
// back, taking K steps for the cost of one pass. Each step, the tile's ends (one stencil
// radius) lack neighbours, so the region of correct values shrinks, and the tile carries a
// halo K radii wide at each end that neighbouring workgroups also compute.
//
// Each node gets the same arithmetic of the same values as in an unblocked pass, though the
// compiler may round some of it differently in a differently shaped kernel (by about one
// float32 ulp at a few nodes per step, as measured on an Apple M2 Max).
//
// Tile cell a stands for the node at its wrapped position, which gives it its x, boundary
// tests and so on. Its neighbour d is the cell a + d, unless the species group is clamped in
// x, when it's the cell holding the clamped node (clamp(c + d) - c away), exactly as the
// sampler would clamp it. With one row, every y-neighbour is the node itself.
//
// In 2D, blocking was slower than one step per pass in every configuration tried (by 25-50%
// on an M2 Max): the per-node work is large, and the redundant halo and barriers cost more
// than the memory traffic they save.

const BLOCK_THREADS = 256;
const BLOCK_CELLS = 2;
const BLOCK_TILE = BLOCK_THREADS * BLOCK_CELLS;
// Steps per blocked pass.
const BLOCK_STEPS = 8;
const FORMAT_TYPES = { r32float: "f32", rg32float: "vec2f", rgba32float: "vec4f" };
const FORMAT_BYTES = { r32float: 4, rg32float: 8, rgba32float: 16 };

// Identifiers in WGSL code.
const identifiers = (code) => code.match(/[A-Za-z_]\w*/g) ?? [];

/**
 * The identifiers whose values can reach the roots in WGSL code, found by following
 * assignments backwards. Any statement that isn't a plain assignment (a condition, a loop, a
 * return) counts all its identifiers as roots, so this only ever overestimates.
 */
function liveIdentifiers(code, roots) {
  const live = new Set(roots);
  const assignments = [];
  for (const statement of code.split(/[;{}]/).map((st) => st.trim()).filter(Boolean)) {
    const m = statement.match(
      /^(?:(?:var|let)\s+)?([A-Za-z_]\w*)(?:\s*:\s*[\w<>]+)?(?:\.[a-z]+)?\s*([-+*/]?)=(?!=)([\s\S]*)$/,
    );
    if (m) {
      // A compound assignment (+= etc.) also reads its target.
      assignments.push({ target: m[1], reads: identifiers(m[3] + (m[2] ? " " + m[1] : "")) });
    } else {
      identifiers(statement).forEach((id) => live.add(id));
    }
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const { target, reads } of assignments) {
      if (!live.has(target)) continue;
      for (const id of reads) {
        if (!live.has(id)) {
          live.add(id);
          changed = true;
        }
      }
    }
  }
  return live;
}

// The WGSL pieces of a Forward Euler step that read the stencil: computeRHS, the timescales
// and the code after the update.
function forwardEulerPieces(parts) {
  const opts = translationOptions(parts);
  return {
    opts,
    rhs: computeRHSFunction(parts, opts),
    timescales:
      `  timescales = ${translateExpression(parts.timescales, opts)};\n` +
      (parts.numGroups > 1
        ? `  timescalesGroup1 = ${translateExpression(parts.timescalesGroup1, opts)};\n`
        : ""),
    bot: translateStatements(parts.bot.FE, opts),
  };
}

/**
 * How to temporally block a simulation's Forward Euler steps, or null if they can't be: in
 * 2D (where it doesn't pay), if the simulation looks up the state away from the stencil (as
 * u[x,y] does), or if the tile wouldn't fit in workgroup memory.
 * @param {SimShaderParts & {twoD: boolean}} parts
 * @param {number} storageLimit - The device's maxComputeWorkgroupStorageSize.
 * @returns {{steps: number, radius: number, output: number} | null} The steps per pass, the
 *   stencil's radius in x, and the nodes each workgroup writes.
 */
export function blockingPlan(parts, storageLimit) {
  if (parts.twoD) return null;
  const { rhs, timescales, bot } = forwardEulerPieces(parts);
  // computeRHS's body (its signature names every stencil value), the timescales and the rest.
  const body = rhs.slice(rhs.indexOf("-> RHSOut {") + "-> RHSOut {".length);
  const code = body + "\n" + timescales + "\n" + bot;
  if (/\bfetch(Nearest|Bilinear)?\s*\(/.test(code)) return null;
  // The stencil's radius: 2 if any second neighbour in x can affect the result.
  const live = liveIdentifiers(code, [
    "result",
    "result0",
    "result1",
    ...identifiers(timescales),
    ...identifiers(bot),
  ]);
  const radius = [...live].some((id) => /^uvwq2?(LL|RR)(In)?$/.test(id)) ? 2 : 1;
  const bytes = BLOCK_TILE * parts.formats.reduce((sum, f) => sum + FORMAT_BYTES[f], 0);
  if (bytes > storageLimit) return null;
  return { steps: BLOCK_STEPS, radius, output: BLOCK_TILE - 2 * BLOCK_STEPS * radius };
}

/**
 * Generates the WGSL for a temporally blocked pass of plan.steps Forward Euler steps on a 1D
 * grid, which reads slot 0 and writes the final state. Step s uses U.stepT[s] and
 * U.stepSeed[s].
 * @param {SimShaderParts} parts
 * @param {NonNullable<ReturnType<typeof blockingPlan>>} plan
 * @returns {string}
 */
export function blockedTimestepShader(parts, plan) {
  const G = parts.numGroups;
  const { opts, rhs, timescales, bot } = forwardEulerPieces(parts);
  const T = BLOCK_TILE;
  const C = BLOCK_CELLS;
  const R = plan.radius;
  const K = plan.steps;
  const groups = Array.from({ length: G }, (_, g) => g);
  const types = parts.formats.map((f) => FORMAT_TYPES[f]);
  const tiles = groups.map((g) => `var<workgroup> tile${g}: array<${types[g]}, ${T}>;`).join("\n");
  // Tile values as the sampler would return them (missing channels 0, alpha 1), and back.
  const readers = groups
    .map((g) => {
      const value =
        types[g] == "f32"
          ? `vec4f(tile${g}[k], 0.0, 0.0, 1.0)`
          : types[g] == "vec2f"
          ? `vec4f(tile${g}[k], 0.0, 1.0)`
          : `tile${g}[k]`;
      const stored = types[g] == "f32" ? "v.x" : types[g] == "vec2f" ? "v.xy" : "v";
      return `fn tileRead${g}(k: i32) -> vec4f { return ${value}; }
fn tileWrite${g}(k: i32, v: vec4f) { tile${g}[k] = ${stored}; }`;
    })
    .join("\n");
  // The tile index of node ci's neighbour di, from its cell k.
  const neighbour = (g, di) =>
    di == 0 ? "k" : parts.clamp[g][0] ? `k + clamp(ci + ${di}, 0, nX - 1) - ci` : `k + ${di}`;
  const stencilArgsFromTile = groups
    .flatMap((g) =>
      // y-neighbours are the node itself; neighbours beyond the radius are never used (see
      // blockingPlan).
      STENCIL.map(([, di]) => `tileRead${g}(${Math.abs(di) > R ? "k" : neighbour(g, di)})`),
    )
    .join(",\n        ");
  const params = [];
  const copies = [];
  for (let g = 0; g < G; g++) {
    const prefix = g == 0 ? "uvwq" : "uvwq2";
    for (const [suffix] of STENCIL) {
      params.push(`${prefix}${suffix}In: vec4f`);
      copies.push(`  var ${prefix}${suffix} = ${prefix}${suffix}In;`);
    }
  }
  const each = (f) =>
    groups.map((g) => f(g, g == 0 ? "" : "2", g == 0 ? "" : "Group1")).join("\n");
  const forCells = (body) => `  for (var c = 0; c < ${C}; c++) {
    let a = i32(l.x) * ${C} + c;
${body}
  }`;
  return `${prelude(parts)}
${rhs}

// One Forward Euler step of node (i, j), as the unblocked pass's main() takes it.
fn advanceNode(i: i32, j: i32, t: f32, seed: f32, ${params.join(", ")}) -> RHSOut {
${commonLets(parts, opts, { withT: false, withSeed: false })}
${copies.join("\n")}
  var timescales: vec4f;
  var RHS: vec4f;
  var updated: vec4f;
${G > 1 ? "  var timescalesGroup1: vec4f;\n  var RHS2: vec4f;\n  var updated2: vec4f;" : ""}
  let rhs1 = computeRHS(0u, t, seed, i, j, ${stencilArgs(G)});
${timescales}
${each((g, n) => `  RHS${n} = rhs1.r${g};`)}
${each((g, n, s) => `  updated${n} = dt * RHS${n} / timescales${s} + uvwq${n};`)}
${bot}
  return RHSOut(updated, ${G > 1 ? "updated2" : "vec4f(0.0)"});
}

${tiles}
${readers}

@compute @workgroup_size(${BLOCK_THREADS})
fn main(@builtin(workgroup_id) wg: vec3u, @builtin(local_invocation_id) l: vec3u) {
  let nX = i32(U.nX);
  let origin = i32(wg.x) * ${plan.output} - ${K * R};
${forCells(`    let ci = wrapIndex(origin + a, nX, false);
${groups.map((g) => `    tileWrite${g}(a, fetch0_${g}(ci, 0));`).join("\n")}`)}
  workgroupBarrier();
${groups.map((g) => `  var next${g}: array<vec4f, ${C}>;`).join("\n")}
  for (var s = 0; s < ${K}; s++) {
    let t = U.stepT[s / 4][s % 4];
    let seed = U.stepSeed[s / 4][s % 4];
    // The cells whose neighbours are all still correct.
    let lo = ${R} * (s + 1);
    let hi = ${T} - lo;
${forCells(`    let k = a;
${groups.map((g) => `    next${g}[c] = tileRead${g}(k);`).join("\n")}
    if (a >= lo && a < hi) {
      let ci = wrapIndex(origin + a, nX, false);
      let r = advanceNode(ci, 0, t, seed,
        ${stencilArgsFromTile});
${groups.map((g) => `      next${g}[c] = r.r${g};`).join("\n")}
    }`)}
    workgroupBarrier();
${forCells(groups.map((g) => `    tileWrite${g}(a, next${g}[c]);`).join("\n"))}
    workgroupBarrier();
  }
${forCells(`    let p = origin + a;
    if (a >= ${K * R} && a < ${T - K * R} && p < nX) {
${groups.map((g) => `      textureStore(dst${g}, vec2i(p, 0), tileRead${g}(a));`).join("\n")}
    }`)}
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
  const outputs = ["  let out0 = vec4f(u, v, w, q);"];
  if (parts.numGroups > 1) outputs.push("  let out1 = vec4f(u5, u6, u7, u8);");
  return `${prelude(parts)}
${entryPoint(
  parts.numGroups,
  `${commonLets(parts, opts, { clearCoords: true })}
${translateStatements(parts.body, opts)}
${outputs.join("\n")}`,
)}`;
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
  const outputs = ["  let out0 = updated;"];
  if (G > 1) outputs.push("  let out1 = updated2;");
  return `${prelude(parts)}
${entryPoint(
  G,
  `${commonLets(parts, opts)}
  var uvwq = fetch(0u, 0u, i, j);
  var updated = uvwq;
${G > 1 ? "  var uvwq2 = fetch(0u, 1u, i, j);\n  var updated2 = uvwq2;" : ""}
${translateStatements(parts.enforceBody, opts)}
${outputs.join("\n")}`,
)}`;
}

/**
 * Generates the WGSL that applies the brush to a slot, as WebGL's drawMaterial does.
 * @param {Object} parts - As for timestepShader, plus body: the body of the WebGL brush
 *   shader's main(), including its closing brace.
 * @returns {string}
 */
export function drawShader(parts) {
  const G = parts.numGroups;
  const opts = translationOptions(parts);
  const body = parts.body.replace(/\}\s*$/, "");
  const declarations =
    G == 1 ? "  var fragColour: vec4f;" : "  var fragColor0: vec4f;\n  var fragColor1: vec4f;";
  const outputs =
    G == 1 ? "  let out0 = fragColour;" : "  let out0 = fragColor0;\n  let out1 = fragColor1;";
  return `${prelude(parts)}
${entryPoint(
  G,
  `${commonLets(parts, opts, { withXY: false })}
${BRUSH_VALUES.lets("V")}
${declarations}
${translateStatements(body, opts)}
${outputs}`,
)}`;
}
