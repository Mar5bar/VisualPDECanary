// webgpu_backend.js
//
// Runs VisualPDE's simulations with WebGPU compute shaders. It mirrors the WebGL code paths
// in main.js (timestep(), enforceDirichlet(), clearTextures(), getRawState()) so that
// main.js can delegate to it, and keeps the same five history slots in the same rotating
// order as main.js's simTextures: slot 1 is always the current state.
//
// Every pass of a frame is recorded into one command encoder and submitted together by
// flush(), which avoids the per-pass overhead of drawing a quad. Each pass reads its uniforms
// (time, seed, ...) from its own entry in a ring buffer, so passes recorded together can use
// different times.

import {
  WORKGROUP_SIZE,
  UNIFORM_STRIDE,
  writeUniforms,
  timestepShader,
  clearShader,
  enforceDirichletShader,
} from "./sim_wgsl.js";

const NUM_SLOTS = 5;
const PASS_TYPES = ["FE", "AB2", "Mid1", "Mid2", "RK41", "RK42", "RK43", "RK44"];

/** Raised for WGSL that fails to compile, with the compiler's messages. */
export class ShaderCompileError extends Error {
  constructor(label, messages, source) {
    super(`WGSL compilation failed for ${label}:\n${messages.join("\n")}`);
    this.messages = messages;
    this.source = source;
  }
}

