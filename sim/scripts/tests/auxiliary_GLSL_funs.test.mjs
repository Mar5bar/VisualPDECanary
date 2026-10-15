import { test } from "node:test";
import assert from "node:assert/strict";
import { auxiliary_GLSL_funs } from "../auxiliary_GLSL_funs.js";

test("auxiliary_GLSL_funs: defines every helper function referenced elsewhere in the shader pipeline", () => {
  const glsl = auxiliary_GLSL_funs();
  for (const fn of ["H(float VALUE)", "safetanh", "safepow", "Gauss", "Bump"]) {
    assert.match(glsl, new RegExp(fn.replace(/[()]/g, "\\$&")), `missing ${fn}`);
  }
  assert.match(glsl, /const float pi = 3\.141592653589793;/);
});

test("auxiliary_GLSL_funs: textureBilinear interpolates between the four surrounding texel centres, snapping near-centre weights", () => {
  const src = auxiliary_GLSL_funs();
  assert.match(src, /vec4 textureBilinear\(sampler2D tex, vec2 uv\)/);
  assert.match(src, /vec2 st = uv \* size - 0\.5;/);
  assert.match(src, /lessThan\(f, vec2\(1e-4\)\)/);
  assert.match(src, /greaterThan\(f, vec2\(1\.0 - 1e-4\)\)/);
});
