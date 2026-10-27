/**
 * Tests for the simulation's extra stencil points (simulation_shaders.js: addStencilPoints,
 * stencilClosure and extendedGhostShader), which derivatives of expressions need beyond the
 * 9 points that the templates hard-code.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  RDShaderTop,
  RDShaderMain,
  RDShaderTopMRT,
  RDShaderMainMRT,
  addStencilPoints,
  stencilClosure,
  extraStencilPoints,
  extendedGhostShader,
} from "../RD/simulation_shaders.js";
import { stencilName } from "../RD/derivatives.js";
import { translateStatements } from "../RD/webgpu/glsl_to_wgsl.js";

const SCHEMES = ["FE", "AB2", "Mid1", "Mid2", "RK41", "RK42", "RK43", "RK44"];

test("addStencilPoints leaves every template unchanged when there are no extra points", () => {
  for (const type of SCHEMES) {
    assert.equal(addStencilPoints(RDShaderTop(type), []), RDShaderTop(type));
    assert.equal(addStencilPoints(RDShaderMain(type), []), RDShaderMain(type));
    assert.equal(addStencilPoints(RDShaderTopMRT(type), [], ["uvwq", "uvwq2"]), RDShaderTopMRT(type));
    assert.equal(addStencilPoints(RDShaderMainMRT(type), [], ["uvwq", "uvwq2"]), RDShaderMainMRT(type));
  }
});

// The number of stencil values computeRHS takes, and that each call passes it.
function argumentCounts(top, main) {
  const signature = top.match(/void computeRHS\(([^)]*)\)/)[1];
  const params = signature.split(",").filter((p) => /\bvec4 uvwq/.test(p)).length;
  const calls = [...main.matchAll(/computeRHS\(([^;]*)\);/g)].map(
    (m) => m[1].split(",").filter((a) => /^\s*uvwq/.test(a)).length,
  );
  return { params, calls };
}

for (const mrt of [false, true]) {
  test(`addStencilPoints adds each point everywhere the BB point appears${mrt ? " (MRT)" : ""}`, () => {
    const extra = [
      [1, 1],
      [-3, 0],
    ];
    const prefixes = mrt ? ["uvwq", "uvwq2"] : ["uvwq"];
    for (const type of SCHEMES) {
      const top = addStencilPoints((mrt ? RDShaderTopMRT : RDShaderTop)(type), extra, prefixes);
      const main = addStencilPoints((mrt ? RDShaderMainMRT : RDShaderMain)(type), extra, prefixes);
      const { params, calls } = argumentCounts(top, main);
      assert.equal(params, 11 * prefixes.length, type);
      assert.ok(calls.length > 0 && calls.every((n) => n == params), type);
      for (const P of prefixes) {
        for (const name of ["RT", "LLL"]) {
          assert.match(top, new RegExp(`vec4 ${P}${name} = ${P}${name}In;`));
          assert.match(main, new RegExp(`vec4 ${P}${name};`));
          // Fetched as BB is, from the same textures.
          const bb = [...main.matchAll(new RegExp(`^\\s*${P}BB = (.*);$`, "gm"))].map((m) => m[1]);
          const added = [...main.matchAll(new RegExp(`^\\s*${P}${name} = (.*);$`, "gm"))].map((m) => m[1]);
          assert.deepEqual(
            added,
            bb.map((v) => v.replaceAll("textureCoordsBB", "textureCoords" + name)),
          );
        }
      }
      assert.match(main, /vec2 textureCoordsRT = textureCoords \+ vec2\(1\.0\*step_x, 1\.0\*step_y\);/);
      assert.match(main, /vec2 textureCoordsLLL = textureCoords \+ vec2\(-3\.0\*step_x, 0\.0\*step_y\);/);
    }
  });
}

test("stencilClosure adds the mirror images and edge nodes that points beyond the edges are filled from", () => {
  const names = (points) => points.map((p) => stencilName(...p)).sort();
  assert.deepEqual(names(stencilClosure([[-1, 0]], true)), ["L"]);
  // LL beyond the left edge from the edge node is RR; from the next node in, the node itself.
  // RR is itself beyond the right edge, from the nodes next to it.
  assert.deepEqual(names(stencilClosure([[-2, 0]], false)), ["", "L", "LL", "R", "RR"]);
  assert.deepEqual(
    names(stencilClosure([[-1, 1]], true)),
    ["B", "L", "LB", "LT", "R", "RB", "RT", "T"],
  );
  assert.deepEqual(extraStencilPoints(stencilClosure([[-1, 1]], true)).map((p) => stencilName(...p)).sort(), [
    "LB",
    "LT",
    "RB",
    "RT",
  ]);
});

// --- extendedGhostShader, executed ---------------------------------------------------
// Its output is also valid JavaScript, so it's run directly on stencils sampled from known
// fields. For reflection with the flux added, the filled-in values are exact for fields that
// are quadratic in each direction (with no cross term, so that the flux is the same along
// each edge), and for odd reflection they're exact for linear fields.

/**
 * Fills in the stencil at every node of an nX by nY grid, as the simulation does: each point
 * is fetched from a clamped texture, the first ring is filled in as the Robin/Dirichlet
 * shaders do, then extendedGhostShader fills in the rest. Returns the worst error against f.
 */
