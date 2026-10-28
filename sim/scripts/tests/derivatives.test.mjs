/**
 * Tests for RD/derivatives.js: derivatives of expressions, (E)_x etc.
 *
 * The expanded expressions are evaluated in float64 by substituting node values sampled from
 * smooth fields, then checked against independently computed derivatives of the same
 * continuous expressions: exact stencil identities with the existing u_x/u_xx/diffusion
 * operators, and second-order convergence for a wide range of expressions.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BASE_STENCIL,
  DerivativeError,
  expandDerivatives,
  findDerivativeGroups,
  nodeToken,
  nodeTokenOffsets,
  resolveStencilTokens,
  stencilName,
} from "../RD/derivatives.js";

const SPECIES = ["u", "v", "w", "q"];
const expand = (str, species = SPECIES) => expandDerivatives(str, { species });

const MATH_NAMES = Object.getOwnPropertyNames(Math);

/**
 * Evaluates an expanded expression at the point (x0, y0) of a grid with spacings h, k.
 * fields[s](x, y) gives species s's value anywhere, so the nodes are samples of it. Any
 * existing species derivatives at offset 0 (u_x etc.) take their stencil definitions.
 */
function evaluate(expanded, { fields, x0, y0, h, k = h, extra = {} }) {
  const at = (s, i, j) => fields[SPECIES[s]](x0 + i * h, y0 + j * k);
  let js = resolveStencilTokens(expanded, {
    node: (s, i, j) => `N(${s},${i},${j})`,
    hx: "h",
    hy: "k",
  }).replaceAll("^", "**");
  const vars = { x: x0, y: y0, h, k, N: at, ...extra };
  SPECIES.forEach((s, ind) => {
    if (!fields[s]) return;
    const n = (i, j) => at(ind, i, j);
    Object.assign(vars, {
      [s]: n(0, 0),
      [s + "_x"]: (n(1, 0) - n(-1, 0)) / (2 * h),
      [s + "_y"]: (n(0, 1) - n(0, -1)) / (2 * k),
      [s + "_xx"]: (n(1, 0) - 2 * n(0, 0) + n(-1, 0)) / (h * h),
      [s + "_yy"]: (n(0, 1) - 2 * n(0, 0) + n(0, -1)) / (k * k),
      [s + "_xf"]: (n(1, 0) - n(0, 0)) / h,
      [s + "_xb"]: (n(0, 0) - n(-1, 0)) / h,
      [s + "_xf2"]: (4 * n(1, 0) - 3 * n(0, 0) - n(2, 0)) / (2 * h),
      [s + "_xb2"]: (3 * n(0, 0) - 4 * n(-1, 0) + n(-2, 0)) / (2 * h),
    });
  });
  const names = [...MATH_NAMES, ...Object.keys(vars)];
  const values = [...MATH_NAMES.map((n) => Math[n]), ...Object.values(vars)];
  return new Function(...names, `return (${js});`)(...values);
}

// Smooth test fields, with their exact partial derivatives.
const A = (x, y) => 1.3 * x + 0.4 * y;
const u = (x, y) => Math.sin(A(x, y)) + 0.5 * Math.cos(0.7 * y);
const ux = (x, y) => 1.3 * Math.cos(A(x, y));
const uy = (x, y) => 0.4 * Math.cos(A(x, y)) - 0.35 * Math.sin(0.7 * y);
const uxx = (x, y) => -1.69 * Math.sin(A(x, y));
const v = (x, y) => Math.exp(0.3 * x) * Math.cos(y);
const vx = (x, y) => 0.3 * v(x, y);
const FIELDS = { u, v };

/**
 * A reference for the (nx, ny)-th partial derivative of F at (x, y): nested fourth-order
 * central differences with a step much smaller than any grid tested.
 */
