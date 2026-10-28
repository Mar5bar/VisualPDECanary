// derivatives.js
//
// Finite-difference derivatives of whole expressions: (E)_x, (E)_y, (E)_xx, (E)_xy, ..., with
// arbitrary nesting, as well as species shorthands such as u_xy that the older u_x/u_xx syntax
// doesn't cover.
//
// Every derivative uses the compact half-step difference
//   (E)_x = (E|x+dx/2 - E|x-dx/2) / dx,
// where E|p is E evaluated at an offset p (in nodes, a multiple of 1/2 in each direction): x and
// y are shifted, and each species is read from the stencil node at p, or the mean of the 2 or 4
// nodes either side of p when p lies on a cell face. So (u)_x = (uR - uL)/(2dx) and
// (u)_xx = (uR - 2u + uL)/dx^2, exactly matching u_x and u_xx, and (D*u_x)_x is the compact
// conservative flux form. Appending f or b to a direction takes a one-sided difference instead,
// as for species: (E)_xf = (E|x+dx - E|x)/dx and (E)_xb = (E|x - E|x-dx)/dx, or with f2 and b2
// the second-order one-sided differences of u_xf2 and u_xb2. Suffixes compose, so (E)_xy is
// ((E)_x)_y and (E)_xfxb is ((E)_xf)_xb, and all the derivatives in one direction are applied at
// once as a single difference, e.g. the binomial difference over offsets -n/2, ..., n/2 for n
// central derivatives.
//
// This works on users' expressions in VisualPDE's own syntax, before parseShaderString turns
// them into GLSL, and is independent of which shader the result ends up in. Shifted species
// become opaque node tokens (see nodeToken), and the grid spacings become the tokens VPDE_HX and
// VPDE_HY. Each shader resolves these itself (see resolveStencilTokens), as only it knows how
// its neighbours are fetched and how its boundaries are treated.

export class DerivativeError extends Error {}

// The neighbours that every simulation shader already fetches, in the order that their
// stencil locals are declared and passed to computeRHS.
export const BASE_STENCIL = [
  [0, 0],
  [-1, 0],
  [1, 0],
  [0, 1],
  [0, -1],
  [-2, 0],
  [2, 0],
  [0, 2],
  [0, -2],
];

/**
 * The suffix of the stencil local holding the node at offset (i, j): "" for the node itself,
 * then one L or R per node left or right and one T or B per node up or down, so (-2, 0) is "LL"
 * and (1, 1) is "RT".
 * @param {number} i
 * @param {number} j
 * @returns {string}
 */
export function stencilName(i, j) {
  return (
    (i < 0 ? "L".repeat(-i) : "R".repeat(i)) +
    (j > 0 ? "T".repeat(j) : "B".repeat(-j))
  );
}

const encodeOffset = (n) => (n < 0 ? "m" + -n : String(n));
const decodeOffset = (s) => (s[0] == "m" ? -Number(s.slice(1)) : Number(s));

/**
 * The token standing for species speciesInd (0-based) at node offset (i, j). It's a single
 * identifier whose digits all follow a letter or underscore, so later parsing passes leave it
 * alone.
 */
export function nodeToken(speciesInd, i, j) {
  return `vpdeN_${speciesInd}_${encodeOffset(i)}_${encodeOffset(j)}`;
}

const NODE_TOKEN_REGEX = /\bvpdeN_(\d+)_(m?\d+)_(m?\d+)\b/g;

/**
 * The distinct node offsets referenced by the node tokens in str, as [i, j] pairs.
 * @param {string} str
 * @returns {number[][]}
 */
export function nodeTokenOffsets(str) {
  const offsets = new Map();
  for (const m of str.matchAll(NODE_TOKEN_REGEX)) {
    const offset = [decodeOffset(m[2]), decodeOffset(m[3])];
    offsets.set(offset.join(","), offset);
  }
  return [...offsets.values()];
}

/** Whether str contains any node or spacing tokens left to resolve. */
export function hasStencilTokens(str) {
  return /\b(?:vpdeN_\d+_m?\d+_m?\d+|VPDE_H[XY])\b/.test(str);
}

