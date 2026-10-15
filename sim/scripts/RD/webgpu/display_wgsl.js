// display_wgsl.js
//
// Generates the WGSL that turns the simulation state into a picture on WebGPU, mirroring the
// WebGL post-processing material (post_shaders.js: the value to plot, the domain mask,
// surface heights and vector-field components, per node) and display material
// (display_shaders.js: colouring, embossing, contours and overlays, per pixel). As for the
// timestep, the bodies of those GLSL shaders are translated, so both backends share them.

import { translateExpression, translateStatements } from "./glsl_to_wgsl.js";
import { WORKGROUP_SIZE, UNIFORMS_STRUCT, AUXILIARY_WGSL } from "./sim_wgsl.js";
import { ValueLayout } from "./values.js";

// The values the post-processing shader reads besides the simulation uniforms.
export const POST_VALUES = new ValueLayout([
  ["customSurface", "bool"],
  ["vectorField", "bool"],
  ["overlayLine", "bool"],
]);

// The values the display shader reads besides the simulation uniforms.
export const DISPLAY_VALUES = new ValueLayout([
  ["minColourValue", "f32"],
  ["maxColourValue", "f32"],
  ["colour1", "vec4f"],
  ["colour2", "vec4f"],
  ["colour3", "vec4f"],
  ["colour4", "vec4f"],
  ["colour5", "vec4f"],
  ["dxUpscaledScale", "f32"],
  ["dyUpscaledScale", "f32"],
  ["embossAmbient", "f32"],
  ["embossDiffuse", "f32"],
  ["embossShiny", "f32"],
  ["embossSmoothness", "f32"],
  ["embossSpecular", "f32"],
  ["embossLightDir", "vec3f"],
  ["contourColour", "vec3f"],
  ["contourEpsilon", "f32"],
  ["contourStep", "f32"],
  ["overlayColour", "vec3f"],
  ["overlayEpsilon", "f32"],
  ["blendImage", "bool"],
  ["blendImageAmount", "f32"],
  ["heightScale", "f32"],
  // Whether the plotted values are interpolated between nodes, as the WebGL post texture's
  // linear filtering does, or shown as flat cells.
  ["linearDisplay", "bool"],
]);

// The runtime +inf that the GLSL computes as 1.0/(0.0*gl_FragCoord.x), to dodge constant
// folding; WGSL rejects a constant infinity outright, so it comes from a uniform instead,
// via a name that can't clash with (and so be renamed as) a user's parameter.
function replaceRuntimeInfinity(glsl) {
  return glsl.replaceAll(
    /1\.0\s*\/\s*\(\s*0\.0\s*\*\s*gl_FragCoord\.x\s*\)/g,
    "vpde_infinity",
  );
}

function sharedLets(parts) {
  const params = parts.paramNames
    .map((name, k) => `  let P_${name} = params[${k >> 2}][${k & 3}];`)
    .join("\n");
  return `
  let dt = U.dt;
  let dx = U.dx;
  let dy = U.dy;
  let L = U.L;
  let L_x = U.L_x;
  let L_y = U.L_y;
  let L_min = U.L_min;
  let t = U.t;
  let seed = U.seed;
  let globalIntegralValue1 = globals.x;
  let globalIntegralValue2 = globals.y;
  let globalIntegralValue3 = globals.z;
  let globalIntegralValue4 = globals.w;
${params}`;
}

function renamesFor(parts) {
  const renames = { gl_FragColor: "fragColour" };
  parts.paramNames.forEach((name) => (renames[name] = "P_" + name));
  return renames;
}

