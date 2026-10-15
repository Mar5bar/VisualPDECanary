// webgpu_backend.js
//
// Runs VisualPDE's simulations with WebGPU. It mirrors the WebGL code paths in main.js
// (timestep(), enforceDirichlet(), clearTextures(), getRawState()) so that main.js can
// delegate to it, and keeps the same five history slots in the same rotating order as
// main.js's simTextures: slot 1 is always the current state. Each slot is one rgba32float
// texture per species group.
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
  drawShader,
  BRUSH_VALUES,
  SOURCE_BINDING,
  SAMPLER_BINDING,
  OUTPUT_BINDING,
} from "./sim_wgsl.js";

const NUM_SLOTS = 5;
const STATE_FORMAT = "rgba32float";
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
    // I_S, I_T, and the image the display can be blended with.
    this.images = [this.placeholderImage(), this.placeholderImage(), this.placeholderImage()];
    this.sampler = device.createSampler({
      magFilter: "nearest",
      minFilter: "nearest",
      addressModeU: "clamp-to-edge",
      addressModeV: "clamp-to-edge",
    });
    // Bind group and pipeline layouts, by species group count (see layout()).
    this.layouts = {};
    this.ensureUniformCapacity(64);
    // The domain integrals Int(...), computed on the GPU by WebGPUDisplay.updateGlobals().
    this.globalsBuffer = device.createBuffer({
      label: "globals",
      size: 16,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
    });
    // Named values some kernels read (see values.js), such as the brush's position.
    this.valuesBuffer = device.createBuffer({
      label: "values",
      size: 16 * 16,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
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
    const old = { slots: this.slots, nX: this.nX, nY: this.nY };
    const keep = old.slots.length && numGroups == this.numGroups;
    this.nX = nX;
    this.nY = nY;
    this.numGroups = numGroups;
    this.invalidateBindGroups();
    this.slots = Array.from({ length: NUM_SLOTS }, (_, k) => this.createSlot(`slot ${k}`));
    // As resizeTextures() does on WebGL, interpolate the state onto the new grid, unless the
    // number of species groups has changed (which starts the state afresh on WebGL too).
    if (keep) {
      old.slots.forEach((source, k) =>
        this.resample(source.textures, old.nX, old.nY, this.slots[k], {
          repeat: [1, 1],
          offset: [0, 0],
          linear: true,
          snap: true,
        }),
      );
    }
    this.flush();
    old.slots.forEach((slot) => slot.textures.forEach((t) => t.destroy()));
  }

  // A history slot: one texture per species group, with views for binding.
  createSlot(label) {
    const textures = Array.from({ length: this.numGroups }, (_, g) =>
      this.device.createTexture({
        label: `${label} group ${g}`,
        size: [this.nX, this.nY],
        format: STATE_FORMAT,
        usage:
          GPUTextureUsage.TEXTURE_BINDING |
          GPUTextureUsage.STORAGE_BINDING |
          GPUTextureUsage.COPY_SRC |
          GPUTextureUsage.COPY_DST,
      }),
    );
    return { label, textures, views: textures.map((t) => t.createView()) };
  }

  /** Sets the kinetic parameters' values, in the order of SimShaderParts.paramNames. */
  setParams(values) {
    const data = new Float32Array(Math.max(4, Math.ceil(values.length / 4) * 4));
    data.set(values);
    if (!this.paramsBuffer || this.paramsBuffer.size < data.byteLength) {
      this.paramsBuffer?.destroy();
      this.invalidateBindGroups();
      this.paramsBuffer = this.device.createBuffer({
        label: "params",
        size: data.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      });
    }
    this.device.queue.writeBuffer(this.paramsBuffer, 0, data);
  }

  /**
   * Uploads an image as one of the image inputs (0 for I_S, 1 for I_T, 2 for blending).
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
    this.invalidateBindGroups();
  }

  /** Compiles WGSL, throwing a ShaderCompileError with the compiler's messages if it fails. */
  async compileModule(label, code) {
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
    return module;
  }

  /**
   * The bind group layout (and pipeline layout) of simulation kernels with G species groups.
   * See the bindings in sim_wgsl.js's prelude().
   */
  layout(G) {
    if (this.layouts[G]) return this.layouts[G];
    const visibility = GPUShaderStage.COMPUTE;
    const entries = [
      { binding: 0, visibility, buffer: { type: "uniform", hasDynamicOffset: true } },
      { binding: 1, visibility, buffer: { type: "read-only-storage" } },
      { binding: 2, visibility, texture: { sampleType: "float" } },
      { binding: 3, visibility, texture: { sampleType: "float" } },
      { binding: 4, visibility, sampler: { type: "filtering" } },
      { binding: 5, visibility, buffer: { type: "read-only-storage" } },
      { binding: 6, visibility, buffer: { type: "read-only-storage" } },
    ];
    for (let g = 0; g < G; g++) {
      entries.push({
        binding: SAMPLER_BINDING + g,
        visibility,
        sampler: { type: "non-filtering" },
      });
      for (let slot = 0; slot < 4; slot++) {
        entries.push({
          binding: SOURCE_BINDING + 4 * g + slot,
          visibility,
          texture: { sampleType: "unfilterable-float" },
        });
      }
      entries.push({
        binding: OUTPUT_BINDING + g,
        visibility,
        storageTexture: { access: "write-only", format: STATE_FORMAT },
      });
    }
    const bindGroupLayout = this.device.createBindGroupLayout({ entries });
    this.layouts[G] = {
      bindGroupLayout,
      pipelineLayout: this.device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
    };
    return this.layouts[G];
  }

  /**
   * Compiles a simulation kernel for G species groups and returns it with what dispatch()
   * needs to know about it.
   */
  async compile(label, code, G) {
    const module = await this.compileModule(label, code);
    this.device.pushErrorScope("validation");
    const pipeline = await this.device.createComputePipelineAsync({
      label,
      layout: this.layout(G).pipelineLayout,
      compute: { module, entryPoint: "main" },
    });
    const error = await this.device.popErrorScope();
    if (error) throw new ShaderCompileError(label, [error.message], code);
    return { pipeline, G };
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
    const G = parts.numGroups;
    this.setClamping(parts.clamp);
    this.requestBuild("simulation", async () => {
      const pipelines = {};
      await Promise.all(
        PASS_TYPES.map(async (type) => {
          pipelines[type] = await this.compile(`timestep ${type}`, timestepShader(type, parts), G);
        }),
      );
      return () => Object.assign(this.pipelines, pipelines);
    });
  }

  /** Builds the initial-condition pipeline. */
  setClear(parts) {
    this.requestBuild("clear", async () => {
      const pipeline = await this.compile("clear", clearShader(parts), parts.numGroups);
      return () => (this.pipelines.clear = pipeline);
    });
  }

  /** Builds the brush pipeline. */
  setDraw(parts) {
    this.requestBuild("draw", async () => {
      const pipeline = await this.compile("draw", drawShader(parts), parts.numGroups);
      return () => (this.pipelines.draw = pipeline);
    });
  }

  /** Builds the Dirichlet enforcement pipeline, or removes it if parts is null. */
  setEnforceDirichlet(parts) {
    this.requestBuild("enforce", async () => {
      const pipeline = parts
        ? await this.compile(
            "enforce Dirichlet",
            enforceDirichletShader(parts),
            parts.numGroups,
          )
        : null;
      return () => (this.pipelines.enforce = pipeline);
    });
  }

  ensureUniformCapacity(count) {
    if (count <= this.uniformCapacity) return;
    const capacity = Math.max(count, 2 * this.uniformCapacity);
    this.flush();
    this.uniformBuffer?.destroy();
    this.invalidateBindGroups();
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

  // Forgets cached bind groups, after a resource they bind has been replaced.
  invalidateBindGroups() {
    this.bindGroups = new WeakMap();
  }

  // Records one pass of a kernel (from compile()) writing slot dst from the given input
  // slots.
  dispatch(kernel, uniforms, inputs, dst) {
    const offset = this.pushUniforms(uniforms);
    const sources = [0, 1, 2, 3].map((k) => this.slots[inputs[k] ?? inputs[0]]);
    const target = this.slots[dst];
    // Bind groups are cached by kernel and the slots bound, as creating one per pass is a
    // large part of the CPU's cost per timestep on small grids.
    if (!this.bindGroups) this.invalidateBindGroups();
    let cache = this.bindGroups.get(kernel);
    if (!cache) this.bindGroups.set(kernel, (cache = new Map()));
    const key = [...sources, target].map((slot) => slot.label).join(",");
    let bindGroup = cache.get(key);
    if (!bindGroup) {
      bindGroup = this.createDispatchBindGroup(kernel, sources, target);
      cache.set(key, bindGroup);
    }
    const encoder = this.getEncoder();
    const pass = encoder.beginComputePass();
    pass.setPipeline(kernel.pipeline);
    pass.setBindGroup(0, bindGroup, [offset]);
    pass.dispatchWorkgroups(
      Math.ceil(this.nX / WORKGROUP_SIZE[0]),
      Math.ceil(this.nY / WORKGROUP_SIZE[1]),
    );
    pass.end();
  }

  createDispatchBindGroup(kernel, sources, target) {
    const entries = [
      { binding: 0, resource: { buffer: this.uniformBuffer, size: UNIFORM_STRIDE } },
      { binding: 1, resource: { buffer: this.paramsBuffer } },
      { binding: 2, resource: this.images[0].createView() },
      { binding: 3, resource: this.images[1].createView() },
      { binding: 4, resource: this.sampler },
      { binding: 5, resource: { buffer: this.valuesBuffer } },
      { binding: 6, resource: { buffer: this.globalsBuffer } },
    ];
    for (let g = 0; g < kernel.G; g++) {
      entries.push({ binding: SAMPLER_BINDING + g, resource: this.stateSampler(g) });
      sources.forEach((slot, k) =>
        entries.push({ binding: SOURCE_BINDING + 4 * g + k, resource: slot.views[g] }),
      );
      entries.push({ binding: OUTPUT_BINDING + g, resource: target.views[g] });
    }
    return this.device.createBindGroup({
      layout: this.layout(kernel.G).bindGroupLayout,
      entries,
    });
  }

  /**
   * Sets whether each species group's state is clamped (rather than wrapped) at the edges in
   * x and y, as sim_wgsl.js's SimShaderParts.clamp describes.
   */
  setClamping(clamp) {
    const key = JSON.stringify(clamp);
    if (key == this.clampKey) return;
    this.clampKey = key;
    this.stateSamplers = clamp.map(([cx, cy]) =>
      this.device.createSampler({
        magFilter: "nearest",
        minFilter: "nearest",
        addressModeU: cx ? "clamp-to-edge" : "repeat",
        addressModeV: cy ? "clamp-to-edge" : "repeat",
      }),
    );
    this.invalidateBindGroups();
  }

  stateSampler(g) {
    if (!this.stateSamplers) this.setClamping([[false, false], [false, false]]);
    return this.stateSamplers[g];
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

  /**
   * Applies the brush to every slot, as draw() in main.js does: slot k+1 is drawn on into
   * slot k, then rotated.
   * @param {Object} uniforms
   * @param {Object} brush - brushCoords ([x, y] in texture coordinates) and
   *   brushValueModifier (1 to draw, -1 to erase).
   */
  draw(uniforms, brush) {
    if (!this.pipelines.draw) return;
    this.flush();
    this.device.queue.writeBuffer(this.valuesBuffer, 0, BRUSH_VALUES.pack(brush));
    for (let k = 1; k < NUM_SLOTS; k++) {
      this.dispatch(this.pipelines.draw, uniforms, [k], k - 1);
    }
    this.rotate();
  }

  /** Writes the initial conditions into every slot, as clearTextures() does. */
  clear(uniforms) {
    this.dispatch(this.pipelines.clear, uniforms, [1], 0);
    this.copySlotToOthers(0);
  }

  // Records copying slot `from` into every other slot.
  copySlotToOthers(from) {
    const encoder = this.getEncoder();
    this.slots.forEach((slot, k) => {
      if (k == from) return;
      slot.textures.forEach((texture, g) =>
        encoder.copyTextureToTexture(
          { texture: this.slots[from].textures[g] },
          { texture },
          [this.nX, this.nY],
        ),
      );
    });
  }

  /**
   * Sets every slot to the given state, in readState()'s layout (one RGBA float32 array per
   * species group, row by row from the bottom).
   * @param {Float32Array[]} groups
   */
  writeState(groups) {
    this.flush();
    const empty = new Float32Array(4 * this.nX * this.nY);
    this.slots.forEach((slot) =>
      slot.textures.forEach((texture, g) =>
        this.device.queue.writeTexture(
          { texture },
          groups[g] ?? empty,
          { bytesPerRow: 16 * this.nX },
          [this.nX, this.nY],
        ),
      ),
    );
  }

  /**
   * Sets every slot to a checkpoint, resampled onto the grid as WebGL draws its checkpoint
   * texture: at each node's texture coordinates times repeat plus offset (see
   * setStretchOrCropTexture), clamped at the edges, interpolated bilinearly where the
   * checkpoint is enlarged (if linear is set) and nearest where it's shrunk.
   * @param {Object} checkpoint
   * @param {Float32Array[]} checkpoint.groups - Per species group, RGBA per node.
   * @param {number} checkpoint.width
   * @param {number} checkpoint.height
   * @param {number[]} checkpoint.repeat
   * @param {number[]} checkpoint.offset
   * @param {boolean} checkpoint.linear
   */
  restoreCheckpoint({ groups, width, height, repeat, offset, linear }) {
    const empty = new Float32Array(4 * width * height);
    const sources = Array.from({ length: this.numGroups }, (_, g) => {
      const texture = this.device.createTexture({
        size: [width, height],
        format: STATE_FORMAT,
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
      });
      this.device.queue.writeTexture(
        { texture },
        groups[g] ?? empty,
        { bytesPerRow: 16 * width },
        [width, height],
      );
      return texture;
    });
    // Enlarged in either direction counts as enlarged, as for a texture's LOD.
    const enlarged = linear && (this.nX * repeat[0] > width || this.nY * repeat[1] > height);
    this.resample(sources, width, height, this.slots[0], { repeat, offset, linear: enlarged });
    this.copySlotToOthers(0);
  }

  /**
   * Records resampling state textures (one per species group) of width by height nodes onto
   * the grid, into the target slot: at each node's texture coordinates times repeat plus
   * offset, clamped at the edges, bilinearly if linear is set (snapping weights near texel
   * centres if snap is set, as textureBilinear does), otherwise nearest.
   */
  resample(sources, width, height, target, { repeat, offset, linear, snap = false }) {
    const device = this.device;
    const G = this.numGroups;
    const params = new ArrayBuffer(48);
    new Uint32Array(params, 0, 4).set([width, height, linear ? 1 : 0, snap ? 1 : 0]);
    new Float32Array(params, 16, 4).set([...repeat, ...offset]);
    new Uint32Array(params, 32, 2).set([this.nX, this.nY]);
    const paramsBuffer = device.createBuffer({
      size: 48,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(paramsBuffer, 0, params);
    this.restorePipelines ??= {};
    if (!this.restorePipelines[G]) {
      this.restorePipelines[G] = device.createComputePipeline({
        layout: "auto",
        compute: {
          module: device.createShaderModule({ code: restoreShader(G) }),
          entryPoint: "main",
        },
      });
    }
    const pipeline = this.restorePipelines[G];
    const pass = this.getEncoder().beginComputePass();
    pass.setPipeline(pipeline);
    pass.setBindGroup(
      0,
      device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: paramsBuffer } },
          ...sources.map((texture, g) => ({ binding: 1 + g, resource: texture.createView() })),
          ...target.views.map((view, g) => ({ binding: 3 + g, resource: view })),
        ],
      }),
    );
    pass.dispatchWorkgroups(
      Math.ceil(this.nX / WORKGROUP_SIZE[0]),
      Math.ceil(this.nY / WORKGROUP_SIZE[1]),
    );
    pass.end();
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
    // Rows of a texture copy must be a multiple of 256 bytes apart.
    const rowBytes = 16 * this.nX;
    const bytesPerRow = Math.ceil(rowBytes / 256) * 256;
    const encoder = this.device.createCommandEncoder();
    const stagings = this.slots[1].textures.map((texture) => {
      const staging = this.device.createBuffer({
        size: bytesPerRow * this.nY,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
      });
      encoder.copyTextureToBuffer({ texture }, { buffer: staging, bytesPerRow }, [this.nX, this.nY]);
      return staging;
    });
    this.device.queue.submit([encoder.finish()]);
    return Promise.all(
      stagings.map(async (staging) => {
        await staging.mapAsync(GPUMapMode.READ);
        const padded = new Uint8Array(staging.getMappedRange());
        const out = new Float32Array(4 * this.nX * this.nY);
        const bytes = new Uint8Array(out.buffer);
        for (let j = 0; j < this.nY; j++) {
          bytes.set(padded.subarray(j * bytesPerRow, j * bytesPerRow + rowBytes), j * rowBytes);
        }
        staging.unmap();
        staging.destroy();
        return out;
      }),
    );
  }
}

