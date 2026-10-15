// glsl_to_wgsl.js
//
// Translates the GLSL that VisualPDE assembles from its shader templates and users'
// expressions (see setRDEquations() in main.js) into WGSL, so the WebGPU backend can reuse the
// exact same boundary-condition, reaction and diffusion logic as WebGL.
//
// Only the subset of GLSL that those blocks use is supported: typed declarations, (compound)
// assignments, including to one or more vector components, if/else blocks, and expressions
// built from operators, function calls and constructors. Texture lookups are delegated to
// the caller through the `calls` option, since how they're done depends on the backend's
// resources. Anything outside the subset throws a TranslationError, so problems surface as
// errors rather than as WGSL that silently means something else.

export class TranslationError extends Error {}

const TYPE_MAP = {
  float: "f32",
  int: "i32",
  uint: "u32",
  bool: "bool",
  vec2: "vec2f",
  vec3: "vec3f",
  vec4: "vec4f",
  ivec2: "vec2i",
  ivec3: "vec3i",
  ivec4: "vec4i",
  bvec2: "vec2<bool>",
  bvec3: "vec3<bool>",
  bvec4: "vec4<bool>",
};

// GLSL functions whose WGSL counterparts have different names.
const RENAMED_FUNCTIONS = {
  mod: "vpde_mod",
  inversesqrt: "inverseSqrt",
  isnan: "vpde_isnan",
  isinf: "vpde_isinf",
};

// GLSL's vector relational functions become WGSL's componentwise operators.
const RELATIONAL_FUNCTIONS = {
  lessThan: "<",
  lessThanEqual: "<=",
  greaterThan: ">",
  greaterThanEqual: ">=",
  equal: "==",
  notEqual: "!=",
};

const QUALIFIERS = new Set(["highp", "mediump", "lowp", "const"]);

/**
 * Splits GLSL into tokens. Whitespace and comments are dropped.
 * @param {string} src
 * @returns {{type: string, value: string}[]}
 */
export function tokenize(src) {
  const tokens = [];
  const re =
    /\s+|\/\/[^\n]*|\/\*[\s\S]*?\*\/|((?:\d+\.\d*|\.\d+|\d+)(?:[eE][+-]?\d+)?)|([A-Za-z_]\w*)|(\+=|-=|\*=|\/=|==|!=|<=|>=|&&|\|\||\+\+|--|[-+*/%<>=!?:;,.(){}\[\]])/y;
  let match;
  re.lastIndex = 0;
  while (re.lastIndex < src.length) {
    const start = re.lastIndex;
    match = re.exec(src);
    if (!match) {
      throw new TranslationError(
        `Unexpected character '${src[start]}' in: ${src.slice(Math.max(0, start - 20), start + 20)}`,
      );
    }
    if (match[1] != undefined) tokens.push({ type: "number", value: match[1] });
    else if (match[2] != undefined) tokens.push({ type: "ident", value: match[2] });
    else if (match[3] != undefined) tokens.push({ type: "punct", value: match[3] });
  }
  return tokens;
}

/**
 * @typedef {Object} TranslateOptions
 * @property {Object<string, string>} [renames] - Identifiers to rename (e.g. parameters,
 *   to keep them clear of WGSL's reserved words).
 * @property {Object<string, (args: string[]) => string>} [calls] - Functions whose calls the
 *   caller translates itself, given their already-translated arguments (e.g. texture lookups).
 * @property {string} [returnValue] - When translating the body of a void GLSL function into
 *   that of a WGSL function returning a value, what a bare "return;" returns.
 */

/**
 * Translates a GLSL expression into WGSL.
 * @param {string} src
 * @param {TranslateOptions} [options]
 * @returns {string}
 */
export function translateExpression(src, options = {}) {
  const tokens = tokenize(src);
  const out = translateTokens(tokens, 0, tokens.length, options);
  return out;
}

// Finds the index of the bracket closing the one at tokens[open].
function matchingBracket(tokens, open) {
  const pairs = { "(": ")", "[": "]", "{": "}" };
  const close = pairs[tokens[open].value];
  let depth = 0;
  for (let i = open; i < tokens.length; i++) {
    if (tokens[i].value == tokens[open].value) depth++;
    else if (tokens[i].value == close) {
      depth--;
      if (depth == 0) return i;
    }
  }
  throw new TranslationError("Unbalanced brackets.");
}

// Splits tokens[start, end) at top-level commas.
function splitTopLevel(tokens, start, end) {
  const parts = [];
  let depth = 0,
    partStart = start;
  for (let i = start; i < end; i++) {
    const v = tokens[i].value;
    if (v == "(" || v == "[") depth++;
    else if (v == ")" || v == "]") depth--;
    else if (v == "," && depth == 0) {
      parts.push([partStart, i]);
      partStart = i + 1;
    }
  }
  if (end > partStart) parts.push([partStart, end]);
  return parts;
}