// Index helpers over the state (species groups interleaved, as in sim_wgsl.js) and post
// buffers, and their nearest and bilinear lookups.
function lookupHelpers(parts) {
  const clampConsts = parts.clamp
    .map(([cx, cy], g) => `const CLAMP_X_${g} = ${cx};\nconst CLAMP_Y_${g} = ${cy};`)
    .join("\n");
  return `
const G = ${parts.numGroups}u;
${clampConsts}

fn wrapIndex(k: i32, n: i32, clampIt: bool) -> i32 {
  if (clampIt) { return clamp(k, 0, n - 1); }
  return ((k % n) + n) % n;
}

fn stateAt(g: u32, i: i32, j: i32) -> vec4f {
  let nX = i32(U.nX);
  let nY = i32(U.nY);
  var cx = CLAMP_X_0;
  var cy = CLAMP_Y_0;
${parts.numGroups > 1 ? "  if (g == 1u) { cx = CLAMP_X_1; cy = CLAMP_Y_1; }" : ""}
  let k = u32(wrapIndex(j, nY, cy) * nX + wrapIndex(i, nX, cx)) * G + g;
  return state[k];
}

fn stateNearest(g: u32, uv: vec2f) -> vec4f {
  let ij = vec2i(floor(uv * vec2f(f32(U.nX), f32(U.nY))));
  return stateAt(g, ij.x, ij.y);
}

fn stateBilinear(g: u32, uv: vec2f) -> vec4f {
  let size = vec2f(f32(U.nX), f32(U.nY));
  let st = uv * size - 0.5;
  let base = floor(st);
  var f = st - base;
  f = select(f, vec2f(0.0), f < vec2f(1e-4));
  f = select(f, vec2f(1.0), f > vec2f(1.0 - 1e-4));
  let i0 = i32(base.x);
  let j0 = i32(base.y);
  return mix(
    mix(stateAt(g, i0, j0), stateAt(g, i0 + 1, j0), f.x),
    mix(stateAt(g, i0, j0 + 1), stateAt(g, i0 + 1, j0 + 1), f.x),
    f.y
  );
}
`;
}

function translationCalls(extra = {}) {
  return {
    // The state and post buffers are both nX by nY.
    textureSize: () => "vec2i(i32(U.nX), i32(U.nY))",
    texture2D: ([tex, uv]) => {
      if (tex == "textureSource") return `stateNearest(0u, ${uv})`;
      if (tex == "textureSourceGroup1") return `stateNearest(1u, ${uv})`;
      throw new Error("Unknown sampler " + tex);
    },
    texture: ([tex, uv]) => {
      if (tex == "imageSourceOne") return `textureSampleLevel(imageOne, imageSampler, ${uv}, 0.0)`;
      if (tex == "imageSourceTwo") return `textureSampleLevel(imageTwo, imageSampler, ${uv}, 0.0)`;
      if (tex == "textureSource") return `stateNearest(0u, ${uv})`;
      if (tex == "textureSourceGroup1") return `stateNearest(1u, ${uv})`;
      throw new Error("Unknown sampler " + tex);
    },
    textureBilinear: ([tex, uv]) => {
      if (tex == "textureSource") return `stateBilinear(0u, ${uv})`;
      if (tex == "textureSourceGroup1") return `stateBilinear(1u, ${uv})`;
      throw new Error("Unknown sampler " + tex);
    },
    ...extra,
  };
}

// The values the probe shader reads besides the simulation uniforms.
export const PROBE_VALUES = new ValueLayout([
  ["pointProbe", "bool"],
  ["probeUVs", "bool"],
  ["probeU", "f32"],
  ["probeV", "f32"],
]);

/**
 * @typedef {Object} FieldShaderParts
 * @property {number} numGroups
 * @property {[boolean, boolean][]} clamp
 * @property {string[]} paramNames
 * @property {string} body - The body of a WebGL shader's main() that sets gl_FragColor from
 *   the state at textureCoords, such as the post-processing, probe or domain integral shaders.
 */

/**
 * Generates a compute shader that writes what a WebGL fragment shader computes from the
 * state into gl_FragColor, at every node (into output[j * nX + i]), or, if point is set, once
 * (into output[0], as for the probe's 1x1 render target).
 * @param {FieldShaderParts} parts
 * @param {ValueLayout} values - The values the body reads besides the simulation uniforms.
 * @param {boolean} [point]
 */
