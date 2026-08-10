/**
 * Tests against generated/main-body.mjs - the extracted, DOM/THREE-free subset of main.js's
 * VisualPDE() closure (see extract-main-body.mjs). Module-scoped state (options, listOfSpecies,
 * ...) is bare/undefined until a test sets it up via __setState(); functions that call
 * throwError (real DOM writes) get it stubbed the same way, since __setState reassigns the
 * shared module binding that every other function already looks `throwError` up through.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as m from "./generated/main-body.mjs";
import exprEvalModule from "../expr-eval.js";

function stubThrowError() {
  const messages = [];
  m.__setState({ throwError: (msg) => messages.push(msg) });
  return messages;
}

// --- parseNamedDefinition ---------------------------------------------------

test("parseNamedDefinition: parses 'name = rhs', trims whitespace, handles multi-line rhs", () => {
  assert.deepEqual(m.parseNamedDefinition("a = 1"), { name: "a", rhs: "1" });
  assert.deepEqual(m.parseNamedDefinition("  a  =  1 + 2  "), { name: "a", rhs: "1 + 2" });
  assert.deepEqual(m.parseNamedDefinition("f = x*y\n+ 1"), { name: "f", rhs: "x*y\n+ 1" });
});

test("parseNamedDefinition: returns null when unparseable", () => {
  assert.equal(m.parseNamedDefinition("not an assignment"), null);
  assert.equal(m.parseNamedDefinition("1a = 1"), null); // name can't start with a digit
  assert.equal(m.parseNamedDefinition(""), null);
});

// --- buildDependencyGraph / checkForCyclicDependencies / resolveDependentDefinitions ---------

test("buildDependencyGraph: finds whole-word references between definitions", () => {
  const graph = m.buildDependencyGraph({ a: "b + 1", b: "2", c: "a * b" }, ["a", "b", "c"]);
  assert.deepEqual(graph, { a: ["b"], b: [], c: ["a", "b"] });
});

test("buildDependencyGraph: doesn't match partial-word substrings", () => {
  const graph = m.buildDependencyGraph({ ab: "a + 1", a: "2" }, ["ab", "a"]);
  // "ab"'s definition "a + 1" does reference "a" as a whole word; "a"'s definition "2" doesn't
  // reference "ab" as a substring match, since \b won't match "ab" inside a definition of "2".
  assert.deepEqual(graph, { ab: ["a"], a: [] });
});

test("checkForCyclicDependencies: no cycle - every name ends up in doneDict, badNames empty", () => {
  const dependencies = { a: ["b"], b: ["c"], c: [] };
  let doneDict = {};
  let badNames = [];
  [doneDict, , badNames] = m.checkForCyclicDependencies("a", doneDict, ["a"], dependencies, badNames);
  assert.deepEqual(Object.keys(doneDict).sort(), ["a", "b", "c"]);
  assert.deepEqual(badNames, []);
});

test("checkForCyclicDependencies: direct cycle (a -> b -> a) is recorded in badNames", () => {
  const dependencies = { a: ["b"], b: ["a"] };
  let doneDict = {};
  let badNames = [];
  [doneDict, , badNames] = m.checkForCyclicDependencies("a", doneDict, ["a"], dependencies, badNames);
  assert.equal(badNames.length, 1);
  assert.ok(badNames[0].includes("a") && badNames[0].includes("b"));
});

test("checkForCyclicDependencies: self-reference (a -> a) is a cycle of length 1", () => {
  const dependencies = { a: ["a"] };
  let doneDict = {};
  let badNames = [];
  [doneDict, , badNames] = m.checkForCyclicDependencies("a", doneDict, ["a"], dependencies, badNames);
  assert.deepEqual(badNames, [["a"]]);
});

test("resolveDependentDefinitions: resolves names in dependency order via the resolve callback", () => {
  const strDict = { a: "b", b: "1" };
  const order = [];
  const [resultDict, badNames] = m.resolveDependentDefinitions(strDict, ["a", "b"], "0", (name, str, deps, result) => {
    order.push(name);
    result[name] = str;
  });
  assert.deepEqual(badNames, []);
  // b has no dependencies, so it must be resolved before a (which depends on b).
  assert.deepEqual(order, ["b", "a"]);
  assert.deepEqual(resultDict, { a: "b", b: "1" });
});

test("resolveDependentDefinitions: cyclic names are degraded to degradeValue before resolve is called", () => {
  const strDict = { a: "b", b: "a" };
  const seenStrs = {};
  const [, badNames] = m.resolveDependentDefinitions(strDict, ["a", "b"], "DEGRADED", (name, str, deps, result) => {
    seenStrs[name] = str;
    result[name] = str;
  });
  assert.ok(badNames.length > 0);
  assert.equal(seenStrs.a, "DEGRADED");
  assert.equal(seenStrs.b, "DEGRADED");
});

// --- evaluateDependentNumerics (Parameters) ---------------------------------

test("evaluateDependentNumerics: evaluates independent and dependent numeric definitions", () => {
  m.__setState({ parser: new exprEvalModule.Parser() });
  const [valDict, badNames] = m.evaluateDependentNumerics({ a: "2 + 3", b: "a * 2" }, ["a", "b"]);
  assert.deepEqual(badNames, []);
  assert.equal(valDict.a, 5);
  assert.equal(valDict.b, 10);
});

test("evaluateDependentNumerics: cyclic definitions degrade to 0 and are reported via throwError", () => {
  m.__setState({ parser: new exprEvalModule.Parser() });
  const messages = stubThrowError();
  const [valDict, badNames] = m.evaluateDependentNumerics({ a: "b", b: "a" }, ["a", "b"]);
  assert.ok(badNames.length > 0);
  assert.equal(valDict.a, 0);
  assert.equal(valDict.b, 0);
  assert.equal(messages.length, 0); // resolveDependentDefinitions degrades silently, no throwError call itself
});

test("evaluateDependentNumerics: unparseable definitions report via throwError and evaluate to 0", () => {
  m.__setState({ parser: new exprEvalModule.Parser() });
  const messages = stubThrowError();
  const [valDict] = m.evaluateDependentNumerics({ a: "not a valid expr (" }, ["a"]);
  assert.equal(valDict.a, 0);
  assert.equal(messages.length, 1);
  assert.match(messages[0], /Unable to evaluate the definition of a/);
});

// --- expandDependentExpressions (Expressions) -------------------------------

test("expandDependentExpressions: substitutes each dependency's own expanded, parenthesized definition", () => {
  const [expanded, badNames] = m.expandDependentExpressions({ a: "b + 1", b: "x * 2" }, ["a", "b"]);
  assert.deepEqual(badNames, []);
  assert.equal(expanded.b, "x * 2");
  assert.equal(expanded.a, "(x * 2) + 1");
});

test("expandDependentExpressions: cyclic definitions degrade to '0.0'", () => {
  const [expanded, badNames] = m.expandDependentExpressions({ a: "b", b: "a" }, ["a", "b"]);
  assert.ok(badNames.length > 0);
  assert.equal(expanded.a, "0.0");
  assert.equal(expanded.b, "0.0");
});

// --- getKineticParamNames / getKineticParamNameVals -------------------------

test("getKineticParamNames/NameVals: parses semicolon-separated 'name = value' definitions", () => {
  m.__setState({ options: { kineticParams: "a = 1; b = 2*a" } });
  assert.deepEqual(m.getKineticParamNames(), ["a", "b"]);
  assert.deepEqual(m.getKineticParamNameVals(), [
    ["a", "1"],
    ["b", "2*a"],
  ]);
});

test("getKineticParamNames: strips 'in [a,b]' range directives before parsing", () => {
  m.__setState({ options: { kineticParams: "a = 1 in [0,1]; b = 2" } });
  assert.deepEqual(m.getKineticParamNames(), ["a", "b"]);
});

test("getKineticParamNameVals: reports unparseable definitions via throwError and skips them", () => {
  const messages = stubThrowError();
  m.__setState({ options: { kineticParams: "not valid; b = 2" } });
  const nameVals = m.getKineticParamNameVals();
  assert.deepEqual(nameVals, [["b", "2"]]);
  assert.equal(messages.length, 1);
});

// --- getExpressionNames / getExpressionNameVals -----------------------------

test("getExpressionNames/NameVals: parses semicolon-separated 'name = value' definitions", () => {
  m.__setState({ options: { expressions: "f = 1; g = f + 2" } });
  assert.deepEqual(m.getExpressionNames(), ["f", "g"]);
  // The third element of each triple is the expression's "TeX" toggle state (see
  // setExpressionsShowStringFromControllers) - defaults to true (shown) when
  // options.expressionsShow is absent, as here.
  assert.deepEqual(m.getExpressionNameVals(), [
    ["f", "1", true],
    ["g", "f + 2", true],
  ]);
});

test("getExpressionNameVals: reads the shown/hidden flag positionally from options.expressionsShow", () => {
  m.__setState({
    options: { expressions: "f = 1; g = f + 2", expressionsShow: "01" },
  });
  assert.deepEqual(m.getExpressionNameVals(), [
    ["f", "1", false],
    ["g", "f + 2", true],
  ]);
});

test("getExpressionNameVals: reports unparseable definitions via throwError", () => {
  const messages = stubThrowError();
  m.__setState({ options: { expressions: "not valid" } });
  assert.deepEqual(m.getExpressionNameVals(), []);
  assert.equal(messages.length, 1);
  assert.match(messages[0], /Unable to evaluate the expression definition/);
});

// --- isSpeciesAlgebraic ------------------------------------------------------

test("isSpeciesAlgebraic: species 1-3 (0-based indices 1-3) use the algebraicV/W/Q booleans", () => {
  m.__setState({ algebraicV: true, algebraicW: false, algebraicQ: true, algebraicSpeciesFlags: [] });
  assert.equal(m.isSpeciesAlgebraic(0), false); // species 0 (u) is never algebraic
  assert.equal(m.isSpeciesAlgebraic(1), true);
  assert.equal(m.isSpeciesAlgebraic(2), false);
  assert.equal(m.isSpeciesAlgebraic(3), true);
});

test("isSpeciesAlgebraic: species 5-8 (0-based indices 4-7) use algebraicSpeciesFlags", () => {
  m.__setState({ algebraicSpeciesFlags: [undefined, undefined, undefined, undefined, true, false] });
  assert.equal(m.isSpeciesAlgebraic(4), true);
  assert.equal(m.isSpeciesAlgebraic(5), false);
  assert.equal(m.isSpeciesAlgebraic(6), false); // out of bounds -> undefined -> coerced falsy
});

// --- species/diffusion key helpers ------------------------------------------

test("speciesToChannelChar/speciesToChannelInd/speciesToGroupInd", () => {
  m.__setState({ listOfSpecies: ["u", "v", "w", "q", "u5", "u6", "u7", "u8"] });
  assert.equal(m.speciesToChannelInd("u"), 0);
  assert.equal(m.speciesToChannelInd("u6"), 5);
  assert.equal(m.speciesToChannelChar("u"), "r");
  assert.equal(m.speciesToChannelChar("v"), "g");
  assert.equal(m.speciesToChannelChar("u5"), "r"); // channel wraps mod 4 for group 1
  assert.equal(m.speciesToChannelChar("u6"), "g");
  assert.equal(m.speciesToGroupInd("u"), 0);
  assert.equal(m.speciesToGroupInd("u5"), 1);
});

test("diffCtrlKey: species 1-4 (1-based) use legacy letter-pair keys; anything touching 5-8 uses numeric keys", () => {
  m.__setState({ defaultSpecies: ["u", "v", "w", "q", "u5", "u6", "u7", "u8"] });
  assert.equal(m.diffCtrlKey(1, 1), "Duu");
  assert.equal(m.diffCtrlKey(1, 2), "Duv");
  assert.equal(m.diffCtrlKey(4, 4), "Dqq");
  assert.equal(m.diffCtrlKey(1, 5), "D_1_5");
  assert.equal(m.diffCtrlKey(5, 5), "D_5_5");
});

// --- getGlobalIntegralComponents / setGlobalIntegralComponent ---------------

test("getGlobalIntegralComponents: splits the packed field on ';', trimming whitespace", () => {
  m.__setState({ options: { globalIntegralFun: "u ; v ; 0 ; w*v" } });
  assert.deepEqual(m.getGlobalIntegralComponents(), ["u", "v", "0", "w*v"]);
});

test("getGlobalIntegralComponents: missing/blank components (including a bare, unsplit field, for backwards compatibility) default to '0'", () => {
  m.__setState({ options: { globalIntegralFun: "u" } });
  assert.deepEqual(m.getGlobalIntegralComponents(), ["u", "0", "0", "0"]);

  m.__setState({ options: { globalIntegralFun: "u;;w;" } });
  assert.deepEqual(m.getGlobalIntegralComponents(), ["u", "0", "w", "0"]);
});

test("setGlobalIntegralComponent: updates only the given (0-based) slot, preserving the others", () => {
  m.__setState({ options: { globalIntegralFun: "u;v;0;0" } });
  m.setGlobalIntegralComponent(2, "w*v");
  assert.equal(m.options.globalIntegralFun, "u;v;w*v;0");
  m.setGlobalIntegralComponent(0, "");
  assert.equal(m.options.globalIntegralFun, "0;v;w*v;0");
});

test("parseShaderString: substitutes GlobalInt1-4 with globalIntegralValue1-4, and bare GlobalInt with globalIntegralValue1", () => {
  m.__setState({
    options: { minX: "0", minY: "0", globalIntegralFun: "u;v;0;0" },
    listOfSpecies: ["u", "v"],
    listOfReactions: ["UFUN", "VFUN"],
    expandedExpressionDefs: {},
  });
  stubThrowError();
  m.genAnySpeciesRegexStrs();
  const out = m.parseShaderString("GlobalInt1 + GlobalInt2 + GlobalInt");
  assert.equal(out.trim(), "globalIntegralValue1 + globalIntegralValue2 + globalIntegralValue1");
});

test("parseStringToTEX: substitutes GlobalInt1-4 (and bare GlobalInt) with \\iint_{\\Omega}(the matching component)", () => {
  m.__setState({
    options: { minX: "0", minY: "0", globalIntegralFun: "u;v;0;0", dimension: "2" },
    listOfSpecies: ["u", "v"],
    listOfReactions: ["UFUN", "VFUN"],
  });
  stubThrowError();
  const out = m.parseStringToTEX("a*GlobalInt2 + GlobalInt");
  assert.match(out, /a \\iint_\{\\Omega\} v\\, \\d x \\d y\\ /);
  assert.match(out, /\\iint_\{\\Omega\} u\\, \\d x \\d y\\ /);
});

test("parseStringToTEX: each integral component gets its own full TeX formatting (e.g. '*' removed), not spliced in as a raw expression string", () => {
  m.__setState({
    options: { minX: "0", minY: "0", globalIntegralFun: "u*v;0;0;0", dimension: "2" },
    listOfSpecies: ["u", "v"],
    listOfReactions: ["UFUN", "VFUN"],
  });
  stubThrowError();
  const out = m.parseStringToTEX("GlobalInt1");
  assert.doesNotMatch(out, /\*/);
  assert.match(out, /\\iint_\{\\Omega\} u v\\, \\d x \\d y\\ /);
});