function worstError({ f, fx, fy, points, rule, nX, nY, twoD }) {
  const h = 0.1,
    k = twoD ? 0.15 : 1;
  const species = [{ prefix: "uvwq", channel: "r", name: "u", rules: { L: rule, R: rule, T: rule, B: rule } }];
  const code = extendedGhostShader(points, species, twoD);
  let worst = 0;
  for (let ci = 0; ci < nX; ci++) {
    for (let cj = 0; cj < nY; cj++) {
      // Dirichlet edge nodes are overwritten, so what they read doesn't matter.
      const onEdge = ci == 0 || ci == nX - 1 || (twoD && (cj == 0 || cj == nY - 1));
      if (rule.type == "dirichlet" && onEdge) continue;
      const at = (i, j) => f((i + 0.5) * h, (j + 0.5) * k);
      const clamp = (n, N) => Math.min(Math.max(n, 0), N - 1);
      const vars = {};
      for (const [i, j] of points) {
        vars["uvwq" + stencilName(i, j)] = { r: at(clamp(ci + i, nX), clamp(cj + j, nY)) };
      }
      const x = (ci + 0.5) * h,
        y = (cj + 0.5) * k;
      // The outward normal derivatives, as robinRHS holds them.
      const flux = {
        robinRHSuL: -fx(0.5 * h, y),
        robinRHSuR: fx((nX - 0.5) * h, y),
        robinRHSuB: twoD ? -fy(x, 0.5 * k) : 0,
        robinRHSuT: twoD ? fy(x, (nY - 0.5) * k) : 0,
      };
      // The first ring, as RDShaderRobinX/Y do (Dirichlet leaves it clamped).
      if (rule.type == "reflect") {
        if (ci == 0) vars.uvwqL.r = 2 * h * flux.robinRHSuL + vars.uvwqR.r;
        if (ci == nX - 1) vars.uvwqR.r = 2 * h * flux.robinRHSuR + vars.uvwqL.r;
        if (twoD && cj == nY - 1) vars.uvwqT.r = 2 * k * flux.robinRHSuT + vars.uvwqB.r;
        if (twoD && cj == 0) vars.uvwqB.r = 2 * k * flux.robinRHSuB + vars.uvwqT.r;
      }
      const env = {
        ...vars,
        ...flux,
        textureCoords: { x: (ci + 0.5) / nX, y: (cj + 0.5) / nY },
        step_x: 1 / nX,
        step_y: 1 / nY,
        dx: h,
        dy: k,
      };
      new Function(...Object.keys(env), code)(...Object.values(env));
      for (const [i, j] of points) {
        // Dirichlet's first ring isn't filled in, as those nodes are overwritten.
        if (rule.type == "dirichlet" && Math.abs(i) + Math.abs(j) == 1) continue;
        if (!twoD && j != 0) continue;
        const exact = f(x + i * h, y + j * k);
        worst = Math.max(worst, Math.abs(vars["uvwq" + stencilName(i, j)].r - exact));
      }
    }
  }
  return worst;
}

