/**
 * Checks the simulator's numerical output against the float64 reference solver in
 * ../numerics/reference_solver.mjs. Each case gives a problem twice: as VisualPDE options (run
 * in the browser through the ?testHooks driver in main.js) and as plain JS functions (run by
 * the reference). Every case is run with every timestepping scheme, and the whole state is
 * compared after a fixed number of steps.
 *
 * Sim scripts are served straight from the working tree, so no site rebuild is needed.
 *
 * Usage: node --test numerics.test.mjs
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { ensureServerRunning, BASE_URL } from "./server.mjs";
import { createSolver } from "../numerics/reference_solver.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const SCHEMES = ["Euler", "AB2", "Mid", "RK4"];
// Which backend to test: BACKEND=webgpu node --test numerics.test.mjs
const BACKEND = process.env.BACKEND ?? "webgl";

let browser, page, stopServer;

before(async () => {
  stopServer = await ensureServerRunning();
  browser = await chromium.launch({
    // ANGLE's Metal backend, so that WebGL and WebGPU both run on the real GPU (headless
    // Chromium otherwise gives WebGPU a software adapter that loses its device alongside
    // WebGL).
    args: ["--use-angle=metal", ...(BACKEND == "webgpu" ? ["--enable-unsafe-webgpu"] : [])],
  });
  const context = await browser.newContext({
    serviceWorkers: "block",
    viewport: { width: 1200, height: 800 },
  });
  await context.addInitScript(() => {
    try {
      localStorage.setItem("visited", "true");
    } catch {}
  });
  await context.route("**/sim/scripts/**", (route) => {
    const file = path.join(REPO_ROOT, new URL(route.request().url()).pathname);
    route.fulfill({
      body: fs.readFileSync(file),
      contentType: "application/javascript",
    });
  });
  page = await context.newPage();
  // LIMITS=default runs WebGPU with only the limits every device supports.
  const limits = process.env.LIMITS == "default" ? "&webgpuLimits=default" : "";
  // WORKGROUP=WxH runs WebGPU's 2D kernels in workgroups of that size (e.g. a vendor's).
  const workgroup = process.env.WORKGROUP ? `&webgpuWorkgroup=${process.env.WORKGROUP}` : "";
  await page.goto(BASE_URL + `/sim/?testHooks&noop&backend=${BACKEND}${limits}${workgroup}`, {
    waitUntil: "load",
  });
  await page.waitForFunction(() => window.VisualPDETest, null, { timeout: 30000 });
  const backend = await page.evaluate(() => window.VisualPDETest.backend);
  assert.equal(backend, BACKEND, `expected the ${BACKEND} backend, but the page is using ${backend}`);
  if (process.env.WORKGROUP) {
    const size = await page.evaluate(() => window.VisualPDETest.workgroupSize);
    assert.equal(size?.join("x"), process.env.WORKGROUP, "the workgroup size wasn't applied");
  }
});

after(async () => {
  await browser?.close();
  stopServer?.();
});

function decode(base64) {
  const bytes = Buffer.from(base64, "base64");
  return new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
}

/**
 * Runs a case on the GPU and in the reference, returning the largest error over every node and
 * species, relative to the largest magnitude in the reference solution.
 */
