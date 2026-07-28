/**
 * Formalizes the manual Playwright verification done for the GlobalInt1-4 feature (see the
 * "Integrals" folder in main.js's initGUI(), getGlobalIntegralComponents/
 * setGlobalIntegralComponent, and parseShaderString/parseStringToTEX's GlobalInt1-4/bare
 * GlobalInt substitution) into a permanent regression test - including the TeX-formatting bug
 * (a raw "*" leaking into the rendered equation instead of being removed) found and fixed
 * earlier this session, which this test would have caught.
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { ensureServerRunning } from "./server.mjs";
import { launchAt, ensureOpen, collectErrors } from "./gui-helpers.mjs";

let browser, page, stopServer, errors;

before(async () => {
  stopServer = await ensureServerRunning();
  browser = await chromium.launch();
  page = await browser.newPage({ viewport: { width: 1400, height: 1200 } });
  errors = collectErrors(page);
  await launchAt(page);
  await ensureOpen(page, "Equations");
  await ensureOpen(page, "Reaction terms");
  await ensureOpen(page, "Integrals");
});

after(async () => {
  await browser.close();
  stopServer();
});

function integrandInput(n) {
  return page.locator("li.cr.string", { hasText: `Integrand ${n}` }).locator("input");
}

test("Integrals folder: default preset's globalIntegralFun ('u;v;0;0') parses into 4 independent fields", async () => {
  assert.equal(await integrandInput(1).inputValue(), "u");
  assert.equal(await integrandInput(2).inputValue(), "v");
  assert.equal(await integrandInput(3).inputValue(), "0");
  assert.equal(await integrandInput(4).inputValue(), "0");
});

test("editing one Integrand field doesn't affect the other 3 (packed-field independence)", async () => {
  await integrandInput(3).fill("u*v");
  await integrandInput(3).blur();
  await page.waitForTimeout(300);
  assert.equal(await integrandInput(1).inputValue(), "u");
  assert.equal(await integrandInput(2).inputValue(), "v");
  assert.equal(await integrandInput(4).inputValue(), "0");
  assert.equal(await integrandInput(3).inputValue(), "u*v");
});

test("GlobalInt3 and bare GlobalInt (backwards-compat for GlobalInt1) in a reaction term render as \\iint_{\\Omega}(...) with no raw '*' left in the typeset equation", async () => {
  const fuInput = page
    .locator("li.title", { hasText: "Reaction terms" })
    .locator("xpath=following-sibling::li[1]//input")
    .first();
  await fuInput.fill("u^2*v - (a+b)*u + 0.001*GlobalInt3 + 0.001*GlobalInt");
  await fuInput.blur();
  await page.waitForTimeout(500);

  const eqText = await page.locator("#equation_display").innerText();
  const iintCount = (eqText.match(/∬/g) || []).length;
  assert.equal(iintCount, 2, "expected one ∬ for GlobalInt3 and one for bare GlobalInt");
  // MathJax renders a raw, un-TeX-ified "*" as the Unicode asterisk operator "∗" (U+2217, not
  // the plain ASCII "*") - checking for both catches the bug regardless of which form leaked.
  assert.ok(
    !eqText.includes("*") && !eqText.includes("∗"),
    "no raw '*' (rendered as '∗') should leak into the typeset equation",
  );
});

test("no console errors or uncaught exceptions occurred across the whole sequence", () => {
  assert.deepEqual(errors, []);
});