/**
 * Replaces the node and spacing tokens in str.
 * @param {string} str
 * @param {Object} ctx
 * @param {(speciesInd: number, i: number, j: number) => string} ctx.node - The expression for a
 *   species' value at a node offset.
 * @param {string} ctx.hx - The node spacing in x, e.g. "dx".
 * @param {string} ctx.hy - The node spacing in y.
 * @returns {string}
 */
export function resolveStencilTokens(str, { node, hx, hy }) {
  return str
    .replace(NODE_TOKEN_REGEX, (m, s, i, j) =>
      node(Number(s), decodeOffset(i), decodeOffset(j)),
    )
    .replace(/\bVPDE_HX\b/g, hx)
    .replace(/\bVPDE_HY\b/g, hy);
}

// The species derivatives that parseShaderString already maps to precomputed stencil locals
// (uvwqX etc.). They're left untouched wherever they aren't being shifted.
const EXISTING_SUFFIXES = new Set(
  ["x", "y"].flatMap((d) => [d, d + "f", d + "b", d + "f2", d + "b2", d + d]),
);

// A derivative suffix: one or more directions, each optionally one-sided (f or b, then 2 for
// second order).
const SUFFIX = "(?:[xy](?:[fb]2?)?)+";
const DERIVATIVE_SUFFIX_REGEX = new RegExp(`^_(${SUFFIX})(?!\\w)`);

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Expands every derivative of an expression in str, and every species derivative that the
 * existing syntax doesn't cover (e.g. u_xy, u_xxx), into differences of node tokens.
 *
 * Strings without either are returned unchanged, so existing expressions are unaffected.
 * @param {string} str - An expression in VisualPDE syntax, with user-defined expressions
 *   already substituted.
 * @param {Object} ctx
 * @param {string[]} ctx.species - The species names, in index order.
 * @returns {string}
 * @throws {DerivativeError} If a derivative can't be taken, e.g. of a random term.
 */
export function expandDerivatives(str, { species }) {
  const ctx = context(species);
  if (!needsExpansion(str, ctx)) return str;
  return emit(str, [0, 0], ctx);
}

/**
 * Whether expandDerivatives would change str.
 * @param {string} str
 * @param {{species: string[]}} ctx
 * @returns {boolean}
 */
export function containsDerivatives(str, { species }) {
  return needsExpansion(str, context(species));
}

function context(species) {
  const speciesAlt = [...species]
    .sort((a, b) => b.length - a.length)
    .map(escapeRegex)
    .join("|");
  return {
    speciesIndex: (s) => species.indexOf(s),
    speciesAlt,
    speciesDerivRegex: speciesAlt
      ? new RegExp(`\\b(${speciesAlt})_([xy][xyfb2]*)\\b`, "g")
      : null,
    speciesRegex: speciesAlt
      ? new RegExp(`\\b(${speciesAlt})\\b(?!\\s*\\[)`, "g")
      : null,
  };
}

const isNewSpeciesSuffix = (suffix) =>
  !EXISTING_SUFFIXES.has(suffix) && /^(?:[xy]+|[xy][fb]2?)$/.test(suffix);

function needsExpansion(str, ctx) {
  if (findDerivativeGroups(str).length) return true;
  if (!ctx.speciesDerivRegex) return false;
  return [...str.matchAll(ctx.speciesDerivRegex)].some((m) => isNewSpeciesSuffix(m[2]));
}

/**
 * Finds each outermost derivative of an expression: a balanced (...) group, together with any
 * function name directly before it, followed by _ and one or more of x and y, each optionally
 * followed by f or b and then 2.
 * @returns {{start: number, end: number, operand: string, suffix: string}[]}
 */
export function findDerivativeGroups(str) {
  const groups = [];
  const stack = [];
  for (let i = 0; i < str.length; i++) {
    if (str[i] == "(") {
      stack.push(i);
    } else if (str[i] == ")") {
      const open = stack.pop();
      if (open == undefined) continue;
      const m = DERIVATIVE_SUFFIX_REGEX.exec(str.slice(i + 1));
      if (!m) continue;
      const fun = /[A-Za-z_]\w*$/.exec(str.slice(0, open));
      const start = fun ? fun.index : open;
      groups.push({
        start,
        end: i + 1 + m[0].length,
        operand: str.slice(start, i + 1),
        suffix: m[1],
      });
    }
  }
  // Inner derivatives are expanded along with the operand they're part of.
  groups.sort((a, b) => a.start - b.start);
  const outermost = [];
  for (const g of groups) {
    const last = outermost[outermost.length - 1];
    if (last && g.start < last.end) continue;
    outermost.push(g);
  }
  return outermost;
}

