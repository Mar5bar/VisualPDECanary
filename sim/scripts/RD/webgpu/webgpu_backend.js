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
  stateFormats,
  blockingPlan,
  blockedTimestepShader,
} from "./sim_wgsl.js";

const NUM_SLOTS = 5;
// The format of checkpoints' textures, before they're resampled into the state's.
const CHECKPOINT_FORMAT = "rgba32float";
// Bytes per node of each state format.
const FORMAT_BYTES = { r32float: 4, rg32float: 8, rgba32float: 16 };
const PASS_TYPES = ["FE", "AB2", "Mid1", "Mid2", "RK41", "RK42", "RK43", "RK44"];
// The builds the simulation can't run without, as they'd leave it running old code: a
// simulation whose timestepping, initial conditions or Dirichlet conditions failed to build
// doesn't run, as on WebGL.
const SIMULATION_BUILDS = ["simulation", "clear", "enforce"];

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
    this.formats = stateFormats(1);
    // Forward Euler steps requested but not yet recorded, which settle() records, blocked
    // where possible (see sim_wgsl.js's blockedTimestepShader).
    this.pendingSteps = [];
    // Whether to block Forward Euler steps when the simulation allows it.
    this.blocking = true;
    this.slots = [];
    this.pipelines = {};
    this.encoder = null;
    this.compiling = 0;
    // Per kind of pipeline, the number of the latest build requested and its request, if
    // it hasn't started (see requestBuild).
    this.generations = {};
    this.requests = {};
    this.buildScheduled = false;
    // The kinds whose latest build failed.
    this.failedBuilds = new Set();
    // The kinds whose latest build hasn't finished.
    this.building = new Set();
    // Called after a batch of builds has installed something (e.g. to draw with it).
    this.onInstalled = null;
    // Resources to destroy once the work recorded so far is submitted (see release).
    this.releases = [];
    // Called with (kind, error) when the latest build of a kind fails.
    this.onBuildError = null;
    this.sources = {};
    // The batches of builds under way (see requestBuild).
    this.batches = new Set();
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

  // The history slots. Reading them first records any pending steps, so that nothing sees
  // the state from before steps that have been requested.
  get slots() {
    this.settle();
    return this.slotList;
  }

  set slots(slots) {
    this.slotList = slots;
  }

  /**
   * Records the pending Forward Euler steps: as many as possible in temporally blocked
   * passes, and the rest, always including the last, one per pass. Taking the last step on
   * its own leaves slot 2 holding the state one step before the end, exactly as unblocked
   * steps do, which AB2 reads if the scheme is changed.
   */
  settle() {
    if (!this.pendingSteps?.length) return;
    const steps = this.pendingSteps;
    this.pendingSteps = [];
    const blocked = this.pipelines.FEBlocked;
    const K = blocked?.plan.steps ?? Infinity;
    // Steps can share a pass only if just their time and seed differ.
    const key = ({ t, seed, ...rest }) => JSON.stringify(rest);
    let k = 0;
    while (k < steps.length) {
      const group = steps.slice(k, k + K);
      if (
        group.length == K &&
        k + K < steps.length &&
        this.canBlock() &&
        group.every((u) => key(u) == key(group[0]))
      ) {
        this.dispatch(
          blocked,
          { ...group[0], stepT: group.map((u) => u.t), stepSeed: group.map((u) => u.seed) },
          [1],
          0,
        );
        k += K;
      } else {
        this.dispatch(this.pipelines.FE, steps[k], [1, 2], 0);
        k++;
      }
      this.rotate();
    }
  }

  // Whether Forward Euler steps can currently be blocked.
  canBlock() {
    const kernel = this.pipelines.FEBlocked;
    return this.blocking && this.fitsState(kernel) && this.nY == 1;
  }

  /**
   * Allocates the history slots for an nX by nY grid with the given number of species.
   */
  resize(nX, nY, numSpecies) {
    this.settle();
    const formats = stateFormats(numSpecies);
    if (
      nX == this.nX &&
      nY == this.nY &&
      formats.join() == this.formats.join() &&
      this.slots.length
    ) {
      return;
    }
    const old = { slots: this.slots, nX: this.nX, nY: this.nY };
    const keep = old.slots.length && formats.length == this.numGroups;
    this.nX = nX;
    this.nY = nY;
    this.formats = formats;
    this.numGroups = formats.length;
    this.invalidateBindGroups();
    this.slots = Array.from({ length: NUM_SLOTS }, (_, k) => this.createSlot(`slot ${k}`));
    // As resizeTextures() does on WebGL, interpolate the state onto the new grid, unless the
    // number of species groups has changed (which starts the state afresh on WebGL too).
    // Interpolation near the edges wraps or clamps as the WebGL textures do, as the
    // simulation clamps each group (see setClamping).
    if (keep) {
      const clamp = Array.from({ length: this.numGroups }, (_, g) => this.clamp?.[g] ?? [false, false]);
      old.slots.forEach((source, k) =>
        this.resample(source.textures, old.nX, old.nY, this.slots[k], {
          repeat: [1, 1],
          offset: [0, 0],
          linear: true,
          snap: true,
          clamp,
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
        format: this.formats[g],
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
    // Work already recorded is submitted first, so it uses the values it was recorded with,
    // as on WebGL (writeBuffer would otherwise land before it, and growing the buffer would
    // destroy one it binds).
    this.flush();
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
    // Decoding is asynchronous, so calls (e.g. a webcam's frames) can finish out of order:
    // only the latest call for an image is installed.
    this.imageRequests ??= [];
    const request = (this.imageRequests[index] = (this.imageRequests[index] ?? 0) + 1);
    // Decode the raw pixel values, without colour-space conversion or premultiplied alpha,
    // as three.js does for WebGL. Flipped to match three.js's default for textures (flipY),
    // so v = 0 is the image's bottom.
    let bitmap = await createImageBitmap(source, {
      premultiplyAlpha: "none",
      colorSpaceConversion: "none",
      imageOrientation: "flipY",
    });
    // As three.js does, scale an image too large for a texture down to fit.
    const max = this.device.limits.maxTextureDimension2D;
    if (Math.max(bitmap.width, bitmap.height) > max) {
      const scale = max / Math.max(bitmap.width, bitmap.height);
      const large = bitmap;
      bitmap = await createImageBitmap(large, {
        premultiplyAlpha: "none",
        colorSpaceConversion: "none",
        resizeWidth: Math.max(1, Math.floor(large.width * scale)),
        resizeHeight: Math.max(1, Math.floor(large.height * scale)),
        resizeQuality: "high",
      });
      large.close();
    }
    if (this.imageRequests[index] != request) {
      bitmap.close();
      return;
    }
    // Work recorded before now uses the previous image.
    this.flush();
    let texture = this.images[index];
    // An image of the same size (e.g. the webcam's next frame) reuses the texture.
    if (texture.width != bitmap.width || texture.height != bitmap.height) {
      texture = this.device.createTexture({
        size: [bitmap.width, bitmap.height],
        format: "rgba8unorm",
        usage:
          GPUTextureUsage.TEXTURE_BINDING |
          GPUTextureUsage.COPY_DST |
          GPUTextureUsage.RENDER_ATTACHMENT,
      });
      this.images[index].destroy();
      this.images[index] = texture;
      this.invalidateBindGroups();
    }
    this.device.queue.copyExternalImageToTexture(
      { source: bitmap },
      { texture, premultipliedAlpha: false },
      [bitmap.width, bitmap.height],
    );
    bitmap.close();
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
   * The bind group layout (and pipeline layout) of simulation kernels writing state of the
   * given formats (one per species group). See the bindings in sim_wgsl.js's prelude().
   */
  layout(formats) {
    const key = formats.join();
    if (this.layouts[key]) return this.layouts[key];
    const G = formats.length;
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
        storageTexture: { access: "write-only", format: formats[g] },
      });
    }
    const bindGroupLayout = this.device.createBindGroupLayout({ entries });
    this.layouts[key] = {
      bindGroupLayout,
      pipelineLayout: this.device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
    };
    return this.layouts[key];
  }

  /**
   * Compiles a simulation kernel writing state of the given formats (one per species group)
   * and returns it with what dispatch() needs to know about it.
   */
  async compile(label, code, formats) {
    const module = await this.compileModule(label, code);
    // A pipeline that can't be created rejects with why. (Not an error scope, which builds
    // under way at once would share.)
    let pipeline;
    try {
      pipeline = await this.device.createComputePipelineAsync({
        label,
        layout: this.layout(formats).pipelineLayout,
        compute: { module, entryPoint: "main" },
      });
    } catch (error) {
      throw new ShaderCompileError(label, [error.message], code);
    }
    return { pipeline, formats, G: formats.length };
  }

  // Requests a build of the given kind of pipeline(s). Builds are deferred to the end of the
  // current task, so that a burst of requests (e.g. while a preset loads) only builds the
  // last one, and the backend counts as not ready from the moment one is requested. build is
  // an async function returning a function that installs its result; it's only installed,
  // and its errors only reported (to onBuildError), if it's still the latest of its kind.
  // If the latest build fails, discard() removes what the previous one installed, so that,
  // as on WebGL, nothing runs code that no longer matches the options.
  requestBuild(kind, build, discard) {
    const generation = (this.generations[kind] ?? 0) + 1;
    this.generations[kind] = generation;
    this.requests[kind] = { generation, build, discard };
    this.building.add(kind);
    if (this.buildScheduled) return;
    this.buildScheduled = true;
    this.compiling++;
    const batch = (async () => {
      await Promise.resolve();
      this.buildScheduled = false;
      const requests = this.requests;
      this.requests = {};
      let installed = false;
      try {
        await Promise.all(
          Object.entries(requests).map(async ([kind, { generation, build, discard }]) => {
            try {
              const install = await build();
              if (this.generations[kind] != generation) return;
              this.building.delete(kind);
              this.failedBuilds.delete(kind);
              install();
              installed = true;
            } catch (error) {
              if (this.generations[kind] != generation) return;
              this.building.delete(kind);
              this.failedBuilds.add(kind);
              this.settle();
              discard?.();
              this.onBuildError?.(kind, error);
            }
          }),
        );
      } finally {
        this.compiling--;
      }
      if (installed) this.onInstalled?.();
    })();
    this.batches.add(batch);
    const done = () => this.batches.delete(batch);
    batch.then(done, done);
  }

  /** Whether every pipeline needed to run a simulation is built and none are being rebuilt. */
  isReady() {
    return (
      this.compiling == 0 &&
      !SIMULATION_BUILDS.some((kind) => this.failedBuilds.has(kind)) &&
      this.slots.length > 0 &&
      PASS_TYPES.every((type) => this.fitsState(this.pipelines[type])) &&
      this.fitsState(this.pipelines.clear)
    );
  }

  // Whether a kernel exists and writes state in the formats the slots have.
  fitsState(kernel) {
    return !!kernel && kernel.formats.join() == this.formats.join();
  }

  /** Resolves once no pipelines are being built. */
  async whenReady() {
    // Every batch, as an older one may still be building after a newer one has finished.
    while (this.compiling > 0) await Promise.allSettled(this.batches);
  }

  /**
   * Builds the timestepping pipelines.
   * @param {import("./sim_wgsl.js").SimShaderParts} parts
   */
  setSimulation(parts) {
    this.setClamping(parts.clamp);
    this.requestBuild("simulation", async () => {
      const pipelines = {};
      const plan = blockingPlan(parts, this.device.limits.maxComputeWorkgroupStorageSize);
      await Promise.all([
        ...PASS_TYPES.map(async (type) => {
          pipelines[type] = await this.compile(
            `timestep ${type}`,
            timestepShader(type, parts),
            parts.formats,
          );
        }),
        (async () => {
          // Optional: if the blocked kernel fails (e.g. it needs more of the GPU than a
          // driver can give one workgroup), steps are taken unblocked. Any error in the
          // equations themselves fails the kernels above too.
          try {
            pipelines.FEBlocked = plan && {
              ...(await this.compile(
                "timestep FE (blocked)",
                blockedTimestepShader(parts, plan),
                parts.formats,
              )),
              plan,
            };
          } catch (error) {
            console.log("Not blocking timesteps, as the blocked kernel failed:", error.message);
            pipelines.FEBlocked = null;
          }
        })(),
      ]);
      return () => {
        // Steps already requested are taken with the pipelines they were requested with.
        this.settle();
        Object.assign(this.pipelines, pipelines);
      };
    }, () => {
      for (const type of [...PASS_TYPES, "FEBlocked"]) delete this.pipelines[type];
    });
  }

  /** Builds the initial-condition pipeline. */
  setClear(parts) {
    this.requestBuild("clear", async () => {
      const pipeline = await this.compile("clear", clearShader(parts), parts.formats);
      return () => (this.pipelines.clear = pipeline);
    }, () => delete this.pipelines.clear);
  }

  /** Builds the brush pipeline. */
  setDraw(parts) {
    this.requestBuild("draw", async () => {
      const pipeline = await this.compile("draw", drawShader(parts), parts.formats);
      return () => (this.pipelines.draw = pipeline);
    }, () => delete this.pipelines.draw);
  }

  /** Builds the Dirichlet enforcement pipeline, or removes it if parts is null. */
  setEnforceDirichlet(parts) {
    this.requestBuild("enforce", async () => {
      const pipeline = parts
        ? await this.compile(
            "enforce Dirichlet",
            enforceDirichletShader(parts),
            parts.formats,
          )
        : null;
      return () => (this.pipelines.enforce = pipeline);
    }, () => delete this.pipelines.enforce);
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
    this.settle();
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
    if (!this.fitsState(kernel)) {
      console.error(`WebGPU kernel ${kernel?.pipeline.label} doesn't fit the state's formats`);
      return;
    }
    // The slots first: reading them records any pending steps, which may flush and replace
    // the uniform buffer that pushUniforms writes into.
    const sources = [0, 1, 2, 3].map((k) => this.slots[inputs[k] ?? inputs[0]]);
    const target = this.slots[dst];
    const offset = this.pushUniforms(uniforms);
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
    // Each workgroup of a blocked kernel writes its tile's interior.
    const perGroup = kernel.plan ? [kernel.plan.output, 1] : WORKGROUP_SIZE;
    pass.dispatchWorkgroups(Math.ceil(this.nX / perGroup[0]), Math.ceil(this.nY / perGroup[1]));
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
      layout: this.layout(kernel.formats).bindGroupLayout,
      entries,
    });
  }

  /**
   * Sets whether each species group's state is clamped (rather than wrapped) at the edges in
   * x and y, as sim_wgsl.js's SimShaderParts.clamp describes.
   */
  setClamping(clamp) {
    this.settle();
    const key = JSON.stringify(clamp);
    if (key == this.clampKey) return;
    this.clampKey = key;
    this.clamp = clamp;
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
        // Requested now and recorded by settle(), which blocks consecutive steps.
        if (this.canBlock()) {
          this.pendingSteps.push(at(t));
          return t + dt;
        }
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
    // Skipped whole, rather than rotating the slots without writing them, if the kernel was
    // built for other state formats (e.g. while it's rebuilt after the species change).
    if (!this.fitsState(this.pipelines.enforce)) return;
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
    // As for enforceDirichlet.
    if (!this.fitsState(this.pipelines.draw)) return;
    this.flush();
    this.device.queue.writeBuffer(this.valuesBuffer, 0, BRUSH_VALUES.pack(brush));
    for (let k = 1; k < NUM_SLOTS; k++) {
      this.dispatch(this.pipelines.draw, uniforms, [k], k - 1);
    }
    this.rotate();
  }

  /** Writes the initial conditions into every slot, as clearTextures() does. */
  clear(uniforms) {
    if (!this.fitsState(this.pipelines.clear)) return;
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
      slot.textures.forEach((texture, g) => {
        const channels = FORMAT_BYTES[texture.format] / 4;
        this.device.queue.writeTexture(
          { texture },
          selectChannels(groups[g] ?? empty, 4, channels),
          { bytesPerRow: 4 * channels * this.nX },
          [this.nX, this.nY],
        );
      }),
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
        format: CHECKPOINT_FORMAT,
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
    this.release(...sources);
    this.copySlotToOthers(0);
  }

  /**
   * Records resampling state textures (one per species group) of width by height nodes onto
   * the grid, into the target slot: at each node's texture coordinates times repeat plus
   * offset, bilinearly if linear is set (snapping weights near texel centres if snap is set,
   * as textureBilinear does), otherwise nearest. Beyond the edges, each group's nodes are
   * clamped in x and y where clamp (per group, [x, y]) says so, as by default, and wrapped
   * otherwise.
   */
  resample(sources, width, height, target, { repeat, offset, linear, snap = false, clamp }) {
    const device = this.device;
    const G = this.numGroups;
    const clampBits = Array.from({ length: G }, (_, g) => clamp?.[g] ?? [true, true]).reduce(
      (bits, [cx, cy], g) => bits | (cx ? 1 << (2 * g) : 0) | (cy ? 2 << (2 * g) : 0),
      0,
    );
    const params = new ArrayBuffer(48);
    new Uint32Array(params, 0, 4).set([width, height, linear ? 1 : 0, snap ? 1 : 0]);
    new Float32Array(params, 16, 4).set([...repeat, ...offset]);
    new Uint32Array(params, 32, 3).set([this.nX, this.nY, clampBits]);
    const paramsBuffer = device.createBuffer({
      size: 48,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(paramsBuffer, 0, params);
    const formats = target.textures.map((texture) => texture.format);
    this.restorePipelines ??= {};
    if (!this.restorePipelines[formats]) {
      this.restorePipelines[formats] = device.createComputePipeline({
        layout: "auto",
        compute: {
          module: device.createShaderModule({ code: restoreShader(formats) }),
          entryPoint: "main",
        },
      });
    }
    const pipeline = this.restorePipelines[formats];
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
    this.release(paramsBuffer);
  }

  /**
   * Destroys GPU resources (buffers or textures) once everything recorded so far has been
   * submitted, which is safe however long the GPU then takes to run it. Call this after
   * recording the last use of a resource made for that work alone, rather than leaving it
   * to garbage collection, which doesn't see GPU memory (and so may let it run short, e.g.
   * on phones).
   */
  release(...resources) {
    this.releases.push(...resources);
  }

  /** Submits everything recorded since the last flush. */
  flush() {
    this.settle();
    this.flushRecorded();
    this.releases.forEach((resource) => resource.destroy());
    this.releases = [];
  }

  flushRecorded() {
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
    const encoder = this.device.createCommandEncoder();
    const copies = this.slots[1].textures.map((texture) => {
      const channels = FORMAT_BYTES[texture.format] / 4;
      // Rows of a texture copy must be a multiple of 256 bytes apart.
      const rowBytes = 4 * channels * this.nX;
      const bytesPerRow = Math.ceil(rowBytes / 256) * 256;
      const staging = this.device.createBuffer({
        size: bytesPerRow * this.nY,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
      });
      encoder.copyTextureToBuffer({ texture }, { buffer: staging, bytesPerRow }, [this.nX, this.nY]);
      return { staging, channels, rowBytes, bytesPerRow };
    });
    this.device.queue.submit([encoder.finish()]);
    return Promise.all(
      copies.map(async ({ staging, channels, rowBytes, bytesPerRow }) => {
        await staging.mapAsync(GPUMapMode.READ);
        const padded = new Uint8Array(staging.getMappedRange());
        const packed = new Float32Array(channels * this.nX * this.nY);
        const bytes = new Uint8Array(packed.buffer);
        for (let j = 0; j < this.nY; j++) {
          bytes.set(padded.subarray(j * bytesPerRow, j * bytesPerRow + rowBytes), j * rowBytes);
        }
        staging.unmap();
        staging.destroy();
        return selectChannels(packed, channels, 4);
      }),
    );
  }
}

// Copies data with from channels per node into an array with to channels per node, dropping
// channels or filling them with 0.
function selectChannels(data, from, to) {
  if (from == to) return data;
  const nodes = data.length / from;
  const out = new Float32Array(to * nodes);
  const shared = Math.min(from, to);
  for (let k = 0; k < nodes; k++) {
    for (let c = 0; c < shared; c++) out[to * k + c] = data[from * k + c];
  }
  return out;
}

// Resamples state textures onto the grid (see WebGPUBackend.resample).
function restoreShader(formats) {
  const groups = formats.map((_, g) => g);
  return `
struct Params {
  width: u32, height: u32, linear: u32, snap: u32,
  repeat: vec2f, offset: vec2f,
  // Bit 2g (2g + 1) set if group g is clamped in x (y), and wrapped otherwise.
  nX: u32, nY: u32, clampBits: u32,
}
@group(0) @binding(0) var<uniform> P: Params;
${groups.map((g) => `@group(0) @binding(${1 + g}) var source${g}: texture_2d<f32>;`).join("\n")}
${groups.map((g) => `@group(0) @binding(${3 + g}) var dst${g}: texture_storage_2d<${formats[g]}, write>;`).join("\n")}

fn wrapOrClamp(k: i32, n: i32, clampIt: bool) -> i32 {
  if (clampIt) { return clamp(k, 0, n - 1); }
  return ((k % n) + n) % n;
}

fn at(g: u32, i: i32, j: i32) -> vec4f {
  let ij = vec2i(
    wrapOrClamp(i, i32(P.width), ((P.clampBits >> (2u * g)) & 1u) != 0u),
    wrapOrClamp(j, i32(P.height), ((P.clampBits >> (2u * g + 1u)) & 1u) != 0u),
  );
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