function translateTokens(tokens, start, end, options) {
  const renames = options.renames ?? {};
  const calls = options.calls ?? {};
  let out = "";
  const emit = (s) => {
    // Keep identifiers and numbers apart.
    if (/\w$/.test(out) && /^\w/.test(s)) out += " ";
    out += s;
  };
  for (let i = start; i < end; i++) {
    const tok = tokens[i];
    if (tok.type == "punct" && tok.value == "?") {
      throw new TranslationError("The ?: operator isn't supported.");
    }
    if (tok.type == "punct" && (tok.value == "++" || tok.value == "--")) {
      throw new TranslationError(`The ${tok.value} operator isn't supported.`);
    }
    if (tok.type == "number") {
      emit(normaliseNumber(tok.value));
      continue;
    }
    if (tok.type != "ident") {
      // WGSL has no unary plus, so drop it (e.g. "vec2(+step_x, 0.0)").
      const previous = i > start ? tokens[i - 1] : null;
      const isUnary =
        !previous ||
        (previous.type == "punct" && !["(", "[", ")", "]"].includes(previous.value)
          ? true
          : previous.value == "(" || previous.value == "[");
      if (tok.value == "+" && isUnary) continue;
      emit(tok.value);
      continue;
    }
    // A member access (e.g. the "r" in "uvwq.r") is never renamed.
    if (i > start && tokens[i - 1].value == ".") {
      emit(tok.value);
      continue;
    }
    const isCall = i + 1 < end && tokens[i + 1].value == "(";
    if (!isCall) {
      emit(renames[tok.value] ?? TYPE_MAP[tok.value] ?? tok.value);
      continue;
    }
    const close = matchingBracket(tokens, i + 1);
    const args = splitTopLevel(tokens, i + 2, close).map(([s, e]) =>
      translateTokens(tokens, s, e, options),
    );
    const name = tok.value;
    let call;
    if (calls[name]) {
      call = calls[name](args);
    } else if (RELATIONAL_FUNCTIONS[name]) {
      if (args.length != 2) throw new TranslationError(`${name} takes 2 arguments.`);
      call = `(${args[0]} ${RELATIONAL_FUNCTIONS[name]} ${args[1]})`;
    } else if (name == "atan" && args.length == 2) {
      call = `atan2(${args.join(", ")})`;
    } else if (name == "H") {
      // WGSL has no overloading, so the two forms of H get their own names.
      call = `H${args.length}(${args.join(", ")})`;
    } else {
      const mapped = TYPE_MAP[name] ?? RENAMED_FUNCTIONS[name] ?? renames[name] ?? name;
      call = `${mapped}(${args.join(", ")})`;
    }
    emit(call);
    i = close;
  }
  return out;
}

// WGSL forbids leading zeros on integer literals (e.g. "00"), which GLSL and VisualPDE's
// parser allow.
function normaliseNumber(value) {
  if (/^\d+$/.test(value)) return String(Number(value));
  return value.replace(/^0+(?=\d)/, "");
}

/**
 * Translates a block of GLSL statements into WGSL.
 * @param {string} src
 * @param {TranslateOptions} [options]
 * @returns {string}
 */