const isZero = (p) => p[0] == 0 && p[1] == 0;

// Writes E|p: str with its derivatives expanded and everything else shifted by p.
function emit(str, p, ctx) {
  // Expanded text is already at the right offsets, so it's set aside until the end to keep
  // the shifts below from applying twice.
  const saved = [];
  const protect = (s) => {
    saved.push(s);
    return "" + (saved.length - 1) + "";
  };

  const groups = findDerivativeGroups(str);
  for (let k = groups.length - 1; k >= 0; k--) {
    const { start, end, operand, suffix } = groups[k];
    str =
      str.slice(0, start) +
      protect(difference(operand, suffix, p, ctx)) +
      str.slice(end);
  }

  if (ctx.speciesDerivRegex) {
    str = str.replace(ctx.speciesDerivRegex, (m, s, suffix) => {
      if (isZero(p) && EXISTING_SUFFIXES.has(suffix)) return m;
      const expanded = speciesDerivative(s, suffix, p, ctx);
      return expanded == null ? m : protect(expanded);
    });
  }

  if (!isZero(p)) {
    if (ctx.speciesRegex) {
      str = str.replace(ctx.speciesRegex, (m, s) => protect(node(s, p, ctx)));
    }
    str = str.replace(/\bx\b/g, () => shiftedCoordinate("x", p[0], "VPDE_HX"));
    str = str.replace(/\by\b/g, () => shiftedCoordinate("y", p[1], "VPDE_HY"));
  }

  return str.replace(/(\d+)/g, (m, k) => saved[Number(k)]);
}

function shiftedCoordinate(name, offset, spacing) {
  if (offset == 0) return name;
  const sign = offset < 0 ? "-" : "+";
  const size = Math.abs(offset);
  return "(" + name + sign + (size == 1 ? "" : size + "*") + spacing + ")";
}

// A species' value at offset p: its node there, or the mean of the nodes either side of each
// half-integer component.
function node(s, p, ctx) {
  const ind = ctx.speciesIndex(s);
  const around = (c) => (Number.isInteger(c) ? [c] : [c - 0.5, c + 0.5]);
  const tokens = [];
  for (const i of around(p[0])) {
    for (const j of around(p[1])) tokens.push(nodeToken(ind, i, j));
  }
  if (tokens.length == 1) return tokens[0];
  return "(" + 1 / tokens.length + "*(" + tokens.join("+") + "))";
}

// The weights of each kind of difference, as [offset, weight] pairs, to be divided by the
// spacing: central half-step, forward and backward, and second-order forward and backward (as
// in uvwqXFXF and uvwqXBXB).
const DIFFERENCE_WEIGHTS = {
  "": [[-0.5, -1], [0.5, 1]],
  f: [[0, -1], [1, 1]],
  b: [[-1, -1], [0, 1]],
  f2: [[0, -1.5], [1, 2], [2, -0.5]],
  b2: [[-2, 0.5], [-1, -2], [0, 1.5]],
};

// The weights of the differences in suffix in one direction, applied one after another, as
// [offset, weight] pairs in order of offset, and how many there are.
function differenceWeights(suffix, dir) {
  let weights = new Map([[0, 1]]);
  let n = 0;
  for (const [, d, kind] of suffix.matchAll(/([xy])((?:[fb]2?)?)/g)) {
    if (d != dir) continue;
    n++;
    const next = new Map();
    for (const [o, w] of weights) {
      for (const [o2, w2] of DIFFERENCE_WEIGHTS[kind]) {
        next.set(o + o2, (next.get(o + o2) ?? 0) + w * w2);
      }
    }
    weights = next;
  }
  const out = [...weights]
    .filter(([, w]) => Math.abs(w) > 1e-12)
    .sort((a, b) => a[0] - b[0]);
  return [out, n];
}