async function runCase(c, scheme) {
  const opts = {
    dimension: 1,
    domainScale: 10,
    spatialStep: 0.25,
    minX: "0",
    minY: "0",
    numAlgebraicSpecies: 0,
    crossDiffusion: false,
    kineticParams: "",
    expressions: "",
    setSeed: true,
    timescales: false,
    whatToPlot: "u",
    ...c.options,
    timesteppingScheme: scheme,
  };
  const { initial, state, grid, message } = await page.evaluate(
    async ([opts, numSteps]) => {
      const T = window.VisualPDETest;
      await T.load(opts);
      const initial = await T.readState();
      await T.step(numSteps);
      return {
        initial,
        state: await T.readState(),
        grid: await T.grid(),
        message: await T.errorMessage(),
      };
    },
    [opts, c.numSteps],
  );
  assert.equal(message, "", "the simulator reported an error");

  // Start the reference from exactly the GPU's initial state, so that the comparison measures
  // the timestepping rather than how accurately the GPU evaluates initial conditions (its
  // sin/cos are only good to about 1e-4).
  // Species s lives in channel s % 4 of group floor(s / 4).
  const valueOf = (state, s, n) =>
    decode(s < 4 ? state.data : state.dataGroup1)[4 * n + (s % 4)];
  const problem = c.reference(grid);
  const initialState = Array.from({ length: problem.numSpecies }, (_, s) =>
    Float64Array.from({ length: grid.nX * grid.nY }, (_, n) => valueOf(initial, s, n)),
  );
  const reference = createSolver({
    ...grid,
    ...problem,
    initialState,
    scheme,
    dt: opts.dt,
  });
  reference.step(c.numSteps);

  let worst = 0,
    scale = 0,
    where = "";
  reference.u.forEach((us, s) => {
    us.forEach((v, n) => {
      scale = Math.max(scale, Math.abs(v));
      const error = Math.abs(valueOf(state, s, n) - v);
      if (error > worst) {
        worst = error;
        where = `species ${s + 1} at node (${n % grid.nX}, ${Math.floor(n / grid.nX)}) of ${grid.nX}x${grid.nY}`;
      }
    });
  });
  return { error: worst / scale, where };
}

const periodic = { type: "periodic" };
const sides = (bc) => ({ L: bc, R: bc, T: periodic, B: periodic });
const constant = (value) => () => value;

