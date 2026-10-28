/**
 * Tests for derivatives of expressions, (E)_x etc., through main.js's real parsing pipeline
 * (parseShaderString and simReactionStencil, via generated/main-body.mjs), and that no preset
 * is affected by the new syntax.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as m from "./generated/main-body.mjs";
import { containsDerivatives, stencilName } from "../RD/derivatives.js";
import { getListOfPresetNames, getResolvedPreset } from "../RD/presets.js";

function setup(extraOptions = {}) {
  const options = {
    minX: "0",
    minY: "0",
    dimension: 2,
    numSpecies: 2,
    expressions: "F = u*v;",
    globalIntExprs: [null, null, null, null],
    boundaryConditions_1: "periodic",
    boundaryConditions_2: "periodic",
    ...extraOptions,
  };
  const errors = [];
  m.__setState({
    options,
    listOfSpecies: ["u", "v", "w", "q", "u5", "u6", "u7", "u8"],
    listOfReactions: ["UFUN", "VFUN"],
    expandedExpressionDefs: { F: "u*v" },
    expandedExpressionDefsSource: options.expressions,
    throwError: (message) => errors.push(message),
  });
  m.genAnySpeciesRegexStrs();
  return errors;
}

const u = (x, y) => Math.sin(1.3 * x + 0.4 * y) + 0.5 * Math.cos(0.7 * y);
const v = (x, y) => Math.exp(0.3 * x) * Math.cos(y);

/**
 * Runs the GLSL that the simulation would compute for the reaction term str at (x0, y0),
 * with every stencil local sampled from the fields u and v, as JavaScript: for expressions
 * of arithmetic and Math's functions, GLSL and JS agree.
 */
function simulateReaction(str, h) {
  const { shader, extra } = m.simReactionStencil("float UFUN = " + m.parseShaderString(str) + ";");
  const x0 = 0.37,
    y0 = -0.61;
  const names = new Set(["", ...extra.map((p) => stencilName(...p))]);
  for (const [, name] of shader.matchAll(/\buvwq([LRTB]*)\./g)) names.add(name);
  const env = { dx: h, dy: h, x: x0, y: y0 };
  for (const name of names) {
    const i = [...name].reduce((s, c) => s + (c == "R") - (c == "L"), 0);
    const j = [...name].reduce((s, c) => s + (c == "T") - (c == "B"), 0);
    env["uvwq" + name] = { r: u(x0 + i * h, y0 + j * h), g: v(x0 + i * h, y0 + j * h) };
  }
  const math = Object.getOwnPropertyNames(Math);
  const body = shader.replace("float UFUN =", "return");
  return new Function(...math, ...Object.keys(env), body)(
    ...math.map((n) => Math[n]),
    ...Object.values(env),
  );
}

// A reference for the derivative of F: nested fourth-order central differences.
function reference(F, nx, ny, x, y) {
  const d = 1e-2;
  const D = (f, dir) => (x, y) => {
    const at = (s) => (dir == 0 ? f(x + s * d, y) : f(x, y + s * d));
    return (-at(2) + 8 * at(1) - 8 * at(-1) + at(-2)) / (12 * d);
  };
  let f = F;
  for (let n = 0; n < nx; n++) f = D(f, 0);
  for (let n = 0; n < ny; n++) f = D(f, 1);
  return f(x, y);
}

for (const [str, F, nx, ny, expected = 2] of [
  ["(u^2*v)_x", (x, y) => u(x, y) ** 2 * v(x, y), 1, 0],
  ["(F)_y", (x, y) => u(x, y) * v(x, y), 0, 1],
  ["(sin(u)*x)_xy", (x, y) => Math.sin(u(x, y)) * x, 1, 1],
  ["(u)_xxx", u, 3, 0],
  ["(exp(-v)*y)_yy", (x, y) => Math.exp(-v(x, y)) * y, 0, 2],
  ["(u^2/2)_xb", (x, y) => u(x, y) ** 2 / 2, 1, 0, 1],
  ["(u*v)_yf", (x, y) => u(x, y) * v(x, y), 0, 1, 1],
  ["(u^2*v)_xf2", (x, y) => u(x, y) ** 2 * v(x, y), 1, 0],
]) {
  test(`the simulation's GLSL for ${str} converges to the derivative`, () => {
    const errors = setup();
    const exact = reference(F, nx, ny, 0.37, -0.61);
    const e1 = Math.abs(simulateReaction(str, 0.04) - exact);
    const e2 = Math.abs(simulateReaction(str, 0.02) - exact);
    assert.deepEqual(errors, []);
    const order = Math.log2(e1 / e2);
    assert.ok(
      order > expected - 0.2 && order < expected + 0.3,
      `order ${order}, errors ${e1}, ${e2}`,
    );
  });
}