export function fieldShader(parts, values, point = false) {
  let body = replaceRuntimeInfinity(parts.body);
  // Drop the brace closing main(), if the body includes it.
  const count = (c) => body.split(c).length - 1;
  if (count("}") > count("{")) body = body.replace(/\}\s*$/, "");
  const opts = { renames: renamesFor(parts), calls: translationCalls() };
  const coords = point
    ? "vec2f(0.5)"
    : "(vec2f(f32(i), f32(j)) + 0.5) / vec2f(f32(U.nX), f32(U.nY))";
  const index = point ? "0u" : "u32(j) * U.nX + u32(i)";
  return `${UNIFORMS_STRUCT}
@group(0) @binding(0) var<uniform> U: Uniforms;
@group(0) @binding(1) var<storage, read> params: array<vec4f>;
@group(0) @binding(2) var<storage, read> state: array<vec4f>;
@group(0) @binding(3) var<storage, read_write> output: array<vec4f>;
@group(0) @binding(4) var<storage, read> V: array<vec4f>;
@group(0) @binding(5) var imageOne: texture_2d<f32>;
@group(0) @binding(6) var imageTwo: texture_2d<f32>;
@group(0) @binding(7) var imageSampler: sampler;
@group(0) @binding(8) var<storage, read> globals: vec4f;
${lookupHelpers(parts)}
${AUXILIARY_WGSL}

@compute @workgroup_size(${WORKGROUP_SIZE.join(", ")})
fn main(@builtin(global_invocation_id) gid: vec3u) {
  if (${point ? "gid.x > 0u || gid.y > 0u" : "gid.x >= U.nX || gid.y >= U.nY"}) { return; }
  let i = i32(gid.x);
  let j = i32(gid.y);
${sharedLets(parts)}
${values.lets("V")}
  let vpde_infinity = U.inf;
  let textureCoords = ${coords};
  var fragColour: vec4f;
${translateStatements(body, opts)}
  output[${index}] = fragColour;
}`;
}

/** The post-processing shader: fieldShader with the post-processing values. */
export function postShader(parts) {
  return fieldShader(parts, POST_VALUES);
}

/**
 * @typedef {Object} DisplayShaderParts
 * @property {number} numGroups
 * @property {[boolean, boolean][]} clamp
 * @property {string[]} paramNames
 * @property {string} body - The body of the WebGL display shader's main(), including its
 *   closing brace.
 */

/**
 * Generates the render pipeline's shaders for the display: a vertex shader for the display
 * domain's mesh and a fragment shader colouring it from the post-processed values.
 * @param {DisplayShaderParts} parts
 */
