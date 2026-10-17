/**
 * Measures how many timesteps per second the WebGL and WebGPU backends manage, for a few
 * presets at a few grid resolutions. Reported, not asserted: the numbers depend on the GPU.
 *
 * Each measurement steps the simulation in batches, as the animation loop does, and waits for
 * the GPU to finish before stopping the clock, so it measures the simulation alone, without
 * drawing or reading the state back.
 *
 * Usage: node bench.mjs [--names=a,b] [--scales=1,2,4] [--seconds=2] [--blocking=off]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { ensureServerRunning, BASE_URL } from "./server.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
);
const names = (args.names ?? "GrayScott,BrusselatorPDE,KellerSegel,heatEquation1D").split(",");
// How much finer than the preset's own grid to run, per dimension.
const scales = (args.scales ?? "1,2,4").split(",").map(Number);
const SECONDS = Number(args.seconds ?? 2);
// Steps between waits for the GPU to finish; large, to amortise their cost.
const BATCH = Number(args.batch ?? 500);
// --blocking=off takes every WebGPU Forward Euler step in its own pass.
const BLOCKING = args.blocking == "off" ? "&webgpuBlocking=off" : "";

const stopServer = await ensureServerRunning();
// ANGLE's Metal backend, so that WebGL and WebGPU both run on the real GPU.
const browser = await chromium.launch({ args: ["--enable-unsafe-webgpu", "--use-angle=metal"] });

async function newPage() {
  const context = await browser.newContext({
    serviceWorkers: "block",
    viewport: { width: 1000, height: 700 },
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
  return context.newPage();
}

async function measure(page, backend, name, scale) {
  await page.goto(
    BASE_URL +
      `/sim/?preset=${encodeURIComponent(name)}&testHooks&noop&backend=${backend}&runningOnLoad=false&no_ui${backend == "webgpu" ? BLOCKING : ""}`,
    { waitUntil: "load" },
  );
  await page.waitForFunction(() => window.VisualPDETest, null, { timeout: 30000 });
  return page.evaluate(
    async ([scale, seconds, BATCH]) => {
      const T = window.VisualPDETest;
      const grid = await T.grid();
      if (scale != 1) await T.setSpatialStep(String(grid.dx / scale));
      const { nX, nY } = await T.grid();
      await T.reset();
      // Let the reset's drawing settle first. Paused, WebGPU redraws whenever a readback
      // (e.g. of a line plot) finds the state changed, so redraws begun while stepping would
      // carry on with it, and be timed with the steps, as WebGL's are not.
      await T.finish();
      await new Promise((resolve) => setTimeout(resolve, 500));
      // Batches of steps, as one animation frame's worth.
      const batch = Number(BATCH);
      // Warm up.
      const warmUp = performance.now();
      while (performance.now() - warmUp < 1000) {
        await T.step(batch);
        await T.finish();
      }
      let steps = 0;
      const start = performance.now();
      while (performance.now() - start < 1000 * seconds) {
        await T.step(batch);
        await T.finish();
        steps += batch;
      }
      const elapsed = (performance.now() - start) / 1000;
      return { nX, nY, stepsPerSecond: steps / elapsed, blocking: await T.blocking?.() };
    },
    [scale, SECONDS, BATCH],
  );
}

const pages = { webgl: await newPage(), webgpu: await newPage() };
console.log("preset".padEnd(22), "grid".padEnd(11), "WebGL steps/s".padStart(14), "WebGPU steps/s".padStart(15), "speedup".padStart(8));
for (const name of names) {
  for (const scale of scales) {
    const r = {};
    for (const backend of ["webgl", "webgpu"]) r[backend] = await measure(pages[backend], backend, name, scale);
    console.log(
      name.padEnd(22),
      `${r.webgl.nX}x${r.webgl.nY}`.padEnd(11),
      r.webgl.stepsPerSecond.toFixed(0).padStart(14),
      r.webgpu.stepsPerSecond.toFixed(0).padStart(15),
      (r.webgpu.stepsPerSecond / r.webgl.stepsPerSecond).toFixed(2).padStart(7) + "x",
      r.webgpu.blocking ? ` (blocked, ${r.webgpu.blocking.steps} steps per pass)` : "",
    );
  }
}
await browser.close();
stopServer();