export function translateStatements(src, options = {}) {
  const tokens = tokenize(src);
  const lines = [];
  let i = 0;
  let swizzleCounter = 0;
  while (i < tokens.length) {
    const tok = tokens[i];
    if (tok.value == "{" || tok.value == "}") {
      lines.push(tok.value);
      i++;
      continue;
    }
    if (tok.value == ";") {
      i++;
      continue;
    }
    if (tok.value == "if" || (tok.value == "else" && tokens[i + 1]?.value == "if")) {
      const offset = tok.value == "else" ? 1 : 0;
      const open = i + 1 + offset;
      if (tokens[open]?.value != "(") throw new TranslationError("Expected ( after if.");
      const close = matchingBracket(tokens, open);
      const cond = translateTokens(tokens, open + 1, close, options);
      lines.push(`${offset ? "else if" : "if"} (${cond})`);
      i = close + 1;
      if (tokens[i]?.value != "{") {
        throw new TranslationError("if statements must use braces.");
      }
      continue;
    }
    if (tok.value == "else") {
      lines.push("else");
      i++;
      continue;
    }
    if (tok.value == "return" && tokens[i + 1]?.value == ";") {
      if (options.returnValue == undefined) {
        throw new TranslationError("'return' statements aren't supported here.");
      }
      lines.push(`return ${options.returnValue};`);
      i += 2;
      continue;
    }
    if (tok.value == "for") {
      // for (init; condition; update), each translated as the statement or expression it is.
      if (tokens[i + 1]?.value != "(") throw new TranslationError("Expected ( after for.");
      const close = matchingBracket(tokens, i + 1);
      const semicolons = [];
      let depth = 0;
      for (let k = i + 2; k < close; k++) {
        const v = tokens[k].value;
        if (v == "(" || v == "[") depth++;
        else if (v == ")" || v == "]") depth--;
        else if (v == ";" && depth == 0) semicolons.push(k);
      }
      if (semicolons.length != 2) throw new TranslationError("Malformed for loop.");
      const [first, second] = semicolons;
      const init = translateSimpleStatement(tokens, i + 2, first, options, () => 0);
      if (init.length != 1) throw new TranslationError("Malformed for loop.");
      const condition = translateTokens(tokens, first + 1, second, options);
      const update = translateSimpleStatement(tokens, second + 1, close, options, () => 0);
      if (update.length != 1) throw new TranslationError("Malformed for loop.");
      lines.push(
        `for (${init[0].replace(/;$/, "")}; ${condition}; ${update[0].replace(/;$/, "")})`,
      );
      i = close + 1;
      if (tokens[i]?.value != "{") throw new TranslationError("for loops must use braces.");
      continue;
    }
    if (["while", "do", "return", "switch", "discard"].includes(tok.value)) {
      throw new TranslationError(`'${tok.value}' statements aren't supported.`);
    }
    // Find the end of this simple statement.
    let end = i;
    let depth = 0;
    while (end < tokens.length) {
      const v = tokens[end].value;
      if (v == "(" || v == "[") depth++;
      else if (v == ")" || v == "]") depth--;
      else if (depth == 0 && (v == ";" || v == "{" || v == "}")) break;
      end++;
    }
    if (tokens[end]?.value != ";") {
      throw new TranslationError("Expected ; at the end of a statement.");
    }
    lines.push(...translateSimpleStatement(tokens, i, end, options, () => swizzleCounter++));
    i = end + 1;
  }
  return indent(lines);
}

function translateSimpleStatement(tokens, start, end, options, nextId) {
  let i = start;
  // Uniform, varying and precision declarations are provided by the WGSL wrapper instead.
  if (["uniform", "varying", "precision", "attribute"].includes(tokens[i].value)) return [];
  while (i < end && QUALIFIERS.has(tokens[i].value)) i++;
  const type = TYPE_MAP[tokens[i].value];
  if (type && tokens[i + 1]?.type == "ident" && tokens[i + 2]?.value != "(") {
    // A declaration, possibly of several variables.
    const lines = [];
    for (const [s, e] of splitTopLevel(tokens, i + 1, end)) {
      const name = tokens[s].value;
      if (tokens[s].type != "ident") throw new TranslationError("Bad declaration.");
      if (e > s + 1) {
        if (tokens[s + 1].value != "=") throw new TranslationError("Bad declaration.");
        lines.push(`var ${name}: ${type} = ${translateTokens(tokens, s + 2, e, options)};`);
      } else {
        lines.push(`var ${name}: ${type};`);
      }
    }
    return lines;
  }
  // An assignment. GLSL allows several vector components to be assigned at once (e.g.
  // v.rg = w.rg), which WGSL doesn't, so those are split into one assignment per component.
  let op = -1;
  let depth = 0;
  for (let k = start; k < end; k++) {
    const v = tokens[k].value;
    if (v == "(" || v == "[") depth++;
    else if (v == ")" || v == "]") depth--;
    else if (depth == 0 && ["=", "+=", "-=", "*=", "/="].includes(v)) {
      op = k;
      break;
    }
  }
  if (op == -1) {
    return [translateTokens(tokens, start, end, options) + ";"];
  }
  const rhs = translateTokens(tokens, op + 1, end, options);
  const lhsTokens = tokens.slice(start, op);
  const last = lhsTokens[lhsTokens.length - 1];
  const isSwizzle =
    lhsTokens.length >= 3 &&
    lhsTokens[lhsTokens.length - 2].value == "." &&
    /^[rgba]{2,4}$|^[xyzw]{2,4}$/.test(last.value);
  if (!isSwizzle) {
    return [`${translateTokens(tokens, start, op, options)} ${tokens[op].value} ${rhs};`];
  }
  const base = translateTokens(tokens, start, op - 2, options);
  const temp = `vpde_swizzle${nextId()}`;
  return [
    `let ${temp} = ${rhs};`,
    ...[...last.value].map(
      (component, k) => `${base}.${component} ${tokens[op].value} ${temp}[${k}];`,
    ),
  ];
}

function indent(lines) {
  let depth = 0;
  return lines
    .map((line) => {
      if (line == "}") depth--;
      const out = "  ".repeat(Math.max(depth, 0)) + line;
      if (line == "{") depth++;
      return out;
    })
    .join("\n");
}