test("parseStringToTEX: doesn't infinitely recurse when a component's own text is unrelated to GlobalInt (regression: the substitution must use a lazy replacer function, since parseStringToTEX(component) is only safe to call when there's an actual GlobalInt match to replace)", () => {
  m.__setState({
    options: { minX: "0", minY: "0", globalIntegralFun: "u*v;v;0;0", dimension: "2" },
    listOfSpecies: ["u", "v"],
    listOfReactions: ["UFUN", "VFUN"],
  });
  stubThrowError();
  assert.equal(m.parseStringToTEX("a - b"), "a - b");
});

// --- lerp / lerpArrays -------------------------------------------------------

test("lerp: interpolates and clamps t to [0,1]", () => {
  assert.equal(m.lerp(0, 10, 0.5), 5);
  assert.equal(m.lerp(0, 10, 0), 0);
  assert.equal(m.lerp(0, 10, 1), 10);
  assert.equal(m.lerp(0, 10, 2), 10); // clamped
  assert.equal(m.lerp(0, 10, -1), 0); // clamped
});

test("lerpArrays: interpolates element-wise", () => {
  assert.deepEqual(m.lerpArrays([0, 10], [10, 20], 0.5), [5, 15]);
});

// --- alternateBrackets -------------------------------------------------------

test("alternateBrackets: alternates nesting depth between ( and [ from the outside in (outermost bracket type depends on total nesting depth)", () => {
  assert.equal(m.alternateBrackets("(a)"), "(a)");
  assert.equal(m.alternateBrackets("((a))"), "[(a)]");
  assert.equal(m.alternateBrackets("(((a)))"), "([(a)])");
});