const cases = [
  {
    name: "periodic diffusion with a timescale",
    numSteps: 100,
    options: {
      numSpecies: 1,
      dt: 0.01,
      diffusionStr_1_1: "0.7",
      reactionStr_1: "0",
      initCond_1: "cos(2*pi*3*x/10)",
      boundaryConditions_1: "periodic",
      timescales: true,
      timescale_1: "2",
    },
    reference: () => ({
      numSpecies: 1,
      D: [[constant(0.7)]],
      f: [constant(0)],
      init: [({ x }) => Math.cos((2 * Math.PI * 3 * x) / 10)],
      bcs: [sides(periodic)],
      timescales: [2],
    }),
  },
  {
    name: "kinetics chosen with the ?: operator",
    numSteps: 100,
    options: {
      numSpecies: 1,
      dt: 0.01,
      diffusionStr_1_1: "0.5",
      reactionStr_1: "u > 0 ? -u : (u < -0.5 ? 1 : -2*u)",
      initCond_1: "sin(2*pi*x/10)",
      boundaryConditions_1: "periodic",
    },
    reference: () => ({
      numSpecies: 1,
      D: [[constant(0.5)]],
      f: [({ u }) => (u[0] > 0 ? -u[0] : u[0] < -0.5 ? 1 : -2 * u[0])],
      bcs: [sides(periodic)],
    }),
  },
  {
    name: "logistic reaction-diffusion with a nonzero Neumann flux",
    numSteps: 200,
    options: {
      numSpecies: 1,
      dt: 0.005,
      diffusionStr_1_1: "1",
      reactionStr_1: "u*(1-u)",
      initCond_1: "0.5+0.2*cos(pi*x/10)",
      boundaryConditions_1: "neumann",
      neumannStr_1: "0.3",
    },
    reference: () => ({
      numSpecies: 1,
      D: [[constant(1)]],
      f: [({ u }) => u[0] * (1 - u[0])],
      init: [({ x }) => 0.5 + 0.2 * Math.cos((Math.PI * x) / 10)],
      bcs: [sides({ type: "neumann", value: constant(0.3) })],
    }),
  },
  {
    name: "diffusion from a constant, nonzero Dirichlet boundary",
    numSteps: 100,
    options: {
      numSpecies: 1,
      dt: 0.01,
      diffusionStr_1_1: "1",
      reactionStr_1: "0",
      initCond_1: "0",
      boundaryConditions_1: "dirichlet",
      dirichletStr_1: "1",
    },
    reference: () => ({
      numSpecies: 1,
      D: [[constant(1)]],
      f: [constant(0)],
      init: [constant(0)],
      bcs: [sides({ type: "dirichlet", value: constant(1) })],
    }),
  },
  {
    name: "diffusion from a time-dependent Dirichlet boundary",
    numSteps: 100,
    options: {
      numSpecies: 1,
      dt: 0.01,
      diffusionStr_1_1: "1",
      reactionStr_1: "0",
      initCond_1: "0",
      boundaryConditions_1: "dirichlet",
      dirichletStr_1: "t*(2-t)",
    },
    reference: () => ({
      numSpecies: 1,
      D: [[constant(1)]],
      f: [constant(0)],
      init: [constant(0)],
      bcs: [sides({ type: "dirichlet", value: ({ t }) => t * (2 - t) })],
    }),
  },
  {
    name: "decay through a Robin boundary",
    numSteps: 100,
    options: {
      numSpecies: 1,
      dt: 0.01,
      diffusionStr_1_1: "1",
      reactionStr_1: "0",
      initCond_1: "1",
      boundaryConditions_1: "robin",
      robinStr_1: "-u",
    },
    reference: () => ({
      numSpecies: 1,
      D: [[constant(1)]],
      f: [constant(0)],
      init: [constant(1)],
      bcs: [sides({ type: "robin", value: ({ u }) => -u[0] })],
    }),
  },
  {
    name: "diffusion with a coefficient depending on x and u",
    numSteps: 100,
    options: {
      numSpecies: 1,
      dt: 0.005,
      diffusionStr_1_1: "0.5+0.025*x+0.5*u*u",
      reactionStr_1: "0",
      initCond_1: "1+0.5*cos(2*pi*x/10)",
      boundaryConditions_1: "periodic",
    },
    reference: () => ({
      numSpecies: 1,
      D: [[({ x, u }) => 0.5 + 0.025 * x + 0.5 * u[0] * u[0]]],
      f: [constant(0)],
      init: [({ x }) => 1 + 0.5 * Math.cos((2 * Math.PI * x) / 10)],
      bcs: [sides(periodic)],
    }),
  },
  {
    name: "two species with cross-diffusion and linear kinetics",
    numSteps: 100,
    options: {
      numSpecies: 2,
      dt: 0.005,
      crossDiffusion: true,
      diffusionStr_1_1: "1",
      diffusionStr_1_2: "0.3",
      diffusionStr_2_1: "-0.2",
      diffusionStr_2_2: "0.5",
      reactionStr_1: "-v",
      reactionStr_2: "u-v",
      initCond_1: "cos(2*pi*x/10)",
      initCond_2: "sin(2*pi*2*x/10)",
      boundaryConditions_1: "periodic",
      boundaryConditions_2: "periodic",
    },
    reference: () => ({
      numSpecies: 2,
      D: [
        [constant(1), constant(0.3)],
        [constant(-0.2), constant(0.5)],
      ],
      f: [({ u }) => -u[1], ({ u }) => u[0] - u[1]],
      init: [
        ({ x }) => Math.cos((2 * Math.PI * x) / 10),
        ({ x }) => Math.sin((2 * Math.PI * 2 * x) / 10),
      ],
      bcs: [sides(periodic), sides(periodic)],
    }),
  },
  {
    name: "five species coupled across both species groups",
    numSteps: 100,
    options: {
      numSpecies: 5,
      dt: 0.005,
      speciesNames: "a b c d e",
      whatToPlot: "a",
      crossDiffusion: true,
      ...Object.fromEntries(
        [1, 2, 3, 4, 5].flatMap((i) => [
          [`boundaryConditions_${i}`, i == 5 ? "neumann" : "periodic"],
          [`neumannStr_${i}`, "0"],
          ...[1, 2, 3, 4, 5].map((j) => [
            `diffusionStr_${i}_${j}`,
            i == j ? "1" : i == 1 && j == 5 ? "0.2" : "0",
          ]),
        ]),
      ),
      reactionStr_1: "-e",
      reactionStr_2: "a - b",
      reactionStr_3: "0",
      reactionStr_4: "0",
      reactionStr_5: "a*(1-e)",
      initCond_1: "cos(2*pi*x/10)",
      initCond_2: "0",
      initCond_3: "0",
      initCond_4: "0",
      initCond_5: "0.5+0.25*sin(2*pi*x/10)",
    },
    reference: () => {
      const one = constant(1);
      const D = [0, 1, 2, 3, 4].map((i) =>
        [0, 1, 2, 3, 4].map((j) => (i == j ? one : i == 0 && j == 4 ? constant(0.2) : null)),
      );
      const neumann = { type: "neumann" };
      return {
        numSpecies: 5,
        D,
        f: [
          ({ u }) => -u[4],
          ({ u }) => u[0] - u[1],
          constant(0),
          constant(0),
          ({ u }) => u[0] * (1 - u[4]),
        ],
        bcs: [0, 1, 2, 3, 4].map((i) => (i == 4 ? sides(neumann) : sides(periodic))),
      };
    },
  },
  {
    name: "2D periodic diffusion",
    numSteps: 100,
    options: {
      dimension: 2,
      numSpecies: 1,
      dt: 0.005,
      diffusionStr_1_1: "1",
      reactionStr_1: "0",
      initCond_1: "cos(2*pi*x/L_x)*sin(2*pi*2*y/L_y)",
      boundaryConditions_1: "periodic",
    },
    reference: (grid) => ({
      numSpecies: 1,
      D: [[constant(1)]],
      f: [constant(0)],
      init: [
        ({ x, y }) =>
          Math.cos((2 * Math.PI * x) / grid.Lx) * Math.sin((2 * Math.PI * 2 * y) / grid.Ly),
      ],
      bcs: [{ L: periodic, R: periodic, T: periodic, B: periodic }],
    }),
  },
  {
    name: "2D diffusion with Neumann conditions",
    numSteps: 100,
    options: {
      dimension: 2,
      numSpecies: 1,
      dt: 0.005,
      diffusionStr_1_1: "1",
      reactionStr_1: "0",
      initCond_1: "exp(-((x-4)^2+(y-3)^2))",
      boundaryConditions_1: "neumann",
      neumannStr_1: "0",
    },
    reference: () => {
      const neumann = { type: "neumann" };
      return {
        numSpecies: 1,
        D: [[constant(1)]],
        f: [constant(0)],
        init: [({ x, y }) => Math.exp(-((x - 4) ** 2 + (y - 3) ** 2))],
        bcs: [{ L: neumann, R: neumann, T: neumann, B: neumann }],
      };
    },
  },
  {
    // A step that doesn't divide the requested domain (10 / 0.3 = 33.3), so the domain is
    // nX * dx = 9.9 long, and an inhomogeneity in x, so positions must agree with dx too.
    name: "a space step that doesn't divide the domain, with forcing in x",
    numSteps: 100,
    options: {
      numSpecies: 1,
      spatialStep: 0.3,
      dt: 0.005,
      diffusionStr_1_1: "1",
      reactionStr_1: "sin(pi*x/L_x)",
      initCond_1: "cos(pi*x/L)",
      boundaryConditions_1: "neumann",
      neumannStr_1: "0",
    },
    reference: ({ Lx }) => {
      const neumann = { type: "neumann" };
      return {
        numSpecies: 1,
        D: [[constant(1)]],
        f: [({ x }) => Math.sin((Math.PI * x) / Lx)],
        init: [({ x }) => Math.cos((Math.PI * x) / Lx)],
        bcs: [sides(neumann)],
      };
    },
  },
];