export function displayShader(parts) {
  const body = parts.body.replace(/\}\s*$/, "");
  const linearIndex = DISPLAY_VALUES.entries.findIndex(([name]) => name == "linearDisplay");
  const opts = {
    renames: renamesFor(parts),
    returnValue: "fragColour",
    calls: translationCalls({
      texture2D: ([tex, uv]) => {
        if (tex == "textureSource") return `postSample(${uv})`;
        if (tex == "imageSourceBlend") return "vec4f(0.0)";
        return translationCalls().texture2D([tex, uv]);
      },
      textureBilinear: ([tex, uv]) => {
        if (tex == "textureSource1") return `stateBilinear(0u, ${uv})`;
        return translationCalls().textureBilinear([tex, uv]);
      },
      colFromValue: ([value]) =>
        `colFromValue(${value}, colour1, colour2, colour3, colour4, colour5)`,
    }),
  };
  return `${UNIFORMS_STRUCT}
struct Camera {
  mvp: mat4x4f,
  heightMode: u32,
}
@group(0) @binding(0) var<uniform> U: Uniforms;
@group(0) @binding(1) var<storage, read> params: array<vec4f>;
@group(0) @binding(2) var<storage, read> state: array<vec4f>;
@group(0) @binding(3) var<storage, read> post: array<vec4f>;
@group(0) @binding(4) var<storage, read> V: array<vec4f>;
@group(0) @binding(5) var imageOne: texture_2d<f32>;
@group(0) @binding(6) var imageTwo: texture_2d<f32>;
@group(0) @binding(7) var imageSampler: sampler;
@group(0) @binding(8) var<uniform> camera: Camera;
@group(0) @binding(9) var<storage, read> globals: vec4f;
${lookupHelpers(parts)}
${AUXILIARY_WGSL}

fn postAt(i: i32, j: i32) -> vec4f {
  let nX = i32(U.nX);
  let nY = i32(U.nY);
  return post[u32(clamp(j, 0, nY - 1) * nX + clamp(i, 0, nX - 1))];
}

fn postNearest(uv: vec2f) -> vec4f {
  let ij = vec2i(floor(uv * vec2f(f32(U.nX), f32(U.nY))));
  return postAt(ij.x, ij.y);
}

// Bilinear interpolation clamped at the edges, as the WebGL post texture's linear filtering.
fn postBilinear(uv: vec2f) -> vec4f {
  let st = uv * vec2f(f32(U.nX), f32(U.nY)) - 0.5;
  let base = floor(st);
  let f = st - base;
  let i0 = i32(base.x);
  let j0 = i32(base.y);
  return mix(
    mix(postAt(i0, j0), postAt(i0 + 1, j0), f.x),
    mix(postAt(i0, j0 + 1), postAt(i0 + 1, j0 + 1), f.x),
    f.y
  );
}

fn postSample(uv: vec2f) -> vec4f {
  if (V[${linearIndex}].x != 0.0) { return postBilinear(uv); }
  return postNearest(uv);
}

fn colFromValue(val: f32, colour1: vec4f, colour2: vec4f, colour3: vec4f, colour4: vec4f, colour5: vec4f) -> vec3f {
  var col: vec3f;
  var a = 0.0;
  if (val <= colour1.a) { col = colour1.rgb; }
  if (val > colour1.a && val <= colour2.a) {
    a = (val - colour1.a)/(colour2.a - colour1.a);
    col = mix(colour1.rgb, colour2.rgb, a);
  }
  if (val > colour2.a && val <= colour3.a) {
    a = (val - colour2.a)/(colour3.a - colour2.a);
    col = mix(colour2.rgb, colour3.rgb, a);
  }
  if (val > colour3.a && val <= colour4.a) {
    a = (val - colour3.a)/(colour4.a - colour3.a);
    col = mix(colour3.rgb, colour4.rgb, a);
  }
  if (val > colour4.a && val <= colour5.a) {
    a = (val - colour4.a)/(colour5.a - colour4.a);
    col = mix(colour4.rgb, colour5.rgb, a);
  }
  if (val > colour5.a) { col = colour5.rgb; }
  return clamp(col, vec3f(0.0), vec3f(1.0));
}

struct VertexOut {
  @builtin(position) position: vec4f,
  @location(0) textureCoords: vec2f,
}

// heightMode: 0 for a flat plane; 1 to displace by the scaled plotted value, as
// surfaceVertexShaderColour does; 2 to displace by the custom height, as
// surfaceVertexShaderCustom does.
@vertex
fn vertexMain(@location(0) position: vec3f, @location(1) uv: vec2f) -> VertexOut {
${DISPLAY_VALUES.lets("V")}
  var p = position;
  if (camera.heightMode == 1u && minColourValue != maxColourValue) {
    let value = postBilinear(uv).r;
    p.z += heightScale * ((value - minColourValue) / (maxColourValue - minColourValue) - 0.5);
  } else if (camera.heightMode == 2u && minColourValue != maxColourValue) {
    p.z += postBilinear(uv).b;
  }
  var out: VertexOut;
  out.position = camera.mvp * vec4f(p, 1.0);
  out.textureCoords = uv;
  return out;
}

fn displayColour(textureCoords: vec2f) -> vec4f {
${sharedLets(parts)}
${DISPLAY_VALUES.lets("V")}
  var fragColour: vec4f;
${translateStatements(body, opts)}
  return fragColour;
}

@fragment
fn fragmentMain(in: VertexOut) -> @location(0) vec4f {
  return displayColour(in.textureCoords);
}

// For picking: the texture coordinates of the surface under a pixel, as WebGL's uvFragShader.
@fragment
fn pickMain(in: VertexOut) -> @location(0) vec4f {
  return vec4f(in.textureCoords, 0.0, 1.0);
}`;
}