test("alternateBrackets: leaves text outside brackets untouched and handles multiple bracket groups", () => {
  assert.equal(m.alternateBrackets("f((a)) + g((b))"), "f[(a)] + g[(b)]");
});

// --- isEmptyString / getDuplicates / sortObject -----------------------------

test("isEmptyString: true for empty or whitespace-only strings, false otherwise", () => {
  assert.equal(m.isEmptyString(""), true);
  assert.equal(m.isEmptyString("   \n\t "), true);
  assert.equal(m.isEmptyString("a"), false);
});

test("getDuplicates: returns each duplicated element once, preserving no particular order requirement", () => {
  assert.deepEqual(m.getDuplicates(["a", "b", "a", "c", "b", "b"]).sort(), ["a", "b"]);
  assert.deepEqual(m.getDuplicates(["a", "b", "c"]), []);
});

test("sortObject: sorts keys case-insensitively, preserving values", () => {
  const sorted = m.sortObject({ Banana: 2, apple: 1, Cherry: 3 });
  assert.deepEqual(Object.keys(sorted), ["apple", "Banana", "Cherry"]);
  assert.deepEqual(sorted, { apple: 1, Banana: 2, Cherry: 3 });
});

// --- isValidSyntax ------------------------------------------------------------

test("isValidSyntax: accepts well-formed expressions", () => {
  stubThrowError();
  assert.equal(m.isValidSyntax(" a + b * (c - 1) "), true);
});