test("WebGPU takes 1D Forward Euler steps in temporally blocked passes", { skip: BACKEND != "webgpu" }, async () => {
  // So that the 1D Forward Euler cases above test the blocked kernel (see sim_wgsl.js).
  const plan = await page.evaluate(async () => {
    const T = window.VisualPDETest;
    await T.load({ dimension: 1, numSpecies: 1, timesteppingScheme: "Euler" });
    return T.blocking();
  });
  assert.ok(plan, "1D Forward Euler steps aren't blocked");
  assert.ok(plan.steps > 1);
});

test("the space step is used exactly, and the domain is the nodes' extent", async () => {
  for (const [dimension, domainScale, spatialStep] of [
    [1, 10, 0.3],
    [2, 10, 0.3],
    [2, 7, 0.11],
  ]) {
    const grid = await page.evaluate(
      async (opts) => {
        const T = window.VisualPDETest;
        await T.load(opts);
        return T.grid();
      },
      { dimension, domainScale, spatialStep, numSpecies: 1, minX: "0", minY: "0" },
    );
    const label = `${dimension}D, L = ${domainScale}, dx = ${spatialStep}`;
    assert.equal(grid.dx, spatialStep, label);
    assert.ok(Math.abs(grid.Lx - grid.nX * spatialStep) < 1e-12, label);
    if (dimension == 2) {
      assert.equal(grid.dy, spatialStep, label);
      assert.ok(Math.abs(grid.Ly - grid.nY * spatialStep) < 1e-12, label);
    }
    // The largest side is the requested domain scale, less any remainder.
    const largest = dimension == 1 ? grid.Lx : Math.max(grid.Lx, grid.Ly);
    assert.ok(largest <= domainScale + 1e-12 && largest > domainScale - spatialStep, label);
  }
});

