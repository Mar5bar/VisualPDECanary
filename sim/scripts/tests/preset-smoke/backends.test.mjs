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

// Steps and draws in rounds, as the animation loop does, so the probe and integral display
// update; WebGPU reads them back asynchronously, so each round waits briefly.
async function runAndRead(opts) {
  const results = {};
  for (const [backend, page] of Object.entries(pages)) {
    results[backend] = await page.evaluate(async (opts) => {
      const T = window.VisualPDETest;
      await T.load(opts);
      for (let round = 0; round < 6; round++) {
        await T.step(10);
        await T.render();
        await new Promise((r) => setTimeout(r, 50));
      }
      return {
        probe: await T.probeData(),
        integral: await T.integralDisplay(),
        errors: await T.errorMessage(),
      };
    }, opts);
  }
  return results;
}

const probeBase = {
  numSpecies: 1,
  dimension: 2,
  domainScale: 20,
  spatialStep: 0.25,
  dt: 0.01,
  diffusionStr_1_1: "1",
  reactionStr_1: "0",
  initCond_1: "1 + cos(2*pi*x/L_x)*cos(2*pi*y/L_y)",
  boundaryConditions_1: "periodic",
  probing: true,
  probeFun: "u",
  probeX: "3.3",
  probeY: "2.1",
  probeLength: 10,
  integrate: true,
};

for (const probeType of ["sample", "integral"]) {
  test(`probe (${probeType}) values agree between backends at the same times`, async () => {
    const r = await runAndRead({ ...probeBase, probeType });
    assert.equal(r.webgl.errors, "");
    assert.equal(r.webgpu.errors, "");
    const webgl = new Map(r.webgl.probe.map(([t, v]) => [t.toFixed(6), v]));
    const matched = r.webgpu.probe.filter(([t]) => webgl.has(t.toFixed(6)));
    assert.ok(matched.length >= 3, `only ${matched.length} probe times in common`);
    for (const [t, v] of matched) {
      const w = webgl.get(t.toFixed(6));
      assert.ok(Math.abs(v - w) <= 1e-5 * Math.max(1, Math.abs(w)), `at t=${t}: ${w} vs ${v}`);
    }
  });
}

test("integral display agrees between backends", async () => {
  const r = await runAndRead({ ...probeBase, probing: false });
  assert.ok(r.webgl.integral.length > 0, "no integral displayed on WebGL");
  assert.equal(r.webgpu.integral, r.webgl.integral);
});

test("domain integrals Int(...) feed back into the equations identically", async () => {
  const states = await onBoth(
    {
      ...probeBase,
      probing: false,
      integrate: false,
      reactionStr_1: "u*(1 - Int(u)/(L_x*L_y))",
      globalIntegralUpdatePeriod: 1,
    },
    [["step", 50]],
  );
  const [a, b] = [decode(states.webgl.data), decode(states.webgpu.data)];
  let worst = 0;
  for (let n = 0; n < a.length; n += 4) worst = Math.max(worst, Math.abs(a[n] - b[n]));
  assert.ok(worst < 1e-5, `largest difference ${worst}`);
});

// Clicks the canvas at the given fraction of its size, as a user would, and returns the
// state afterwards. Uses a replacing brush, so the result doesn't depend on how many frames
// the click lasts.
async function clickAndRead(page, opts, fx, fy) {
  await page.evaluate(async (opts) => {
    const T = window.VisualPDETest;
    if (opts.preset) await T.loadPreset(opts.preset, opts.overrides);
    else await T.load(opts);
    await T.render();
  }, opts);
  const box = await page.locator("#simCanvas").boundingBox();
  await page.mouse.move(box.x + fx * box.width, box.y + fy * box.height);
  await page.mouse.down();
  await page.waitForTimeout(300);
  await page.mouse.up();
  await page.waitForTimeout(100);
  return page.evaluate(() => window.VisualPDETest.readState());
}

for (const plotType of ["plane", "surface"]) {
  test(`clicking draws at the same place on both backends (${plotType})`, async () => {
    const brush = { brushType: "circle", brushAction: "replace", brushValue: "1", runningOnLoad: false };
    // Surfaces are configured as a surface preset is loaded.
    const opts =
      plotType == "plane"
        ? { ...brushBase, ...brush }
        : { preset: "waveEquation3D", overrides: { ...brush, brushRadius: "5", whatToDraw: "v" } };
    const states = {};
    for (const [backend, page] of Object.entries(pages)) {
      states[backend] = await clickAndRead(page, opts, 0.5, 0.5);
    }
    const [a, b] = [decode(states.webgl.data), decode(states.webgpu.data)];
    let drawn = 0,
      differing = 0;
    for (let n = 1; n < a.length; n += 4) {
      if (a[n] == 1) drawn++;
      if (a[n] != b[n]) differing++;
    }
    const drawnGPU = b.filter((v, n) => n % 4 == 1 && v == 1).length;
    assert.ok(drawn > 10, `the click only drew ${drawn} nodes on WebGL (${drawnGPU} on WebGPU)`);
    // The pick may land a node away, from rounding in the camera maths.
    assert.ok(differing <= drawn * 0.2, `${differing} of ${drawn} drawn nodes differ`);
  });
}

