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

test("checkpoints restored onto another grid agree, whatever the number of species", async () => {
  // Shrunk (nearest) and enlarged (linear), stretched and cropped. Species 1 is the same
  // with 2 species and with 6 (so species groups restored together), and must restore the
  // same way in each case on each backend. Across backends, WebGL's hardware filtering
  // weights are only accurate to about 1e-4.
  for (const spatialStep of ["0.7", "0.35"]) {
    for (const resizeCheckpoints of ["stretch", "crop"]) {
      const results = {};
      for (const numSpecies of [2, 6]) {
        const states = await onBoth(
          {
            dimension: 2,
            // An odd number of nodes across, so that cropping doesn't sample the checkpoint
            // exactly between nodes, where which is taken is down to rounding.
            domainScale: 40.5,
            spatialStep: 0.5,
            numSpecies,
            speciesNames: "u v w q a b",
            resizeCheckpoints,
            ...Object.fromEntries(
              [1, 2, 3, 4, 5, 6].flatMap((i) => [
                [`reactionStr_${i}`, "0"],
                [`diffusionStr_${i}_${i}`, "0"],
                [`initCond_${i}`, i == 1 ? "sin(x/7)+cos(y/5)+x/40" : `${i}*x*y/1000`],
              ]),
            ),
          },
          [["saveCheckpoint"], ["setSpatialStep", spatialStep], ["resetFromCheckpoint"]],
        );
        for (const backend of ["webgl", "webgpu"]) {
          results[`${backend}, ${numSpecies} species`] = decode(states[backend].data).filter(
            (_, k) => k % 4 == 0,
          );
        }
      }
      const label = `dx 0.5 -> ${spatialStep}, ${resizeCheckpoints}`;
      const compare = (a, b, tolerance) => {
        const [x, y] = [results[a], results[b]];
        assert.equal(x.length, y.length, `${label}: ${a} vs ${b}`);
        let worst = 0;
        for (let n = 0; n < x.length; n++) worst = Math.max(worst, Math.abs(x[n] - y[n]));
        assert.ok(worst <= tolerance, `${label}: ${a} vs ${b} differ by ${worst}`);
      };
      compare("webgl, 2 species", "webgl, 6 species", 1e-6);
      compare("webgpu, 2 species", "webgpu, 6 species", 1e-6);
      compare("webgl, 6 species", "webgpu, 6 species", 2e-3);
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

test("resampling onto a new grid wraps or clamps at the edges as WebGL's textures do", async () => {
  // WebGL interpolates each texture as it wraps: clamped only if all four species slots of a
  // single group are, and always wrapping with 5-8 species. The state varies across the
  // edges, so wrapping and clamping give different values there.
  for (const [numSpecies, bc] of [
    [1, "neumann"],
    [4, "neumann"],
    [5, "neumann"],
    [1, "periodic"],
  ]) {
    const opts = {
      numSpecies,
      dimension: 2,
      domainScale: 20,
      spatialStep: 1,
      dt: 0.01,
      ...Object.fromEntries(
        [1, 2, 3, 4, 5].flatMap((i) => [
          [`boundaryConditions_${i}`, bc],
          [`neumannStr_${i}`, "0"],
          [`initCond_${i}`, `${i}*x/20 + y*y/400`],
          [`reactionStr_${i}`, "0"],
          [`diffusionStr_${i}_${i}`, "0"],
        ]),
      ),
    };
    const states = await onBoth(opts, [["setSpatialStep", "0.7"]]);
    const label = `${numSpecies} species, ${bc}`;
    assert.equal(states.webgpu.nX, states.webgl.nX, label);
    let worst = 0;
    for (const key of ["data", "dataGroup1"]) {
      if (!states.webgl[key]) continue;
      const [a, b] = [decode(states.webgl[key]), decode(states.webgpu[key])];
      for (let n = 0; n < a.length; n++) worst = Math.max(worst, Math.abs(a[n] - b[n]));
    }
    assert.ok(worst < 1e-5, `${label}: largest difference ${worst}`);
  }
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

test("a simulation that fails to build doesn't run on either backend", async () => {
  // A working simulation, then one whose kinetics don't compile: nothing should step it, on
  // WebGPU as on WebGL, rather than the previous simulation's code carrying on.
  const base = {
    numSpecies: 1,
    dimension: 1,
    domainScale: 10,
    spatialStep: 0.5,
    dt: 0.01,
    diffusionStr_1_1: "1",
    reactionStr_1: "-u",
    initCond_1: "sin(x)",
    boundaryConditions_1: "periodic",
  };
  for (const [backend, page] of Object.entries(pages)) {
    const result = await page.evaluate(async (base) => {
      const T = window.VisualPDETest;
      await T.load(base);
      await T.step(10);
      await T.load({ ...base, reactionStr_1: "-undefinedFunction(u)" });
      const before = await T.readState();
      await T.step(10);
      const after = await T.readState();
      const message = await T.errorMessage();
      // Fixing the kinetics makes it run again.
      await T.load(base);
      const fixed = await T.readState();
      await T.step(10);
      const recovered = (await T.readState()).data != fixed.data;
      return { message, changed: before.data != after.data, recovered };
    }, base);
    assert.notEqual(result.message, "", `${backend}: no error was reported`);
    assert.ok(!result.changed, `${backend}: the simulation stepped`);
    assert.ok(result.recovered, `${backend}: the fixed simulation didn't run`);
  }
});

test("an undefined symbol is reported the same way on both backends", async () => {
  const messages = {};
  for (const [backend, page] of Object.entries(pages)) {
    messages[backend] = await page.evaluate(async () => {
      const T = window.VisualPDETest;
      await T.load({ numSpecies: 1, dimension: 1, reactionStr_1: "-undefinedRate*u" });
      // WebGL compiles a shader when it's first used.
      await T.step(1);
      return T.errorMessage();
    });
  }
  assert.match(messages.webgl, /^Unknown symbol: 'undefinedRate'/);
  assert.equal(messages.webgpu, messages.webgl);
});

test("WebGPU frees the buffers it makes for each frame's passes", async () => {
  // Garbage collection doesn't see GPU memory, so buffers made for one frame's work (probes,
  // the integral display, domain integrals, readbacks) must be destroyed explicitly. Counts
  // the buffers made and not destroyed over a run, after warming up.
  const live = await pages.webgpu.evaluate(async (opts) => {
    const T = window.VisualPDETest;
    await T.load(opts);
    const frames = async (n) => {
      for (let k = 0; k < n; k++) {
        await T.step(10);
        await T.render();
        await new Promise((r) => setTimeout(r, 30));
      }
    };
    await frames(5);
    let count = 0;
    const create = GPUDevice.prototype.createBuffer;
    const destroy = GPUBuffer.prototype.destroy;
    const made = new Set();
    GPUDevice.prototype.createBuffer = function (...args) {
      const buffer = create.apply(this, args);
      made.add(buffer);
      count++;
      return buffer;
    };
    GPUBuffer.prototype.destroy = function () {
      if (made.delete(this)) count--;
      return destroy.call(this);
    };
    try {
      await frames(20);
      await T.finish();
      await new Promise((r) => setTimeout(r, 200));
    } finally {
      GPUDevice.prototype.createBuffer = create;
      GPUBuffer.prototype.destroy = destroy;
    }
    return count;
  }, { ...probeBase, probeType: "integral", expressions: "", reactionStr_1: "-0.01*Int(u)*u" });
  // A few may be awaiting their readback.
  assert.ok(live <= 4, `${live} buffers made over 20 frames are still alive`);
});

test("post-processed values aren't read for the wrong grid after a resize", async () => {
  // Until the next draw, they're for the old grid, so reading them must give nothing rather
  // than reading the old values as if they were on the new grid.
  const page = pages.webgpu;
  const errors = [];
  const onConsole = (m) => m.type() == "error" && errors.push(m.text());
  page.on("console", onConsole);
  try {
    const r = await page.evaluate(async (opts) => {
      const T = window.VisualPDETest;
      await T.load(opts);
      await T.render();
      await T.setSpatialStep("0.4");
      const stale = await T.readPost();
      await T.render();
      const fresh = await T.readPost();
      const bytes = (post) => atob(post.data).length;
      return { stale: bytes(stale), fresh: bytes(fresh), nX: fresh.nX, nY: fresh.nY };
    }, { ...probeBase, probing: false });
    assert.equal(r.stale, 0, "values for the old grid were read");
    assert.equal(r.fresh, 16 * r.nX * r.nY);
    assert.deepEqual(errors, []);
  } finally {
    page.off("console", onConsole);
  }
});

test("brushing while the kernels are rebuilt for a new number of species does nothing", async () => {
  // The brush kernel then writes the old state's formats, so it mustn't run (nor the slots
  // rotate as if it had).
  const message = await pages.webgpu.evaluate(async (base) => {
    const T = window.VisualPDETest;
    await T.load(base);
    await T.step(5);
    const loading = T.load({ ...base, numSpecies: 5 });
    await T.brush(0.5, 0.5, false, false);
    await loading;
    return T.errorMessage();
  }, brushBase);
  assert.equal(message, "");
});

test("overlapping image loads leave the latest image in place", async () => {
  // Decoding is asynchronous: make the first image decode last.
  const value = await pages.webgpu.evaluate(async () => {
    const T = window.VisualPDETest;
    await T.load({ numSpecies: 1, dimension: 2, initCond_1: "I_SR", reactionStr_1: "0", diffusionStr_1_1: "0" });
    const canvas = (red) => {
      const c = document.createElement("canvas");
      c.width = c.height = 4;
      const ctx = c.getContext("2d");
      ctx.fillStyle = `rgb(${red}, 0, 0)`;
      ctx.fillRect(0, 0, 4, 4);
      return c;
    };
    const [first, second] = [canvas(0), canvas(255)];
    const decode = window.createImageBitmap;
    window.createImageBitmap = async (source, ...args) => {
      if (source == first) await new Promise((r) => setTimeout(r, 200));
      return decode(source, ...args);
    };
    try {
      await Promise.all([T.setImage(0, first), T.setImage(0, second)]);
    } finally {
      window.createImageBitmap = decode;
    }
    await T.reset();
    const state = await T.readState();
    return new Float32Array(Uint8Array.from(atob(state.data), (c) => c.charCodeAt(0)).buffer)[0];
  });
  assert.equal(value, 1);
});

test("grids and images too large for the WebGPU device are capped, and still run", async () => {
  // A page with only WebGPU's default limits (8192 texels per side, 128 MiB storage buffer
  // bindings), as a low-powered device may offer. Each simulation is u_t = 1 from u = x, and
  // the automatic colour range (the true extremes of u, from the GPU) checks that every node
  // stepped, without reading back the large state.
  const context = pages.webgpu.context();
  const page = await context.newPage();
  try {
    await page.goto(BASE_URL + "/sim/?testHooks&noop&backend=webgpu&webgpuLimits=default", {
      waitUntil: "load",
    });
    await page.waitForFunction(() => window.VisualPDETest, null, { timeout: 30000 });
    const results = await page.evaluate(async () => {
      const T = window.VisualPDETest;
      const run = async (opts, image) => {
        await T.load({
          numSpecies: 1,
          reactionStr_1: "1",
          diffusionStr_1_1: "0",
          initCond_1: "x",
          minX: "0",
          dt: 0.5,
          autoSetColourRange: true,
          ...opts,
        });
        if (image) await T.setImage(0, image);
        await T.step(2);
        await T.render();
        return { grid: await T.grid(), range: await T.colourRange(), message: await T.errorMessage() };
      };
      const image = new OffscreenCanvas(9000, 40);
      image.getContext("2d").fillRect(0, 0, 9000, 40);
      return {
        // 10000 nodes along x, more than a texture's side.
        wide: await run({ dimension: 1, domainScale: 1000, spatialStep: 0.1 }),
        // 5000 x 2600 or so nodes, whose post-processed values need more than 128 MiB.
        many: await run({ dimension: 2, domainScale: 100, spatialStep: 0.02 }),
        // An image wider than a texture's side, which every simulation kernel binds.
        image: await run({ dimension: 1, domainScale: 100, spatialStep: 1 }, image),
      };
    });
    const { wide, many, image } = results;
    const label = (r) => JSON.stringify(r);
    assert.ok(wide.grid.nX <= 8192 && wide.grid.dx == 0.1, label(wide));
    assert.match(wide.message, /does not support a discretisation this fine/);
    assert.ok(16 * many.grid.nX * many.grid.nY <= 128 * 2 ** 20 && many.grid.dx == 0.02, label(many));
    assert.match(many.message, /does not support a discretisation this fine/);
    assert.equal(image.message, "");
    for (const r of [wide, many, image]) {
      const dx = r.grid.dx;
      const expected = [1 + dx / 2, 1 + r.grid.Lx - dx / 2];
      assert.ok(
        r.range.every((v, k) => Math.abs(v - expected[k]) < 1e-3 * expected[1]),
        `colour range ${r.range}, not ${expected}: ${label(r)}`,
      );
    }
  } finally {
    await page.close();
  }
});

test("in clean mode, every blow-up to NaN resets the simulation, on both backends", async () => {
  // Without error messages to show (as when embedded), hitting NaN resets the simulation,
  // which on WebGPU mustn't act on the range found from the state it's just replaced.
  for (const backend of ["webgl", "webgpu"]) {
    const page = await pages[backend].context().newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    try {
      await page.goto(BASE_URL + `/sim/?testHooks&noop&clean&backend=${backend}`, { waitUntil: "load" });
      await page.waitForFunction(() => window.VisualPDETest, null, { timeout: 30000 });
      const values = await page.evaluate(async () => {
        const T = window.VisualPDETest;
        await T.load({ reactionStr_1: "u*u", reactionStr_2: "0", initCond_1: "1", dt: 0.1, whatToPlot: "u" });
        const values = [];
        for (let round = 0; round < 3; round++) {
          await T.step(100);
          await T.render();
          // The check runs every second.
          await new Promise((resolve) => setTimeout(resolve, 2500));
          const state = await T.readState();
          values.push(new Float32Array(Uint8Array.from(atob(state.data), (c) => c.charCodeAt(0)).buffer)[0]);
        }
        return values;
      });
      assert.deepEqual(values, [1, 1, 1], `${backend}: the simulation wasn't reset each time`);
      assert.deepEqual(errors, [], backend);
    } finally {
      await page.close();
    }
  }
});

test("the probe's chart has the same points on both backends, across a reset", async () => {
  // Including the point at t = 0 and none from before a reset made while a probe (read back
  // asynchronously on WebGPU) was under way.
  const charts = {};
  for (const [backend, page] of Object.entries(pages)) {
    charts[backend] = await page.evaluate(async () => {
      const T = window.VisualPDETest;
      await T.load({
        numSpecies: 1,
        dimension: 2,
        reactionStr_1: "1",
        diffusionStr_1_1: "0",
        initCond_1: "0",
        dt: 0.1,
        probing: true,
        probeType: "integral",
        probeFun: "u",
        probeLength: 20,
      });
      const before = [];
      for (let k = 0; k < 5; k++) {
        await T.step(10);
        await T.render();
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
      before.push(...(await T.probeData()));
      await T.step(10);
      const rendering = T.render();
      await T.reset();
      await rendering;
      await new Promise((resolve) => setTimeout(resolve, 200));
      for (let k = 0; k < 3; k++) {
        await T.step(10);
        await T.render();
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
      return { before, after: await T.probeData() };
    });
  }
  for (const part of ["before", "after"]) {
    const times = (backend) => charts[backend][part].map(([t]) => t.toFixed(6));
    assert.deepEqual(times("webgpu"), times("webgl"), part);
    charts.webgl[part].forEach(([, v], k) => {
      const w = charts.webgpu[part][k][1];
      assert.ok(Math.abs(v - w) <= 1e-5 * Math.max(1, Math.abs(v)), `${part}: ${w} vs ${v}`);
    });
  }
});

test("WebGPU doesn't allocate WebGL textures for the state", async () => {
  // The WebGL renderer kept for the rest of the app mustn't hold copies of the state, which
  // would multiply the memory a simulation needs (e.g. on phones).
  const allocations = await pages.webgpu.evaluate(async () => {
    const T = window.VisualPDETest;
    const sizes = [];
    const proto = WebGL2RenderingContext.prototype;
    const texImage2D = proto.texImage2D;
    const texStorage2D = proto.texStorage2D;
    proto.texImage2D = function (...args) {
      if (typeof args[3] == "number") sizes.push(args[3] * args[4]);
      return texImage2D.apply(this, args);
    };
    proto.texStorage2D = function (...args) {
      sizes.push(args[3] * args[4]);
      return texStorage2D.apply(this, args);
    };
    try {
      for (const numSpecies of [2, 6]) {
        await T.load({ numSpecies, dimension: 2, spatialStep: 0.5, domainScale: 100 });
        await T.step(5);
        await T.render();
        await T.setSpatialStep("0.4");
        await T.render();
      }
    } finally {
      proto.texImage2D = texImage2D;
      proto.texStorage2D = texStorage2D;
    }
    const grid = await T.grid();
    return sizes.filter((size) => size >= (grid.nX * grid.nY) / 4);
  });
  assert.deepEqual(allocations, []);
});

test("toggling interpolation doesn't change the state", async () => {
  for (const [backend, page] of Object.entries(pages)) {
    const changed = await page.evaluate(async () => {
      const T = window.VisualPDETest;
      await T.load({
        numSpecies: 1,
        dimension: 2,
        spatialStep: 4,
        reactionStr_1: "0",
        diffusionStr_1_1: "0",
        initCond_1: "sin(x/3)*cos(y/5)",
      });
      await T.step(1);
      const before = (await T.readState()).data;
      for (let k = 0; k < 2; k++) document.getElementById("interpController").click();
      return (await T.readState()).data != before;
    });
    assert.ok(!changed, `${backend}: the state changed`);
  }
});

test("changing boundary conditions in the GUI acts as loading them would", async () => {
  // The state's lookups beyond the edges switch between wrapping and clamping with the
  // conditions: for the timestep (here, second-order one-sided differences) and for the
  // display (here, plotting u_xx). The display is also the same with 5 species as with 4.
  const base = {
    numSpecies: 4,
    dimension: 1,
    timesteppingScheme: "Euler",
    dt: 0.01,
    spatialStep: 0.25,
    domainScale: 10,
    minX: "0",
    whatToPlot: "u_xx",
    reactionStr_1: "-0.5*u_xb2",
    initCond_1: "x^2/100",
    ...Object.fromEntries(
      [1, 2, 3, 4, 5].flatMap((i) => [
        [`diffusionStr_${i}_${i}`, "0"],
        ...(i > 1 ? [[`reactionStr_${i}`, "0"]] : []),
        [`neumannStr_${i}`, "0"],
      ]),
    ),
  };
  const neumann = Object.fromEntries([1, 2, 3, 4, 5].map((i) => [`boundaryConditions_${i}`, "neumann"]));
  for (const [backend, page] of Object.entries(pages)) {
    const r = await page.evaluate(
      async ([base, neumann]) => {
        const T = window.VisualPDETest;
        const run = async () => {
          await T.step(20);
          await T.render();
          return { state: (await T.readState()).data, post: (await T.readPost()).data };
        };
        await T.load({ ...base, ...neumann });
        const loaded = await run();
        await T.load({ ...base, ...neumann, numSpecies: 5 });
        const five = await run();
        await T.load(base);
        // The boundary condition menus offering periodic, for species 1-4.
        const menus = [...document.querySelectorAll("select")].filter((s) =>
          ["neumann", "periodic"].every((v) => [...s.options].some((o) => o.value == v)),
        );
        for (const menu of menus.slice(0, 4)) {
          menu.value = "neumann";
          menu.dispatchEvent(new Event("change", { bubbles: true }));
        }
        await T.reset();
        const changed = await run();
        return { loaded, five, changed };
      },
      [base, neumann],
    );
    assert.equal(r.changed.state, r.loaded.state, `${backend}: the solution differs`);
    assert.equal(r.changed.post, r.loaded.post, `${backend}: the display differs`);
    // Species 1 only: the post-processed values are its u_xx, at each node.
    const u = (post) => decode(post).filter((_, k) => k % 4 == 0);
    assert.deepEqual(u(r.five.post), u(r.loaded.post), `${backend}: 5 species display differently`);
  }
});

// Sets a dat.GUI controller in the page, by its label, as a user would.
function setControl(label, value) {
  const item = [...document.querySelectorAll("li.cr")].find(
    (li) => li.querySelector(".property-name")?.textContent.trim() == label,
  );
  if (!item) throw new Error(`No controller labelled ${label}`);
  const select = item.querySelector("select");
  if (select) {
    select.value = String(value);
    select.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }
  const input = item.querySelector("input");
  input.focus();
  input.value = String(value);
  for (const type of ["input", "keyup", "change"]) input.dispatchEvent(new Event(type, { bubbles: true }));
  input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", keyCode: 13, which: 13, bubbles: true }));
  input.dispatchEvent(new Event("blur", { bubbles: true }));
  input.blur();
}

// Runs fn(T, setControl, ...args) in each backend's page, returning the results by backend.
async function inBoth(fn, ...args) {
  const results = {};
  for (const [backend, page] of Object.entries(pages)) {
    results[backend] = await page.evaluate(
      async ([fn, setControl, args]) => {
        const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        return eval(`(${fn})`)(window.VisualPDETest, eval(`(${setControl})`), sleep, ...args);
      },
      [fn.toString(), setControl.toString(), args],
    );
  }
  return results;
}

test("a change made while paused is drawn, once WebGPU has built its pipeline", async () => {
  const r = await inBoth(async (T, setControl, sleep) => {
    await T.load({
      numSpecies: 1,
      dimension: 2,
      reactionStr_1: "0",
      diffusionStr_1_1: "0",
      initCond_1: "x/100",
      whatToPlot: "u",
    });
    await T.render();
    setControl("Expression", "1-u");
    // No render requested: the app redraws once the change can be drawn.
    await sleep(1500);
    const post = await T.readPost();
    const state = await T.readState();
    const value = (data) => new Float32Array(Uint8Array.from(atob(data), (c) => c.charCodeAt(0)).buffer)[400];
    return { plotted: value(post.data), u: value(state.data) };
  });
  for (const [backend, { plotted, u }] of Object.entries(r)) {
    assert.ok(Math.abs(plotted - (1 - u)) < 1e-6, `${backend}: plotted ${plotted}, not 1 - ${u}`);
  }
});

test("the probe's chart agrees between backends after changing the probe or resetting", async () => {
  const base = {
    dimension: 2,
    numSpecies: 1,
    reactionStr_1: "0",
    diffusionStr_1_1: "0",
    initCond_1: "0.5",
    whatToPlot: "u",
    dt: 0.01,
    probeLength: 1,
    probeType: "sample",
    probeX: "10",
    probeY: "10",
  };
  const r = await inBoth(async (T, setControl, sleep, base) => {
    // Probing switched on for a probe changed while it was off.
    await T.load({ ...base, probing: true, probeFun: "u" });
    await T.step(5);
    await T.render();
    await sleep(200);
    await T.load({ ...base, probing: false, probeFun: "1000+u" });
    await T.render();
    await sleep(200);
    document.getElementById("probeButton").click();
    await sleep(800);
    const switchedOn = await T.probeData();
    // A reset made just after a change that rebuilds the simulation's pipelines.
    await T.load({ ...base, reactionStr_1: "1", probing: true, probeFun: "u" });
    await T.step(50);
    await T.render();
    await sleep(300);
    setControl("Du", "0.001");
    document.getElementById("erase").click();
    await sleep(1000);
    return { switchedOn, reset: await T.probeData() };
  }, base);
  assert.deepEqual(r.webgpu, r.webgl);
});

test("snapping the colour range uses the current state's range", async () => {
  const r = await inBoth(async (T, setControl, sleep) => {
    await T.load({
      numSpecies: 1,
      dimension: 2,
      reactionStr_1: "1",
      diffusionStr_1_1: "0",
      initCond_1: "x/100",
      whatToPlot: "u",
      dt: 0.01,
      autoSetColourRange: false,
      minColourValue: "0",
      maxColourValue: "1",
    });
    await T.step(300);
    await T.render();
    const button = [...document.querySelectorAll("button")].find(
      (b) => /Snap range/.test(b.textContent) && !b.closest("#probeFolder"),
    );
    button.click();
    await sleep(500);
    return T.colourRange();
  });
  for (const [backend, [min, max]] of Object.entries(r)) {
    // u = x/100 + 3, at nodes from x = 0.25 to 99.75.
    assert.ok(Math.abs(min - 3.0025) < 1e-4 && Math.abs(max - 3.9975) < 1e-4, `${backend}: [${min}, ${max}]`);
  }
});

// Changes an option while paused, as a user would, and returns whether the canvas changed.
async function canvasChanges(page, opts, label, value) {
  await page.evaluate(async (opts) => {
    const T = window.VisualPDETest;
    await T.load(opts);
    await T.render();
    await new Promise((resolve) => setTimeout(resolve, 500));
  }, opts);
  const before = await page.locator("#simCanvas").screenshot();
  await page.evaluate(([setControl, label, value]) => eval(`(${setControl})`)(label, value), [
    setControl.toString(),
    label,
    value,
  ]);
  await page.waitForTimeout(1000);
  const after = await page.locator("#simCanvas").screenshot();
  return !before.equals(after);
}

test("a paused line plot or vector field is redrawn when its options change", async () => {
  const flat = { numSpecies: 1, reactionStr_1: "0", diffusionStr_1_1: "0", initCond_1: "x/100", whatToPlot: "u" };
  for (const [backend, page] of Object.entries(pages)) {
    const line = await canvasChanges(
      page,
      { ...flat, dimension: 1, plotType: "line", autoSetColourRange: false, minColourValue: "0", maxColourValue: "1" },
      "Max value",
      "4",
    );
    assert.ok(line, `${backend}: the line wasn't redrawn for a new colour range`);
    const arrows = await canvasChanges(
      page,
      { ...flat, dimension: 2, vectorField: true, arrowX: "x-50", arrowY: "y-30", arrowScale: "auto", arrowDensity: 0.3 },
      "Scaling",
      "none",
    );
    assert.ok(arrows, `${backend}: the arrows weren't redrawn for a new scaling`);
  }
});
