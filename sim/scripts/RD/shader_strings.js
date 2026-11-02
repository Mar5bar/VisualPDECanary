// shader_strings.js
//
// Rewrites of the GLSL built from users' expressions.

import { replaceStrAtIndex } from "./utils.js";

export function enableImageLookupInShader(str) {
  // Enable function evaluation in shaders.
  var newStr = str;
  const matches = str.matchAll(/\bI_([TS])([RGBA])?\b/g);
  let funcInd,
    startInd,
    endInd,
    subStr,
    argStr,
    args,
    depth,
    foundBracket,
    ind,
    toAddPart,
    toAdd,
    imNum,
    component,
    offset = 0;
  const imageLookup = { S: "One", T: "Two" };
  const componentLookup = { R: "r", G: "g", B: "b", A: "a" };
  for (const match of matches) {
    funcInd = match.index;
    imNum = imageLookup[match[1]];
    startInd = funcInd + match[0].length;
    subStr = str.slice(startInd);
    ind = 0;
    depth = 0;
    foundBracket = false;
    // Try to find paired brackets.
    while (
      (ind <= subStr.length) &
      (!foundBracket | !(foundBracket && depth == 0))
    ) {
      depth += ["("].includes(subStr[ind]);
      depth -= [")"].includes(subStr[ind]);
      foundBracket |= depth;
      ind += 1;
    }
    // If we found correctly paired brackets, replace with the function. Otherwise, do nothing.
    if (foundBracket && depth == 0) {
      endInd = ind - 1 + startInd;
      argStr = newStr.slice(startInd + offset + 1, endInd + offset);
      // Detect at most two arguments separated by a comma.
      args = argStr.split(",");
      // If the second argument is empty, put a zero in its place.
      if (args.length == 1 || args[1].trim().length == 0) args[1] = "0";
      args[0] = "(" + args[0] + "-MINX)/L_x";
      args[1] = "(" + args[1] + "-MINY)/L_y";
      toAddPart =
        "texture(imageSource" + imNum + ",vec2(" + args.join(",") + ")).";
      if (match[2] != undefined) {
        component = componentLookup[match[2]];
        toAdd = toAddPart + component;
      } else {
        component = ["r", "g", "b"];
        toAdd =
          "(" + component.map((c) => toAddPart + c).join("+") + ")/3.0 ";
      }

      newStr = replaceStrAtIndex(
        newStr,
        toAdd,
        funcInd + offset,
        endInd + 1 + offset,
      );
      offset += toAdd.length - endInd + funcInd - 1;
    }
  }
  return newStr;
}

export function nonConstantDiffusionEvaluateInSpaceStr(str, label) {
  let out = "";
  let xRegex = /\bx\b/g;
  let yRegex = /\by\b/g;
  let uvwqRegex = /\buvwq\.\b/g;

  out += "float D" + label + " = " + str;
  out +=
    "float D" +
    label +
    "L = " +
    str.replaceAll(xRegex, "(x-dx)").replaceAll(uvwqRegex, "uvwqL.");
  out +=
    "float D" +
    label +
    "R = " +
    str.replaceAll(xRegex, "(x+dx)").replaceAll(uvwqRegex, "uvwqR.");
  out +=
    "float D" +
    label +
    "T = " +
    str.replaceAll(yRegex, "(y+dy)").replaceAll(uvwqRegex, "uvwqT.");
  out +=
    "float D" +
    label +
    "B = " +
    str.replaceAll(yRegex, "(y-dy)").replaceAll(uvwqRegex, "uvwqB.");
  return out;
}

// Rewrites group 0's stencil and output variable names (uvwq*, updated, RHS, timescales)
// to group 1's (uvwq2*, updated2, RHS2, timescalesGroup1). A no-op for group 0.
export function groupifyShaderStr(shaderStr, group) {
  if (group === 0) return shaderStr;
  return shaderStr.replaceAll(
    /\buvwqLL\b|\buvwqRR\b|\buvwqTT\b|\buvwqBB\b|\buvwqL\b|\buvwqR\b|\buvwqT\b|\buvwqB\b|\buvwq(?:[XY](?:[FB](?:[XY][FB])?)?|XX|YY)\b|\buvwq\b|\bupdated\b|\bRHS\b|\btimescales\b/g,
    function (m) {
      if (m === "uvwq") return "uvwq2";
      if (m === "updated") return "updated2";
      if (m === "RHS") return "RHS2";
      if (m === "timescales") return "timescalesGroup1";
      // uvwqL/R/T/B/LL/RR/TT/BB and derivatives: insert "2" right after "uvwq".
      return "uvwq2" + m.slice(4);
    },
  );
}

// The text of a shader that's at global scope or in main(), without comments or functions'
// parameters (which are local to them).
export function shaderOutsideHelperFunctions(shader) {
  const code = shader.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
  let depth = 0;
  let inMain = false;
  let header = "";
  let out = "";
  for (const c of code) {
    if (depth == 0 && c == "{") inMain = /\bmain\s*\(\s*\)\s*$/.test(header);
    if (depth == 0 || inMain) out += c;
    if (depth == 0) header = c == ";" || c == "{" ? "" : header + c;
    if (c == "{") depth++;
    if (c == "}" && --depth == 0) inMain = false;
  }
  return out.replace(/\([^()]*\)\s*\{/g, "() {");
}

// Set the y diffusion coefficients to be equal to the x counterparts.
export function setEqualYDiffusionCoefficientsShader(label) {
  let out = "";
  out += "float D" + label + "y = D" + label + "x;\n";
  out += "float D" + label + "yL = D" + label + "xL;\n";
  out += "float D" + label + "yR = D" + label + "xR;\n";
  out += "float D" + label + "yT = D" + label + "xT;\n";
  out += "float D" + label + "yB = D" + label + "xB;\n";
  return out;
}