test("checkpoints restore the saved state exactly, on both backends", async () => {
  for (const [backend, page] of Object.entries(pages)) {
    const { saved, restored } = await page.evaluate(async (opts) => {
      const T = window.VisualPDETest;
      await T.load(opts);
      await T.step(20);
      await T.saveCheckpoint();
      const saved = await T.readState();
      await T.step(20);
      await T.resetFromCheckpoint();
      return { saved, restored: await T.readState() };
    }, { ...probeBase, probing: false, integrate: false, numSpecies: 5, speciesNames: "a b c d e", whatToPlot: "a", reactionStr_5: "a - e", diffusionStr_5_5: "1", initCond_5: "sin(x)", boundaryConditions_5: "periodic" });
    for (const key of ["data", "dataGroup1"]) {
      assert.ok(saved[key], `${backend}: no ${key}`);
      assert.equal(restored[key], saved[key], `${backend}: ${key} wasn't restored exactly`);
    }
  }
});

test("changing the grid mid-run resamples the state identically on both backends", async () => {
  const states = await onBoth({ ...probeBase, probing: false, integrate: false }, [
    ["step", 20],
    ["setSpatialStep", "0.4"],
    ["step", 5],
  ]);
  assert.equal(states.webgpu.nX, states.webgl.nX);
  const [a, b] = [decode(states.webgl.data), decode(states.webgpu.data)];
  let worst = 0;
  for (let n = 0; n < a.length; n += 4) worst = Math.max(worst, Math.abs(a[n] - b[n]));
  assert.ok(worst < 1e-5, `largest difference ${worst}`);
});

test("timescales depending on the state are evaluated from the current state", async () => {
  for (const timesteppingScheme of ["Euler", "AB2", "Mid", "RK4"]) {
    const states = await onBoth(
      {
        ...probeBase,
        probing: false,
        integrate: false,
        numSpecies: 2,
        timesteppingScheme,
        reactionStr_1: "-u",
        reactionStr_2: "0",
        diffusionStr_2_2: "0",
        initCond_2: "1 + 0.5*cos(2*pi*x/L_x)",
        boundaryConditions_2: "periodic",
        timescales: true,
        timescale_1: "v",
        // Small enough to be stable where v, which divides the timestep, is smallest.
        dt: 0.002,
      },
      [["step", 50]],
    );
    const [a, b] = [decode(states.webgl.data), decode(states.webgpu.data)];
    let worst = 0,
      at = 0;
    for (let n = 0; n < a.length; n += 4) {
      const d = Math.abs(a[n] - b[n]);
      if (!(d <= worst)) [worst, at] = [d, n];
    }
    assert.ok(
      worst < 1e-5,
      `${timesteppingScheme}: largest difference ${worst} at node ${at / 4} of ${states.webgl.nX}x${states.webgl.nY}: u ${a[at]} vs ${b[at]}, v ${a[at + 1]} vs ${b[at + 1]}`,
    );
  }
});

test("the automatic colour range is the plotted values' true min and max", async () => {
  // This preset's grid gives odd-sized reduction textures, in which WebGL's min/max
  // reduction used to skip texels, and with them the maximum (4.32, found as 3.94).
  for (const [backend, page] of Object.entries(pages)) {
    // As following a link to the preset does.
    const query = `preset=swiftHohenbergLocalisedDirectedAdvection&setSeed=true&randSeed=1&runningOnLoad=false`;
    await page.goto(BASE_URL + `/sim/?testHooks&noop&backend=${backend}&${query}`);
    await page.waitForFunction(() => window.VisualPDETest, null, { timeout: 30000 });
    const { range, post } = await page.evaluate(async () => {
      const T = window.VisualPDETest;
      await T.reset();
      await T.step(20);
      await T.render();
      return { range: await T.colourRange(), post: await T.readPost() };
    });
    // Back to the page the other tests use.
    await page.goto(BASE_URL + `/sim/?testHooks&noop&backend=${backend}`);
    await page.waitForFunction(() => window.VisualPDETest, null, { timeout: 30000 });
    const values = decode(post.data).filter((_, k) => k % 4 == 0);
    const min = values.reduce((a, b) => Math.min(a, b));
    const max = values.reduce((a, b) => Math.max(a, b));
    assert.deepEqual(range, [min, max], backend);
  }
});