// (operand)_suffix at offset p.
function difference(operand, suffix, p, ctx) {
  if (/\bRAND\w*\b/.test(operand)) {
    throw new DerivativeError(
      "Random terms (such as RAND, RANDN or WhiteNoise) can't be differentiated, in: " +
        operand +
        "_" +
        suffix,
    );
  }
  const [weightsX, nx] = differenceWeights(suffix, "x");
  const [weightsY, ny] = differenceWeights(suffix, "y");
  const shifts = [];
  for (const [ox, wx] of weightsX) {
    for (const [oy, wy] of weightsY) {
      shifts.push([wx * wy, [p[0] + ox, p[1] + oy]]);
    }
  }
  const spacings = [
    ...Array(nx).fill("VPDE_HX"),
    ...Array(ny).fill("VPDE_HY"),
  ];
  const bare =
    ctx.speciesAlt && new RegExp(`^\\(\\s*(${ctx.speciesAlt})\\s*\\)$`).exec(operand);
  const terms = bare
    ? nodeWeights(bare[1], shifts, ctx)
    : shifts.map(([w, q]) => [w, "(" + emit(operand, q, ctx) + ")"]);
  return "((" + weightedSum(terms) + ")/(" + spacings.join("*") + "))";
}

// The derivative of a lone species is linear in its nodes, so the means that make up each
// shifted value are combined into one weighted sum, cancelling nodes whose weights sum to 0.
function nodeWeights(s, shifts, ctx) {
  const ind = ctx.speciesIndex(s);
  const around = (c) => (Number.isInteger(c) ? [c] : [c - 0.5, c + 0.5]);
  const weights = new Map();
  for (const [w, q] of shifts) {
    const is = around(q[0]);
    const js = around(q[1]);
    for (const i of is) {
      for (const j of js) {
        const key = nodeToken(ind, i, j);
        weights.set(key, (weights.get(key) ?? 0) + w / (is.length * js.length));
      }
    }
  }
  return [...weights].filter(([, w]) => Math.abs(w) > 1e-12).map(([t, w]) => [w, t]);
}

function weightedSum(terms) {
  return terms
    .map(([w, e], ind) => {
      const sign = w < 0 ? "-" : ind == 0 ? "" : "+";
      const size = Math.abs(w);
      return sign + (size == 1 ? "" : size + "*") + e;
    })
    .join("");
}

// A species derivative at offset p, or null if the suffix isn't one we know.
function speciesDerivative(s, suffix, p, ctx) {
  if (/^[xy]+$/.test(suffix)) return difference("(" + s + ")", suffix, p, ctx);
  const m = /^([xy])([fb])(2?)$/.exec(suffix);
  if (!m) return null;
  const [, dir, side, second] = m;
  const e = dir == "x" ? [1, 0] : [0, 1];
  const at = (k) => node(s, [p[0] + k * e[0], p[1] + k * e[1]], ctx);
  const h = dir == "x" ? "VPDE_HX" : "VPDE_HY";
  // The same one-sided differences as uvwqXF, uvwqXB, uvwqXFXF and uvwqXBXB.
  if (!second) {
    return side == "f"
      ? "((" + at(1) + "-" + at(0) + ")/" + h + ")"
      : "((" + at(0) + "-" + at(-1) + ")/" + h + ")";
  }
  return side == "f"
    ? "((4.0*" + at(1) + "-3.0*" + at(0) + "-" + at(2) + ")/(2.0*" + h + "))"
    : "((3.0*" + at(0) + "-4.0*" + at(-1) + "+" + at(-2) + ")/(2.0*" + h + "))";
}

/**
 * Collects the tests for whether nodes are outside a domain given by an indicator function,
 * each computed once into a bool named by its node and axis (and prefix, so that several sets
 * can share a scope).
 * @param {(q: number[], axis: number) => string} outside - GLSL for whether the node at offset
 *   q is outside the domain, tested along axis (0 for x, 1 for y).
 * @param {string} [prefix]
 * @returns {{test: (q: number[], axis: number) => string, declarations: () => string}} test
 *   gives the name of a test's bool, and declarations the code declaring every one asked for.
 */
