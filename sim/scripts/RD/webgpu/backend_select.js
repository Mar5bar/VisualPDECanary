// backend_select.js
//
// Decides whether the simulator runs on WebGL or WebGPU, and sets up the WebGPU device.
//
// The choice is "webgl", "webgpu" or "auto" (WebGPU if it's available). It comes from, in
// order of precedence: a ?backend= URL parameter (for testing; never written into share
// links), this session's fallback flag (set if WebGPU failed, so a reload doesn't retry it),
// and the Developer tools setting stored in localStorage.

export const BACKEND_STORAGE_KEY = "backend";
const FALLBACK_SESSION_KEY = "backendFallback";

// The default while WebGPU support is being rolled out.
const DEFAULT_CHOICE = "webgl";

function safeStorage(storage, action) {
  try {
    return action(window[storage]);
  } catch {
    return null;
  }
}

/** Returns the user's stored choice: "webgl", "webgpu" or "auto". */
export function storedBackendChoice() {
  const stored = safeStorage("localStorage", (s) => s.getItem(BACKEND_STORAGE_KEY));
  return ["webgl", "webgpu", "auto"].includes(stored) ? stored : DEFAULT_CHOICE;
}

/** Stores the user's choice, which takes effect on the next page load. */
export function storeBackendChoice(choice) {
  safeStorage("localStorage", (s) => s.setItem(BACKEND_STORAGE_KEY, choice));
  safeStorage("sessionStorage", (s) => s.removeItem(FALLBACK_SESSION_KEY));
}

/** Records that WebGPU failed, so that this session sticks to WebGL. */
export function recordWebGPUFailure(reason) {
  safeStorage("sessionStorage", (s) => s.setItem(FALLBACK_SESSION_KEY, String(reason)));
}

/** Why this session fell back to WebGL, if it did. */
export function webGPUFailureReason() {
  return safeStorage("sessionStorage", (s) => s.getItem(FALLBACK_SESSION_KEY));
}

/**
 * Whether to try WebGPU on this page load.
 * @param {URLSearchParams} params
 */
export function shouldTryWebGPU(params) {
  const fromURL = params.get("backend");
  if (fromURL == "webgl") return false;
  if (fromURL == "webgpu" || fromURL == "auto") return true;
  if (webGPUFailureReason()) return false;
  return storedBackendChoice() != "webgl";
}

/**
 * Requests a WebGPU device with the limits the simulator needs, or throws explaining why
 * WebGPU can't be used. Buffer sizes are requested at the adapter's maximum, since they cap
 * the grid size.
 * @returns {Promise<{device: GPUDevice, adapterInfo: Object}>}
 */
export async function createWebGPUDevice() {
  if (!navigator.gpu) throw new Error("This browser doesn't support WebGPU.");
  const adapter = await navigator.gpu.requestAdapter({
    powerPreference: "high-performance",
  });
  if (!adapter) throw new Error("No WebGPU adapter is available.");
  const STORAGE_BUFFERS_NEEDED = 6;
  if (adapter.limits.maxStorageBuffersPerShaderStage < STORAGE_BUFFERS_NEEDED) {
    throw new Error("The WebGPU adapter supports too few storage buffers.");
  }
  const device = await adapter.requestDevice({
    requiredLimits: {
      maxStorageBufferBindingSize: adapter.limits.maxStorageBufferBindingSize,
      maxBufferSize: adapter.limits.maxBufferSize,
      maxStorageBuffersPerShaderStage: STORAGE_BUFFERS_NEEDED,
    },
  });
  const info = adapter.info ?? {};
  return {
    device,
    adapterInfo: {
      vendor: info.vendor,
      architecture: info.architecture,
      description: info.description,
    },
  };
}
