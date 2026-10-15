/**
 * Compares what the WebGL and WebGPU backends draw, preset by preset (all of them, or those
 * given with --names=a,b). Each preset is loaded paused on both backends, WebGPU is started
 * from WebGL's initial state, both are stepped the same number of times and drawn, and the
 * canvases are compared pixel by pixel. Screenshots of both are saved to --out (default: a
 * folder in the system's temporary directory) for inspection.
 *
 * Usage: node visual-parity.mjs [--names=a,b] [--steps=N] [--out=dir]
 */
import fs from "node:fs";
import os from "node:os";
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
const OUT = args.out ?? fs.mkdtempSync(path.join(os.tmpdir(), "visual-parity-"));
fs.mkdirSync(OUT, { recursive: true });

// Thrown when a preset can't run on WebGPU yet, so falls back to WebGL.
class Skip extends Error {}

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

async function run(page, backend, name, initialState) {
  const query = `preset=${encodeURIComponent(name)}&testHooks&noop&backend=${backend}&setSeed=true&randSeed=1&runningOnLoad=false&no_ui`;
  await page.goto(BASE_URL + "/sim/?" + query, { waitUntil: "load" });
  await page.waitForFunction(() => window.VisualPDETest, null, { timeout: 30000 });
  const actual = await page.evaluate(() => window.VisualPDETest.backend);
  if (actual != backend) {
    const reason = await page.evaluate(() => window.VisualPDETest.fallbackReason);
    throw new Skip(reason ?? `expected ${backend}, got ${actual}`);
  }
  const initial = await page.evaluate(
    async ([numSteps, initialState]) => {
      const T = window.VisualPDETest;
      await new Promise((r) => setTimeout(r, 300));
      await T.reset();
      const initial = await T.readState();
      if (initialState) await T.writeState(initialState);
      await T.step(numSteps);
      await T.render();
      return initial;
    },
    [NUM_STEPS, initialState],
  );
  const file = path.join(OUT, `${name}-${backend}.png`);
  const png = await page.locator("#simCanvas").screenshot({ path: file });
  const message = await page.evaluate(() => window.VisualPDETest.errorMessage());
  return { initial, png, file, message };
}

// Decodes a PNG screenshot into RGBA pixels, using the page's own image decoder.
async function pixels(page, png) {
  return page.evaluate(async (base64) => {
    const blob = await (await fetch("data:image/png;base64," + base64)).blob();
    const bitmap = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0);
    return {
      width: bitmap.width,
      height: bitmap.height,
      data: Array.from(ctx.getImageData(0, 0, bitmap.width, bitmap.height).data),
    };
  }, png.toString("base64"));
}

const webglPage = await newPage();
const webgpuPage = await newPage();
for (const [index, name] of names.entries()) {
  let status;
  try {
    const a = await run(webglPage, "webgl", name);
    const b = await run(webgpuPage, "webgpu", name, a.initial);
    const [pa, pb] = [await pixels(webglPage, a.png), await pixels(webglPage, b.png)];
    if (pa.width != pb.width || pa.height != pb.height) {
      status = `size differs: ${pa.width}x${pa.height} vs ${pb.width}x${pb.height}`;
    } else {
      let sum = 0,
        worst = 0,
        differing = 0;
      for (let k = 0; k < pa.data.length; k++) {
        const d = Math.abs(pa.data[k] - pb.data[k]);
        sum += d * d;
        worst = Math.max(worst, d);
        if (d > 8) differing++;
      }
      const rmse = Math.sqrt(sum / pa.data.length);
      status = `RMSE ${rmse.toFixed(2)}/255, ${((100 * differing) / pa.data.length).toFixed(2)}% of channels off by more than 8`;
    }
    const error = b.message && b.message != a.message ? "  WebGPU ERROR" : "";
    status += error;
  } catch (e) {
    status = e instanceof Skip ? "SKIP " + e.message : "FAIL " + String(e).slice(0, 200);
  }
  console.log(`[${index + 1}/${names.length}] ${name.padEnd(36)} ${status}`);
}
console.log("Screenshots in " + OUT);
await browser.close();
stopServer();