function referenceDerivative(F, nx, ny, x, y) {
  const d = 1e-2;
  const D = (f, dir) => (x, y) => {
    const at = (s) => (dir == 0 ? f(x + s * d, y) : f(x, y + s * d));
    return (-at(2) + 8 * at(1) - 8 * at(-1) + at(-2)) / (12 * d);
  };
  let f = F;
  for (let n = 0; n < nx; n++) f = D(f, 0);
  for (let n = 0; n < ny; n++) f = D(f, 1);
  return f(x, y);
}

// --- stencil naming and tokens -------------------------------------------------

test("stencilName: reproduces the existing stencil names and extends them", () => {
  assert.deepEqual(
    BASE_STENCIL.map(([i, j]) => stencilName(i, j)),
    ["", "L", "R", "T", "B", "LL", "RR", "TT", "BB"],
  );
  assert.equal(stencilName(1, 1), "RT");
  assert.equal(stencilName(-2, -1), "LLB");
  assert.equal(stencilName(3, 0), "RRR");
});

test("node tokens round-trip through resolveStencilTokens and nodeTokenOffsets", () => {
  const str = nodeToken(2, -1, 3) + "+" + nodeToken(0, 0, -2) + "/VPDE_HX/VPDE_HY";
  assert.deepEqual(nodeTokenOffsets(str), [
    [-1, 3],
    [0, -2],
  ]);
  assert.equal(
    resolveStencilTokens(str, {
      node: (s, i, j) => `uvwq${stencilName(i, j)}.${"rgba"[s]}`,
      hx: "dx",
      hy: "dy",
    }),
    "uvwqLTTT.b+uvwqBB.r/dx/dy",
  );
});

// --- unchanged input -------------------------------------------------------------

test("expressions without derivatives of expressions are returned unchanged", () => {
  for (const str of [
    "u^2 + v_x*u_xx - Gauss(0, 0, 1)",
    "u_xf + u_yb2 + v_y + q_yy + (u+v)*x",
    "sin(u)*(v - 1) + I_T(x, y) + u[x, y]",
    "L_x + dx + (a)_z + (u)_xz + (u)_x2",
    "",
  ]) {
    assert.equal(expand(str), str);
  }
});

// --- parsing ---------------------------------------------------------------------

test("findDerivativeGroups: finds outermost groups, including function calls", () => {
  const str = "2*sin(u)_x + ((u)_x*v)_y - (a)_xy";
  const groups = findDerivativeGroups(str).map((g) => [g.operand, g.suffix]);
  assert.deepEqual(groups, [
    ["sin(u)", "x"],
    ["((u)_x*v)", "y"],
    ["(a)", "xy"],
  ]);
});

test("a suffix must be made only of x and y, each optionally one-sided, and end there", () => {
  assert.deepEqual(
    findDerivativeGroups("(u)_xz + (u)_x1 + (u)_x2 + (u)_xfb + (u)_xf3 + (u)_f"),
    [],
  );
  assert.equal(findDerivativeGroups("(u)_x*x").length, 1);
  assert.equal(findDerivativeGroups("(u)_xx")[0].suffix, "xx");
  assert.deepEqual(
    findDerivativeGroups("(u)_xf + (u)_yb2 + (u)_xbyf + (u)_xfx").map((g) => g.suffix),
    ["xf", "yb2", "xbyf", "xfx"],
  );
});

test("text around a derivative is kept, so powers and products still apply to it", () => {
  const out = expand("2*(u)_x^2 + v");
  assert.match(out, /^2\*\(\(.*\)\)\^2 \+ v$/);
});

test("random terms can't be differentiated", () => {
  assert.throws(() => expand("(u*RANDN)_x"), DerivativeError);
  assert.throws(() => expand("(RAND)_y"), DerivativeError);
});

test("absolute lookups u[a,b] aren't shifted, but the coordinates in them are", () => {
  const out = expand("(u[x, 0.5])_x");
  assert.match(out, /u\[\(x\+0\.5\*VPDE_HX\), 0\.5\]/);
  assert.match(out, /u\[\(x-0\.5\*VPDE_HX\), 0\.5\]/);
  assert.equal(nodeTokenOffsets(out).length, 0);
});