export function outsideTests(outside, prefix = "") {
  const tests = new Map();
  return {
    test(q, axis) {
      // The node itself is inside: nodes outside have nothing to compute.
      if (q[0] == 0 && q[1] == 0) return "false";
      const name = "vpdeOutside" + prefix + stencilName(...q) + "XY"[axis];
      if (!tests.has(name)) tests.set(name, outside(q, axis));
      return name;
    },
    declarations: () =>
      [...tests].map(([name, value]) => `\n    bool ${name} = ${value};`).join("") + "\n",
  };
}

// --- Stencils for shaders that read the state directly -----------------------------------
// The display, post-processing, probe and integral shaders read the state at neighbouring
// nodes themselves, with no boundary conditions applied. There, every neighbour beyond the
// centre of an edge node, on a side that isn't periodic, is extrapolated quadratically from the
// three nodes nearest that edge. Species derivatives (uvwqX etc.) are then defined from the
// neighbours exactly as in the simulation, so u_x and (u)_x agree everywhere, and at an edge
// node u_x is the second-order one-sided difference.

// The species derivatives' stencil locals, from those of the nodes, as in RDShaderAdvectionPreBC
// and RDShaderDiffusionPreBC.
const STATE_DERIVATIVES = [
  ["X", "(R - L) / (2.0*HX)"],
  ["Y", "(T - B) / (2.0*HY)"],
  ["XF", "(R - C) / HX"],
  ["YF", "(T - C) / HY"],
  ["XB", "(C - L) / HX"],
  ["YB", "(C - B) / HY"],
  ["XFXF", "(4.0*R - 3.0*C - RR) / (2.0*HX)"],
  ["YFYF", "(4.0*T - 3.0*C - TT) / (2.0*HY)"],
  ["XBXB", "(3.0*C - 4.0*L + LL) / (2.0*HX)"],
  ["YBYB", "(3.0*C - 4.0*B + BB) / (2.0*HY)"],
  ["XX", "(R - 2.0*C + L) / (HX*HX)"],
  ["YY", "(T - 2.0*C + B) / (HY*HY)"],
];

const NO_MASK = "vec4(0.0)";
const toFloat = (n) => (Number.isInteger(n) ? n.toFixed(1) : String(n));

/**
 * Declares the stencil locals of one species group for a shader that reads the state
 * directly: the node and its neighbours (uvwq, uvwqL, ..., and any further points that
 * derivatives of expressions use), extrapolated beyond the edges as described above, and the
 * species derivatives (uvwqX, ..., uvwqYY).
 * @param {Object} opts
 * @param {string} opts.prefix - "uvwq" or "uvwq2".
 * @param {(coords: string) => string} opts.fetch - GLSL reading the group's state at
 *   texture coordinates, e.g. (c) => `texture2D(textureSource, ${c})`.
 * @param {string} [opts.coords] - The node's texture coordinates.
 * @param {string[]} [opts.step] - The offset between neighbours, in texture coordinates.
 * @param {string} opts.texel - The state's texel size (a vec2), which sets where its edge
 *   nodes are. This differs from step where the state is read at a finer resolution.
 * @param {string[]} opts.h - The spacing between neighbours, [hx, hy].
 * @param {number[][]} [opts.points] - Further neighbours to declare, as [i, j] offsets.
 * @param {{L: string, R: string, T: string, B: string}} opts.masks - Per edge, a vec4 that is
 *   1.0 in the channels of species whose condition there isn't periodic.
 * @param {boolean} opts.twoD - Whether there are edges in y.
 * @param {boolean} [opts.aligned] - Whether coords is always a node of the state (rather than
 *   anywhere, as for the probe), so that neighbours can only be beyond the edges along the
 *   axes they're offset along.
 * @param {(q: number[], axis: number) => string} [opts.outside] - For a domain given by an
 *   indicator function, and aligned coords: GLSL for whether the node at offset q is outside
 *   the domain, tested along axis. The edge along each axis through the node is then the last
 *   node before the first one outside, as in the simulation (see extendedGhostShader), and
 *   points beyond it on their own row or column
 *   are extrapolated from the nodes on its near side in the channels of masks.L: quadratically
 *   from three, or linearly or as a constant where the domain is too thin for that.
 * @param {ReturnType<typeof outsideTests>} [opts.tests] - With outside: tests to share with
 *   other species groups, whose declarations the caller then places, after every group's
 *   fetches (as the indicator can read any group's species) and before any group's rest.
 * @param {boolean} [opts.phases] - With outside: return {fetches, rest}, the code fetching the
 *   group's stencil and the code extrapolating it and defining its derivatives, for the caller
 *   to place around the tests' declarations.
 * @returns {string|{fetches: string, rest: string}} The shader code.
 */