test("parseShaderString leaves only stencil-ready tokens, and reports random terms", () => {
  let errors = setup();
  const parsed = m.parseShaderString("(u*v)_x + u_x");
  assert.match(parsed, /\bvpdeN_0_1_0\b/);
  assert.match(parsed, /\buvwqX\.r\b/);
  assert.deepEqual(errors, []);
  errors = setup();
  assert.equal(m.parseShaderString("(u*RAND)_x").trim(), "0.0");
  assert.equal(errors.length, 1);
});

test("simReactionStencil adds only the points that aren't already fetched", () => {
  setup();
  const { extra } = m.simReactionStencil(
    "float UFUN = " + m.parseShaderString("(u)_xy + (u)_xxx") + ";",
  );
  assert.deepEqual(extra.map((p) => stencilName(...p)).sort(), ["LB", "LT", "RB", "RT"]);
});

test("simReactionStencil fills in points beyond Neumann edges from robinRHS", () => {
  setup({ boundaryConditions_1: "neumann" });
  const { shader } = m.simReactionStencil(
    "float UFUN = " + m.parseShaderString("(u)_xy") + ";",
  );
  assert.match(shader, /uvwqLT\.r = uvwqRT\.r \+ 2\.0\*\(dx \* robinRHSuL\);/);
  // v is periodic and unused.
  assert.doesNotMatch(shader, /\.g = /);
});

test("timescales may use derivatives of expressions of x and y, but not of the species", () => {
  let errors = setup({ timescales: true, timescale_1: "1+(x^2)_x", timescale_2: "1" });
  assert.match(m.insertRates("TIMESCALES"), /\bdx\b/);
  assert.deepEqual(errors, []);
  errors = setup({ timescales: true, timescale_1: "1+(u^2)_x", timescale_2: "1" });
  m.insertRates("TIMESCALES");
  assert.equal(errors.length, 1);
});

test("no preset uses the new syntax, so every preset's shaders are unchanged", () => {
  for (const id of getListOfPresetNames()) {
    const preset = getResolvedPreset(id);
    const species = (preset.speciesNames ?? "u v w q").trim().split(/\s+/);
    for (const [key, value] of Object.entries(preset)) {
      if (typeof value != "string") continue;
      assert.equal(containsDerivatives(value, { species }), false, `${id}.${key}: ${value}`);
    }
  }
});

import {
  computeDisplayFunShaderTop,
  computeDisplayFunShaderMid,
  computeDisplayFunShaderMidMRT,
} from "../RD/post_shaders.js";
import { postShader } from "../RD/webgpu/display_wgsl.js";

for (const mrt of [false, true]) {
  test(`a post-processing shader with derivatives of expressions builds and translates to WGSL${mrt ? " (MRT)" : ""}`, () => {
    const errors = setup({ boundaryConditions_1: "neumann", numSpecies: mrt ? 5 : 2 });
    const fun = m.parseShaderString(mrt ? "(u*u5)_xy + u5_x" : "(u^2)_xy + v_xx");
    let shader = (computeDisplayFunShaderTop() + (mrt ? computeDisplayFunShaderMidMRT() : computeDisplayFunShaderMid()))
      .replace(/\bFUN\b/, fun)
      .replace(/\b(HEIGHT|XVECFUN|YVECFUN|OVERLAYEXPR)\b/g, "0.0")
      .replace("VECFIELDPLACEHOLDER", "")
      .replaceAll("MINX", "0.0")
      .replaceAll("MINY", "0.0");
    shader = m.insertStateStencil(shader, {
      textures: ["textureSource", "textureSourceGroup1"],
      fetch: "texture2D",
      texel: "1.0/vec2(texSize)",
    });
    assert.deepEqual(errors, []);
    assert.doesNotMatch(shader, /STATE_STENCIL|vpdeN_|VPDE_H/);
    // u is Neumann, so is extrapolated at every edge; v isn't.
    assert.match(shader, /mix\(uvwqL, .*, vec4\(1\.0, 0\.0, 0\.0, 0\.0\)\)/);
    assert.match(shader, /\buvwqRT\.r\b/);
    const body = shader.slice(shader.indexOf("{", shader.indexOf("void main()")) + 1);
    const wgsl = postShader({ numGroups: mrt ? 2 : 1, clamp: [[true, true], [false, false]], paramNames: [], body });
    assert.match(wgsl, /uvwqRT/);
  });
}