// Resamples state textures onto the grid (see WebGPUBackend.resample).
function restoreShader(G) {
  const groups = Array.from({ length: G }, (_, g) => g);
  return `
struct Params {
  width: u32, height: u32, linear: u32, snap: u32,
  repeat: vec2f, offset: vec2f,
  nX: u32, nY: u32,
}
@group(0) @binding(0) var<uniform> P: Params;
${groups.map((g) => `@group(0) @binding(${1 + g}) var source${g}: texture_2d<f32>;`).join("\n")}
${groups.map((g) => `@group(0) @binding(${3 + g}) var dst${g}: texture_storage_2d<${STATE_FORMAT}, write>;`).join("\n")}

fn at(g: u32, i: i32, j: i32) -> vec4f {
  let ij = vec2i(clamp(i, 0, i32(P.width) - 1), clamp(j, 0, i32(P.height) - 1));
${groups.map((g) => `  if (g == ${g}u) { return textureLoad(source${g}, ij, 0); }`).join("\n")}
  return vec4f(0.0);
}

fn sample(g: u32, uv: vec2f) -> vec4f {
  let size = vec2f(f32(P.width), f32(P.height));
  if (P.linear != 0u) {
    let st = uv * size - 0.5;
    let base = floor(st);
    var f = st - base;
    if (P.snap != 0u) {
      f = select(f, vec2f(0.0), f < vec2f(1e-4));
      f = select(f, vec2f(1.0), f > vec2f(1.0 - 1e-4));
    }
    let i0 = i32(base.x);
    let j0 = i32(base.y);
    return mix(
      mix(at(g, i0, j0), at(g, i0 + 1, j0), f.x),
      mix(at(g, i0, j0 + 1), at(g, i0 + 1, j0 + 1), f.x),
      f.y
    );
  }
  let ij = vec2i(floor(uv * size));
  return at(g, ij.x, ij.y);
}

@compute @workgroup_size(${WORKGROUP_SIZE.join(", ")})
fn main(@builtin(global_invocation_id) gid: vec3u) {
  if (gid.x >= P.nX || gid.y >= P.nY) { return; }
  let uv = (vec2f(gid.xy) + 0.5) / vec2f(f32(P.nX), f32(P.nY)) * P.repeat + P.offset;
${groups.map((g) => `  textureStore(dst${g}, vec2i(gid.xy), sample(${g}u, uv));`).join("\n")}
}`;
}