/**
 * Generates a two-stage reduction finding the minimum and maximum of the post-processed
 * values (their .r), as WebGL's minMaxMaterial does. Each invocation of "main" reduces
 * `count` vec2f (min, max) pairs, or the post buffer's values when FIRST is true, into one
 * pair per workgroup.
 */
export function minMaxShader(first) {
  return `
struct Reduce { count: u32 }
@group(0) @binding(0) var<uniform> R: Reduce;
@group(0) @binding(1) var<storage, read> input: array<vec4f>;
@group(0) @binding(2) var<storage, read_write> output: array<vec4f>;

const SIZE = 256u;
var<workgroup> lows: array<f32, SIZE>;
var<workgroup> highs: array<f32, SIZE>;

@compute @workgroup_size(SIZE)
fn main(@builtin(local_invocation_index) local: u32, @builtin(workgroup_id) wg: vec3u, @builtin(num_workgroups) groups: vec3u) {
  var low = 1e38;
  var high = -1e38;
  let stride = SIZE * groups.x;
  for (var k = wg.x * SIZE + local; k < R.count; k += stride) {
    let v = input[k];
    low = min(low, v.x);
    high = max(high, ${first ? "v.x" : "v.y"});
  }
  lows[local] = low;
  highs[local] = high;
  workgroupBarrier();
  for (var s = SIZE / 2u; s > 0u; s /= 2u) {
    if (local < s) {
      lows[local] = min(lows[local], lows[local + s]);
      highs[local] = max(highs[local], highs[local + s]);
    }
    workgroupBarrier();
  }
  if (local == 0u) {
    output[wg.x] = vec4f(lows[0], highs[0], 0.0, 0.0);
  }
}`;
}

/** WGSL for a GLSL expression, using the post shader's conventions (for testing). */
export function translateDisplayExpression(expr, parts) {
  return translateExpression(expr, { renames: renamesFor(parts), calls: translationCalls() });
}

/**
 * WGSL drawing three.js Line2 lines (as used for 1D plots) as LineMaterial does with
 * worldUnits off and its resolution left at (1, 1), as main.js leaves it: each segment is an
 * instance of a quad with round end caps, widened in clip space.
 */
