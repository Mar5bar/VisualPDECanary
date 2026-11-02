// utils.js
//
// General-purpose helpers for strings, numbers, arrays and objects.

export function modulo(num, quot) {
  return ((num % quot) + quot) % quot;
}

export function replaceStrAtIndex(str, toSub, ind, resumeInd) {
  if (resumeInd == undefined) resumeInd = ind + 1;
  return str.slice(0, ind) + toSub + str.slice(resumeInd, str.length);
}

export function insertStrAtIndex(str, toAdd, ind) {
  return str.slice(0, ind) + toAdd + str.slice(ind, str.length);
}

export function removeWhitespace(str) {
  str = str.replace(/\s+/g, "  ").trim();
  return str;
}

export function removeExtraWhitespace(str) {
  while (str != (str = str.replace(/\s\s/g, " ")));
  return str;
}

// Whether str is empty or only whitespace.
export function isEmptyString(str) {
  return /^\s*$/.test(str);
}

export function capitaliseFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function getDuplicates(strarr) {
  const seen = {};
  let dups = [];
  strarr.forEach((e) => (seen[e] ? dups.push(e) : (seen[e] = true)));
  return Array.from(new Set(dups));
}

// A copy of obj with its keys in case-insensitive alphabetical order.
export function sortObject(obj) {
  return Object.keys(obj)
    .sort(function (a, b) {
      return a.toLowerCase().localeCompare(b.toLowerCase());
    })
    .reduce(function (result, key) {
      result[key] = obj[key];
      return result;
    }, {});
}

export function diffObjects(o1, o2) {
  const diff = Object.fromEntries(
    Object.entries(o1).filter(
      ([k, v]) => JSON.stringify(o2[k]) !== JSON.stringify(v),
    ),
  );
  return JSON.parse(JSON.stringify(diff));
}

export function shortestStringNum(num, depth) {
  num = parseFloat(num);
  const dec = num.toFixed(depth);
  const sig = num.toPrecision(depth);
  return dec.length < sig.length ? dec : sig;
}

// Linear interpolation between a and b, with t clamped to [0, 1].
export function lerp(a, b, t) {
  t = Math.min(Math.max(t, 0), 1);
  return (1 - t) * a + t * b;
}

// Elementwise lerp of the arrays v1 and v2.
export function lerpArrays(v1, v2, t) {
  let res = new Array(v1.length);
  for (let i = 0; i < res.length; i++) {
    res[i] = lerp(v1[i], v2[i], t);
  }
  return res;
}

export function median(values) {
  return [...values].sort((a, b) => a - b)[values.length >> 1];
}

// Whether two arrays of numbers are the same, NaNs included.
export function sameValues(a, b) {
  return a.length == b.length && a.every((v, k) => Object.is(v, b[k]));
}

export function formatLabelNum(num, depth) {
  return num.toPrecision(depth);
}

export function formatLabels(min, max) {
  const depth = 3;
  // Check if both numbers are close to zero, in which case use exponential notation.
  if (Math.abs(min) < 0.001 && Math.abs(max) < 0.001) {
    return [min.toExponential(depth - 1), max.toExponential(depth - 1)];
  }
  // Otherwise, use the shorter of dp or sig fig for each.
  return [shortestStringNum(min, depth), shortestStringNum(max, depth)];
}

// A number of timesteps per second for the stats display, e.g. 950, 86k or 1.2M.
export function formatStepRate(stepRate) {
  if (stepRate < 1e3) return Math.round(stepRate).toString();
  const [value, unit] = stepRate < 1e6 ? [stepRate / 1e3, "k"] : [stepRate / 1e6, "M"];
  return (value < 10 ? value.toFixed(1) : Math.round(value)) + unit;
}

// The brightness of an RGB colour, as the mean of its components.
export function computeColourBrightness(col) {
  return col.reduce((a, b) => a + b, 0) / 3;
}

// str with every occurrence of substr wrapped in a span of class highlightClass.
export function highlightStringinString(str, substr, highlightClass) {
  if (highlightClass == undefined) {
    highlightClass = "highlight";
  }
  return str.replaceAll(
    substr,
    `<span class="${highlightClass}">${substr}</span>`,
  );
}