test("round() and fractional powers of negative numbers round halves away from zero", async () => {
  // safepow gives (-4)^y the sign of (-1)^round(y). (Constants rather than x, which WebGL
  // interpolates to within an ulp, so isn't exactly a half-integer at any node.)
  const { state, message } = await page.evaluate(async (opts) => {
    const T = window.VisualPDETest;
    await T.load(opts);
    return { state: await T.readState(), message: await T.errorMessage() };
  }, {
    dimension: 1,
    numSpecies: 4,
    initCond_1: "round(0.5) + 10*round(-0.5) + 100*round(1.5) + 1000*round(2.5)",
    initCond_2: "(-4)^0.5",
    initCond_3: "(-4)^2.5",
    initCond_4: "(-4)^1.5 + (-4)^(-0.5)",
  });
  assert.equal(message, "");
  const values = decode(state.data);
  // Rounding halves to even would give 2200, 2, 32 and 8.5.
  assert.deepEqual([...values.slice(0, 4)], [3191, -2, -32, 7.5]);
});

test("constant subexpressions that are infinite give inf at run time, as in GLSL", async () => {
  // WGSL rejects shaders in which an expression of literals alone isn't finite.
  const { state, message } = await page.evaluate(async (opts) => {
    const T = window.VisualPDETest;
    await T.load(opts);
    await T.step(1);
    return { state: await T.readState(), message: await T.errorMessage() };
  }, {
    dimension: 1,
    numSpecies: 4,
    dt: 0.1,
    timesteppingScheme: "Euler",
    ...Object.fromEntries([1, 2, 3, 4].map((i) => [`diffusionStr_${i}_${i}`, "0"])),
    initCond_1: "min(1/0, 2)",
    initCond_2: "max(-1/0, -3)",
    initCond_3: "min(exp(1000), 5)",
    // Also a literal too large for an f32 (inf in GLSL), and minus signs WGSL mustn't read as
    // its -- operator.
    initCond_4: "min(1e40, 4) - -1",
    reactionStr_1: "0",
    reactionStr_2: "0",
    reactionStr_3: "0",
    reactionStr_4: "min(1/0, 1) + max(-1/0, -1) + min(exp(1000), 1)",
  });
  assert.equal(message, "");
  assert.deepEqual([...decode(state.data).slice(0, 4)].map((v) => Math.fround(v)), [2, -3, 5, Math.fround(5.1)]);
});

test("the state read back on a large grid is exactly the state stepped, with 5-8 species too", async () => {
  // One Forward Euler step of u_t = -u_xb, checked against float64 from the state read back
  // beforehand: any error in reading the state back (e.g. interpolating between nodes) shows
  // up as a mismatch far larger than rounding. The grid is large, as the texture coordinates
  // of such errors are least accurate there.
  for (const numSpecies of [1, 5]) {
    const opts = {
      dimension: 1,
      domainScale: 100,
      spatialStep: 0.1,
      minX: "0",
      numSpecies,
      speciesNames: ["a", "b", "c", "d", "e"].slice(0, numSpecies).join(" "),
      whatToPlot: "a",
      timesteppingScheme: "Euler",
      dt: 0.01,
      reactionStr_1: "-a_xb",
      diffusionStr_1_1: "0",
      initCond_1: "sin(x/4)",
      boundaryConditions_1: "periodic",
    };
    const { initial, state, grid } = await page.evaluate(async (opts) => {
      const T = window.VisualPDETest;
      await T.load(opts);
      const initial = await T.readState();
      await T.step(1);
      return { initial, state: await T.readState(), grid: await T.grid() };
    }, opts);
    const [u0, u1] = [decode(initial.data), decode(state.data)];
    const n = grid.nX;
    let worst = 0;
    for (let i = 0; i < n; i++) {
      const expected = u0[4 * i] - (opts.dt * (u0[4 * i] - u0[4 * ((i + n - 1) % n)])) / grid.dx;
      worst = Math.max(worst, Math.abs(u1[4 * i] - expected));
    }
    assert.ok(worst < 1e-7, `${numSpecies} species: error ${worst.toExponential(2)}`);
  }
});