test("species-free expressions only shift coordinates", () => {
  const out = expand("(sin(x)*y)_x");
  assert.equal(nodeTokenOffsets(out).length, 0);
  assert.match(out, /sin\(\(x\+0\.5\*VPDE_HX\)\)/);
});

test("species with names that contain others are matched whole", () => {
  const out = expandDerivatives("(uu*u)_x", { species: ["u", "uu"] });
  const offsets = [...out.matchAll(/vpdeN_(\d+)_/g)].map((m) => m[1]);
  assert.ok(offsets.includes("0") && offsets.includes("1"));
});

// --- exact identities with the existing operators ----------------------------------

// Random node values: identities must hold for any data, not just smooth fields.
function randomFields(seed) {
  let s = seed;
  const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647) * 2 - 1;
  const cache = new Map();
  const field = (name) => (x, y) => {
    const key = name + Math.round(x * 1e6) + "," + Math.round(y * 1e6);
    if (!cache.has(key)) cache.set(key, rand());
    return cache.get(key);
  };
  return { u: field("u"), v: field("v") };
}

test("(u)_x, (u)_y, (u)_xx and (u)_yy are exactly u_x, u_y, u_xx and u_yy", () => {
  const opts = { fields: randomFields(7), x0: 0.2, y0: 0.4, h: 0.1, k: 0.15 };
  for (const [lhs, rhs] of [
    ["(u)_x", "u_x"],
    ["(u)_y", "u_y"],
    ["(u)_xx", "u_xx"],
    ["(u)_yy", "u_yy"],
    ["((u)_x)_x", "u_xx"],
    ["((v)_y)_y", "v_yy"],
  ]) {
    const a = evaluate(expand(lhs), opts);
    const b = evaluate(rhs, opts);
    assert.ok(Math.abs(a - b) < 1e-9, `${lhs} = ${a}, ${rhs} = ${b}`);
  }
});

test("one-sided derivatives of a species are exactly its one-sided shorthands", () => {
  const opts = { fields: randomFields(13), x0: 0.2, y0: 0.4, h: 0.1, k: 0.15 };
  const n = (i, j) => opts.fields.u(opts.x0 + i * opts.h, opts.y0 + j * opts.k);
  const { h, k } = opts;
  for (const [lhs, value] of [
    ["(u)_xf", "u_xf"],
    ["(u)_xb", "u_xb"],
    ["(u)_xf2", "u_xf2"],
    ["(u)_xb2", "u_xb2"],
    ["(u)_xfxb", "u_xx"],
    ["((u)_xb)_xf", "u_xx"],
    ["(u)_yf", (n(0, 1) - n(0, 0)) / k],
    ["(u)_yb", (n(0, 0) - n(0, -1)) / k],
    ["(u)_yb2", (3 * n(0, 0) - 4 * n(0, -1) + n(0, -2)) / (2 * k)],
    ["(u)_xfyb", (n(1, 0) - n(0, 0) - n(1, -1) + n(0, -1)) / (h * k)],
  ]) {
    const a = evaluate(expand(lhs), opts);
    const b = typeof value == "string" ? evaluate(value, opts) : value;
    assert.ok(Math.abs(a - b) < 1e-9, `${lhs} = ${a}, ${value} = ${b}`);
  }
});

test("one-sided derivatives of expressions difference the expression at whole nodes", () => {
  const opts = { fields: randomFields(17), x0: 0.2, y0: 0.4, h: 0.1 };
  const F = (i) => {
    const x = opts.x0 + i * opts.h;
    return opts.fields.u(x, opts.y0) ** 2 * Math.sin(x);
  };
  const h = opts.h;
  for (const [str, expected] of [
    ["(u^2*sin(x))_xf", (F(1) - F(0)) / h],
    ["(u^2*sin(x))_xb", (F(0) - F(-1)) / h],
    ["(u^2*sin(x))_xf2", (4 * F(1) - 3 * F(0) - F(2)) / (2 * h)],
    ["(u^2*sin(x))_xbxf", (F(1) - 2 * F(0) + F(-1)) / h ** 2],
  ]) {
    const value = evaluate(expand(str), opts);
    assert.ok(Math.abs(value - expected) < 1e-9, `${str}: ${value} vs ${expected}`);
  }
});