const quadratic = {
  f: (x, y) => 0.3 + 1.7 * x - 2.1 * x * x + 0.8 * y - 1.3 * y * y,
  fx: (x) => 1.7 - 4.2 * x,
  fy: (x, y) => 0.8 - 2.6 * y,
};
const linear = {
  f: (x, y) => 0.3 + 1.7 * x + 0.8 * y,
  fx: () => 1.7,
  fy: () => 0.8,
};

test("Neumann/Robin: points beyond the edges are exact for quadratic fields, in 1D", () => {
  const points = stencilClosure([[-3, 0], [3, 0], [-2, 0], [2, 0]], false);
  assert.ok(worstError({ ...quadratic, points, rule: { type: "reflect" }, nX: 9, nY: 1, twoD: false }) < 1e-12);
});

test("Neumann/Robin: points beyond the edges and corners are exact for quadratic fields, in 2D", () => {
  const points = stencilClosure([[-1, 1], [1, -1], [2, 2], [-2, -1], [0, 3]], true);
  assert.ok(worstError({ ...quadratic, points, rule: { type: "reflect" }, nX: 7, nY: 8, twoD: true }) < 1e-12);
});

test("Dirichlet: points beyond the edges and corners are exact for linear fields", () => {
  const points = stencilClosure([[-1, 1], [1, 1], [-2, 0], [0, -2], [2, -2]], true);
  assert.ok(worstError({ ...linear, points, rule: { type: "dirichlet" }, nX: 7, nY: 8, twoD: true }) < 1e-12);
});

test("periodic species are left as the textures wrap them", () => {
  const species = [{ prefix: "uvwq", channel: "r", name: "u", rules: { L: { type: "periodic" }, R: { type: "periodic" }, T: { type: "periodic" }, B: { type: "periodic" } } }];
  assert.equal(extendedGhostShader(stencilClosure([[-2, 1]], true), species, true), "");
});

test("ghost conditions fill points beyond the edge with the ghost value", () => {
  const ghost = { type: "ghost", value: "0.5*x" };
  const species = [{ prefix: "uvwq2", channel: "g", name: "v", rules: { L: ghost, R: { type: "periodic" }, T: { type: "periodic" }, B: { type: "periodic" } } }];
  const code = extendedGhostShader(stencilClosure([[-2, 0]], false), species, false);
  assert.match(code, /uvwq2LL\.g = \(0\.5\*x\);/);
  assert.doesNotMatch(code, /uvwq2RR\.g =/);
});

test("extendedGhostShader's output translates to WGSL", () => {
  const rules = { L: { type: "reflect" }, R: { type: "dirichlet" }, T: { type: "ghost", value: "1.0" }, B: { type: "reflect" } };
  const code = extendedGhostShader(
    stencilClosure([[-2, 1], [2, 2]], true),
    [{ prefix: "uvwq", channel: "r", name: "u", rules }],
    true,
  );
  const wgsl = translateStatements(code, {});
  assert.match(wgsl, /uvwqLLT\.r = /);
  assert.match(wgsl, /else/);
});

// --- stateStencilShader, executed ------------------------------------------------------
// The shaders that read the state directly extrapolate it quadratically beyond the edges, so
// their stencil is exact for fields that are quadratic in each direction. The GLSL is run as
// JavaScript on one channel, with vec2s as {x, y}.

import { stateStencilShader } from "../RD/derivatives.js";

