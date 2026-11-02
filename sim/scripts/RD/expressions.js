// expressions.js
//
// Parsing and rewriting of the expressions users type: function calls and their
// arguments, operators, named definitions and their dependencies, and their TeX.

import { insertStrAtIndex, modulo, replaceStrAtIndex } from "./utils.js";

export function findAllFunCalls(input, fun) {
  const calls = [];
  const regex = new RegExp(`\\b${fun}\\s*\\(`, "g");
  let match;

  while ((match = regex.exec(input)) !== null) {
    let start = match.index + match[0].length - 1;
    let depth = 1;
    let end = start;

    while (end < input.length && depth > 0) {
      end++;
      const char = input[end];
      if (char === "(") depth++;
      else if (char === ")") depth--;
    }

    if (depth === 0) {
      const fullCall = input.slice(match.index, end + 1);
      const argsStr = input.slice(start + 1, end);
      const args = splitArgs(argsStr);
      calls.push({
        start: match.index,
        end: end + 1,
        fullCall,
        args,
      });
    }
  }

  return calls;
}

// Argument splitter with nesting support
export function splitArgs(str) {
  const args = [];
  let current = "";
  let depth = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (char === "," && depth === 0) {
      args.push(current.trim());
      current = "";
    } else {
      if (char === "(") depth++;
      else if (char === ")") depth--;
      current += char;
    }
  }

  if (current.trim()) args.push(current.trim());

  return args;
}

export function alternateBrackets(str) {
  // Given a string with balanced bracketing, loop nested brackets through (, [.
  const openBrackets = ["(", "["];
  const closeBrackets = [")", "]"];
  let bracketInd = 0;
  let bracketDepth = 0;
  let lastIndex = 0;
  let chunk = "";
  let strOut = "";
  for (var ind = 0; ind < str.length; ind++) {
    if (openBrackets.includes(str[ind])) {
      bracketInd += 1;
      bracketDepth += 1;
    } else if (closeBrackets.includes(str[ind])) {
      bracketInd -= 1;
    }
    if (bracketInd == 0 && bracketDepth > 0) {
      chunk = str.slice(lastIndex, ind + 1);
      strOut = strOut + alternateBracketsGivenDepth(chunk, bracketDepth);
      bracketDepth = 0;
      lastIndex = ind + 1;
    }
  }
  strOut = strOut + str.slice(lastIndex);
  return strOut;
}

export function alternateBracketsGivenDepth(str, depth) {
  // Given a string with balanced bracketing, loop nested brackets through (, [.
  // Requires a depth so that it can select brackets from the outside in, i.e. 321123
  const openBrackets = ["(", "["];
  const closeBrackets = [")", "]"];
  let bracketInd = modulo(-depth + 1, openBrackets.length);
  for (var ind = 0; ind < str.length; ind++) {
    if (openBrackets.includes(str[ind])) {
      str = replaceStrAtIndex(str, openBrackets[bracketInd], ind);
      bracketInd += 1;
      // Ensure that bracketInd is a valid index that loops through listToSub.
      bracketInd = modulo(bracketInd, openBrackets.length);
    } else if (closeBrackets.includes(str[ind])) {
      bracketInd -= 1;
      // Ensure that bracketInd is a valid index that loops through listToSub.
      bracketInd = modulo(bracketInd, openBrackets.length);
      str = replaceStrAtIndex(str, closeBrackets[bracketInd], ind);
    }
  }
  return str;
}

export function replaceBinOperator(str, op, form) {
  // Take a string and replace all instances of op with form,
  // matching balanced brackets.
  const needsEscaping = "^*".includes(op);
  if (str.indexOf(op) > -1) {
    let tab = [];
    let joker = "___joker___";
    while (str.indexOf("(") > -1) {
      str = str.replace(/(\([^\(\)]*\))/g, function (m, t) {
        tab.push(t);
        return joker + (tab.length - 1);
      });
    }

    tab.push(str);
    str = joker + (tab.length - 1);
    let regex;
    if (needsEscaping) {
      regex = new RegExp("([\\w.]*)\\s*\\" + op + "\\s*(-?[\\w.]*)", "g");
    } else {
      regex = new RegExp("([\\w.]*)\\s*" + op + "\\s*(-?[\\w.]*)", "g");
    }
    while (str.indexOf(joker) > -1) {
      str = str.replace(new RegExp(joker + "(\\w+)", "g"), function (m, d) {
        return tab[d] ? tab[d].replace(regex, form) : "";
      });
    }
  }
  return str;
}

/**
 * Replaces occurrences of Gauss(blah) with correct shader syntax.
 *
 * @param {string} str - The input string to be modified.
 * @returns {string} The modified string.
 */