test("(u)_xy is the standard four-corner mixed difference", () => {
  const opts = { fields: randomFields(11), x0: 0, y0: 0, h: 0.1, k: 0.2 };
  const n = (i, j) => opts.fields.u(i * opts.h, j * opts.k);
  const expected = (n(1, 1) - n(-1, 1) - n(1, -1) + n(-1, -1)) / (4 * opts.h * opts.k);
  for (const str of ["(u)_xy", "(u)_yx", "((u)_x)_y", "u_xy"]) {
    assert.ok(Math.abs(evaluate(expand(str), opts) - expected) < 1e-9, str);
  }
});

test("(D*u_x)_x is the compact flux form, matching the diffusion operator for linear D", () => {
  const opts = { fields: randomFields(3), x0: 0.3, y0: 0.1, h: 0.1 };
  const n = (i) => opts.fields.u(opts.x0 + i * opts.h, opts.y0);
  const D = (i) => 0.7 + 0.2 * n(i) + 0.3 * (opts.x0 + i * opts.h);
  const h = opts.h;
  // As in RDShaderUpdateNormal.
  const existing =
    (0.5 * (D(0) * (n(1) + n(-1) - 2 * n(0)) + D(1) * (n(1) - n(0)) + D(-1) * (n(-1) - n(0)))) /
    h /
    h;
  for (const str of ["((0.7+0.2*u+0.3*x)*u_x)_x", "((0.7+0.2*u+0.3*x)*(u)_x)_x"]) {
    const value = evaluate(expand(str), opts);
    assert.ok(Math.abs(value - existing) < 1e-9, `${str}: ${value} vs ${existing}`);
  }
});

test("one-sided species derivatives keep their definitions when shifted", () => {
  const opts = { fields: randomFields(5), x0: 0, y0: 0, h: 0.1 };
  const n = (i) => opts.fields.u(i * opts.h, 0);
  const h = opts.h;
  const xf = (i) => (n(i + 1) - n(i)) / h;
  const xb2 = (i) => (3 * n(i) - 4 * n(i - 1) + n(i - 2)) / (2 * h);
  const close = (a, b) => Math.abs(a - b) < 1e-9;
  // (u_xf)_xx: shifted by -1, 0, 1.
  assert.ok(close(evaluate(expand("(u_xf)_xx"), opts), (xf(1) - 2 * xf(0) + xf(-1)) / h ** 2));
  assert.ok(close(evaluate(expand("(u_xb2)_xx"), opts), (xb2(1) - 2 * xb2(0) + xb2(-1)) / h ** 2));
});

test("stencil extent grows by half a node per derivative", () => {
  const extent = (str) =>
    Math.max(...nodeTokenOffsets(expand(str)).map(([i, j]) => Math.max(Math.abs(i), Math.abs(j))));
  assert.equal(extent("(u)_x"), 1);
  assert.equal(extent("(u)_xx"), 1);
  assert.equal(extent("(u^2*u_x)_x"), 1);
  assert.equal(extent("(u)_xxx"), 2);
  assert.equal(extent("(u)_xxxx"), 2);
  assert.equal(extent("(u)_xf"), 1);
  assert.equal(extent("(u)_xf2"), 2);
  assert.equal(extent("(u)_xb2xb2"), 4);
  assert.deepEqual(
    nodeTokenOffsets(expand("(u)_xy"))
      .map(([i, j]) => stencilName(i, j))
      .sort(),
    ["LB", "LT", "RB", "RT"],
  );
});

// --- convergence ------------------------------------------------------------------