function runStateStencil(code, env) {
  const js = code
    .replace(/^vec2 (\w+) = (\w+) \+ vec2\((.*)\);$/gm, "let $1 = add($2, vec2($3));")
    .replace(/^(?:vec4|vec2|float) /gm, "let ");
  // The stencil locals, rather than the temporaries scoped to the extrapolating blocks.
  const names = js
    .match(/^let (\w+)/gm)
    .map((d) => d.slice(4))
    .filter((d) => !d.includes("_"));
  const helpers = {
    vec2: (x, y) => ({ x, y }),
    vec4: (a) => a,
    add: (a, b) => ({ x: a.x + b.x, y: a.y + b.y }),
    mix: (a, b, m) => a + (b - a) * m,
  };
  const all = { ...helpers, ...env };
  return new Function(...Object.keys(all), js + `\nreturn {${names.join(",")}};`)(
    ...Object.values(all),
  );
}

const ALL_EDGES = { L: "vec4(1.0)", R: "vec4(1.0)", T: "vec4(1.0)", B: "vec4(1.0)" };
const biquadratic = (x, y) => 0.3 + 1.7 * x - 2.1 * x * x + 0.8 * y - 1.3 * y * y + 0.9 * x * y - 0.4 * x * x * y * y;

test("stateStencilShader: neighbours beyond the edges are exact for biquadratic fields, at every node", () => {
  const nX = 6,
    nY = 7,
    h = 0.1,
    k = 0.2;
  const points = [[1, 1], [-2, -1], [3, 0], [0, -3], [-2, 2]];
  const code = stateStencilShader({
    prefix: "uvwq",
    fetch: (c) => `fetch(${c})`,
    texel: "texel",
    h: ["h", "k"],
    points,
    masks: ALL_EDGES,
    twoD: true,
  });
  const fetch = (c) => {
    // As a clamped texture: the nearest node.
    const i = Math.min(Math.max(Math.floor(c.x * nX), 0), nX - 1);
    const j = Math.min(Math.max(Math.floor(c.y * nY), 0), nY - 1);
    return biquadratic(i, j);
  };
  let worst = 0;
  for (let ci = 0; ci < nX; ci++) {
    for (let cj = 0; cj < nY; cj++) {
      const out = runStateStencil(code, {
        fetch,
        texel: { x: 1 / nX, y: 1 / nY },
        textureCoords: { x: (ci + 0.5) / nX, y: (cj + 0.5) / nY },
        step_x: 1 / nX,
        step_y: 1 / nY,
        h,
        k,
      });
      for (const [i, j] of [...points, [-1, 0], [2, 0], [0, 2], [0, -1]]) {
        worst = Math.max(worst, Math.abs(out["uvwq" + stencilName(i, j)] - biquadratic(ci + i, cj + j)));
      }
      // So u_x at an edge node is the second-order one-sided difference.
      if (ci == 0) {
        const f = (i) => biquadratic(i, cj);
        const oneSided = (-3 * f(0) + 4 * f(1) - f(2)) / (2 * h);
        worst = Math.max(worst, Math.abs(out.uvwqX - oneSided));
      }
    }
  }
  assert.ok(worst < 1e-9, `differs by up to ${worst}`);
});

test("stateStencilShader: anywhere in the domain (the probe), neighbours are exact for bilinear fields", () => {
  const nX = 5,
    nY = 6;
  const f = (x, y) => 0.4 + 1.1 * x - 0.7 * y + 0.3 * x * y;
  // Bilinear sampling of node values, clamped, as textureBilinear does.
  const at = (i, j) => f(Math.min(Math.max(i, 0), nX - 1), Math.min(Math.max(j, 0), nY - 1));
  const fetch = (c) => {
    const s = c.x * nX - 0.5,
      t = c.y * nY - 0.5;
    const i = Math.floor(s),
      j = Math.floor(t);
    const a = s - i,
      b = t - j;
    return (
      (1 - a) * (1 - b) * at(i, j) + a * (1 - b) * at(i + 1, j) + (1 - a) * b * at(i, j + 1) + a * b * at(i + 1, j + 1)
    );
  };
  const code = stateStencilShader({
    prefix: "uvwq",
    fetch: (c) => `fetch(${c})`,
    coords: "probeTexCoords",
    texel: "texel",
    h: ["1.0", "1.0"],
    points: [[1, 1], [-1, -1]],
    masks: ALL_EDGES,
    twoD: true,
    aligned: false,
  });
  let worst = 0;
  for (const [px, py] of [[0.0, 0.0], [0.03, 0.97], [0.5, 0.01], [0.99, 0.6], [0.41, 0.52]]) {
    const out = runStateStencil(code, {
      fetch,
      texel: { x: 1 / nX, y: 1 / nY },
      probeTexCoords: { x: px, y: py },
      step_x: 1 / nX,
      step_y: 1 / nY,
    });
    // Node coordinates of the probe.
    const x = px * nX - 0.5,
      y = py * nY - 0.5;
    for (const [i, j] of [[0, 0], [-1, 0], [1, 0], [0, 1], [0, -1], [-2, 0], [2, 0], [0, 2], [0, -2], [1, 1], [-1, -1]]) {
      worst = Math.max(worst, Math.abs(out["uvwq" + stencilName(i, j)] - f(x + i, y + j)));
    }
  }
  assert.ok(worst < 1e-9, `differs by up to ${worst}`);
});