test("a species clamped at the edges evolves the same whatever the other species' conditions", async () => {
  // Second-order one-sided differences reach two nodes beyond the edge, so they test that
  // every neighbour is clamped, whether that's done by the texture's wrap mode (when every
  // species in a group is clamped) or in the shader (when only some are, and always for
  // species 5-8). Species a is compared with a run where four species all clamp, so the
  // texture clamps: run alone, beside a periodic species, and among five species (all
  // clamped, then all but a periodic), with e solving a's equation in group 2.
  const names = ["a", "b", "c", "d", "e"];
  const equation = (s) => `-0.5*${s}_xb2 + 0.3*${s}_xf2 - 0.4*${s}_yb2 + 0.2*${s}_yf2`;
  const init = "x/10 + 0.2*cos(2*pi*x/10) + y/20";
  const run = (dimension, numSpecies, bc) =>
    page.evaluate(
      async (opts) => {
        const T = window.VisualPDETest;
        await T.load(opts);
        await T.step(50);
        return { state: await T.readState(), message: await T.errorMessage() };
      },
      {
        dimension,
        domainScale: 10,
        spatialStep: 0.25,
        minX: "0",
        minY: "0",
        numAlgebraicSpecies: 0,
        crossDiffusion: false,
        timesteppingScheme: "Euler",
        dt: 0.005,
        setSeed: true,
        numSpecies,
        speciesNames: names.slice(0, Math.max(numSpecies, 1)).join(" "),
        whatToPlot: "a",
        ...Object.fromEntries(
          names.flatMap((s, i) => [
            [`diffusionStr_${i + 1}_${i + 1}`, "1"],
            [`reactionStr_${i + 1}`, i == 0 || i == 4 ? equation(s) : "0"],
            [`initCond_${i + 1}`, i == 0 || i == 4 ? init : "0"],
            [`boundaryConditions_${i + 1}`, i == 0 || i == 4 ? "neumann" : bc],
            [`neumannStr_${i + 1}`, "0"],
          ]),
        ),
      },
    );
  for (const dimension of [1, 2]) {
    const { state: clamped } = await run(dimension, 4, "neumann");
    const expected = decode(clamped.data).filter((_, k) => k % 4 == 0);
    for (const [numSpecies, bc] of [
      [1, "neumann"],
      [2, "periodic"],
      [5, "neumann"],
      [5, "periodic"],
    ]) {
      const { state, message } = await run(dimension, numSpecies, bc);
      assert.equal(message, "");
      const label = `${dimension}D, ${numSpecies} species, the others ${bc}`;
      const a = decode(state.data).filter((_, k) => k % 4 == 0);
      const species = [["a", a]];
      if (numSpecies == 5) species.push(["e", decode(state.dataGroup1).filter((_, k) => k % 4 == 0)]);
      for (const [name, values] of species) {
        let worst = 0;
        values.forEach((v, n) => (worst = Math.max(worst, Math.abs(v - expected[n]))));
        assert.ok(worst < 1e-6, `${label}: species ${name} differs by up to ${worst}`);
      }
    }
  }
});

for (const c of cases) {
  for (const scheme of SCHEMES) {
    test(`${c.name} (${scheme})`, async () => {
      const { error, where } = await runCase(c, scheme);
      const tolerance = c.tolerance ?? 2e-5;
      assert.ok(
        error < tolerance,
        `relative error ${error.toExponential(2)} > ${tolerance}, worst for ${where}`,
      );
    });
  }
}