export function replaceGauss(str) {
  // Find all calls to Gauss in the string.
  const calls = findAllFunCalls(str, "Gauss");

  // If there are no calls to Gauss, return the string unchanged.
  if (calls.length == 0) return str;

  // Sort matches in reverse order (innermost to outermost).
  calls.sort((a, b) => b.start - a.start);

  let output = str;

  for (const { start, end, args } of calls) {
    // Default to no change.
    let replacement = output.slice(start, end);
    // Replace Gauss(meanx, meany, sx, sy, rho) with Gauss(x, y, meanx, meany, sx, sy, rho).
    if (args.length == 5) {
      replacement = `Gauss(x,y,${args[0]},${args[1]},${args[2]},${args[3]},${args[4]})`;
    } else if (args.length == 4) {
      // Replace Gauss(meanx, meany, sx, sy) with Gauss(x, y, meanx, meany, sx, sy, 0).
      replacement = `Gauss(x,y,${args[0]},${args[1]},${args[2]},${args[3]},0)`;
    } else if (args.length == 3) {
      // Replace Gauss(meanx, meany, sd) with Gauss(x, y, meanx, meany, sd, sd, 0).
      replacement = `Gauss(x,y,${args[0]},${args[1]},${args[2]},${args[2]},0)`;
    } else if (args.length == 2) {
      // Replace Gauss(mean, sd) with Gauss(x, y, mean, 0.5*L_y, sd, sd, 0).
      replacement = `Gauss(x,y,${args[0]},0.5*L_y,${args[1]},${args[1]},0)`;
    }
    output = output.slice(0, start) + replacement + output.slice(end);
  }

  return output;
}

/**
 * Replaces occurrences of Bump(blah) with correct shader syntax.
 *
 * @param {string} str - The input string to be modified.
 * @returns {string} The modified string.
 */
export function replaceBump(str) {
  // Find all calls to Bump in the string.
  const calls = findAllFunCalls(str, "Bump");

  // If there are no calls to Bump, return the string unchanged.
  if (calls.length == 0) return str;

  // Sort matches in reverse order (innermost to outermost).
  calls.sort((a, b) => b.start - a.start);

  let output = str;

  for (const { start, end, args } of calls) {
    // Default to no change.
    let replacement = output.slice(start, end);
    // If there are 2 arguments, replace with Bump(x, y, arg1, 0.5*L_y, arg2).
    if (args.length == 2) {
      replacement = `Bump(x,y,${args[0]},0.5*L_y,${args[1]})`;
    }
    // If there are 3 arguments, replace with Bump(x, y, arg1, arg2, arg3).
    else if (args.length == 3) {
      replacement = `Bump(x,y,${args[0]},${args[1]},${args[2]})`;
    }
    output = output.slice(0, start) + replacement + output.slice(end);
  }

  return output;
}

/**
 * Replaces all the symbols from originals, found as whole words, with those in replacements, allowing for an optional trailing regex.
 * @param {string} str - The string to replace symbols in.
 * @param {string[]} originals - The original symbols to replace.
 * @param {string[]} replacements - The replacement symbols.
 * @param {string} [optional] - An optional trailing regex.
 * @returns {string} The string with replaced symbols.
 */
export function replaceSymbolsInStr(str, originals, replacements, optional) {
  if (optional == undefined) optional = "";
  // Delimit the placeholders with private-use characters so that they can't clash with user text.
  const placeholders = new Array(originals.length)
    .fill(0)
    .map((x, i) => "\uE000" + i.toString() + "\uE001");
  let regex;
  // Substitute in placeholders first.
  for (var ind = 0; ind < originals.length; ind++) {
    // An empty original would match at every word boundary.
    if (!originals[ind]) continue;
    regex = new RegExp(
      "\\b(" + originals[ind] + ")(" + optional + ")?\\b",
      "g",
    );
    str = str.replaceAll(regex, placeholders[ind] + "$2");
  }
  // Now swap the placeholders for the new reactions.
  for (var ind = 0; ind < placeholders.length; ind++) {
    str = str.replaceAll(placeholders[ind], replacements[ind]);
  }
  return str;
}

export function removeEvalAt(str) {
  return str
    .replace("\\left.", "")
    .replace("\\right\\rvert_{\\boundary}", "");
}

// An Int(...) argument as a lookup key, so that e.g. "u*v" and "u * v" share a slot.
export function canonicalizeIntExpr(str) {
  return str.replace(/\s+/g, "");
}

/**
 * Parses a whitespace-agnostic "name = definition" string (shared by Parameters and
 * Expressions). Returns {name, rhs} or null if unparseable.
 *
 * @param {string} str - The definition string to parse.
 * @returns {{name: string, rhs: string}|null}
 */