export function stateStencilShader({
  prefix,
  fetch,
  coords = "textureCoords",
  step = ["step_x", "step_y"],
  texel,
  h,
  points = [],
  masks,
  twoD,
  aligned = true,
  outside,
  tests,
  phases = false,
}) {
  const all = new Map(BASE_STENCIL.map((p) => [p.join(","), p]));
  for (const p of points) all.set(p.join(","), p);
  if (outside && aligned) {
    const own = !tests;
    tests ??= outsideTests(outside, prefix);
    const parts = customDomainStateStencil({ prefix, fetch, coords, step, h, all, mask: masks.L, twoD, tests });
    if (phases) return parts;
    return parts.fetches + (own ? tests.declarations() : "") + parts.rest;
  }
  const t = prefix + "Texel";
  let fresh = 0;
  const name = (base) => `${prefix}_${base}${fresh++}`;
  // Statements declaring V as the state at the vec2 C, extrapolated beyond the edges in x if
  // inX, and then in y if inY, from points that are themselves extrapolated in x.
  const extrapolated = (V, C, inX, inY) => {
    if (inY && twoD) return extrapolatedAlong(V, C, 1, inX);
    if (inX) return extrapolatedAlong(V, C, 0);
    return `vec4 ${V} = ${fetch(C)};\n`;
  };
  const extrapolatedAlong = (V, C, axis, inX) => {
    const c = axis == 0 ? "x" : "y";
    const [lo, hi] = axis == 0 ? ["L", "R"] : ["B", "T"];
    const at = (k) => (axis == 0 ? `vec2(${k}, ${C}.y)` : `vec2(${C}.x, ${k})`);
    let out = axis == 0 ? `vec4 ${V} = ${fetch(C)};\n` : extrapolated(V, C, inX, false);
    for (const [side, edge, sign] of [
      [lo, `0.5*${t}.${c}`, 1],
      [hi, `1.0 - 0.5*${t}.${c}`, -1],
    ]) {
      if (masks[side] == NO_MASK) continue;
      const m = name("m");
      const nodes = [0, 1, 2].map((k) => {
        const position = `${edge} ${sign > 0 ? "+" : "-"} ${toFloat(k)}*${t}.${c}`;
        if (axis == 0 || !inX) return { pre: "", value: fetch(at(position)) };
        const S = name("S");
        const SC = name("C");
        return {
          pre: `vec2 ${SC} = ${at(position)};\n` + extrapolated(S, SC, true, false),
          value: S,
        };
      });
      const distance = sign > 0 ? `(${edge} - ${C}.${c})` : `(${C}.${c} - (${edge}))`;
      const quadratic =
        `(${nodes[0].value})*((${m}+1.0)*(${m}+2.0)*0.5) - (${nodes[1].value})*(${m}*(${m}+2.0))` +
        ` + (${nodes[2].value})*(${m}*(${m}+1.0)*0.5)`;
      const condition = sign > 0 ? `${C}.${c} < ${edge}` : `${C}.${c} > ${edge}`;
      out +=
        `if (${condition}) {\n` +
        nodes.map((n) => n.pre).join("") +
        `float ${m} = ${distance} / ${t}.${c};\n` +
        `${V} = mix(${V}, ${quadratic}, ${masks[side]});\n}\n`;
    }
    return out;
  };

  // Away from the nodes (as for the probe), the point itself can be beyond an edge node, so is
  // extrapolated like its neighbours, keeping the stencil consistent.
  let out =
    `vec2 ${t} = ${texel};\n` +
    (aligned ? `vec4 ${prefix} = ${fetch(coords)};\n` : extrapolated(prefix, coords, true, true));
  for (const [i, j] of all.values()) {
    if (i == 0 && j == 0) continue;
    const C = `${prefix}${stencilName(i, j)}Coords`;
    out += `vec2 ${C} = ${coords} + vec2(${toFloat(i)}*${step[0]}, ${toFloat(j)}*${step[1]});\n`;
    out += extrapolated(prefix + stencilName(i, j), C, !aligned || i != 0, !aligned || j != 0);
  }
  for (const [suffix, formula] of STATE_DERIVATIVES) {
    const value = formula
      .replace(/\b(C|L|R|T|B|LL|RR|TT|BB)\b/g, (m) => prefix + (m == "C" ? "" : m))
      .replaceAll("HX", h[0])
      .replaceAll("HY", h[1]);
    out += `vec4 ${prefix}${suffix} = ${value};\n`;
  }
  return out;
}