// [expression, continuous operand, nx, ny, expected order (2 if omitted)].
const CONVERGENCE_CASES = [
  ["(u)_x", u, 1, 0],
  ["(u^2)_x", (x, y) => u(x, y) ** 2, 1, 0],
  ["(sin(u)*x)_x", (x, y) => Math.sin(u(x, y)) * x, 1, 0],
  ["cos(u)_x", (x, y) => Math.cos(u(x, y)), 1, 0],
  ["(u*v)_y", (x, y) => u(x, y) * v(x, y), 0, 1],
  ["(u*v)_xy", (x, y) => u(x, y) * v(x, y), 1, 1],
  ["((u)_x)_y", u, 1, 1],
  ["u_xy", u, 1, 1],
  ["(exp(-u)*u_x)_x", (x, y) => Math.exp(-u(x, y)) * ux(x, y), 1, 0],
  ["(u^2*u_x)_x", (x, y) => u(x, y) ** 2 * ux(x, y), 1, 0],
  ["(u_y*v)_x", (x, y) => uy(x, y) * v(x, y), 1, 0],
  ["(u_xx)_x", uxx, 1, 0],
  ["(u_xf2)_x", ux, 1, 0],
  ["(u)_xxx", u, 3, 0],
  ["(u)_xxxx", u, 4, 0],
  ["(u^2*v)_xxyy", (x, y) => u(x, y) ** 2 * v(x, y), 2, 2],
  [
    "((u*v)_x*u)_y",
    (x, y) => (ux(x, y) * v(x, y) + u(x, y) * vx(x, y)) * u(x, y),
    0,
    1,
  ],
  ["(sin(x)*y)_xy", (x, y) => Math.sin(x) * y, 1, 1],
  ["(x*u + y*v)_xx", (x, y) => x * u(x, y) + y * v(x, y), 2, 0],
  ["(u/(1+v^2))_x", (x, y) => u(x, y) / (1 + v(x, y) ** 2), 1, 0],
  ["((u)_x^2)_x", (x, y) => ux(x, y) ** 2, 1, 0],
  ["(((u)_x)_x)_x", u, 3, 0],
  ["(v*(u)_y)_y", (x, y) => v(x, y) * uy(x, y), 0, 1],
  ["(u^2)_xf", (x, y) => u(x, y) ** 2, 1, 0, 1],
  ["(u^2)_xb", (x, y) => u(x, y) ** 2, 1, 0, 1],
  ["(u*v)_yf", (x, y) => u(x, y) * v(x, y), 0, 1, 1],
  ["(u*v)_yb", (x, y) => u(x, y) * v(x, y), 0, 1, 1],
  ["(u^2*v)_xby", (x, y) => u(x, y) ** 2 * v(x, y), 1, 1, 1],
  ["(u^2)_xf2", (x, y) => u(x, y) ** 2, 1, 0],
  ["(u*v)_yb2", (x, y) => u(x, y) * v(x, y), 0, 1],
  ["(u^2)_xfxb", (x, y) => u(x, y) ** 2, 2, 0],
];

for (const [str, F, nx, ny, order = 2] of CONVERGENCE_CASES) {
  test(`${str} converges to the exact derivative at ${order == 2 ? "second" : "first"} order`, () => {
    const x0 = 0.37,
      y0 = -0.61;
    const exact = referenceDerivative(F, nx, ny, x0, y0);
    const expanded = expand(str);
    const errors = [0.08, 0.04, 0.02].map((h) =>
      Math.abs(evaluate(expanded, { fields: FIELDS, x0, y0, h, k: 1.25 * h }) - exact),
    );
    const orders = [Math.log2(errors[0] / errors[1]), Math.log2(errors[1] / errors[2])];
    assert.ok(
      orders[1] > order - 0.2 && orders[1] < order + 0.3,
      `observed orders ${orders.map((o) => o.toFixed(3))}, errors ${errors}`,
    );
  });
}
