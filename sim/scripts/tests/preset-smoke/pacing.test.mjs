/**
 * Checks that WebGPU keeps the display smooth beyond the device's limit: outside performance
 * mode, it takes fewer timesteps per frame than set, says so in the Steps/frame box, and
 * records frames evenly, a fixed number of display refreshes apart. Frames recorded unevenly
 * (one refresh apart, then two) are shown unevenly, and the simulation is seen to jump.
 *
 * The load is far beyond any current GPU's limit, so the result shouldn't depend on the
 * device. Runs in a browser window, as a headless browser doesn't time frames by a display's
 * refreshes; skipped where no window can be opened, or WebGPU isn't available.
 *
 * Usage: node --test pacing.test.mjs
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { ensureServerRunning, BASE_URL } from "./server.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
let browser, stopServer, launchError;

before(async () => {
  stopServer = await ensureServerRunning();
  try {
    browser = await chromium.launch({
      headless: false,
      args: ["--enable-unsafe-webgpu", "--use-angle=metal"],
    });
  } catch (error) {
    launchError = error;
  }
});

after(async () => {
  await browser?.close();
  stopServer?.();
});

/**
 * Runs Gray-Scott at four times its resolution with 4000 timesteps per frame, and returns
 * the Steps/frame box as shown, and the gaps between frames that gave the GPU work, in
 * display refreshes; or null if the page fell back to WebGL.
 */
async function run({ performanceMode }) {
  if (!browser) return null;
  const context = await browser.newContext({
    serviceWorkers: "block",
    viewport: { width: 1000, height: 700 },
  });
  await context.addInitScript(() => {
    try {
      localStorage.setItem("visited", "true");
    } catch {}
    // Note the animation frames, and whether each submitted any work.
    window.frames_ = [];
    let current = null;
    const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (callback) =>
      raf((time) => {
        current = { time, submitted: false };
        if (window.recording) window.frames_.push(current);
        callback(time);
      });
    if (window.GPUQueue) {
      const submit = GPUQueue.prototype.submit;
      GPUQueue.prototype.submit = function (...args) {
        if (current) current.submitted = true;
        return submit.apply(this, args);
      };
    }
  });
  for (const dir of ["scripts", "css"]) {
    await context.route(`**/sim/${dir}/**`, (route) => {
      const file = path.join(REPO_ROOT, new URL(route.request().url()).pathname);
      route.fulfill({
        body: fs.readFileSync(file),
        contentType: dir == "css" ? "text/css" : "application/javascript",
      });
    });
  }
  const page = await context.newPage();
  try {
    await page.goto(BASE_URL + "/sim/?testHooks&noop&backend=webgpu&runningOnLoad=false", {
      waitUntil: "load",
    });
    await page.waitForFunction(() => window.VisualPDETest, null, { timeout: 30000 });
    if ((await page.evaluate(() => window.VisualPDETest.backend)) != "webgpu") return null;
    return await page.evaluate(async (performanceMode) => {
      const T = window.VisualPDETest;
      await T.loadPreset("GrayScott", { numTimestepsPerFrame: 4000, performanceMode });
      const { dx } = await T.grid();
      await T.setSpatialStep(String(dx / 4));
      await T.reset();
      $("#play").click();
      // Let the timesteps per frame settle, then record.
      await new Promise((resolve) => setTimeout(resolve, 3000));
      window.recording = true;
      await new Promise((resolve) => setTimeout(resolve, 4000));
      window.recording = false;
      const frames = window.frames_;
      const gaps = frames.slice(1).map((frame, i) => frame.time - frames[i].time);
      const refresh = gaps.sort((a, b) => a - b)[gaps.length >> 1];
      const worked = frames.filter((frame) => frame.submitted).map((frame) => frame.time);
      const box = [...document.querySelectorAll(".dg li")]
        .find((li) => li.querySelector(".property-name")?.textContent == "Steps/frame")
        .querySelector("input[type=text]");
      return {
        shown: Number(box.value),
        reduced: box.classList.contains("reduced"),
        gaps: worked.slice(1).map((time, i) => Math.round((time - worked[i]) / refresh)),
      };
    }, performanceMode);
  } finally {
    await context.close();
  }
}

test("outside performance mode, fewer steps per frame are taken, and frames are even", async (t) => {
  const result = await run({ performanceMode: false });
  if (!result) return t.skip(launchError ? "No browser window" : "WebGPU isn't available");
  assert.ok(result.shown < 4000, `Steps/frame shows ${result.shown}`);
  assert.ok(result.reduced, "Steps/frame isn't marked as reduced");
  // Frames are recorded a fixed number of refreshes apart, bar the odd one held back by
  // something else on the page.
  const counts = {};
  result.gaps.forEach((gap) => (counts[gap] = (counts[gap] ?? 0) + 1));
  const usual = Math.max(...Object.values(counts));
  assert.ok(
    usual >= 0.9 * result.gaps.length,
    `Frames were recorded unevenly, so many refreshes apart: ${JSON.stringify(counts)}`,
  );
});

test("in performance mode, the steps per frame are as set", async (t) => {
  const result = await run({ performanceMode: true });
  if (!result) return t.skip(launchError ? "No browser window" : "WebGPU isn't available");
  assert.equal(result.shown, 4000);
  assert.ok(!result.reduced, "Steps/frame is marked as reduced");
});
