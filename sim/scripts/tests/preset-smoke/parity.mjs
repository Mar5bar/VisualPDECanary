/**
 * Compares the WebGL and WebGPU backends on every preset (or those given with --names=a,b).
 * Each preset is loaded on both backends with a fixed random seed. Their initial states are
 * compared, then WebGPU is started from WebGL's initial state, both are stepped the same
 * number of times, and the states compared, relative to the range of the WebGL state.
 *
 * Chaotic or noise-driven presets amplify the backends' tiny differences in rounding (and in
 * sin(), which the noise uses), so a large difference isn't necessarily a bug; the report
 * also lists each preset's difference after a single step, which should always be small.
 *
 * With --against=unblocked, compares WebGPU with WebGPU taking every Forward Euler step in
 * its own pass instead of WebGL, to check its temporally blocked passes (see
 * webgpu/sim_wgsl.js); the report's "webgl" fields are then that reference.
 *
 * Usage: node parity.mjs [--names=a,b] [--steps=N] [--json=out.json] [--against=unblocked]
 *   [--limits=default]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { ensureServerRunning, BASE_URL } from "./server.mjs";
import { getListOfPresetNames } from "../../RD/presets.js";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
);
const names = args.names
  ? args.names.split(",")
  : getListOfPresetNames().filter((n) => n != "default");
const NUM_STEPS = Number(args.steps ?? 20);

// Thrown when a preset can't run on WebGPU yet, so falls back to WebGL.
class Skip extends Error {}

const stopServer = await ensureServerRunning();
// ANGLE's Metal backend, so that WebGL and WebGPU both run on the real GPU (headless
// Chromium otherwise gives WebGPU a software adapter that loses its device alongside WebGL).
const browser = await chromium.launch({ args: ["--enable-unsafe-webgpu", "--use-angle=metal"] });

async function openPage(backend, extraQuery = "") {
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
    route.fulfill({ body: fs.readFileSync(file), contentType: "application/javascript" });
  });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (m) => m.type() == "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  return { page, errors, backend, extraQuery };
}

function decode(base64) {
  if (!base64) return null;
  const bytes = Buffer.from(base64, "base64");
  return new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
}

// Loads a preset in a fresh page, as following a ?preset= link does, with a fixed seed. If
// initialState is given, the run starts from it instead of the preset's initial conditions.
async function run({ page, errors, backend, extraQuery }, name, initialState) {
  errors.length = 0;
  const query = `preset=${encodeURIComponent(name)}&testHooks&noop&backend=${backend}&setSeed=true&randSeed=1&runningOnLoad=false${extraQuery}`;
  await page.goto(BASE_URL + "/sim/?" + query, { waitUntil: "load" });
  await page.waitForFunction(() => window.VisualPDETest, null, { timeout: 30000 });
  const actual = await page.evaluate(() => window.VisualPDETest.backend);
  if (actual != backend) {
    const reason = await page.evaluate(() => window.VisualPDETest.fallbackReason);
    throw new Skip(reason ?? `expected ${backend}, got ${actual}`);
  }
  return page.evaluate(
    async ([numSteps, initialState]) => {
      const T = window.VisualPDETest;
      // Give images a moment to load, as presets that use them reset once they have.
      await new Promise((r) => setTimeout(r, 300));
      await T.reset();
      const initial = await T.readState();
      if (initialState) await T.writeState(initialState);
      const states = [];
      await T.step(1);
      states.push(await T.readState());
      await T.step(numSteps - 1);
      states.push(await T.readState());
      return { initial, states, message: await T.errorMessage() };
    },
    [NUM_STEPS, initialState],
  );
}

// The largest difference between two states, relative to the range of the first, over the
// active species only.
function compare(a, b, numSpecies) {
  const groups = [
    [decode(a.data), decode(b.data)],
    [decode(a.dataGroup1), decode(b.dataGroup1)],
  ];
  let worst = 0,
    min = Infinity,
    max = -Infinity,
    nonFinite = 0,
    differing = 0,
    where = "";
  groups.forEach(([ga, gb], g) => {
    if (!ga || !gb) return;
    for (let n = 0; n < ga.length; n++) {
      if (4 * g + (n % 4) >= numSpecies) continue;
      if (!Number.isFinite(ga[n]) || !Number.isFinite(gb[n])) {
        if (Number.isFinite(ga[n]) != Number.isFinite(gb[n])) nonFinite++;
        continue;
      }
      min = Math.min(min, ga[n]);
      max = Math.max(max, ga[n]);
      const d = Math.abs(ga[n] - gb[n]);
      if (d > 1e-5 * Math.max(1, Math.abs(ga[n]))) differing++;
      if (d > worst) {
        worst = d;
        const node = Math.floor(n / 4);
        where = `species ${4 * g + (n % 4) + 1} at node ${node % a.nX},${Math.floor(node / a.nX)} (${ga[n]} vs ${gb[n]})`;
      }
    }
  });
  const range = Math.max(max - min, Math.abs(max), Math.abs(min), 1e-12);
  // A value that's finite on one backend but not the other is as different as can be.
  return {
    difference: nonFinite ? Infinity : worst / range,
    nonFinite,
    where: `${where}; ${differing} values differ by more than rounding`,
  };
}

// The reference: WebGL, or WebGPU without temporal blocking.
const webgl =
  args.against == "unblocked"
    ? await openPage("webgpu", "&webgpuBlocking=off")
    : await openPage("webgl");
// --limits=default runs WebGPU with only the limits every device supports.
const webgpu = await openPage("webgpu", args.limits == "default" ? "&webgpuLimits=default" : "");
const results = [];
for (const [index, name] of names.entries()) {
  let result;
  try {
    const a = await run(webgl, name);
    const b = await run(webgpu, name, a.initial);
    const species = a.states[1].numSpecies;
    const initial = compare(a.initial, b.initial, species);
    const firstStep = compare(a.states[0], b.states[0], species);
    const lastStep = compare(a.states[1], b.states[1], species);
    result = {
      name,
      initial: initial.difference,
      firstStep: firstStep.difference,
      lastStep: lastStep.difference,
      firstStepWhere: firstStep.where,
      lastStepWhere: lastStep.where,
      nonFinite: lastStep.nonFinite,
      webglError: a.message,
      webgpuError: b.message,
      webgpuConsole: webgpu.errors.slice(0, 2).map((e) => e.slice(0, 300)),
    };
  } catch (e) {
    result =
      e instanceof Skip
        ? { name, skipped: e.message }
        : { name, failure: String(e).slice(0, 300) };
  }
  results.push(result);
  const status = result.skipped
    ? "SKIP  " + result.skipped
    : result.failure
    ? "FAIL  " + result.failure
    : result.webgpuError && result.webgpuError != result.webglError
      ? "ERROR " + result.webgpuError
      : `initial ${result.initial.toExponential(1)}, ${result.firstStep.toExponential(1)} after 1 step, ${result.lastStep.toExponential(1)} after ${NUM_STEPS}`;
  console.log(`[${index + 1}/${names.length}] ${name.padEnd(36)} ${status}`);
  if (args.verbose && result.firstStepWhere) {
    console.log("    worst after 1 step: " + result.firstStepWhere);
    console.log(`    worst after ${NUM_STEPS}: ` + result.lastStepWhere);
  }
}

if (args.json) fs.writeFileSync(args.json, JSON.stringify(results, null, 2));
await browser.close();
stopServer();
