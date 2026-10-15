// display.js
//
// Draws the simulation on WebGPU, in place of three.js's WebGL renderer: the post-processing
// pass (as WebGL's postMaterial), the display mesh coloured from it (as displayMaterial), and
// the min/max reduction used to set the colour range. The camera, the mesh's geometry and
// placement, and everything else about the scene still come from three.js objects in main.js,
// which are only used for their maths.

import { UNIFORM_STRIDE, writeUniforms } from "./sim_wgsl.js";
import {
  postShader,
  displayShader,
  minMaxShader,
  POST_VALUES,
  DISPLAY_VALUES,
  LINE_SHADER,
} from "./display_wgsl.js";

// The template quad of three.js's LineSegmentsGeometry: each line segment is an instance of
// it, with y < 0 and y > 1 forming the round end caps.
const LINE_QUAD_POSITIONS = new Float32Array([
  -1, 2, 0, 1, 2, 0, -1, 1, 0, 1, 1, 0, -1, 0, 0, 1, 0, 0, -1, -1, 0, 1, -1, 0,
]);
const LINE_QUAD_UVS = new Float32Array([-1, 2, 1, 2, -1, 1, 1, 1, -1, -1, 1, -1, -1, -2, 1, -2]);
const LINE_QUAD_INDICES = new Uint32Array([0, 2, 1, 2, 3, 1, 2, 4, 3, 4, 5, 3, 4, 6, 5, 6, 7, 5]);

// three.js's projection matrices map depth to [-1, 1], as WebGL does; WebGPU's clip space
// uses [0, 1].
const DEPTH_TO_WEBGPU = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.5, 0, 0, 0, 0.5, 1];

function multiply(a, b) {
  // Column-major 4x4 matrices, as three.js's Matrix4.elements.
  const out = new Float32Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) sum += a[4 * k + r] * b[4 * c + k];
      out[4 * c + r] = sum;
    }
  }
  return out;
}

export class WebGPUDisplay {
  /**
   * @param {import("./webgpu_backend.js").WebGPUBackend} backend
   * @param {HTMLCanvasElement} canvas
   * @param {boolean} [antialias] - Whether to multisample, as WebGL's antialias option does.
   */
  constructor(backend, canvas, antialias = false) {
    this.sampleCount = antialias ? 4 : 1;
    this.backend = backend;
    this.device = backend.device;
    this.canvas = canvas;
    this.context = canvas.getContext("webgpu");
    this.format = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({
      device: this.device,
      format: this.format,
      alphaMode: "premultiplied",
    });
    this.pipelines = {};
    this.postBuffer = null;
    this.depthTexture = null;
    this.geometry = null;
    this.minMax = [0, 1];
    this.minMaxPending = false;
    const device = this.device;
    this.simUniforms = device.createBuffer({
      size: UNIFORM_STRIDE,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.cameraBuffer = device.createBuffer({
      size: 80,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.postValues = this.valuesBuffer(POST_VALUES);
    this.displayValues = this.valuesBuffer(DISPLAY_VALUES);
    this.reduceParams = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.reduceParamsSecond = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    // At most this many workgroups in the first stage of a reduction, so one workgroup can
    // finish it.
    this.reduceGroups = 256;
    this.partials = device.createBuffer({
      size: 16 * this.reduceGroups,
      usage: GPUBufferUsage.STORAGE,
    });
    this.reduced = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });
    this.buildReductions();
    this.buildLayouts();
    this.buildLines();
  }

  buildLines() {
    const device = this.device;
    const module = device.createShaderModule({ label: "line", code: LINE_SHADER });
    const instance = (location, offset) => ({
      shaderLocation: location,
      offset,
      format: "float32x3",
    });
    this.pipelines.line = device.createRenderPipeline({
      label: "line",
      layout: "auto",
      vertex: {
        module,
        entryPoint: "vertexMain",
        buffers: [
          { arrayStride: 12, attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }] },
          { arrayStride: 8, attributes: [{ shaderLocation: 1, offset: 0, format: "float32x2" }] },
          { arrayStride: 24, stepMode: "instance", attributes: [instance(2, 0), instance(3, 12)] },
          { arrayStride: 24, stepMode: "instance", attributes: [instance(4, 0), instance(5, 12)] },
        ],
      },
      fragment: { module, entryPoint: "fragmentMain", targets: [{ format: this.format }] },
      primitive: { topology: "triangle-list", cullMode: "none" },
      depthStencil: { format: "depth24plus", depthWriteEnabled: true, depthCompare: "less-equal" },
      multisample: { count: this.sampleCount },
    });
    const upload = (data, usage) => {
      const buffer = device.createBuffer({ size: data.byteLength, usage: usage | GPUBufferUsage.COPY_DST });
      device.queue.writeBuffer(buffer, 0, data);
      return buffer;
    };
    this.lineQuad = [
      upload(LINE_QUAD_POSITIONS, GPUBufferUsage.VERTEX),
      upload(LINE_QUAD_UVS, GPUBufferUsage.VERTEX),
      upload(LINE_QUAD_INDICES, GPUBufferUsage.INDEX),
    ];
    // Per line drawn in a frame, its uniforms and instance buffers, reused across frames.
    this.lineResources = [];
  }