test("isValidSyntax: rejects empty parentheses, unbalanced parentheses, and trailing operators", () => {
  for (const bad of [" f() ", " (a + b ", " a + b) ", " a + "]) {
    const messages = stubThrowError();
    assert.equal(m.isValidSyntax(bad), false, `expected "${bad}" to be invalid`);
    assert.equal(messages.length, 1);
  }
});

test("isValidSyntax: rejects '--' and '++' as ambiguous", () => {
  for (const bad of [" a--b ", " a++b "]) {
    stubThrowError();
    assert.equal(m.isValidSyntax(bad), false);
  }
});

// --- isReservedName / validateParamName / validateExpressionName -----------

test("isReservedName: true for GLSL built-ins/reserved image tokens, false for an ordinary name", () => {
  stubThrowError();
  assert.equal(m.isReservedName("I_T"), true);
  assert.equal(m.isReservedName("myOwnParamName"), false);
});

test("validateParamName/validateExpressionName: reject species/reaction/reserved names and names already used by the other feature", () => {
  m.__setState({
    listOfSpecies: ["u", "v"],
    listOfReactions: ["UFUN", "VFUN"],
    expressionNameToCont: { myExpr: {} },
    kineticNameToCont: { myParam: {} },
  });
  const paramMessages = stubThrowError();
  assert.equal(m.validateParamName("u"), false); // species name
  assert.equal(m.validateParamName("myExpr"), false); // already an expression name
  assert.ok(paramMessages.length > 0);

  const exprMessages = stubThrowError();
  assert.equal(m.validateExpressionName("UFUN"), false); // reaction name
  assert.equal(m.validateExpressionName("myParam"), false); // already a parameter name
  assert.ok(exprMessages.length > 0);
});

