import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

test("WebGPUBackend.whenReady waits for every batch of builds, without spinning", () => {
  const script = fileURLToPath(new URL("./fixtures/webgpu_build_batches.mjs", import.meta.url));
  const result = spawnSync(process.execPath, [script], { timeout: 5000, encoding: "utf8" });
  assert.equal(result.signal, null, "whenReady() didn't return (timed out)");
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { slowDone: true, compiling: 0 });
});
