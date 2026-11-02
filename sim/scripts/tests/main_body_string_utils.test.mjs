/**
 * Tests for the smaller string/formatting/TeX helpers: those in utils.js, expressions.js and
 * shader_strings.js, and a few still in main.js, tested against generated/main-body.mjs (see
 * extract-main-body.mjs). These need no options/state fixture at all, or only a trivial one.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as m from "./generated/main-body.mjs";
import {
  alternateBracketsGivenDepth,
  findAllFunCalls,
  removeEvalAt,
  replaceBinOperator,
  replaceBump,
  replaceFunctionInTeX,
  replaceGauss,
  replaceSymbolsInStr,
  replaceUserDefDiff,
  replaceUserDefReac,
  sortBCsString,
  splitArgs,
} from "../RD/expressions.js";
import { enableImageLookupInShader } from "../RD/shader_strings.js";
import {
  capitaliseFirstLetter,
  computeColourBrightness,
  diffObjects,
  formatLabelNum,
  formatLabels,
  insertStrAtIndex,
  modulo,
  removeExtraWhitespace,
  removeWhitespace,
  replaceStrAtIndex,
  shortestStringNum,
} from "../RD/utils.js";

test("modulo: always returns a non-negative result, unlike JS's %", () => {
  assert.equal(modulo(-1, 3), 2);
  assert.equal(modulo(5, 3), 2);
  assert.equal(modulo(0, 3), 0);
});

test("replaceStrAtIndex: replaces a single character by default, or a range when resumeInd is given", () => {
  assert.equal(replaceStrAtIndex("hello world", "X", 6), "hello Xorld");
  assert.equal(replaceStrAtIndex("hello world", "XYZ", 0, 5), "XYZ world");
});

test("insertStrAtIndex: inserts without removing any existing characters", () => {
  assert.equal(insertStrAtIndex("hello", "X", 2), "heXllo");
});

test("removeWhitespace: collapses runs of whitespace to 2 spaces and trims", () => {
  assert.equal(removeWhitespace("  a   b\tc  "), "a  b  c");
});

test("removeExtraWhitespace: collapses runs of whitespace to a single space (no trim)", () => {
  assert.equal(removeExtraWhitespace("a   b    c"), "a b c");
  assert.equal(removeExtraWhitespace("  a  "), " a ");
});

test("capitaliseFirstLetter", () => {
  assert.equal(capitaliseFirstLetter("hello"), "Hello");
  assert.equal(capitaliseFirstLetter(""), "");
});

test("removeEvalAt: strips the TeX eval-at-boundary wrapper, leaving the wrapped content", () => {
  assert.equal(removeEvalAt("\\left. u \\right\\rvert_{\\boundary}"), " u ");
});

test("sortBCsString: sorts ';'-separated clauses alphabetically, dropping empties, trailing ';'", () => {
  assert.equal(
    sortBCsString("Top: Periodic; Left: Dirichlet = 0;"),
    "Left: Dirichlet = 0; Top: Periodic;",
  );
  assert.equal(sortBCsString(";;"), ";");
});

test("formatLabelNum: formats to the given number of significant figures", () => {
  assert.equal(formatLabelNum(3.14159, 3), "3.14");
});

test("shortestStringNum: picks whichever of toFixed/toPrecision is shorter", () => {
  assert.equal(shortestStringNum(5, 3), "5.00");
  assert.equal(shortestStringNum(0.001234, 3), "0.001");
});

test("formatLabels: uses exponential notation when both values are near zero, otherwise the shortest fixed/precision form", () => {
  assert.deepEqual(formatLabels(0.0001, 0.0002), ["1.00e-4", "2.00e-4"]);
  assert.deepEqual(formatLabels(1, 200), ["1.00", "200"]);
});

test("diffObjects: returns only the entries of o1 whose value differs (by JSON) from o2's, deep-cloned", () => {
  const o1 = { a: 1, b: 2, c: { x: 1 } };
  const o2 = { a: 1, b: 3, c: { x: 1 } };
  const diff = diffObjects(o1, o2);
  assert.deepEqual(diff, { b: 2 });
  // Deep-cloned, not a live reference.
  diff.b = 999;
  assert.equal(o1.b, 2);
});

test("splitArgs: splits on top-level commas only, respecting nested parentheses", () => {
  assert.deepEqual(splitArgs("a, b, f(c,d), e"), ["a", "b", "f(c,d)", "e"]);
  assert.deepEqual(splitArgs(""), []);
});

test("findAllFunCalls: locates every balanced call to the named function and parses its arguments", () => {
  const calls = findAllFunCalls("Gauss(1,2,3) + Bump(x,y) + Gauss(4,5)", "Gauss");
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0].args, ["1", "2", "3"]);
  assert.deepEqual(calls[1].args, ["4", "5"]);
  assert.equal(findAllFunCalls("no calls here", "Gauss").length, 0);
});

test("alternateBracketsGivenDepth: picks the bracket type based on depth parity", () => {
  assert.equal(alternateBracketsGivenDepth("(a)", 1), "(a)");
  assert.equal(alternateBracketsGivenDepth("(a)", 2), "[a]");
});

test("replaceFunctionInTeX: prefixes a backslash and wraps the argument in braces (optionally keeping the original brackets)", () => {
  assert.equal(replaceFunctionInTeX("sqrt(a+b)", "sqrt", true), "\\sqrt{(a+b)}");
  assert.equal(replaceFunctionInTeX("abs(a-b)", "abs", false), "\\abs{a-b}");
  assert.equal(replaceFunctionInTeX("a+b", "sqrt", true), "a+b");
});

test("enableImageLookupInShader: converts I_S/I_T(...) calls into texture lookups, averaging rgb when no channel is specified", () => {
  const rgb = enableImageLookupInShader("I_T(x,y)");
  assert.match(rgb, /texture\(imageSourceTwo,vec2\(\(x-MINX\)\/L_x,\(y-MINY\)\/L_y\)\)\.r/);
  assert.match(rgb, /\)\/3\.0/);
  const single = enableImageLookupInShader("I_SR(x,y)");
  assert.equal(single, "texture(imageSourceOne,vec2((x-MINX)/L_x,(y-MINY)/L_y)).r");
});

test("replaceUserDefReac: removes the match for '0', substitutes lettered input directly, leaves scalar input as the original", () => {
  assert.equal(replaceUserDefReac("blah f blah", /\bf\b/g, "0"), "blah  blah");
  assert.equal(replaceUserDefReac("blah f blah", /\bf\b/g, "2*a"), "blah 2*a blah");
  assert.equal(replaceUserDefReac("blah f blah", /\bf\b/g, "2"), "blah f blah");
});

test("replaceUserDefTimescale: special-cases 1/-1, parenthesizes +/- expressions, removes the match entirely when timescales are off", () => {
  m.__setState({ options: { timescales: true } });
  assert.equal(m.replaceUserDefTimescale("X tau Y", /tau/g, "1"), "X  Y");
  assert.equal(m.replaceUserDefTimescale("X tau Y", /tau/g, "-1"), "X - Y");
  assert.equal(m.replaceUserDefTimescale("X tau Y", /tau/g, "a+b"), "X (a+b) Y");
  m.__setState({ options: { timescales: false } });
  assert.equal(m.replaceUserDefTimescale("X tau Y", /tau/g, "a+b"), "X  Y");
});

test("replaceUserDefDiff: special-cases 0/1/-1, otherwise wraps the input in the given delimiters", () => {
  const re = () => /(FOO) (BAR)/g;
  assert.equal(replaceUserDefDiff("FOO BAR", re(), "0"), "");
  assert.equal(replaceUserDefDiff("FOO BAR", re(), "0.0"), "");
  assert.equal(replaceUserDefDiff("FOO BAR", re(), "1"), "BAR");
  assert.equal(replaceUserDefDiff("FOO BAR", re(), "-1"), " - BAR");
  assert.equal(replaceUserDefDiff("FOO BAR", re(), "2*a"), " 2*a BAR");
  assert.equal(replaceUserDefDiff("FOO BAR", re(), "2*a", "[]"), "[2*a]BAR");
});

test("replaceWhiteNoise: substitutes WhiteNoise/WhiteNoise_2-4 with scaled RANDN terms, using dx (1D) or dx*dy (2D)", () => {
  m.__setState({ numsAsWords: ["zero", "one", "two", "three", "four", "five"] });
  m.__setState({ options: { dimension: 2 } });
  assert.equal(
    m.replaceWhiteNoise("WhiteNoise + WhiteNoise_2"),
    "sqrt(1/(dt*(dx*dy)))*RANDN + sqrt(1/(dt*(dx*dy)))*RANDNTWO",
  );
  m.__setState({ options: { dimension: 1 } });
  assert.equal(m.replaceWhiteNoise("WhiteNoise"), "sqrt(1/(dt*dx))*RANDN");
});

test("replaceGauss: normalizes every arity of Gauss(...) to the full 7-argument Gauss(x,y,meanx,meany,sx,sy,rho) form", () => {
  assert.equal(replaceGauss("Gauss(1,2,3,4,5)"), "Gauss(x,y,1,2,3,4,5)");
  assert.equal(replaceGauss("Gauss(1,2,3,4)"), "Gauss(x,y,1,2,3,4,0)");
  assert.equal(replaceGauss("Gauss(1,2,3)"), "Gauss(x,y,1,2,3,3,0)");
  assert.equal(replaceGauss("Gauss(1,2)"), "Gauss(x,y,1,0.5*L_y,2,2,0)");
  assert.equal(replaceGauss("a+b"), "a+b");
});

test("replaceBump: normalizes every arity of Bump(...) to the full 5-argument Bump(x,y,meanx,meany,maxR) form", () => {
  assert.equal(replaceBump("Bump(1,2,3)"), "Bump(x,y,1,2,3)");
  assert.equal(replaceBump("Bump(1,2)"), "Bump(x,y,1,0.5*L_y,2)");
  assert.equal(replaceBump("a+b"), "a+b");
});

test("replaceBinOperator: replaces every top-level match of the given operator with form(match, left, right), respecting balanced brackets", () => {
  const pow = (str) => replaceBinOperator(str, "^", (full, p1, p2) => `POW(${p1},${p2})`);
  assert.equal(pow("a^2"), "POW(a,2)");
  assert.equal(pow("(a+b)^2"), "POW((a+b),2)");
  assert.equal(pow("a+b"), "a+b"); // no match, unchanged
});

test("replaceSymbolsInStr: substitutes every whole-word original with its replacement, via placeholders so overlapping names don't clash", () => {
  assert.equal(replaceSymbolsInStr("u + v", ["u", "v"], ["prey", "predator"]), "prey + predator");
  assert.equal(
    replaceSymbolsInStr("u_x + v", ["u", "v"], ["p", "q"], "_(?:[xy])"),
    "p_x + q",
  );
});

test("replaceSymbolsInStr: ignores empty originals rather than matching at every word boundary", () => {
  const optional = "_(?:[xy][xybf]?)";
  assert.equal(replaceSymbolsInStr("0", ["", "v"], ["u", "v"], optional), "0");
  assert.equal(
    replaceSymbolsInStr("L_x/2 - x", ["", "v"], ["u", "v"], optional),
    "L_x/2 - x",
  );
  assert.equal(replaceSymbolsInStr("v_x + 1", ["", "v"], ["u", "w"], optional), "w_x + 1");
});

test("replaceSymbolsInStr: swaps names round, and leaves text resembling a placeholder alone", () => {
  assert.equal(replaceSymbolsInStr("u - v", ["u", "v"], ["v", "u"]), "v - u");
  assert.equal(replaceSymbolsInStr("PLACE0 + u", ["u"], ["a"]), "PLACE0 + a");
  assert.equal(replaceSymbolsInStr("u1 + u10", ["u1", "u10"], ["a", "b"]), "a + b");
});

test("timescaleTag: species 1-4 use a letter suffix (matching timescaleTags), species 5-8 use a numeric suffix", () => {
  m.__setState({ defaultSpecies: ["u", "v", "w", "q", "u5", "u6", "u7", "u8"] });
  assert.equal(m.timescaleTag(1), "TU");
  assert.equal(m.timescaleTag(4), "TQ");
  assert.equal(m.timescaleTag(5), "TU5");
});

test("computeColourBrightness: mean of the RGB components", () => {
  assert.equal(computeColourBrightness([1, 0.5, 0]), 0.5);
  assert.equal(computeColourBrightness([0, 0, 0]), 0);
});