test("validateParamName/validateExpressionName: accept a fresh, unused name", () => {
  m.__setState({
    listOfSpecies: ["u", "v"],
    listOfReactions: ["UFUN", "VFUN"],
    expressionNameToCont: {},
    kineticNameToCont: {},
  });
  stubThrowError();
  assert.equal(m.validateParamName("myBrandNewName"), true);
  assert.equal(m.validateExpressionName("myOtherNewName"), true);
});

// --- autoCorrectSyntax --------------------------------------------------------

test("autoCorrectSyntax: inserts implicit multiplication between a number and a following letter/paren", () => {
  m.__setState({ listOfSpecies: ["u", "v"] });
  m.genAnySpeciesRegexStrs();
  assert.equal(m.autoCorrectSyntax("2u"), "2*u");
  assert.equal(m.autoCorrectSyntax("3(a+1)"), "3*(a+1)");
});

test("autoCorrectSyntax: inserts implicit multiplication between adjacent parentheses, and simplifies +- chains", () => {
  m.__setState({ listOfSpecies: ["u", "v"] });
  m.genAnySpeciesRegexStrs();
  assert.equal(m.autoCorrectSyntax("(a)(b)"), "(a)*(b)");
  assert.equal(m.autoCorrectSyntax("a +- b"), "a - b");
  assert.equal(m.autoCorrectSyntax("a - + b"), "a - b");
});

test("autoCorrectSyntax: empty/whitespace-only input becomes '0'", () => {
  m.__setState({ listOfSpecies: [] });
  m.genAnySpeciesRegexStrs();
  assert.equal(m.autoCorrectSyntax("   "), "0");
});
