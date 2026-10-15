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
    args: BACKEND == "webgpu" ? ["--enable-unsafe-webgpu"] : [],
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
  await page.goto(BASE_URL + `/sim/?testHooks&noop&backend=${BACKEND}`, {
    waitUntil: "load",
  });
  await page.waitForFunction(() => window.VisualPDETest, null, { timeout: 30000 });
  const backend = await page.evaluate(() => window.VisualPDETest.backend);
  assert.equal(backend, BACKEND, `expected the ${BACKEND} backend, but the page is using ${backend}`);
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
];

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
