// Run by webgpu_backend.test.mjs in a child process (a hang starves the event loop, so the
// test can't time it out itself): an older batch of pipeline builds outlives a newer one,
// and whenReady() must wait for both.
globalThis.GPUBufferUsage = new Proxy({}, { get: () => 1 });
globalThis.GPUTextureUsage = new Proxy({}, { get: () => 1 });
globalThis.GPUShaderStage = new Proxy({}, { get: () => 1 });
const { WebGPUBackend } = await import("../../RD/webgpu/webgpu_backend.js");
const stub = () => ({ destroy() {}, createView() { return {}; } });
const device = new Proxy(
  { queue: { writeBuffer() {}, writeTexture() {}, submit() {} }, limits: {} },
  { get: (target, key) => (key in target ? target[key] : () => stub()) },
);
const backend = new WebGPUBackend(device);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let slowDone = false;
backend.requestBuild("simulation", async () => {
  await sleep(200);
  slowDone = true;
  return () => {};
});
await sleep(10);
backend.requestBuild("post", async () => {
  await sleep(20);
  return () => {};
});
await sleep(50);
await backend.whenReady();
console.log(JSON.stringify({ slowDone, compiling: backend.compiling }));