test("stateStencilShader: periodic edges aren't extrapolated", () => {
  const none = { L: "vec4(0.0)", R: "vec4(0.0)", T: "vec4(0.0)", B: "vec4(0.0)" };
  const code = stateStencilShader({
    prefix: "uvwq2",
    fetch: (c) => `texture2D(textureSourceGroup1, ${c})`,
    texel: "vec2(0.1)",
    h: ["dx", "dy"],
    masks: none,
    twoD: true,
  });
  assert.doesNotMatch(code, /\bif\b/);
  assert.match(code, /vec4 uvwq2XX = \(uvwq2R - 2\.0\*uvwq2 \+ uvwq2L\) \/ \(dx\*dx\);/);
});

test("stateStencilShader's output translates to WGSL", () => {
  const code = stateStencilShader({
    prefix: "uvwq",
    fetch: (c) => `texture2D(textureSource, ${c})`,
    coords: "probeTexCoords",
    texel: "1.0/vec2(texSize)",
    h: ["dx", "dy"],
    points: [[1, -1]],
    masks: { L: "vec4(1.0, 0.0, 0.0, 0.0)", R: "vec4(0.0)", T: "vec4(1.0)", B: "vec4(0.0)" },
    twoD: true,
    aligned: false,
  });
  const wgsl = translateStatements(code, { calls: { texture2D: ([, uv]) => `stateNearest(0u, ${uv})` } });
  assert.match(wgsl, /uvwqRB/);
});

// --- Domains given by an indicator function ---------------------------------------------
// The domain is x < a (with a between nodes), within the rectangle less its edge nodes, as in
// VisualPDE: so its edges are a staircase that here is straight, and the reflections and
// extrapolations are exact for fields that are quadratic in each direction.

// Whether node (I, J) of an nX by nY grid is outside the domain, tested from node (ci, cj)
// along axis, as indicatorOutsideTest does: the indicator a quarter of a node further out.
function makeOutside({ nX, nY, a, twoD }) {
  return (ci, cj, q, axis) => {
    const I = ci + q[0],
      J = cj + q[1];
    const x = I + (axis == 0 ? Math.sign(q[0]) * 0.25 : 0);
    const N = axis == 0 ? nX : nY;
    const n = axis == 0 ? I : J;
    return x >= a || (twoD || axis == 0 ? n <= 0 || n >= N - 1 : false);
  };
}

const outsideTest = (q, axis) => `outsideAt(${q[0]}, ${q[1]}, ${axis})`;

