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
  assert.match(src, /vec4 textureBilinear\(sampler2D TEX, vec2 UV\)/);
  assert.match(src, /vec2 ST = UV \* SIZE - 0\.5;/);
  assert.match(src, /lessThan\(FRAC, vec2\(1e-4\)\)/);
  assert.match(src, /greaterThan\(FRAC, vec2\(1\.0 - 1e-4\)\)/);
});

// getReservedStrs() in main.js reserves every name declared in these helpers (it scrapes
// "float NAME", "vec2 NAME" etc.), so new locals mustn't take names users might choose.
test("auxiliary_GLSL_funs: declares no new lowercase names that would be reserved from users", () => {
  // Names that were already reserved before this check existed.
  const allowed = ["pi", "isTwoD", "safetanh", "safepow", "x", "y", "yDiff", "textureBilinear"];
  const declared = [...auxiliary_GLSL_funs().matchAll(/(?:float|vec\d|ivec\d|function|void)\b\s+(\w+)\b/g)].map((m) => m[1]);
  const lowercase = declared.filter((name) => /[a-z]/.test(name) && !/^[A-Z]/.test(name) && !allowed.includes(name));
  assert.deepEqual(lowercase, []);
});
