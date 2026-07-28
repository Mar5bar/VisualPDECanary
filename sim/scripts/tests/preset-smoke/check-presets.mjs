#!/usr/bin/env node
/**
 * Loads every preset in sim/scripts/RD/presets.js (via ?preset=<name> against a running
 * VisualPDE site) in a single reused browser tab and reports any JS console errors or
 * uncaught exceptions as failures. Complements the node:test unit harness in
 * sim/scripts/tests/ - this exercises the ~250+ DOM/THREE.js/dat.gui-touching functions that
 * harness explicitly can't cover (see the "out of scope" section of its plan), by actually
 * running the app in a real browser instead.
 *
 * If nothing is already listening on BASE_URL, this spawns `bundle exec jekyll serve` itself
 * (from the repo root) and tears it down afterwards; if a server is already running there
 * (e.g. a dev server you started by hand), it's reused as-is and left running.
 */
import { chromium } from "playwright";
import { BASE_URL, ensureServerRunning } from "./server.mjs";

const LOAD_WAIT_MS = 3000;

async function checkPreset(page, name) {
  const messages = [];
  const onConsole = (msg) => {
    if (msg.type() === "error") messages.push(`[console.error] ${msg.text()}`);
  };
  const onPageError = (err) => {
    messages.push(`[uncaught exception] ${err.message}`);
  };
  page.on("console", onConsole);
  page.on("pageerror", onPageError);

  try {
    const url = `${BASE_URL}/sim/?preset=${encodeURIComponent(name)}`;
    await page.goto(url, { waitUntil: "load", timeout: 30000 });
    await page.waitForTimeout(LOAD_WAIT_MS);
  } finally {
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
  }

  return messages;
}

async function main() {
  const { getListOfPresetNames } = await import("../../RD/presets.js");
  const presetNames = getListOfPresetNames();
  console.log(`Checking ${presetNames.length} presets against ${BASE_URL}/sim/ ...\n`);

  const stopServer = await ensureServerRunning();
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const failures = [];
  try {
    for (const [i, name] of presetNames.entries()) {
      const messages = await checkPreset(page, name);
      if (messages.length > 0) {
        failures.push({ name, messages });
        console.log(`[${i + 1}/${presetNames.length}] FAIL  ${name}`);
        for (const msg of messages) console.log(`    ${msg}`);
      } else {
        console.log(`[${i + 1}/${presetNames.length}] ok    ${name}`);
      }
    }
  } finally {
    await browser.close();
    stopServer();
  }

  console.log("");
  console.log(`${presetNames.length - failures.length}/${presetNames.length} presets loaded without console errors.`);
  if (failures.length > 0) {
    console.log(`\n${failures.length} preset(s) failed:`);
    for (const { name, messages } of failures) {
      console.log(`- ${name}`);
      for (const msg of messages) console.log(`    ${msg}`);
    }
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