test("custom domains: points beyond the staircase edges and corners are exact for Neumann conditions", () => {
  for (const twoD of [false, true]) {
    const nX = 10,
      nY = twoD ? 8 : 1,
      a = 6.6;
    const f = (x, y) => 0.3 + 1.7 * x - 0.21 * x * x + (twoD ? 0.8 * y - 0.13 * y * y : 0);
    const fx = (x) => 1.7 - 0.42 * x;
    const fy = (y) => 0.8 - 0.26 * y;
    const isOut = makeOutside({ nX, nY, a, twoD });
    const points = stencilClosure(
      twoD ? [[-1, 1], [2, -1], [-2, 2], [3, 0], [0, -3]] : [[-3, 0], [3, 0], [2, 0]],
      twoD,
      { customDomain: true },
    );
    const species = [{ prefix: "uvwq", channel: "r", name: "u", rules: { L: { type: "reflect" }, R: { type: "reflect" }, T: { type: "reflect" }, B: { type: "reflect" } } }];
    const code = extendedGhostShader(points, species, twoD, { outside: outsideTest }).replace(
      /\bbool /g,
      "let ",
    );
    let worst = 0;
    // The edge nodes inside the domain: columns 1 and 6, rows 1 and nY - 2.
    const lastInside = 6;
    for (let ci = 1; ci <= lastInside; ci++) {
      for (let cj = twoD ? 1 : 0; cj <= (twoD ? nY - 2 : 0); cj++) {
        const vars = {};
        for (const [i, j] of points) vars["uvwq" + stencilName(i, j)] = { r: f(ci + i, cj + j) };
        const outsideAt = (qi, qj, axis) => isOut(ci, cj, [qi, qj], axis);
        // Outward normal derivatives at the edge nodes (the domain's edges are straight).
        const flux = {
          robinRHSuL: -fx(1),
          robinRHSuR: fx(lastInside),
          robinRHSuB: twoD ? -fy(1) : 0,
          robinRHSuT: twoD ? fy(nY - 2) : 0,
        };
        // The first ring, as RDShaderRobinCustomDomainX/Y fill it.
        for (const [name, q, opposite, axis, side] of [
          ["L", [-1, 0], "R", 0, "L"],
          ["R", [1, 0], "L", 0, "R"],
          ["B", [0, -1], "T", 1, "B"],
          ["T", [0, 1], "B", 1, "T"],
        ]) {
          if (axis == 1 && !twoD) continue;
          if (isOut(ci, cj, q, axis)) {
            vars["uvwq" + name].r = 2 * flux["robinRHSu" + side] + vars["uvwq" + opposite].r;
          }
        }
        const env = { ...vars, ...flux, outsideAt, dx: 1, dy: 1 };
        new Function(...Object.keys(env), code)(...Object.values(env));
        for (const [i, j] of points) {
          worst = Math.max(worst, Math.abs(vars["uvwq" + stencilName(i, j)].r - f(ci + i, cj + j)));
        }
      }
    }
    assert.ok(worst < 1e-12, `${twoD ? "2D" : "1D"}: differs by up to ${worst}`);
  }
});

test("custom domains: where the domain is too thin to reflect in, Neumann conditions fall back to one-sided values", () => {
  // Inside: columns 1 and 2 only.
  const isOut = makeOutside({ nX: 10, nY: 1, a: 2.5, twoD: false });
  const points = stencilClosure([[3, 0]], false, { customDomain: true });
  const species = [{ prefix: "uvwq", channel: "r", name: "u", rules: { L: { type: "reflect" }, R: { type: "reflect" }, T: { type: "periodic" }, B: { type: "periodic" } } }];
  const code = extendedGhostShader(points, species, false, { outside: outsideTest }).replace(/\bbool /g, "let ");
  const vars = {};
  for (const [i, j] of points) vars["uvwq" + stencilName(i, j)] = { r: 10 + i };
  // From column 1, the edge is column 2 (R), and RRR is 2 beyond it, but its mirror (L) is
  // outside: so it's the edge node plus 2*dx*g.
  const env = { ...vars, robinRHSuR: 0.5, robinRHSuL: 0, outsideAt: (qi, qj, axis) => isOut(1, 0, [qi, qj], axis), dx: 0.1 };
  new Function(...Object.keys(env), code)(...Object.values(env));
  assert.ok(Math.abs(vars.uvwqRRR.r - (11 + 2 * 0.1 * 0.5)) < 1e-12, `RRR = ${vars.uvwqRRR.r}`);
});

