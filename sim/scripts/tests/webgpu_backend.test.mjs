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

test("WebGPUBackend: if only the blocked timestep kernel fails to build, steps are unblocked", async () => {
  globalThis.GPUBufferUsage ??= new Proxy({}, { get: () => 1 });
  globalThis.GPUTextureUsage ??= new Proxy({}, { get: () => 1 });
  globalThis.GPUShaderStage ??= new Proxy({}, { get: () => 1 });
  const { WebGPUBackend } = await import("../RD/webgpu/webgpu_backend.js");
  const stub = () => ({ destroy() {}, createView() { return {}; } });
  const device = new Proxy(
    {
      queue: { writeBuffer() {}, writeTexture() {}, submit() {} },
      limits: { maxComputeWorkgroupStorageSize: 32768 },
    },
    { get: (target, key) => (key in target ? target[key] : () => stub()) },
  );
  const backend = new WebGPUBackend(device);
  const compiled = [];
  backend.compile = async (label, code, formats) => {
    if (label.includes("blocked")) throw new Error("too many registers");
    compiled.push(label);
    return { pipeline: { label }, formats, G: formats.length };
  };
  const errors = [];
  backend.onBuildError = (kind, error) => errors.push(kind);
  backend.setSimulation({
    numGroups: 1,
    formats: ["r32float"],
    clamp: [[true, false]],
    paramNames: [],
    minX: "0.0",
    minY: "0.0",
    twoD: false,
    timescales: "vec4(1.0, 1.0, 1.0, 1.0)",
    timescalesGroup1: "vec4(1.0, 1.0, 1.0, 1.0)",
    bot: Object.fromEntries(["FE", "AB2", "Mid1", "Mid2", "RK41", "RK42", "RK43", "RK44"].map((t) => [t, ""])),
    middle: "float LDuuU = (uvwqR.r+uvwqL.r-2.0*uvwq.r)/(dx*dx); result = vec4(LDuuU, 0.0, 0.0, 0.0); }",
  });
  await backend.whenReady();
  assert.deepEqual(errors, []);
  assert.ok(!backend.failedBuilds.has("simulation"));
  assert.ok(backend.pipelines.FE);
  assert.equal(backend.pipelines.FEBlocked, null);
});

test("WebGPUBackend.setParams submits work already recorded before writing new values", async () => {
  globalThis.GPUBufferUsage ??= new Proxy({}, { get: () => 1 });
  globalThis.GPUTextureUsage ??= new Proxy({}, { get: () => 1 });
  globalThis.GPUShaderStage ??= new Proxy({}, { get: () => 1 });
  const { WebGPUBackend } = await import("../RD/webgpu/webgpu_backend.js");
  const log = [];
  const stub = (label) => ({ label, destroy() {}, createView() { return {}; }, size: 16 });
  const device = new Proxy(
    {
      queue: {
        writeBuffer: (buffer) => log.push(`write ${buffer.label}`),
        writeTexture() {},
        submit: () => log.push("submit"),
      },
      limits: {},
      createBuffer: ({ label }) => stub(label),
      createCommandEncoder: () => ({ finish: () => ({}) }),
    },
    { get: (target, key) => (key in target ? target[key] : () => stub()) },
  );
  const backend = new WebGPUBackend(device);
  backend.getEncoder(); // Stands for passes recorded with the current parameters.
  log.length = 0;
  backend.setParams([1, 2]);
  assert.deepEqual(log, ["submit", "write params"]);
});

test("WebGPUBackend.compile reports a pipeline that can't be created, without error scopes", async () => {
  globalThis.GPUBufferUsage ??= new Proxy({}, { get: () => 1 });
  globalThis.GPUTextureUsage ??= new Proxy({}, { get: () => 1 });
  globalThis.GPUShaderStage ??= new Proxy({}, { get: () => 1 });
  const { WebGPUBackend } = await import("../RD/webgpu/webgpu_backend.js");
  const stub = () => ({ destroy() {}, createView() { return {}; } });
  let scopes = 0;
  const device = new Proxy(
    {
      queue: { writeBuffer() {}, writeTexture() {}, submit() {} },
      limits: {},
      createShaderModule: () => ({ getCompilationInfo: async () => ({ messages: [] }) }),
      createComputePipelineAsync: async () => {
        throw new Error("workgroup storage exceeds the limit");
      },
      pushErrorScope: () => scopes++,
      popErrorScope: async () => (scopes--, null),
    },
    { get: (target, key) => (key in target ? target[key] : () => stub()) },
  );
  const backend = new WebGPUBackend(device);
  await assert.rejects(backend.compile("test", "", ["r32float"]), /workgroup storage exceeds the limit/);
  assert.equal(scopes, 0);
});
