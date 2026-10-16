import { test } from "node:test";
import assert from "node:assert/strict";
import { blockingPlan, blockedTimestepShader } from "../RD/webgpu/sim_wgsl.js";

// The pieces of a 1D, one-species simulation, as main.js's gpuShaderParts() and
// setRDEquations() build them, with the given computeRHS body (GLSL).
function parts(middle, overrides = {}) {
  return {
    numGroups: 1,
    formats: ["r32float"],
    clamp: [[true, false]],
    paramNames: [],
    minX: "0.0",
    minY: "0.0",
    twoD: false,
    timescales: "vec4(1.0, 1.0, 1.0, 1.0)",
    timescalesGroup1: "vec4(1.0, 1.0, 1.0, 1.0)",
    bot: { FE: "" },
    middle,
    ...overrides,
  };
}

// Defines every derivative, as setRDEquations() does whether or not they're used.
const DERIVATIVES = `
  vec4 uvwqX = (uvwqR-uvwqL)/(2.0*dx);
  vec4 uvwqXFXF = (4.0*uvwqR-3.0*uvwq-uvwqRR)/(2.0*dx);
  vec4 uvwqXBXB = (3.0*uvwq-4.0*uvwqL+uvwqLL)/(2.0*dx);
`;
const LAPLACIAN = `
  float LDuuU = (uvwqR.r+uvwqL.r-2.0*uvwq.r)/(dx*dx);
`;

test("blockingPlan: 2D simulations aren't blocked", () => {
  assert.equal(
    blockingPlan(parts(`${LAPLACIAN} result = vec4(LDuuU, 0.0, 0.0, 0.0); }`, { twoD: true }), 32768),
    null,
  );
});

test("blockingPlan: second neighbours that can't affect the result don't widen the stencil", () => {
  const plan = blockingPlan(
    parts(`${DERIVATIVES}${LAPLACIAN} result = vec4(LDuuU + uvwqX.r, 0.0, 0.0, 0.0); }`),
    32768,
  );
  assert.equal(plan.radius, 1);
  assert.equal(plan.output, 512 - 2 * plan.steps);
});

test("blockingPlan: second neighbours that reach the result widen the stencil to 2", () => {
  const plan = blockingPlan(
    parts(`${DERIVATIVES}${LAPLACIAN} float du = LDuuU - uvwqXBXB.r; result = vec4(du, 0.0, 0.0, 0.0); }`),
    32768,
  );
  assert.equal(plan.radius, 2);
});

test("blockingPlan: second neighbours used under a condition widen the stencil", () => {
  const plan = blockingPlan(
    parts(`${DERIVATIVES}${LAPLACIAN} if (uvwqRR.r > 0.0) { LDuuU = 0.0; } result = vec4(LDuuU, 0.0, 0.0, 0.0); }`),
    32768,
  );
  assert.equal(plan.radius, 2);
});

test("blockingPlan: second neighbours used by the timescales or Dirichlet code widen the stencil", () => {
  const middle = `${DERIVATIVES}${LAPLACIAN} result = vec4(LDuuU, 0.0, 0.0, 0.0); }`;
  assert.equal(
    blockingPlan(parts(middle, { timescales: "vec4(1.0 + uvwqLL.r, 1.0, 1.0, 1.0)" }), 32768).radius,
    2,
  );
  assert.equal(blockingPlan(parts(middle, { bot: { FE: "updated.r = uvwqRR.r;" } }), 32768).radius, 2);
});

test("blockingPlan: lookups away from the stencil (u[x,y]) prevent blocking", () => {
  const middle = `${LAPLACIAN} result = vec4(LDuuU + textureBilinear(textureSource, vec2(0.5, 0.5)).r, 0.0, 0.0, 0.0); }`;
  assert.equal(blockingPlan(parts(middle), 32768), null);
});

test("blockingPlan: a tile that doesn't fit in workgroup memory prevents blocking", () => {
  const middle = `${LAPLACIAN} result = vec4(LDuuU, 0.0, 0.0, 0.0); }`;
  // 512 nodes of 8 species in two rgba32float groups: 16 KiB.
  const eight = parts(middle, {
    numGroups: 2,
    formats: ["rgba32float", "rgba32float"],
    clamp: [[true, false], [false, false]],
  });
  assert.ok(blockingPlan(eight, 16384));
  assert.equal(blockingPlan(eight, 16383), null);
});

test("blockedTimestepShader: neighbours are clamped only for clamped groups, and y-neighbours are the node", () => {
  const middle = `${LAPLACIAN} result = vec4(LDuuU, 0.0, 0.0, 0.0); }`;
  const clamped = parts(middle);
  const clampedCode = blockedTimestepShader(clamped, blockingPlan(clamped, 32768));
  assert.match(clampedCode, /tileRead0\(k \+ clamp\(ci \+ -1, 0, nX - 1\) - ci\)/);
  assert.doesNotMatch(clampedCode, /tileRead0\(k \+ -1\)/);
  const periodic = parts(middle, { clamp: [[false, false]] });
  const periodicCode = blockedTimestepShader(periodic, blockingPlan(periodic, 32768));
  assert.match(periodicCode, /tileRead0\(k \+ -1\)/);
  assert.doesNotMatch(periodicCode, /clamp\(ci/);
  // Missing channels read as the sampler returns them: 0, and 1 for alpha.
  assert.match(periodicCode, /vec4f\(tile0\[k\], 0\.0, 0\.0, 1\.0\)/);
});
