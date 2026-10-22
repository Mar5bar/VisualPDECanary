/**
 * Checks that WebGPU keeps the display smooth beyond the device's limit: outside performance
 * mode, it takes fewer timesteps per frame than set, says so in the Steps/frame box, and
 * records frames evenly, a fixed number of display refreshes apart. Frames recorded unevenly
 * (one refresh apart, then two) are shown unevenly, and the simulation is seen to jump.
 *
 * The load is far beyond any current GPU's limit. Slower devices take longer to settle on
 * their steps per frame, so frames are recorded once the steps stop changing, and are judged
 * against how evenly the display refreshes with nothing running. Runs in a browser window, as
 * a headless browser doesn't time frames by a display's refreshes; skipped where no window can
 * be opened, WebGPU isn't available, or the display refreshes unevenly even when idle.
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
    // Note the animation frames, and whether each submitted any work. The page asks for
    // several callbacks each frame, which share its time, so note each frame once.
    window.frames_ = [];
    let current = null;
    const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (callback) =>
      raf((time) => {
        if (current?.time != time) {
          current = { time, submitted: false };
          if (window.recording) window.frames_.push(current);
        }
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
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      // The frames recorded over ms milliseconds, and the display's refresh period.
      const record = async (ms) => {
        window.frames_ = [];
        window.recording = true;
        await wait(ms);
        window.recording = false;
        const frames = window.frames_;
        const gaps = frames.slice(1).map((frame, i) => frame.time - frames[i].time);
        return { frames, refresh: gaps.sort((a, b) => a - b)[gaps.length >> 1] };
      };
      const inRefreshes = (times, refresh) =>
        times.slice(1).map((time, i) => Math.round((time - times[i]) / refresh));
      const box = () =>
        [...document.querySelectorAll(".dg li")]
          .find((li) => li.querySelector(".property-name")?.textContent == "Steps/frame")
          .querySelector("input[type=text]");

      await T.loadPreset("GrayScott", { numTimestepsPerFrame: 4000, performanceMode });
      const { dx } = await T.grid();
      await T.setSpatialStep(String(dx / 4));
      await T.reset();
      // How evenly the display refreshes with nothing running, to tell the page's
      // unevenness from the device's.
      const idle = await record(2000);
      const idleGaps = inRefreshes(
        idle.frames.map((frame) => frame.time),
        idle.refresh,
      );

      $("#play").click();
      // Wait for the timesteps per frame to settle, which takes longer the slower the
      // device, then record.
      const start = performance.now();
      let steps = box().value;
      let since = start;
      let settled = true;
      while (performance.now() - since < 2000) {
        if (performance.now() - start > 30000) {
          settled = false;
          break;
        }
        await wait(250);
        if (box().value != steps) {
          steps = box().value;
          since = performance.now();
        }
      }
      const { frames, refresh } = await record(4000);
      const worked = frames.filter((frame) => frame.submitted).map((frame) => frame.time);
      return {
        shown: Number(box().value),
        reduced: box().classList.contains("reduced"),
        settled,
        idleGaps,
        gaps: inRefreshes(worked, refresh),
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
  assert.ok(result.settled, "Steps/frame was still changing after 30 seconds");
  // Frames are recorded a fixed number of refreshes apart, bar the odd one held back by
  // something else on the page, nearly as evenly as the display refreshes when idle.
  const idle = evenness(result.idleGaps);
  if (idle.fraction < 0.8)
    return t.skip(`The display refreshes unevenly even when idle: ${JSON.stringify(idle.counts)}`);
  const running = evenness(result.gaps);
  assert.ok(
    running.fraction >= 0.9 * idle.fraction,
    `Frames were recorded unevenly, so many refreshes apart: ${JSON.stringify(running.counts)}` +
      ` (idle: ${JSON.stringify(idle.counts)})`,
  );
});

/** How many of the gaps are each number of refreshes, and the fraction that are the most
 * common number. */
function evenness(gaps) {
  const counts = {};
  gaps.forEach((gap) => (counts[gap] = (counts[gap] ?? 0) + 1));
  return { counts, fraction: Math.max(...Object.values(counts)) / gaps.length };
}

test("in performance mode, the steps per frame are as set", async (t) => {
  const result = await run({ performanceMode: true });
  if (!result) return t.skip(launchError ? "No browser window" : "WebGPU isn't available");
  assert.equal(result.shown, 4000);
  assert.ok(!result.reduced, "Steps/frame is marked as reduced");
});