function customDomainStateStencil({ prefix, fetch, coords, step, h, all, mask, twoD, tests }) {
  const axes = twoD ? [0, 1] : [0];
  // Every node that a point can be extrapolated from, or tested to find the edge, along each
  // axis: up to two beyond the node on the near side.
  const points = new Map(all);
  const queue = [...all.values()];
  while (queue.length) {
    const p = queue.pop();
    for (const axis of axes) {
      const d = Math.abs(p[axis]);
      const s = Math.sign(p[axis]);
      for (let t = -2; t <= d && d > 0; t++) {
        for (const q of axis == 0 ? [[s * t, p[1]], [s * t, 0]] : [[p[0], s * t], [0, s * t]]) {
          if (!points.has(q.join(","))) {
            points.set(q.join(","), q);
            queue.push(q);
          }
        }
      }
    }
  }
  const sorted = [...points.values()].sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  const local = (q) => prefix + stencilName(...q);
  let out = "";
  for (const [i, j] of sorted) {
    const at = i == 0 && j == 0 ? coords : `${coords} + vec2(${toFloat(i)}*${step[0]}, ${toFloat(j)}*${step[1]})`;
    out += `vec4 ${local([i, j])} = ${fetch(at)};\n`;
  }
  const fetches = out;
  out = "";
  let passes = "";
  if (mask != NO_MASK) {
    for (const axis of axes) {
      for (const p of sorted) {
        const d = Math.abs(p[axis]);
        if (d == 0) continue;
        const s = Math.sign(p[axis]);
        // Points on the point's line, and nodes on the axis through the node, along which the
        // edge is found (as in the simulation, see extendedGhostShader).
        const along = (t) => (axis == 0 ? [s * t, p[1]] : [p[0], s * t]);
        const onAxis = (t) => (axis == 0 ? [s * t, 0] : [0, s * t]);
        const branches = [];
        for (let k = 1; k <= d; k++) {
          const e = k - 1;
          const m = d - e;
          const [u0, u1, u2] = [e, e - 1, e - 2].map((t) => local(along(t)));
          const quadratic =
            `${toFloat(((m + 1) * (m + 2)) / 2)}*${u0} - ${toFloat(m * (m + 2))}*${u1}` +
            ` + ${toFloat((m * (m + 1)) / 2)}*${u2}`;
          const linear = `${u0} + ${toFloat(m)}*(${u0} - ${u1})`;
          const value =
            `${tests.test(onAxis(e - 1), axis)} ? ${u0} : ` +
            `(${tests.test(onAxis(e - 2), axis)} ? ${linear} : ${quadratic})`;
          branches.push(
            `if (${tests.test(onAxis(k), axis)}) {\n${local(p)} = mix(${local(p)}, ${value}, ${mask});\n}`,
          );
        }
        passes += branches.join(" else ") + "\n";
      }
    }
  }
  out += passes;
  for (const [suffix, formula] of STATE_DERIVATIVES) {
    const value = formula
      .replace(/\b(C|L|R|T|B|LL|RR|TT|BB)\b/g, (m) => prefix + (m == "C" ? "" : m))
      .replaceAll("HX", h[0])
      .replaceAll("HY", h[1]);
    out += `vec4 ${prefix}${suffix} = ${value};\n`;
  }
  return { fetches, rest: out };
}