test("derivatives of expressions are typeset as partial derivative operators", () => {
  setup();
  m.__setState({ options: { ...m.options, dimension: 2 } });
  const tex = (str) => m.parseStringToTEX(str).replaceAll(/\s+/g, " ");
  assert.match(tex("(u^2)_x"), /\\pd\{\}\{x\}\\left\(\{u\}\^\{2\}\s*\\right\)/);
  assert.match(tex("(u*v)_yy"), /\\pdd\{\}\{y\}\\left\(/);
  // One-sided derivatives are typeset like u_xf, as the derivative they approximate.
  assert.match(tex("(u^2)_xb"), /\\pd\{\}\{x\}\\left\(/);
  assert.match(tex("(u*v)_yf2"), /\\pd\{\}\{y\}\\left\(/);
  assert.match(tex("(u*v)_xfxb"), /\\pdd\{\}\{x\}\\left\(/);
  assert.match(tex("(u)_xxy"), /\\frac\{\\partial\^\{3\}\}\{\\partial x\^\{2\} \\partial y\}/);
  // Nested derivatives, and functions as operands.
  const nested = tex("(v*(u)_x)_y + sin(u)_x");
  assert.equal(nested.match(/\\pd\{\}/g).length, 3);
  assert.match(nested, /\\sin/);
  assert.doesNotMatch(nested, /Placeholder|\)_/);
});

import { translateStatements } from "../RD/webgpu/glsl_to_wgsl.js";

test("in a domain given by an indicator function, the stencil is filled in from the indicator", () => {
  const errors = setup({
    boundaryConditions_1: "neumann",
    boundaryConditions_2: "dirichlet",
    domainViaIndicatorFun: true,
    domainIndicatorFun: "16-(x-5)^2-(y-5)^2",
  });
  const { shader, extra } = m.simReactionStencil(
    "float UFUN = " + m.parseShaderString("(u)_xy + (v)_xy + (u)_xxx") + ";",
  );
  assert.deepEqual(errors, []);
  // Tested with the indicator a quarter of a node further out, as for the first ring.
  assert.match(shader, /bool vpdeOutsideRRX = \(float\(.*\(x\+2\.25\*dx\)/);
  assert.match(shader, /uvwqLT\.r = vpdeOutside/);
  // The Dirichlet species v needs nothing.
  assert.doesNotMatch(shader, /\.g = /);
  assert.ok(extra.length > 0);
  translateStatements(shader.replace(/^[\s\S]*?(?=\n\s*bool)/, ""), {});

  let post = (computeDisplayFunShaderTop() + computeDisplayFunShaderMid())
    .replace(/\bFUN\b/, m.parseShaderString("(u^2)_x + u_y"))
    .replace(/\b(HEIGHT|XVECFUN|YVECFUN|OVERLAYEXPR)\b/g, "0.0")
    .replace("VECFIELDPLACEHOLDER", "")
    .replaceAll("MINX", "0.0")
    .replaceAll("MINY", "0.0");
  post = m.insertStateStencil(post, {
    textures: ["textureSource", "textureSourceGroup1"],
    fetch: "texture2D",
    texel: "1.0/vec2(texSize)",
  });
  assert.deepEqual(errors, []);
  // Only the Neumann species u is extrapolated.
  assert.match(post, /mix\(uvwqL, .*, vec4\(1\.0, 0\.0, 0\.0, 0\.0\)\)/);
  const body = post.slice(post.indexOf("{", post.indexOf("void main()")) + 1);
  postShader({ numGroups: 1, clamp: [[true, true]], paramNames: [], body });
});

// Every stencil local and outside test in code is declared before its first use.
function assertDeclaredBeforeUse(code) {
  const declared = new Set();
  for (const m of code.matchAll(/\b(?:(vec4|bool) )?(uvwq2?[LRTB]*|vpdeOutside\w+)\b/g)) {
    if (m[1]) declared.add(m[2]);
    else assert.ok(declared.has(m[2]), `${m[2]} is used before it's declared`);
  }
}

test("in a domain given by an indicator of species 5-8, the display's stencils are fetched before the indicator reads them", () => {
  const errors = setup({
    numSpecies: 5,
    boundaryConditions_1: "neumann",
    boundaryConditions_5: "neumann",
    domainViaIndicatorFun: true,
    domainIndicatorFun: "16-(x-5)^2-(y-5)^2 + u5 - u",
  });
  let post = (computeDisplayFunShaderTop() + computeDisplayFunShaderMidMRT())
    .replace(/\bFUN\b/, m.parseShaderString("(u*u5)_xy + u5_x"))
    .replace(/\b(HEIGHT|XVECFUN|YVECFUN|OVERLAYEXPR)\b/g, "0.0")
    .replace("VECFIELDPLACEHOLDER", "")
    .replaceAll("MINX", "0.0")
    .replaceAll("MINY", "0.0");
  post = m.insertStateStencil(post, {
    textures: ["textureSource", "textureSourceGroup1"],
    fetch: "texture2D",
    texel: "1.0/vec2(texSize)",
  });
  assert.deepEqual(errors, []);
  const body = post.slice(post.indexOf("{", post.indexOf("void main()")) + 1);
  assertDeclaredBeforeUse(body);
  // The tests read species 5 at the nodes, and are shared by both groups.
  assert.match(body, /bool vpdeOutsideRX = .*uvwq2R\.r/);
  assert.equal(body.match(/bool vpdeOutsideRX\b/g).length, 1);
  // ...and come before any group is extrapolated.
  assert.ok(body.indexOf("bool vpdeOutside") < body.indexOf("mix(uvwq"));
  postShader({ numGroups: 2, clamp: [[true, true], [false, false]], paramNames: [], body });
});