export function parseNamedDefinition(str) {
  const match = str.match(/^\s*([a-zA-Z]\w*)\s*=\s*(.*)$/s);
  if (!match) return null;
  return { name: match[1], rhs: match[2].trim() };
}

/**
 * Serializes a "definitions list"'s strs dict back into a single semicolon-joined string,
 * for storage in the corresponding options field.
 */
export function serializeDefinitions(strs) {
  return Object.values(strs)
    .map((str) => str.replaceAll(/"\s+"/g, " "))
    .join(";");
}

/**
 * Builds a dependency graph {name: [otherNamesReferenced]} from a name->definition-string
 * dict, via word-boundary scan. Shared by Parameters' numeric evaluation and Expressions'
 * substitution ordering.
 */
export function buildDependencyGraph(strDict, names) {
  const dependencies = {};
  names.forEach((name) => {
    dependencies[name] = names.filter(
      (other) =>
        other != name &&
        new RegExp("\\b" + other + "\\b").test(strDict[name] ?? ""),
    );
  });
  return dependencies;
}

/**
 * Depth-first search from name through dependencies (name -> names it uses), recording in
 * badNames each path that loops back on itself, and in doneDict the names checked.
 * @returns {[Object, Array, Array]} [doneDict, stack, badNames].
 */
export function checkForCyclicDependencies(
  name,
  doneDict,
  stack,
  dependencies,
  badNames,
) {
  // If we know the name is safe already, don't do anything.
  if (name in doneDict) return [doneDict, stack.slice(0, -1), badNames];
  // Find any names and check them.
  for (const otherName of dependencies[name]) {
    // Check if it's something we're already trying to evaluate.
    if (stack.includes(otherName)) {
      // We've hit a quantity that we're already trying to evaluate - cyclic!
      // Record the name as bad so that we can throw an error.
      badNames.push(stack.slice(stack.indexOf(otherName)));
    } else {
      // Otherwise, check for its dependencies.
      [doneDict, , badNames] = checkForCyclicDependencies(
        otherName,
        doneDict,
        [...stack, otherName],
        dependencies,
        badNames,
      );
    }
  }
  // Record that we've done this name.
  doneDict[name] = true;
  return [doneDict, stack.slice(0, -1), badNames];
}

/**
 * Shared by evaluateDependentNumerics (Parameters) and expandDependentExpressions
 * (Expressions): builds a dependency graph over strDict/names, checks for cyclic
 * dependencies (reusing the generic checkForCyclicDependencies()), degrades any name
 * involved in a cycle to `degradeValue`, then resolves every name in dependency order
 * (each name's dependencies are always resolved before it, since
 * checkForCyclicDependencies's DFS only marks a name "done" once all its dependencies are)
 * via the caller-supplied `resolve` callback.
 *
 * @param {Object} strDict - name -> raw definition string.
 * @param {string[]} names - The full list of names to resolve.
 * @param {string} degradeValue - What a cyclic name's definition is replaced with.
 * @param {function(string, string, string[], Object): void} resolve - Called once per name,
 *   in dependency order, as (name, degradedDefStr, dependencyNames, resultDict); should set
 *   resultDict[name].
 * @returns {[Object, Array]} [resultDict, badNames] - badNames is a list of cyclic paths.
 */
export function resolveDependentDefinitions(strDict, names, degradeValue, resolve) {
  const dependencies = buildDependencyGraph(strDict, names);
  let doneDict = {};
  let badNames = [];
  for (const name of names) {
    if (!(name in doneDict)) {
      [doneDict, , badNames] = checkForCyclicDependencies(
        name,
        doneDict,
        [name],
        dependencies,
        badNames,
      );
    }
  }
  const degradedStrDict = { ...strDict };
  badNames.forEach((path) =>
    path.forEach((name) => (degradedStrDict[name] = degradeValue)),
  );
  const resultDict = {};
  Object.keys(doneDict).forEach((name) => {
    resolve(name, degradedStrDict[name], dependencies[name], resultDict);
  });
  return [resultDict, badNames];
}

/**
 * Fully expands a set of (possibly interdependent, but not cyclically so) text-macro
 * definitions - used for expressions. Each name's definition has every expression name it
 * references replaced by that name's own (already fully expanded) definition, parenthesized
 * for precedence safety.
 *
 * @returns {[Object, Array]} [expandedDict, badNames].
 */
export function expandDependentExpressions(strDict, names) {
  return resolveDependentDefinitions(
    strDict,
    names,
    "0.0",
    (name, str, deps, expandedDict) => {
      deps.forEach((dep) => {
        str = str.replaceAll(
          new RegExp("\\b" + dep + "\\b", "g"),
          "(" + (expandedDict[dep] ?? "0.0") + ")",
        );
      });
      expandedDict[name] = str;
    },
  );
}

