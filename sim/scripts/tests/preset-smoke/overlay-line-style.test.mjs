/**
 * The overlay's line styles on line plots, on both backends: that each style is drawn as it
 * should be (measured from the pixels of a horizontal overlay), and that it survives every
 * way a simulation reaches the page or changes - starting up from a link, a ?preset= link
 * or a reload, switching backend, Views, plot types, thickness, resizing and running -
 * without errors.
 *
 * Usage: node --test overlay-line-style.test.mjs
 */
import { test, before, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { ensureServerRunning, BASE_URL } from "./server.mjs";
import { encodeOptions } from "../../RD/url_codec.js";
import { getResolvedPreset, getFieldsInView } from "../../RD/presets.js";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const BACKENDS = ["webgl", "webgpu"];
const STYLES = ["solid", "dotted", "dashed", "looselyDashed"];

// The length of each style's pattern (dash and gap) relative to the line's thickness, and the
// fraction of the line covered along its centre (round ends included), as main.js sets them.
const EXPECTED = {
  dotted: { period: 2.5, coverage: 2 / 5 },
  dashed: { period: 8, coverage: 10 / 16 },
  looselyDashed: { period: 12, coverage: 10 / 24 },
};

let browser, stopServer;
// The contexts the current test has opened, closed after it whether or not it passes, so that
// no simulation is left running to slow down (or, on WebGPU, starve) the tests that follow.
const contexts = new Set();

before(async () => {
  stopServer = await ensureServerRunning();
  // ANGLE's Metal backend, so that WebGL and WebGPU both run on the real GPU.
  browser = await chromium.launch({ args: ["--enable-unsafe-webgpu", "--use-angle=metal"] });
});

afterEach(async () => {
  await Promise.all([...contexts].map((context) => context.close()));
  contexts.clear();
});

after(async () => {
  await browser?.close();
  stopServer?.();
});

// A line plot with a red, horizontal overlay below a flat solution, so that the overlay's
// pixels can be picked out and measured.
function lineOptions(overrides = {}) {
  return {
    dimension: 1,
    oneDimensional: true,
    plotType: "line",
    numSpecies: 2,
    initCond_1: "1",
    initCond_2: "0",
    reactionStr_1: "0",
    reactionStr_2: "0",
    autoSetColourRange: false,
    minColourValue: -1.5,
    maxColourValue: 1.5,
    colourmap: "viridis",
    overlay: true,
    overlayExpr: "-1",
    overlayColour: 0xff0000,
    overlayLineWidthMul: 1,
    ...overrides,
  };
}

// A share link for the given options on top of the default preset, as the app makes them.
function linkTo(opts, views) {
  const options = { ...getResolvedPreset("default"), ...opts };
  const fields = getFieldsInView();
  const fromTop = () =>
    Object.fromEntries(fields.filter((k) => k in options).map((k) => [k, options[k]]));
  options.views = (views ?? [{ name: "1" }]).map((view) => ({ ...fromTop(), ...view }));
  options.activeViewInd = 0;
  return "#options=" + encodeOptions(JSON.parse(JSON.stringify(options)));
}

// Opens the simulator on a backend, at the given hash and query, recording any errors.
async function open(backend, { hash = "", query = "", viewport } = {}) {
  const context = await browser.newContext({
    serviceWorkers: "block",
    viewport: viewport ?? { width: 1000, height: 700 },
  });
  contexts.add(context);
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
  page.errors = [];
  page.on("console", (m) => m.type() == "error" && page.errors.push(m.text()));
  page.on("pageerror", (e) => page.errors.push(String(e)));
  await page.goto(`${BASE_URL}/sim/?testHooks&noop&backend=${backend}${query}${hash}`, {
    waitUntil: "load",
  });
  await ready(page, backend);
  return page;
}

// Closes a page's context early, within a test that opens several in turn.
async function close(page) {
  contexts.delete(page.context());
  await page.context().close();
}

async function ready(page, backend) {
  // Stop waiting as soon as anything goes wrong, which may stop the page starting at all
  // (and may only be logged, as for an unhandled rejection).
  const deadline = Date.now() + 30000;
  while (!(await page.evaluate(() => !!window.VisualPDETest))) {
    if (page.errors.length)
      assert.fail(`the page failed while starting:\n${page.errors.join("\n")}`);
    if (Date.now() > deadline) assert.fail("the page didn't start within 30 s");
    await page.waitForTimeout(100);
  }
  assert.equal(await page.evaluate(() => window.VisualPDETest.backend), backend);
  await settle(page);
}

async function settle(page) {
  await page.evaluate(() => window.VisualPDETest.render());
  await page.waitForTimeout(300);
}

// Asserts that nothing has gone wrong: no errors in the console, and none that the app has
// shown its users (which aren't all logged).
async function assertNoErrors(page, label) {
  assert.deepEqual(page.errors, [], label);
  assert.equal(await page.evaluate(() => window.VisualPDETest.errorMessage()), "", label);
}

const styleSelect = (page) => page.locator("#overlayFolder select");

async function chooseStyle(page, style) {
  await styleSelect(page).selectOption(style, { force: true });
  await settle(page);
}

/**
 * Measures the red overlay in a screenshot of the canvas, along the row through the middle of
 * the line: the fraction of the central 60% of the width it covers, the number of separate
 * runs there, and the line's thickness, in pixels.
 */
async function measure(page) {
  const png = (await page.locator("#simCanvas").screenshot()).toString("base64");
  return page.evaluate(async (png) => {
    const image = new Image();
    image.src = "data:image/png;base64," + png;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0);
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    const red = (x, y) => {
      const i = 4 * (y * canvas.width + x);
      return data[i] > 180 && data[i + 1] < 90 && data[i + 2] < 90;
    };
    const x0 = Math.round(0.2 * canvas.width);
    const x1 = Math.round(0.8 * canvas.width);
    // The rows the line covers, and so its middle.
    const rows = [];
    for (let y = 0; y < canvas.height; y++) {
      for (let x = x0; x < x1; x++) {
        if (red(x, y)) {
          rows.push(y);
          break;
        }
      }
    }
    if (!rows.length) return { coverage: 0, runs: 0, thickness: 0 };
    const middle = Math.round((rows[0] + rows[rows.length - 1]) / 2);
    let covered = 0;
    let runs = 0;
    for (let x = x0; x < x1; x++) {
      if (red(x, middle)) {
        covered++;
        if (x == x0 || !red(x - 1, middle)) runs++;
      }
    }
    return {
      coverage: covered / (x1 - x0),
      runs,
      thickness: rows[rows.length - 1] - rows[0] + 1,
      width: x1 - x0,
    };
  }, png);
}