test("custom domains: Dirichlet species need nothing filled in", () => {
  const species = [{ prefix: "uvwq", channel: "r", name: "u", rules: { L: { type: "dirichlet" }, R: { type: "dirichlet" }, T: { type: "dirichlet" }, B: { type: "dirichlet" } } }];
  assert.equal(
    extendedGhostShader(stencilClosure([[-2, 1]], true, { customDomain: true }), species, true, { outside: outsideTest }),
    "",
  );
});

test("custom domains: the display's stencil is exact for biquadratic fields, extrapolated from inside the domain", () => {
  const nX = 10,
    nY = 9,
    a = 6.6;
  const isOut = makeOutside({ nX, nY, a, twoD: true });
  const points = [[1, 1], [-2, -1], [3, 0], [0, -2], [2, 2]];
  const code = stateStencilShader({
    prefix: "uvwq",
    fetch: (c) => `fetch(${c})`,
    h: ["1.0", "1.0"],
    points,
    masks: { L: "vec4(1.0)" },
    twoD: true,
    outside: outsideTest,
  });
  const js = code
    .replace(/(\w+) \+ vec2\(([^()]*)\)/g, "add($1, vec2($2))")
    .replace(/^\s*(?:vec4|vec2|float|bool) /gm, "let ");
  const names = js
    .match(/^let (\w+)/gm)
    .map((d) => d.slice(4))
    .filter((d) => !d.startsWith("vpde"));
  let worst = 0;
  for (let ci = 1; ci <= 6; ci++) {
    for (let cj = 1; cj <= nY - 2; cj++) {
      // The state holds garbage outside the domain, which must never be read.
      const node = (i, j) => (isOut(0, 0, [i, j], 0) || isOut(0, 0, [i, j], 1) ? 1e6 : biquadratic(i, j));
      const env = {
        vec2: (x, y) => ({ x, y }),
        vec4: (v) => v,
        add: (p, q) => ({ x: p.x + q.x, y: p.y + q.y }),
        mix: (p, q, m) => p + (q - p) * m,
        fetch: (c) => node(Math.round(c.x * nX - 0.5), Math.round(c.y * nY - 0.5)),
        textureCoords: { x: (ci + 0.5) / nX, y: (cj + 0.5) / nY },
        step_x: 1 / nX,
        step_y: 1 / nY,
        outsideAt: (qi, qj, axis) => isOut(ci, cj, [qi, qj], axis),
      };
      const out = new Function(...Object.keys(env), js + `\nreturn {${names.join(",")}};`)(...Object.values(env));
      for (const [i, j] of [...points, [-1, 0], [1, 0], [0, 1], [0, -1], [2, 0], [-2, 0]]) {
        worst = Math.max(worst, Math.abs(out["uvwq" + stencilName(i, j)] - biquadratic(ci + i, cj + j)));
      }
    }
  }
  assert.ok(worst < 1e-8, `differs by up to ${worst}`);
});

test("custom domains: the generated code translates to WGSL", () => {
  const species = [{ prefix: "uvwq", channel: "r", name: "u", rules: { L: { type: "reflect" }, R: { type: "reflect" }, T: { type: "reflect" }, B: { type: "reflect" } } }];
  const outside = (q, axis) =>
    `(float(1.0 - x*x) <= 0.0 || textureCoords.${"xy"[axis]} + ${q[axis].toFixed(1)}*step_x - step_x < 0.0)`;
  const sim = extendedGhostShader(stencilClosure([[-1, 1], [2, 0]], true, { customDomain: true }), species, true, { outside });
  assert.match(translateStatements(sim, {}), /select\(|\?/);
  const display = stateStencilShader({
    prefix: "uvwq2",
    fetch: (c) => `texture2D(textureSource, ${c})`,
    h: ["dx", "dy"],
    masks: { L: "vec4(1.0, 0.0, 0.0, 0.0)" },
    twoD: true,
    outside,
  });
  translateStatements(display, { calls: { texture2D: ([, uv]) => `stateNearest(0u, ${uv})` } });
});