export function replaceFunctionInTeX(str, func, withBrackets) {
  // Replace a function, like sqrt(expression), with \sqrt{expression} in str.
  // withBrackets specifies whether or not we should include brackets in between {}.
  var newStr = str;
  var addedChars = 0;
  const matches = str.matchAll(new RegExp("\\b" + func + "\\b", "g"));
  let funcInd,
    startInd,
    endInd,
    subStr,
    depth,
    foundBracket,
    ind,
    offset = 0;
  for (const match of matches) {
    funcInd = match.index;
    startInd = funcInd + func.length;
    subStr = str.slice(startInd);
    ind = 0;
    depth = 0;
    foundBracket = false;
    // Try to find paired brackets.
    while (
      (ind <= subStr.length) &
      (!foundBracket | !(foundBracket && depth == 0))
    ) {
      depth += ["(", "["].includes(subStr[ind]);
      depth -= [")", "]"].includes(subStr[ind]);
      foundBracket |= depth;
      ind += 1;
    }
    // If we found correctly paired brackets, replace them. Otherwise, do nothing.
    if (foundBracket && depth == 0) {
      endInd = ind - 1 + startInd;
      // Insert a backslash and record that we've added a character, which will shift all indices in newStr.
      newStr = insertStrAtIndex(newStr, "\\", funcInd + offset);
      offset += 1;
      if (withBrackets) {
        // Insert braces before and after brackets.
        newStr = insertStrAtIndex(newStr, "{", startInd + offset);
        offset += 1;
        newStr = insertStrAtIndex(newStr, "}", endInd + 1 + offset);
        offset += 1;
      } else {
        newStr = replaceStrAtIndex(newStr, "{", startInd + offset);
        newStr = replaceStrAtIndex(newStr, "}", endInd + offset);
      }
    }
  }
  return newStr;
}

// The TeX of the partial derivative operator that a derivative suffix (e.g. "xxy") stands
// for: \pd{}{x}, \pdd{}{x}, or a \frac with powers for higher and mixed orders.
export function partialDerivativeTEX(suffix) {
  const nx = suffix.split("x").length - 1;
  const ny = suffix.split("y").length - 1;
  if (nx + ny == 1) return "\\pd{}{" + (nx ? "x" : "y") + "}";
  if (nx + ny == 2 && (nx == 0 || ny == 0)) return "\\pdd{}{" + (nx ? "x" : "y") + "}";
  const part = (c, n) =>
    n == 0 ? "" : "\\partial " + c + (n > 1 ? "^{" + n + "}" : "");
  const denominator = [part("x", nx), part("y", ny)].filter(Boolean).join(" ");
  return "\\frac{\\partial^{" + (nx + ny) + "}}{" + denominator + "}";
}

export function replaceUserDefDiff(str, regex, input, delimiters) {
  // Insert user-defined input into str in place of original, surrounded by delimiters.
  // E.g. str = some TeX, regex = /(D_{uu}) (\\vnabla u)/g; input = "2*a"; delimiters = " ";
  // If the input is 0, just remove the original from str.
  if (delimiters == undefined) delimiters = "  ";
  // Special cases.
  let trimmed = input.replace(/\s+/g, "  ").trim();
  if (["0", "0.0", "-0", "-0.0", "+0", "+0.0"].includes(trimmed))
    return str.replaceAll(regex, "");
  if (trimmed == "1" || trimmed == "1.0") return str.replaceAll(regex, "$2");
  if (trimmed == "-1" || trimmed == "-1.0")
    return str.replaceAll(regex, delimiters[0] + "-" + delimiters[1] + "$2");
  // Otherwise, just do the substitution.
  return str.replaceAll(regex, delimiters[0] + input + delimiters[1] + "$2");
}

export function replaceUserDefReac(str, regex, input) {
  // Insert user-defined input into str in place of original.
  // E.g. str = some TeX, regex = /\bf\b/g; input = "2*a".
  // If the input is 0, just remove the original from str.
  if (input.replace(/\s+/g, "  ").trim() == "0")
    return str.replaceAll(regex, "");
  // If the input contains letters (like parameters), insert it with delimiters.
  if (input.match(/[a-zA-Z]/)) return str.replaceAll(regex, input);
  // If it's just a scalar, keep the original, but replace old species with new.
  return str;
}

export function sortBCsString(str) {
  return (
    str
      .split(";")
      .filter((s) => s.trim() != "")
      .map((s) => s.trim())
      .sort()
      .join("; ") + ";"
  );
}
