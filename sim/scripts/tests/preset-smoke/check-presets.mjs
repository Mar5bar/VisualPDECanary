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
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../../..");
const BASE_URL = process.env.BASE_URL ?? "http://localhost:4000";
const LOAD_WAIT_MS = 3000;
const SERVER_READY_TIMEOUT_MS = 60000;

async function isServerUp() {
  try {
    const res = await fetch(BASE_URL + "/sim/");
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForServer(timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isServerUp()) return true;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

/**
 * Starts `bundle exec jekyll serve` in the background if BASE_URL isn't already reachable.
 * Returns a cleanup function - a no-op if we didn't start anything (an already-running server,
 * possibly started by hand outside this script, is left alone).
 */
async function ensureServerRunning() {
  if (await isServerUp()) {
    console.log(`Found an existing server at ${BASE_URL} - reusing it.`);
    return () => {};
  }

  console.log(`No server found at ${BASE_URL} - starting "bundle exec jekyll serve"...`);
  const child = spawn("bundle", ["exec", "jekyll", "serve", "--no-watch"], {
    cwd: REPO_ROOT,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", (d) => (output += d));
  child.stderr.on("data", (d) => (output += d));

  const up = await waitForServer(SERVER_READY_TIMEOUT_MS);
  if (!up) {
    child.kill();
    throw new Error(
      `jekyll serve did not become ready at ${BASE_URL} within ${SERVER_READY_TIMEOUT_MS}ms. Output:\n${output}`,
    );
  }
  console.log("jekyll serve is up.");
  return () => child.kill();
}

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