  // Returns line k's resources, with instance buffers large enough for `bytes` bytes.
  lineResource(k, bytes) {
    const device = this.device;
    let r = this.lineResources[k];
    if (!r) {
      r = {
        uniforms: device.createBuffer({ size: 96, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST }),
      };
      r.bindGroup = device.createBindGroup({
        layout: this.pipelines.line.getBindGroupLayout(0),
        entries: [{ binding: 0, resource: { buffer: r.uniforms } }],
      });
      this.lineResources[k] = r;
    }
    if (!r.positions || r.positions.size < bytes) {
      r.positions?.destroy();
      r.colours?.destroy();
      const make = () =>
        device.createBuffer({ size: bytes, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
      r.positions = make();
      r.colours = make();
    }
    return r;
  }

  // Explicit layouts, so every binding is always supplied, whether or not a shader uses it.
  buildLayouts() {
    const entry = (binding, visibility, kind) => {
      const e = { binding, visibility };
      if (kind == "uniform") e.buffer = { type: "uniform" };
      else if (kind == "read") e.buffer = { type: "read-only-storage" };
      else if (kind == "write") e.buffer = { type: "storage" };
      else if (kind == "texture") e.texture = { sampleType: "float" };
      else if (kind == "sampler") e.sampler = { type: "filtering" };
      return e;
    };
    const C = GPUShaderStage.COMPUTE;
    const VF = GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT;
    const kinds = (write) => [
      "uniform", "read", "read", write ? "write" : "read", "read", "texture", "texture", "sampler",
    ];
    this.postLayout = this.device.createBindGroupLayout({
      entries: kinds(true).map((kind, binding) => entry(binding, C, kind)),
    });
    this.displayLayout = this.device.createBindGroupLayout({
      entries: [...kinds(false), "uniform"].map((kind, binding) => entry(binding, VF, kind)),
    });
  }

  valuesBuffer(layout) {
    return this.device.createBuffer({
      size: 16 * Math.max(1, layout.entries.length),
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
  }

  buildReductions() {
    for (const first of [true, false]) {
      const module = this.device.createShaderModule({ code: minMaxShader(first) });
      this.pipelines[first ? "minMaxFirst" : "minMaxSecond"] =
        this.device.createComputePipeline({
          layout: "auto",
          compute: { module, entryPoint: "main" },
        });
    }
  }

  /** Builds the post-processing pipeline from the WebGL post shader's body. */
  setPost(parts) {
    this.backend.requestBuild("post", async () => {
      const module = await this.backend.compileModule("post", postShader(parts));
      const pipeline = await this.device.createComputePipelineAsync({
        label: "post",
        layout: this.device.createPipelineLayout({ bindGroupLayouts: [this.postLayout] }),
        compute: { module, entryPoint: "main" },
      });
      return () => (this.pipelines.post = pipeline);
    });
  }

  /** Builds the display pipeline from the WebGL display shader's body. */
  setDisplay(parts) {
    this.backend.requestBuild("display", async () => {
      const module = await this.backend.compileModule("display", displayShader(parts));
      const pipeline = await this.device.createRenderPipelineAsync({
        label: "display",
        layout: this.device.createPipelineLayout({ bindGroupLayouts: [this.displayLayout] }),
        vertex: {
          module,
          entryPoint: "vertexMain",
          buffers: [
            { arrayStride: 12, attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }] },
            { arrayStride: 8, attributes: [{ shaderLocation: 1, offset: 0, format: "float32x2" }] },
          ],
        },
        fragment: {
          module,
          entryPoint: "fragmentMain",
          targets: [{ format: this.format }],
        },
        primitive: { topology: "triangle-list", cullMode: "none" },
        depthStencil: {
          format: "depth24plus",
          depthWriteEnabled: true,
          depthCompare: "less-equal",
        },
        multisample: { count: this.sampleCount },
      });
      return () => (this.pipelines.display = pipeline);
    });
  }

  /**
   * Sets the display mesh, from a three.js BufferGeometry's attributes.
   * @param {Float32Array} positions
   * @param {Float32Array} uvs
   * @param {Uint16Array|Uint32Array} indices
   */
  setGeometry(positions, uvs, indices) {
    const make = (data, usage) => {
      const buffer = this.device.createBuffer({
        size: Math.ceil(data.byteLength / 4) * 4,
        usage: usage | GPUBufferUsage.COPY_DST,
      });
      const padded = new Uint8Array(buffer.size);
      padded.set(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
      this.device.queue.writeBuffer(buffer, 0, padded);
      return buffer;
    };
    this.geometry?.buffers.forEach((b) => b.destroy());
    const index = indices instanceof Uint32Array ? indices : Uint32Array.from(indices);
    const buffers = [
      make(positions, GPUBufferUsage.VERTEX),
      make(uvs, GPUBufferUsage.VERTEX),
      make(index, GPUBufferUsage.INDEX),
    ];
    this.geometry = { buffers, count: index.length };
  }

  ensurePostBuffer() {
    const size = Math.max(16, this.backend.nX * this.backend.nY * 16);
    if (this.postBuffer?.size == size) return;
    this.postBuffer?.destroy();
    this.postBuffer = this.device.createBuffer({
      label: "post",
      size,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });
  }

  writeSimUniforms(values) {
    const data = new ArrayBuffer(UNIFORM_STRIDE);
    writeUniforms(new DataView(data), 0, {
      nX: this.backend.nX,
      nY: this.backend.nY,
      ...values,
    });
    this.device.queue.writeBuffer(this.simUniforms, 0, data);
  }

  imageEntries(first) {
    return [
      { binding: first, resource: this.backend.images[0].createView() },
      { binding: first + 1, resource: this.backend.images[1].createView() },
      { binding: first + 2, resource: this.backend.sampler },
    ];
  }

  /**
   * Computes the post-processed values from the current state.
   * @param {Object} simValues - The simulation uniforms, as for the timestep.
   * @param {Object} postValues - customSurface, vectorField and overlayLine.
   * @returns {boolean} Whether it ran.
   */
  postprocess(simValues, postValues) {
    const backend = this.backend;
    if (!this.pipelines.post || !backend.slots.length) return false;
    this.ensurePostBuffer();
    this.writeSimUniforms(simValues);
    this.device.queue.writeBuffer(this.postValues, 0, POST_VALUES.pack(postValues));
    const bindGroup = this.device.createBindGroup({
      layout: this.postLayout,
      entries: [
        { binding: 0, resource: { buffer: this.simUniforms } },
        { binding: 1, resource: { buffer: backend.paramsBuffer } },
        { binding: 2, resource: { buffer: backend.slots[1] } },
        { binding: 3, resource: { buffer: this.postBuffer } },
        { binding: 4, resource: { buffer: this.postValues } },
        ...this.imageEntries(5),
      ],
    });
    const pass = backend.getEncoder().beginComputePass();
    pass.setPipeline(this.pipelines.post);
    pass.setBindGroup(0, bindGroup);
    pass.dispatchWorkgroups(Math.ceil(backend.nX / 8), Math.ceil(backend.nY / 8));
    pass.end();
    return true;
  }

  /**
   * Reads the post-processed values back, as WebGL's fillBuffer() does (RGBA per node, row by
   * row from the bottom).
   * @returns {Promise<Float32Array>}
   */
  async readPost() {
    if (!this.postBuffer) return new Float32Array(0);
    const size = this.backend.nX * this.backend.nY * 16;
    const staging = this.device.createBuffer({
      size,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });
    this.backend.getEncoder().copyBufferToBuffer(this.postBuffer, 0, staging, 0, size);
    this.backend.flush();
    await staging.mapAsync(GPUMapMode.READ);
    const data = new Float32Array(staging.getMappedRange().slice(0));
    staging.destroy();
    return data;
  }

  /**
   * Draws the display mesh into the canvas.
   * @param {Object} options
   * @param {Object} options.simValues - The simulation uniforms.
   * @param {Object} options.displayValues - The values in DISPLAY_VALUES.
   * @param {ArrayLike<number>} options.projection - The camera's projection matrix.
   * @param {ArrayLike<number>} options.modelView - The mesh's model-view matrix.
   * @param {number} options.heightMode - 0 (plane), 1 (surface from the plotted value) or 2
   *   (surface from the custom height).
   * @param {number[]} options.background - The background colour, RGBA.
   * @param {number} options.width - The drawing buffer's size, in pixels.
   * @param {number} options.height
   * @param {boolean} [options.showDomain] - Whether to draw the display mesh (not for line
   *   plots).
   * @param {Object[]} [options.lines] - Lines to draw, as three.js Line2 objects describe
   *   them: modelView (matrix), segments (start and end of each, as LineSegmentsGeometry's
   *   instanceStart buffer holds them), colours (likewise, or null), colour (RGBA) and
   *   linewidth.
   */
  draw({
    simValues,
    displayValues,
    projection,
    modelView,
    heightMode,
    background,
    width,
    height,
    showDomain = true,
    lines = [],
  }) {
    const backend = this.backend;
    // A zero-sized canvas has no texture to draw into.
    if (!(width > 0 && height > 0)) return;
    if (this.canvas.width != width || this.canvas.height != height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    if (!this.depthTexture || this.depthTexture.width != width || this.depthTexture.height != height) {
      this.depthTexture?.destroy();
      this.msaaTexture?.destroy();
      this.depthTexture = this.device.createTexture({
        size: [width, height],
        format: "depth24plus",
        sampleCount: this.sampleCount,
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });
      // When multisampling, draw into this and resolve into the canvas.
      this.msaaTexture =
        this.sampleCount > 1
          ? this.device.createTexture({
              size: [width, height],
              format: this.format,
              sampleCount: this.sampleCount,
              usage: GPUTextureUsage.RENDER_ATTACHMENT,
            })
          : null;
    }
    const encoder = backend.getEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.msaaTexture
            ? this.msaaTexture.createView()
            : this.context.getCurrentTexture().createView(),
          resolveTarget: this.msaaTexture
            ? this.context.getCurrentTexture().createView()
            : undefined,
          clearValue: { r: background[0], g: background[1], b: background[2], a: background[3] },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
      depthStencilAttachment: {
        view: this.depthTexture.createView(),
        depthClearValue: 1,
        depthLoadOp: "clear",
        depthStoreOp: "discard",
      },
    });
    const toClip = (mv) => multiply(DEPTH_TO_WEBGPU, multiply(projection, mv));
    lines.forEach((line, k) => {
      const count = line.segments.length / 6;
      if (!count) return;
      const r = this.lineResource(k, line.segments.byteLength);
      const uniforms = new ArrayBuffer(96);
      new Float32Array(uniforms, 0, 16).set(toClip(line.modelView));
      new Float32Array(uniforms, 64, 5).set([...line.colour, line.linewidth]);
      new Uint32Array(uniforms, 84, 1)[0] = line.colours ? 1 : 0;
      this.device.queue.writeBuffer(r.uniforms, 0, uniforms);
      this.device.queue.writeBuffer(r.positions, 0, line.segments);
      if (line.colours) this.device.queue.writeBuffer(r.colours, 0, line.colours);
      pass.setPipeline(this.pipelines.line);
      pass.setBindGroup(0, r.bindGroup);
      pass.setVertexBuffer(0, this.lineQuad[0]);
      pass.setVertexBuffer(1, this.lineQuad[1]);
      pass.setVertexBuffer(2, r.positions);
      pass.setVertexBuffer(3, r.colours);
      pass.setIndexBuffer(this.lineQuad[2], "uint32");
      pass.drawIndexed(LINE_QUAD_INDICES.length, count);
    });
    if (
      showDomain &&
      this.pipelines.display &&
      this.geometry &&
      this.postBuffer &&
      backend.slots.length
    ) {
      this.writeSimUniforms(simValues);
      this.device.queue.writeBuffer(this.displayValues, 0, DISPLAY_VALUES.pack(displayValues));
      const camera = new ArrayBuffer(80);
      new Float32Array(camera, 0, 16).set(
        multiply(DEPTH_TO_WEBGPU, multiply(projection, modelView)),
      );
      new Uint32Array(camera, 64, 1)[0] = heightMode;
      this.device.queue.writeBuffer(this.cameraBuffer, 0, camera);
      const bindGroup = this.device.createBindGroup({
        layout: this.displayLayout,
        entries: [
          { binding: 0, resource: { buffer: this.simUniforms } },
          { binding: 1, resource: { buffer: backend.paramsBuffer } },
          { binding: 2, resource: { buffer: backend.slots[1] } },
          { binding: 3, resource: { buffer: this.postBuffer } },
          { binding: 4, resource: { buffer: this.displayValues } },
          ...this.imageEntries(5),
          { binding: 8, resource: { buffer: this.cameraBuffer } },
        ],
      });
      pass.setPipeline(this.pipelines.display);
      pass.setBindGroup(0, bindGroup);
      pass.setVertexBuffer(0, this.geometry.buffers[0]);
      pass.setVertexBuffer(1, this.geometry.buffers[1]);
      pass.setIndexBuffer(this.geometry.buffers[2], "uint32");
      pass.drawIndexed(this.geometry.count);
    }
    pass.end();
  }

  /**
   * Starts finding the minimum and maximum post-processed values, unless a search is already
   * under way, and returns the most recent result. Readback is asynchronous, so the result
   * lags by a frame or so; onResult is called when a new one arrives.
   * @param {(minMax: number[]) => void} [onResult]
   * @returns {number[]}
   */
  requestMinMax(onResult) {
    if (this.minMaxPending || !this.postBuffer) return this.minMax;
    const backend = this.backend;
    const count = backend.nX * backend.nY;
    this.minMaxPending = true;
    this.device.queue.writeBuffer(this.reduceParams, 0, new Uint32Array([count, 0, 0, 0]));
    this.device.queue.writeBuffer(
      this.reduceParamsSecond,
      0,
      new Uint32Array([this.reduceGroups, 0, 0, 0]),
    );
    const encoder = backend.getEncoder();
    const run = (pipeline, params, input, output, groups) => {
      const pass = encoder.beginComputePass();
      pass.setPipeline(pipeline);
      pass.setBindGroup(
        0,
        this.device.createBindGroup({
          layout: pipeline.getBindGroupLayout(0),
          entries: [
            { binding: 0, resource: { buffer: params } },
            { binding: 1, resource: { buffer: input } },
            { binding: 2, resource: { buffer: output } },
          ],
        }),
      );
      pass.dispatchWorkgroups(groups);
      pass.end();
    };
    run(this.pipelines.minMaxFirst, this.reduceParams, this.postBuffer, this.partials, this.reduceGroups);
    run(this.pipelines.minMaxSecond, this.reduceParamsSecond, this.partials, this.reduced, 1);
    const staging = this.device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });
    encoder.copyBufferToBuffer(this.reduced, 0, staging, 0, 16);
    backend.flush();
    staging.mapAsync(GPUMapMode.READ).then(
      () => {
        const [low, high] = new Float32Array(staging.getMappedRange().slice(0));
        staging.destroy();
        this.minMax = [low, high];
        this.minMaxPending = false;
        onResult?.(this.minMax);
      },
      () => {
        staging.destroy();
        this.minMaxPending = false;
      },
    );
    return this.minMax;
  }
}