export const LINE_SHADER = `
struct Line {
  mvp: mat4x4f,
  colour: vec4f,
  linewidth: f32,
  useVertexColours: u32,
}
@group(0) @binding(0) var<uniform> line: Line;

struct VertexOut {
  @builtin(position) position: vec4f,
  @location(0) colour: vec3f,
  @location(1) uv: vec2f,
}

@vertex
fn vertexMain(
  @location(0) position: vec3f,
  @location(1) uv: vec2f,
  @location(2) instanceStart: vec3f,
  @location(3) instanceEnd: vec3f,
  @location(4) colourStart: vec3f,
  @location(5) colourEnd: vec3f,
) -> VertexOut {
  var out: VertexOut;
  out.colour = select(colourEnd, colourStart, position.y < 0.5);
  out.uv = uv;
  let clipStart = line.mvp * vec4f(instanceStart, 1.0);
  let clipEnd = line.mvp * vec4f(instanceEnd, 1.0);
  let ndcStart = clipStart.xyz / clipStart.w;
  let ndcEnd = clipEnd.xyz / clipEnd.w;
  var dir = normalize(ndcEnd.xy - ndcStart.xy);
  var offset = vec2f(dir.y, -dir.x);
  if (position.x < 0.0) { offset = -offset; }
  if (position.y < 0.0) {
    offset += -dir;
  } else if (position.y > 1.0) {
    offset += dir;
  }
  offset *= line.linewidth;
  var clip = select(clipEnd, clipStart, position.y < 0.5);
  offset *= clip.w;
  clip = vec4f(clip.xy + offset, clip.zw);
  out.position = clip;
  return out;
}

@fragment
fn fragmentMain(in: VertexOut) -> @location(0) vec4f {
  // Round end caps.
  if (abs(in.uv.y) > 1.0) {
    let a = in.uv.x;
    let b = select(in.uv.y + 1.0, in.uv.y - 1.0, in.uv.y > 0.0);
    if (a * a + b * b > 1.0) { discard; }
  }
  var colour = line.colour.rgb;
  if (line.useVertexColours != 0u) { colour *= in.colour; }
  return vec4f(colour, line.colour.a);
}
`;

/**
 * WGSL drawing instanced meshes in a flat colour, as three.js's MeshBasicMaterial does (used
 * for the vector field's arrows). Each instance's world matrix is a per-instance attribute.
 */
export const MESH_SHADER = `
struct Mesh {
  viewProjection: mat4x4f,
  colour: vec4f,
}
@group(0) @binding(0) var<uniform> mesh: Mesh;

@vertex
fn vertexMain(
  @location(0) position: vec3f,
  @location(1) m0: vec4f,
  @location(2) m1: vec4f,
  @location(3) m2: vec4f,
  @location(4) m3: vec4f,
) -> @builtin(position) vec4f {
  return mesh.viewProjection * mat4x4f(m0, m1, m2, m3) * vec4f(position, 1.0);
}

@fragment
fn fragmentMain() -> @location(0) vec4f {
  return mesh.colour;
}
`;

/**
 * Generates a two-stage sum reduction, as WebGL's sumMaterial does for domain integrals.
 * Each invocation of "main" sums R.count vec4fs into one per workgroup, multiplying the
 * total by R.scale. In the first stage, if masked is set, only the masked value r * (1 - g)
 * is summed (into x), as main.js does for the integral display and probe: r is the value and
 * g flags nodes outside the domain.
 */
export function sumShader(first, masked) {
  const term = first && masked ? "vec4f(v.x * (1.0 - v.y), 0.0, 0.0, 0.0)" : "v";
  return `
struct Reduce { count: u32, scale: f32 }
@group(0) @binding(0) var<uniform> R: Reduce;
@group(0) @binding(1) var<storage, read> input: array<vec4f>;
@group(0) @binding(2) var<storage, read_write> output: array<vec4f>;

const SIZE = 256u;
var<workgroup> sums: array<vec4f, SIZE>;

@compute @workgroup_size(SIZE)
fn main(@builtin(local_invocation_index) local: u32, @builtin(workgroup_id) wg: vec3u, @builtin(num_workgroups) groups: vec3u) {
  var total = vec4f(0.0);
  let stride = SIZE * groups.x;
  for (var k = wg.x * SIZE + local; k < R.count; k += stride) {
    let v = input[k];
    total += ${term};
  }
  sums[local] = total;
  workgroupBarrier();
  for (var s = SIZE / 2u; s > 0u; s /= 2u) {
    if (local < s) {
      sums[local] += sums[local + s];
    }
    workgroupBarrier();
  }
  if (local == 0u) {
    output[wg.x] = sums[0] * R.scale;
  }
}`;
}