export class WebGPUBackend {
  /**
   * @param {GPUDevice} device
   */
  constructor(device) {
    this.device = device;
    this.nX = 0;
    this.nY = 0;
    this.numGroups = 1;
    this.slots = [];
    this.pipelines = {};
    this.encoder = null;
    this.compiling = 0;
    // Per kind of pipeline, the number of the latest build requested and its request, if
    // it hasn't started (see requestBuild).
    this.generations = {};
    this.requests = {};
    this.buildScheduled = false;
    // Called with (kind, error) when the latest build of a kind fails.
    this.onBuildError = null;
    this.sources = {};
    this.pending = Promise.resolve();
    this.uniformCapacity = 0;
    this.uniformCount = 0;
    this.uniformData = null;
    this.paramsBuffer = null;
    this.setParams([]);
    this.images = [this.placeholderImage(), this.placeholderImage()];
    this.sampler = device.createSampler({
      magFilter: "nearest",
      minFilter: "nearest",
      addressModeU: "clamp-to-edge",
      addressModeV: "clamp-to-edge",
    });
    this.bindGroupLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: "uniform", hasDynamicOffset: true } },
        { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage" } },
        ...[2, 3, 4, 5].map((binding) => ({
          binding,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "read-only-storage" },
        })),
        { binding: 6, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage" } },
        { binding: 7, visibility: GPUShaderStage.COMPUTE, texture: { sampleType: "float" } },
        { binding: 8, visibility: GPUShaderStage.COMPUTE, texture: { sampleType: "float" } },
        { binding: 9, visibility: GPUShaderStage.COMPUTE, sampler: { type: "filtering" } },
      ],
    });
    this.pipelineLayout = device.createPipelineLayout({
      bindGroupLayouts: [this.bindGroupLayout],
    });
    this.ensureUniformCapacity(64);
  }

  placeholderImage() {
    const texture = this.device.createTexture({
      size: [1, 1],
      format: "rgba8unorm",
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
    this.device.queue.writeTexture({ texture }, new Uint8Array([0, 0, 0, 255]), {}, [1, 1]);
    return texture;
  }

  /**
   * Allocates the history slots for an nX by nY grid with the given number of species
   * groups. The previous contents are discarded.
   */
  resize(nX, nY, numGroups) {
    if (nX == this.nX && nY == this.nY && numGroups == this.numGroups && this.slots.length) {
      return;
    }
    this.flush();
    this.slots.forEach((buffer) => buffer.destroy());
    this.nX = nX;
    this.nY = nY;
    this.numGroups = numGroups;
    const size = nX * nY * numGroups * 16;
    this.slots = Array.from({ length: NUM_SLOTS }, (_, k) =>
      this.device.createBuffer({
        label: `slot ${k}`,
        size,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
      }),
    );
  }

  /** Sets the kinetic parameters' values, in the order of SimShaderParts.paramNames. */
  setParams(values) {
    const data = new Float32Array(Math.max(4, Math.ceil(values.length / 4) * 4));
    data.set(values);
    if (!this.paramsBuffer || this.paramsBuffer.size < data.byteLength) {
      this.paramsBuffer?.destroy();
      this.paramsBuffer = this.device.createBuffer({
        label: "params",
        size: data.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      });
    }
    this.device.queue.writeBuffer(this.paramsBuffer, 0, data);
  }

  /**
   * Uploads an image as one of the two image inputs (0 for I_S, 1 for I_T).
   * @param {number} index
   * @param {ImageBitmapSource} source
   */
  async setImage(index, source) {
    // Decode the raw pixel values, without colour-space conversion or premultiplied alpha,
    // as three.js does for WebGL. Flipped to match three.js's default for textures (flipY),
    // so v = 0 is the image's bottom.
    const bitmap = await createImageBitmap(source, {
      premultiplyAlpha: "none",
      colorSpaceConversion: "none",
      imageOrientation: "flipY",
    });
    const texture = this.device.createTexture({
      size: [bitmap.width, bitmap.height],
      format: "rgba8unorm",
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });
    this.device.queue.copyExternalImageToTexture(
      { source: bitmap },
      { texture, premultipliedAlpha: false },
      [bitmap.width, bitmap.height],
    );
    bitmap.close();
    this.images[index].destroy();
    this.images[index] = texture;
  }

  async compile(label, code) {
    // Kept for debugging (see the test hooks' shaderSources()).
    this.sources[label] = code;
    const module = this.device.createShaderModule({ label, code });
    const info = await module.getCompilationInfo();
    const errors = info.messages.filter((m) => m.type == "error");
    if (errors.length) {
      throw new ShaderCompileError(
        label,
        errors.map((m) => `${m.lineNum}:${m.linePos} ${m.message}`),
        code,
      );
    }
    this.device.pushErrorScope("validation");
    const pipeline = await this.device.createComputePipelineAsync({
      label,
      layout: this.pipelineLayout,
      compute: { module, entryPoint: "main" },
    });
    const error = await this.device.popErrorScope();
    if (error) throw new ShaderCompileError(label, [error.message], code);
    return pipeline;
  }

  // Requests a build of the given kind of pipeline(s). Builds are deferred to the end of the
  // current task, so that a burst of requests (e.g. while a preset loads) only builds the
  // last one, and the backend counts as not ready from the moment one is requested. build is
  // an async function returning a function that installs its result; it's only installed,
  // and its errors only reported (to onBuildError), if it's still the latest of its kind.
  requestBuild(kind, build) {
    const generation = (this.generations[kind] ?? 0) + 1;
    this.generations[kind] = generation;
    this.requests[kind] = { generation, build };
    if (this.buildScheduled) return;
    this.buildScheduled = true;
    this.compiling++;
    this.pending = (async () => {
      await Promise.resolve();
      this.buildScheduled = false;
      const requests = this.requests;
      this.requests = {};
      try {
        await Promise.all(
          Object.entries(requests).map(async ([kind, { generation, build }]) => {
            try {
              const install = await build();
              if (this.generations[kind] == generation) install();
            } catch (error) {
              if (this.generations[kind] == generation) this.onBuildError?.(kind, error);
            }
          }),
        );
      } finally {
        this.compiling--;
      }
    })();
  }

  /** Whether every pipeline needed to run a simulation is built and none are being rebuilt. */
  isReady() {
    return (
      this.compiling == 0 &&
      this.slots.length > 0 &&
      PASS_TYPES.every((type) => this.pipelines[type]) &&
      !!this.pipelines.clear
    );
  }

  /** Resolves once no pipelines are being built. */
  async whenReady() {
    while (this.compiling > 0) await this.pending;
  }

  /**
   * Builds the timestepping pipelines.
   * @param {import("./sim_wgsl.js").SimShaderParts} parts
   */
  setSimulation(parts) {
    this.requestBuild("simulation", async () => {
      const pipelines = {};
      await Promise.all(
        PASS_TYPES.map(async (type) => {
          pipelines[type] = await this.compile(`timestep ${type}`, timestepShader(type, parts));
        }),
      );
      return () => Object.assign(this.pipelines, pipelines);
    });
  }

  /** Builds the initial-condition pipeline. */
  setClear(parts) {
    this.requestBuild("clear", async () => {
      const pipeline = await this.compile("clear", clearShader(parts));
      return () => (this.pipelines.clear = pipeline);
    });
  }

  /** Builds the Dirichlet enforcement pipeline, or removes it if parts is null. */
  setEnforceDirichlet(parts) {
    this.requestBuild("enforce", async () => {
      const pipeline = parts
        ? await this.compile("enforce Dirichlet", enforceDirichletShader(parts))
        : null;
      return () => (this.pipelines.enforce = pipeline);
    });
  }

  ensureUniformCapacity(count) {
    if (count <= this.uniformCapacity) return;
    const capacity = Math.max(count, 2 * this.uniformCapacity);
    this.flush();
    this.uniformBuffer?.destroy();
    this.uniformBuffer = this.device.createBuffer({
      label: "uniforms",
      size: capacity * UNIFORM_STRIDE,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.uniformData = new ArrayBuffer(capacity * UNIFORM_STRIDE);
    this.uniformView = new DataView(this.uniformData);
    this.uniformCapacity = capacity;
    this.uniformCount = 0;
  }

  // Reserves a ring entry for one pass's uniforms and returns its byte offset.
  pushUniforms(values) {
    if (this.uniformCount == this.uniformCapacity) {
      this.flush();
      this.ensureUniformCapacity(2 * this.uniformCapacity);
    }
    const offset = this.uniformCount * UNIFORM_STRIDE;
    writeUniforms(this.uniformView, offset, {
      nX: this.nX,
      nY: this.nY,
      ...values,
    });
    this.uniformCount++;
    return offset;
  }

  getEncoder() {
    if (!this.encoder) this.encoder = this.device.createCommandEncoder();
    return this.encoder;
  }

  // Records one compute pass writing slot dst from the given input slots.
  dispatch(pipeline, uniforms, inputs, dst) {
    const offset = this.pushUniforms(uniforms);
    const sources = [0, 1, 2, 3].map((k) => this.slots[inputs[k] ?? inputs[0]]);
    const bindGroup = this.device.createBindGroup({
      layout: this.bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.uniformBuffer, size: UNIFORM_STRIDE } },
        { binding: 1, resource: { buffer: this.paramsBuffer } },
        ...sources.map((buffer, k) => ({ binding: 2 + k, resource: { buffer } })),
        { binding: 6, resource: { buffer: this.slots[dst] } },
        { binding: 7, resource: this.images[0].createView() },
        { binding: 8, resource: this.images[1].createView() },
        { binding: 9, resource: this.sampler },
      ],
    });
    const pass = this.getEncoder().beginComputePass();
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup, [offset]);
    pass.dispatchWorkgroups(
      Math.ceil(this.nX / WORKGROUP_SIZE[0]),
      Math.ceil(this.nY / WORKGROUP_SIZE[1]),
    );
    pass.end();
  }

  rotate() {
    // As simTextures.rotate(-1): the slot just written becomes slot 1.
    this.slots.unshift(this.slots.pop());
  }

  /**
   * Records one timestep, mirroring timestep() in main.js, and returns the new time.
   * @param {string} scheme - "Euler", "AB2", "Mid" or "RK4".
   * @param {Object} uniforms - The uniforms at the start of the step (t, dt, seed, ...).
   */
  timestep(scheme, uniforms) {
    const p = this.pipelines;
    const { dt } = uniforms;
    let t = uniforms.t;
    const at = (time) => ({ ...uniforms, t: time });
    switch (scheme) {
      case "Euler":
        this.dispatch(p.FE, at(t), [1, 2], 0);
        t += dt;
        break;
      case "AB2":
        this.dispatch(p.AB2, at(t), [1, 2], 0);
        t += dt;
        break;
      case "Mid":
        // Slots as [result, previous, k1].
        this.dispatch(p.Mid1, at(t), [1], 2);
        t += 0.5 * dt;
        this.dispatch(p.Mid2, at(t), [1, 2], 0);
        t += 0.5 * dt;
        break;
      case "RK4":
        // Slots as [result, previous, k1, k2, k3].
        this.dispatch(p.RK41, at(t), [1], 2);
        t += 0.5 * dt;
        this.dispatch(p.RK42, at(t), [1, 2], 3);
        this.dispatch(p.RK43, at(t), [1, undefined, 3], 4);
        t += 0.5 * dt;
        this.dispatch(p.RK44, at(t), [1, 2, 3, 4], 0);
        break;
      default:
        throw new Error("Unknown scheme " + scheme);
    }
    this.rotate();
    return t;
  }

  /** Mirrors enforceDirichlet() in main.js: slot k+1 is enforced into slot k, then rotated. */
  enforceDirichlet(uniforms) {
    if (!this.pipelines.enforce) return;
    for (let k = 1; k < NUM_SLOTS; k++) {
      this.dispatch(this.pipelines.enforce, uniforms, [k], k - 1);
    }
    this.rotate();
  }

  /** Writes the initial conditions into every slot, as clearTextures() does. */
  clear(uniforms) {
    this.dispatch(this.pipelines.clear, uniforms, [1], 0);
    const encoder = this.getEncoder();
    for (let k = 1; k < NUM_SLOTS; k++) {
      encoder.copyBufferToBuffer(this.slots[0], 0, this.slots[k], 0, this.slots[0].size);
    }
  }

  /**
   * Sets every slot to the given state, in readState()'s layout (one RGBA float32 array per
   * species group, row by row from the bottom).
   * @param {Float32Array[]} groups
   */
  writeState(groups) {
    this.flush();
    const N = this.nX * this.nY;
    const G = this.numGroups;
    const interleaved = new Float32Array(4 * N * G);
    for (let g = 0; g < G; g++) {
      if (!groups[g]) continue;
      for (let n = 0; n < N; n++) {
        interleaved.set(groups[g].subarray(4 * n, 4 * n + 4), 4 * (n * G + g));
      }
    }
    this.slots.forEach((slot) => this.device.queue.writeBuffer(slot, 0, interleaved));
  }

  /** Submits everything recorded since the last flush. */
  flush() {
    if (!this.encoder && !this.uniformCount) return;
    if (this.uniformCount) {
      this.device.queue.writeBuffer(
        this.uniformBuffer,
        0,
        this.uniformData,
        0,
        this.uniformCount * UNIFORM_STRIDE,
      );
    }
    if (this.encoder) this.device.queue.submit([this.encoder.finish()]);
    this.encoder = null;
    this.uniformCount = 0;
  }

  /**
   * Reads the current state (slot 1), in the same layout as WebGL's getRawState(): one
   * RGBA float32 array per species group, row by row from the bottom.
   * @returns {Promise<Float32Array[]>}
   */
  async readState() {
    this.flush();
    const size = this.slots[1].size;
    const staging = this.device.createBuffer({
      size,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });
    const encoder = this.device.createCommandEncoder();
    encoder.copyBufferToBuffer(this.slots[1], 0, staging, 0, size);
    this.device.queue.submit([encoder.finish()]);
    await staging.mapAsync(GPUMapMode.READ);
    const interleaved = new Float32Array(staging.getMappedRange().slice(0));
    staging.unmap();
    staging.destroy();
    const N = this.nX * this.nY;
    const G = this.numGroups;
    return Array.from({ length: G }, (_, g) => {
      const out = new Float32Array(4 * N);
      for (let n = 0; n < N; n++) {
        out.set(interleaved.subarray(4 * (n * G + g), 4 * (n * G + g) + 4), 4 * n);
      }
      return out;
    });
  }
}