// Asserts that the overlay is drawn in the given style.
async function assertStyle(page, style, label) {
  const m = await measure(page);
  label = `${label}: ${style}, measured ${JSON.stringify(m)}`;
  assert.ok(m.thickness > 2, `no overlay drawn (${label})`);
  if (style == "solid" || !(style in EXPECTED)) {
    assert.ok(m.coverage > 0.97 && m.runs == 1, label);
    return;
  }
  const { period, coverage } = EXPECTED[style];
  assert.ok(Math.abs(m.coverage - coverage) < 0.1, `coverage (${label})`);
  const measuredPeriod = m.width / m.runs / m.thickness;
  assert.ok(
    Math.abs(measuredPeriod / period - 1) < 0.25,
    `period of ${measuredPeriod.toFixed(2)} thicknesses, not ${period} (${label})`,
  );
}

for (const backend of BACKENDS) {
  test(`${backend}: each style starts up from a link, drawn as it should be`, async () => {
    for (const style of STYLES) {
      const page = await open(backend, { hash: linkTo(lineOptions({ overlayLineStyle: style })) });
      await assertStyle(page, style, "link");
      assert.equal(await styleSelect(page).inputValue(), style);
      await assertNoErrors(page, style);
      await close(page);
    }
  });

  test(`${backend}: starts up on a ?preset= link with a style given`, async () => {
    const page = await open(backend, {
      query: "&preset=heatEquation1DValidity&overlayLineStyle=dashed",
    });
    assert.equal(await styleSelect(page).inputValue(), "dashed");
    await assertNoErrors(page);
  });

  test(`${backend}: an unknown style from a link is drawn solid`, async () => {
    const page = await open(backend, { hash: linkTo(lineOptions({ overlayLineStyle: "wavy" })) });
    await assertStyle(page, "solid", "unknown style");
    await assertNoErrors(page);
  });

  test(`${backend}: a link from before line styles is drawn solid`, async () => {
    // Line styles were added after v1 links were frozen, so older links don't mention them.
    const page = await open(backend, { hash: linkTo(lineOptions()) });
    await assertStyle(page, "solid", "old link");
    await assertNoErrors(page);
  });

  test(`${backend}: switching backend keeps the style`, async () => {
    const other = BACKENDS.find((b) => b != backend);
    const page = await open(backend, {
      hash: linkTo(lineOptions({ overlayLineStyle: "dashed" })),
    });
    // As the WebGPU toggle in the Developer tools does.
    await Promise.all([
      page.waitForEvent("load"),
      page.evaluate(() =>
        [...document.querySelectorAll(".toggle_button")]
          .find((b) => b.innerHTML.includes("WebGPU"))
          .click(),
      ),
    ]);
    await ready(page, other);
    assert.equal(await styleSelect(page).inputValue(), "dashed");
    await assertStyle(page, "dashed", `after switching to ${other}`);
    await assertNoErrors(page);
  });

  test(`${backend}: a reload, and the link the URL is synced to, keep the style`, async () => {
    const page = await open(backend, { hash: linkTo(lineOptions()) });
    // Interacting starts the URL syncing.
    await page.keyboard.press("Shift");
    await chooseStyle(page, "looselyDashed");
    await page.waitForFunction(() => location.hash.startsWith("#options="));
    await page.waitForTimeout(600);
    const synced = page.url();
    await page.reload({ waitUntil: "load" });
    await ready(page, backend);
    await assertStyle(page, "looselyDashed", "after reload");
    const fresh = await open(backend, { hash: new URL(synced).hash });
    await assertStyle(fresh, "looselyDashed", "synced link");
    await assertNoErrors(page);
    await assertNoErrors(fresh);
  });

  test(`${backend}: changing the style, thickness and overlay in the GUI`, async () => {
    const page = await open(backend, { hash: linkTo(lineOptions()) });
    for (const style of [...STYLES, "solid", "dashed"]) {
      await chooseStyle(page, style);
      await assertStyle(page, style, "chosen in the GUI");
    }
    // The dashes scale with the thickness.
    const thin = await measure(page);
    await page.evaluate(() => {
      const input = [...document.querySelectorAll("#overlayFolder li")]
        .find((li) => li.textContent.includes("Thickness"))
        .querySelector("input");
      input.value = "2";
      input.dispatchEvent(new Event("change"));
    });
    await settle(page);
    const thick = await measure(page);
    assert.ok(thick.thickness > 1.6 * thin.thickness, JSON.stringify({ thin, thick }));
    await assertStyle(page, "dashed", "thicker");
    // Turning the overlay off and on again.
    for (let i = 0; i < 2; i++) {
      await page.evaluate(() =>
        [...document.querySelectorAll("#overlayFolder .toggle_button")]
          .find((b) => b.textContent.includes("Enable"))
          .click(),
      );
      await settle(page);
    }
    await assertStyle(page, "dashed", "overlay toggled off and on");
    await assertNoErrors(page);
  });

  test(`${backend}: other plot types hide the style, and keep it for line plots`, async () => {
    const page = await open(backend, {
      hash: linkTo(lineOptions({ overlayLineStyle: "dotted", dimension: 2, oneDimensional: false })),
    });
    const plotType = page.locator("select:has(option[value=surface])");
    for (const type of ["plane", "surface", "line"]) {
      await plotType.selectOption(type, { force: true });
      await settle(page);
      assert.equal(
        await page.evaluate(() => {
          const li = document.querySelector("#overlayFolder select").closest("li");
          return getComputedStyle(li).display != "none";
        }),
        type == "line",
        type,
      );
    }
    await assertStyle(page, "dotted", "back to a line plot");
    await assertNoErrors(page);
  });

  test(`${backend}: Views keep their own styles`, async () => {
    const page = await open(backend, {
      hash: linkTo(lineOptions({ overlayLineStyle: "dashed" }), [
        { name: "1" },
        { name: "2", overlayLineStyle: "dotted" },
        { name: "3", overlayLineStyle: "solid" },
      ]),
    });
    for (const [index, style] of [[1, "dotted"], [2, "solid"], [0, "dashed"], [1, "dotted"]]) {
      await page.evaluate((i) => document.querySelectorAll("#views_list a")[i].click(), index);
      await settle(page);
      assert.equal(await styleSelect(page).inputValue(), style);
      await assertStyle(page, style, `view ${index + 1}`);
    }
    await assertNoErrors(page);
  });

  test(`${backend}: resizing and running keep the dashes`, async () => {
    const page = await open(backend, {
      hash: linkTo(lineOptions({ overlayLineStyle: "dashed" })),
    });
    for (const size of [{ width: 600, height: 900 }, { width: 1400, height: 500 }]) {
      await page.setViewportSize(size);
      await page.waitForTimeout(500);
      await settle(page);
      await assertStyle(page, "dashed", `resized to ${size.width}x${size.height}`);
    }
    await page.evaluate(() => window.VisualPDETest.step(50));
    await settle(page);
    await assertStyle(page, "dashed", "after running");
    await assertNoErrors(page);
  });

  test(`${backend}: more than four species`, async () => {
    const page = await open(backend, {
      hash: linkTo(
        lineOptions({
          numSpecies: 5,
          overlayLineStyle: "dashed",
          initCond_5: "1",
        }),
      ),
    });
    await assertStyle(page, "dashed", "five species");
    await assertNoErrors(page);
  });
}

test("both backends draw each style alike", async () => {
  for (const style of STYLES) {
    const measured = [];
    for (const backend of BACKENDS) {
      const page = await open(backend, { hash: linkTo(lineOptions({ overlayLineStyle: style })) });
      measured.push(await measure(page));
      await close(page);
    }
    const [a, b] = measured;
    assert.ok(Math.abs(a.coverage - b.coverage) < 0.03, `${style}: ${JSON.stringify(measured)}`);
    assert.ok(Math.abs(a.runs - b.runs) <= 1, `${style}: ${JSON.stringify(measured)}`);
  }
});
