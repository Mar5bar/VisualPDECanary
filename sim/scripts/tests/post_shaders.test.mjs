import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeDisplayFunShaderTop,
  computeDisplayFunShaderMid,
  computeDisplayFunShaderTopMRT,
  computeDisplayFunShaderMidMRT,
  postShaderDomainIndicatorVField,
  postShaderDomainIndicator,
  postGenericShaderBot,
  interpolationShader,
  minMaxShader,
  sumShader,
  probeShader,
  probeShaderMRT,
} from "../RD/post_shaders.js";

// Every field Int(...) can be used in (see getUserTextFields()) has to be compiled into a
// shader that declares these 4 uniforms, or parseShaderString's Int(...) -> globalIntegralValueN
// substitution produces a reference to an undeclared uniform - a GLSL compile error. Checked
// wherever a View-eligible field (whatToPlot/surfaceFun/arrowX/arrowY here, probeFun/X/Y below)
// gets compiled.
function assertDeclaresGlobalIntegralUniforms(shaderSrc) {
  for (let i = 1; i <= 4; i++) {
    assert.match(shaderSrc, new RegExp(`uniform float globalIntegralValue${i};`));
  }
}

test("computeDisplayFunShaderTop: declares the globalIntegralValue1-4 uniforms Int(...) needs (whatToPlot/surfaceFun/arrowX/arrowY)", () => {
  assertDeclaresGlobalIntegralUniforms(computeDisplayFunShaderTop());
});

test("probeShader: declares the globalIntegralValue1-4 uniforms Int(...) needs (probeFun/probeX/probeY)", () => {
  assertDeclaresGlobalIntegralUniforms(probeShader());
});

test("computeDisplayFunShaderTop/Mid: non-empty, contain expected placeholders", () => {
  assert.match(computeDisplayFunShaderTop(), /AUXILIARY_GLSL_FUNS/);
  const mid = computeDisplayFunShaderMid();
  for (const placeholder of ["FUN", "HEIGHT", "XVECFUN", "YVECFUN", "OVERLAYEXPR", "VECFIELDPLACEHOLDER"]) {
    assert.match(mid, new RegExp(placeholder), `missing ${placeholder}`);
  }
});

test("computeDisplayFunShaderTopMRT: adds textureSourceGroup1 sampler", () => {
  const mrt = computeDisplayFunShaderTopMRT();
  assert.match(mrt, /uniform sampler2D textureSource;\s*\n\s*uniform sampler2D textureSourceGroup1;/);
});

test("computeDisplayFunShaderMidMRT: adds group 1's stencil placeholder before 'float value = FUN;'", () => {
  const mrt = computeDisplayFunShaderMidMRT();
  const group1Index = mrt.indexOf("STATE_STENCIL_GROUP1");
  const valueIndex = mrt.lastIndexOf("float value = FUN;");
  assert.ok(group1Index >= 0 && valueIndex >= 0 && group1Index < valueIndex);
  assert.equal(mrt.split("float value = FUN;").length - 1, 1);
});

test("postShaderDomainIndicatorVField: substitutes fun's x/y/uvwq references for each of the 4 stencil directions", () => {
  const shader = postShaderDomainIndicatorVField("uvwq.r * x");
  assert.match(shader, /uvwqL\.r \* \(x-dx\)/);
  assert.match(shader, /uvwqR\.r \* \(x\+dx\)/);
  // The T/B substitutions operate on \by\b, which is absent from this fun string, so they
  // should leave the x-substituted text as-is except for swapping the channel to T/B.
  assert.match(shader, /uvwqT\.r \* x/);
  assert.match(shader, /uvwqB\.r \* x/);
});

test("postShaderDomainIndicator/postGenericShaderBot: minimal fixed fragments", () => {
  assert.match(postShaderDomainIndicator(), /gl_FragColor\.g = float\(float\(indicatorFun\) <= 0\.0\);/);
  assert.equal(postGenericShaderBot(), "}");
});

test("interpolationShader/minMaxShader/sumShader: non-empty, self-contained shaders", () => {
  assert.match(interpolationShader(), /Bilinear interpolation/);
  assert.match(minMaxShader(), /gl_FragColor = vec4\(minVal, maxVal, 0\.0, 0\.0\);/);
  assert.match(sumShader(), /gl_FragColor = sumVal;/);
  assert.match(sumShader(), /vec4 sumVal = vec4\(0\.0\);/); // sums all 4 channels independently
});

test("probeShader: contains PROBE_FUN/PROBE_X/PROBE_Y placeholders and a stencil placeholder", () => {
  const shader = probeShader();
  for (const placeholder of ["PROBE_FUN", "PROBE_X", "PROBE_Y"]) {
    assert.match(shader, new RegExp(placeholder));
  }
  assert.ok(shader.indexOf("STATE_STENCIL") < shader.indexOf("PROBE_FUN"));
});

test("probeShaderMRT: adds textureSourceGroup1 sampler and group 1's stencil placeholder", () => {
  const mrt = probeShaderMRT();
  assert.match(mrt, /uniform sampler2D textureSourceGroup1;/);
  assert.ok(mrt.indexOf("STATE_STENCIL_GROUP1") < mrt.indexOf("PROBE_FUN"));
});

test("minMaxShader: reduces each texel's 2x2 block of source texels by index, within bounds", () => {
  // As sumShader does: with normalised coordinates, blocks don't line up with the texels of
  // odd-sized textures, and some texels were never read.
  const src = minMaxShader();
  assert.match(src, /ivec2 srcTexel = outTexel \* 2 \+ ivec2\(x, y\);/);
  assert.match(src, /srcTexel\.x < int\(srcResolution\.x\) && srcTexel\.y < int\(srcResolution\.y\)/);
  assert.match(src, /texture2D\(textureSource, \(vec2\(srcTexel\) \+ 0\.5\) \/ srcResolution\)/);
  assert.doesNotMatch(src, /onePixel/);
});
