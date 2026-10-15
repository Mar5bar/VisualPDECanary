import { test } from "node:test";
import assert from "node:assert/strict";
import {
  translateExpression,
  translateStatements,
  TranslationError,
} from "../RD/webgpu/glsl_to_wgsl.js";

test("translateExpression: maps GLSL types, casts and renamed functions to WGSL", () => {
  assert.equal(translateExpression("float(u > 0.5)"), "f32(u>0.5)");
  assert.equal(translateExpression("vec4(du,dv,0.0,0.0)"), "vec4f(du, dv, 0.0, 0.0)");
  assert.equal(translateExpression("mod(x, 2.)"), "vpde_mod(x, 2.)");
  assert.equal(translateExpression("inversesqrt(x)"), "inverseSqrt(x)");
  assert.equal(translateExpression("isnan(x)"), "vpde_isnan(x)");
});

test("translateExpression: two-argument atan becomes atan2, one-argument atan stays", () => {
  assert.equal(translateExpression("atan(y, x)"), "atan2(y, x)");
  assert.equal(translateExpression("atan(x)"), "atan(x)");
});

test("translateExpression: H is split by arity, since WGSL has no overloading", () => {
  assert.equal(translateExpression("H(u) + H(u, 0.5)"), "H1(u)+H2(u, 0.5)");
});

test("translateExpression: vector relational functions become componentwise operators", () => {
  assert.equal(translateExpression("vec2(lessThan(f, vec2(1e-4)))"), "vec2f((f < vec2f(1e-4)))");
  assert.equal(translateExpression("notEqual(a, b)"), "(a != b)");
});

test("translateExpression: nested calls and component access", () => {
  assert.equal(
    translateExpression("safepow(uvwq.r, 2.)*exp(-(x-1.)*(x-1.))"),
    "safepow(uvwq.r, 2.)*exp(-(x-1.)*(x-1.))",
  );
});

test("translateExpression: renames identifiers but never member names", () => {
  const renames = { a: "P_a", r: "P_r" };
  assert.equal(translateExpression("a*uvwq.r + r", { renames }), "P_a*uvwq.r+P_r");
});

test("translateExpression: caller-supplied calls receive translated arguments", () => {
  const calls = {
    textureBilinear: ([tex, uv]) => `lookup_${tex}(${uv})`,
  };
  assert.equal(
    translateExpression("textureBilinear(textureSource, vec2(x, float(1))).g", { calls }),
    "lookup_textureSource(vec2f(x, f32(1))).g",
  );
});

test("translateExpression: integer literals lose leading zeros, which WGSL forbids", () => {
  assert.equal(translateExpression("00 + 007. + 0.5"), "0+7.+0.5");
});

test("translateExpression: unsupported operators are rejected rather than mistranslated", () => {
  assert.throws(() => translateExpression("u > 0. ? 1. : 0."), TranslationError);
  assert.throws(() => translateExpression("i++"), TranslationError);
});

test("translateStatements: declarations become typed vars", () => {
  assert.equal(
    translateStatements("float UFUN = uvwq.r*(1.-uvwq.r);\nvec4 RHS;"),
    "var UFUN: f32 = uvwq.r*(1.-uvwq.r);\nvar RHS: vec4f;",
  );
  assert.equal(
    translateStatements("const highp float A = 1.0, B;"),
    "var A: f32 = 1.0;\nvar B: f32;",
  );
});

test("translateStatements: uniform, varying and precision declarations are dropped", () => {
  assert.equal(
    translateStatements("precision highp float; uniform float a; varying vec2 textureCoords; float b = 1.;"),
    "var b: f32 = 1.;",
  );
});

test("translateStatements: if/else blocks keep their structure", () => {
  const out = translateStatements(`
    if (textureCoords.x - step_x < 0.0) {
        uvwqL.r = 2.0 * (dx * robinRHSuL) + uvwqR.r;
    } else if (interior > 0.5) {
        uvwqL.r += 1.0;
    } else {
        uvwqL.r = 0.0;
    }`);
  assert.equal(
    out,
    [
      "if (textureCoords.x-step_x<0.0)",
      "{",
      "  uvwqL.r = 2.0*(dx*robinRHSuL)+uvwqR.r;",
      "}",
      "else if (interior>0.5)",
      "{",
      "  uvwqL.r += 1.0;",
      "}",
      "else",
      "{",
      "  uvwqL.r = 0.0;",
      "}",
    ].join("\n"),
  );
});

test("translateStatements: multi-component swizzle assignments are split per component", () => {
  assert.equal(
    translateStatements("uvwqL.rg = uvwq.rg;"),
    "let vpde_swizzle0 = uvwq.rg;\nuvwqL.r = vpde_swizzle0[0];\nuvwqL.g = vpde_swizzle0[1];",
  );
});

test("translateStatements: nested blocks can shadow names, as the Dirichlet wrapper does", () => {
  assert.equal(
    translateStatements("float tDirichlet = t + dt; { float t = tDirichlet; updated.r = t; }"),
    "var tDirichlet: f32 = t+dt;\n{\n  var t: f32 = tDirichlet;\n  updated.r = t;\n}",
  );
});

test("translateStatements: for loops keep their structure", () => {
  assert.equal(
    translateStatements(
      "for (float contourVal = contourStep; contourVal < 1.0; contourVal += contourStep) { col = mix(col, c, 0.5); }",
    ),
    "for (var contourVal: f32 = contourStep; contourVal<1.0; contourVal += contourStep)\n{\n  col = mix(col, c, 0.5);\n}",
  );
});

test("translateStatements: a bare return returns the given value, if there is one", () => {
  assert.equal(
    translateStatements("if (v > 0.5) { fragColour = vec4(0); return; }", { returnValue: "fragColour" }),
    "if (v>0.5)\n{\n  fragColour = vec4f(0);\n  return fragColour;\n}",
  );
  assert.throws(() => translateStatements("return;"), TranslationError);
});

test("translateStatements: other loops and value returns are rejected", () => {
  assert.throws(() => translateStatements("while (x < 1.) { x += 1.; }"), TranslationError);
  assert.throws(() => translateStatements("return x;"), TranslationError);
});
