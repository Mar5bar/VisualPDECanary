/**
 * Compares the WebGL and WebGPU backends directly, on things the float64 reference solver in
 * numerics.test.mjs doesn't model, such as brushes.
 *
 * Usage: node --test backends.test.mjs
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { ensureServerRunning, BASE_URL } from "./server.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
let browser, stopServer;
const pages = {};

before(async () => {
  stopServer = await ensureServerRunning();
  // ANGLE's Metal backend, so that WebGL and WebGPU both run on the real GPU.
  browser = await chromium.launch({ args: ["--enable-unsafe-webgpu", "--use-angle=metal"] });
  for (const backend of ["webgl", "webgpu"]) {
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
    const page = await context.newPage();
    await page.goto(BASE_URL + `/sim/?testHooks&noop&backend=${backend}`, { waitUntil: "load" });
    await page.waitForFunction(() => window.VisualPDETest, null, { timeout: 30000 });
    assert.equal(await page.evaluate(() => window.VisualPDETest.backend), backend);
    pages[backend] = page;
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

// Loads the options on both backends, runs the given actions, and returns both states.
async function onBoth(opts, actions) {
  const states = {};
  for (const [backend, page] of Object.entries(pages)) {
    states[backend] = await page.evaluate(
      async ([opts, actions]) => {
        const T = window.VisualPDETest;
        await T.load(opts);
        for (const [method, ...args] of actions) await T[method](...args);
        return T.readState();
      },
      [opts, actions],
    );
  }
  return states;
}

const brushBase = {
  numSpecies: 2,
  dimension: 2,
  domainScale: 100,
  spatialStep: 1,
  dt: 0.01,
  reactionStr_1: "0",
  reactionStr_2: "0",
  diffusionStr_1_1: "0",
  diffusionStr_2_2: "0",
  initCond_1: "0.5",
  initCond_2: "0",
  boundaryConditions_1: "periodic",
  boundaryConditions_2: "periodic",
  brushRadius: "5",
  brushValue: "1 + x/100",
  whatToDraw: "v",
};

for (const brushType of ["circle", "square", "hline", "vline"]) {
  for (const brushAction of ["replace", "add", "smoothreplace", "smoothadd"]) {
    test(`brush: ${brushType}, ${brushAction}, drawn and erased`, async () => {
      const states = await onBoth({ ...brushBase, brushType, brushAction }, [
        ["brush", 0.5, 0.5],
        ["brush", 0.3, 0.6, true],
      ]);
      const [a, b] = [decode(states.webgl.data), decode(states.webgpu.data)];
      let worst = 0,
        changed = 0;
      for (let n = 0; n < a.length; n++) {
        worst = Math.max(worst, Math.abs(a[n] - b[n]));
        if (n % 4 == 1 && a[n] != 0) changed++;
      }
      assert.ok(changed > 0, "the brush didn't change anything");
      // Smooth brushes evaluate exp(), whose precision varies between GPU code paths.
      const tolerance = brushAction.startsWith("smooth") ? 1e-5 : 1e-6;
      assert.ok(worst < tolerance, `largest difference ${worst}`);
    });
  }
}

test("brush: a custom brush that depends on the value under the brush's centre", async () => {
  const states = await onBoth(
    { ...brushBase, brushType: "custom", brushAction: "replace", brushValue: "u + 0.25*sin(x)", brushRadius: "u" },
    [["brush", 0.4, 0.4]],
  );
  const [a, b] = [decode(states.webgl.data), decode(states.webgpu.data)];
  let worst = 0;
  for (let n = 0; n < a.length; n++) worst = Math.max(worst, Math.abs(a[n] - b[n]));
  assert.ok(worst < 1e-5, `largest difference ${worst}`);
});
