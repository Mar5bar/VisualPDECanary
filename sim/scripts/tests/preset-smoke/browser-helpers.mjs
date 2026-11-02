/**
 * Shared setup for the tests and tools that drive the simulator through its test hooks
 * (?testHooks) in Chromium.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../..",
);

// ANGLE's Metal backend, so that WebGL and WebGPU both run on the real GPU (headless Chromium
// otherwise gives WebGPU a software adapter that loses its device alongside WebGL).
export const GPU_ARGS = ["--enable-unsafe-webgpu", "--use-angle=metal"];

/**
 * A browser context for the simulator, with the first-visit welcome skipped and its scripts
 * served from the working tree, so never stale.
 */
export async function newSimContext(browser, viewport = { width: 1000, height: 700 }) {
  const context = await browser.newContext({ serviceWorkers: "block", viewport });
  await context.addInitScript(() => {
    try {
      localStorage.setItem("visited", "true");
    } catch {}
  });
  await context.route("**/sim/scripts/**", (route) => {
    const file = path.join(REPO_ROOT, new URL(route.request().url()).pathname);
    route.fulfill({ body: fs.readFileSync(file), contentType: "application/javascript" });
  });
  return context;
}

/** Decodes a Float32Array from the test hooks' base64, or returns null for none. */
export function decodeFloats(base64) {
  if (!base64) return null;
  const bytes = Buffer.from(base64, "base64");
  return new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
}
