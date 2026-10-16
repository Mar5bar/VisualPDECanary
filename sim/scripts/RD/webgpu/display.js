// display.js
//
// Draws the simulation on WebGPU, in place of three.js's WebGL renderer: the post-processing
// pass (as WebGL's postMaterial), the display mesh coloured from it (as displayMaterial), and
// the min/max reduction used to set the colour range. The camera, the mesh's geometry and
// placement, and everything else about the scene still come from three.js objects in main.js,
// which are only used for their maths.

import { UNIFORM_STRIDE, WORKGROUP_SIZE, writeUniforms } from "./sim_wgsl.js";
import { ValueLayout } from "./values.js";

const NO_VALUES = new ValueLayout([]);
import {
  postShader,
  displayShader,
  minMaxShader,
  sumShader,
  fieldShader,
  POST_VALUES,
  PROBE_VALUES,
  DISPLAY_VALUES,
  LINE_SHADER,
  MESH_SHADER,
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
    // Whether minMax is of the current state, rather than of one since replaced (see
    // discardMinMax), and the count of such replacements, to tell stale results apart.
    this.minMaxCurrent = false;
    this.minMaxGeneration = 0;
    // The callback of a search requested while one was under way, to make once it's done.
    this.minMaxAgain = null;
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

    const meshModule = device.createShaderModule({ label: "mesh", code: MESH_SHADER });
    this.pipelines.mesh = device.createRenderPipeline({
      label: "mesh",
      layout: "auto",
      vertex: {
        module: meshModule,
        entryPoint: "vertexMain",
        buffers: [
          { arrayStride: 12, attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }] },
          {
            arrayStride: 64,
            stepMode: "instance",
            attributes: [1, 2, 3, 4].map((location, k) => ({
              shaderLocation: location,
              offset: 16 * k,
              format: "float32x4",
            })),
          },
        ],
      },
      fragment: { module: meshModule, entryPoint: "fragmentMain", targets: [{ format: this.format }] },
      primitive: { topology: "triangle-list", cullMode: "none" },
      depthStencil: { format: "depth24plus", depthWriteEnabled: true, depthCompare: "less-equal" },
      multisample: { count: this.sampleCount },
    });
    // Uploaded geometries, by the three.js BufferGeometry they came from.
    this.meshGeometries = new WeakMap();
    this.meshResources = [];
  }

  // Uploads a three.js BufferGeometry's positions and indices, once.
  meshGeometry(geometry) {
    let g = this.meshGeometries.get(geometry);
    if (g) return g;
    const device = this.device;
    const positions = geometry.attributes.position.array;
    const index = geometry.index
      ? Uint32Array.from(geometry.index.array)
      : Uint32Array.from({ length: positions.length / 3 }, (_, k) => k);
    const upload = (data, usage) => {
      const buffer = device.createBuffer({ size: data.byteLength, usage: usage | GPUBufferUsage.COPY_DST });
      device.queue.writeBuffer(buffer, 0, data);
      return buffer;
    };
    g = {
      positions: upload(Float32Array.from(positions), GPUBufferUsage.VERTEX),
      index: upload(index, GPUBufferUsage.INDEX),
      count: index.length,
    };
    this.meshGeometries.set(geometry, g);
    return g;
  }

  // Returns mesh k's resources, with an instance buffer large enough for `bytes` bytes.
  meshResource(k, bytes) {
    const device = this.device;
    let r = this.meshResources[k];
    if (!r) {
      r = {
        uniforms: device.createBuffer({ size: 80, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST }),
      };
      r.bindGroup = device.createBindGroup({
        layout: this.pipelines.mesh.getBindGroupLayout(0),
        entries: [{ binding: 0, resource: { buffer: r.uniforms } }],
      });
      this.meshResources[k] = r;
    }
    if (!r.instances || r.instances.size < bytes) {
      r.instances?.destroy();
      r.instances = device.createBuffer({ size: bytes, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
    }
    return r;
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
      else if (kind == "state") e.texture = { sampleType: "unfilterable-float" };
      else if (kind == "sampler") e.sampler = { type: "filtering" };
      return e;
    };
    const C = GPUShaderStage.COMPUTE;
    const VF = GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT;
    // Binding 2 and 12 are the state's two species groups.
    const kinds = (write) => [
      "uniform", "read", "state", write ? "write" : "read", "read", "texture", "texture", "sampler",
    ];
    const withState1 = (entries) => [...entries, entry(12, entries[0].visibility, "state")];
    // Field shaders (post-processing, probes, domain integrands): binding 8 is the domain
    // integrals.
    this.postLayout = this.device.createBindGroupLayout({
      entries: withState1([...kinds(true), "read"].map((kind, binding) => entry(binding, C, kind))),
    });
    // The display: binding 8 is the camera, 9 the domain integrals, 10 the blend image.
    this.displayLayout = this.device.createBindGroupLayout({
      entries: withState1(
        [...kinds(false), "uniform", "read", "texture"].map((kind, binding) =>
          entry(binding, VF, kind),
        ),
      ),
    });
  }

  valuesBuffer(layout) {
    return this.device.createBuffer({
      size: 16 * Math.max(1, layout.entries.length),
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
  }

  buildReductions() {
    const build = (code) =>
      this.device.createComputePipeline({
        layout: "auto",
        compute: { module: this.device.createShaderModule({ code }), entryPoint: "main" },
      });
    this.pipelines.minMaxFirst = build(minMaxShader(true));
    this.pipelines.minMaxSecond = build(minMaxShader(false));
    this.pipelines.sum = build(sumShader(true, false));
    this.pipelines.sumMasked = build(sumShader(true, true));
    this.pipelines.sumSecond = build(sumShader(false, false));
    this.fieldBuffer = null;
  }

  // Requests a build of a field shader pipeline (see fieldShader), named kind.
  buildField(kind, code) {
    this.backend.requestBuild(kind, async () => {
      const module = await this.backend.compileModule(kind, code);
      const pipeline = await this.device.createComputePipelineAsync({
        label: kind,
        layout: this.device.createPipelineLayout({ bindGroupLayouts: [this.postLayout] }),
        compute: { module, entryPoint: "main" },
      });
      return () => (this.pipelines[kind] = pipeline);
    }, () => delete this.pipelines[kind]);
  }

  /** Builds the post-processing pipeline from the WebGL post shader's body. */
  setPost(parts) {
    this.buildField("post", postShader(parts));
  }

  /**
   * Builds the probe's pipelines from the WebGL probe shader's body: one evaluating it at
   * the probe's position, for point probes, and one at every node, for integral probes.
   */
  setProbe(parts) {
    this.buildField("probePoint", fieldShader(parts, PROBE_VALUES, true));
    this.buildField("probeField", fieldShader(parts, PROBE_VALUES));
  }

  /** Builds the domain integrals' integrand pipeline from the WebGL shader's body. */
  setIntegrands(parts) {
    this.buildField("integrands", fieldShader(parts, NO_VALUES));
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
          // Blended as three.js blends the WebGL display material (transparent, so
          // NormalBlending with non-premultiplied alpha): outside the domain, where the shader
          // outputs transparent black, the background shows.
          targets: [
            {
              format: this.format,
              blend: {
                color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add" },
                alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
              },
            },
          ],
        },
        primitive: { topology: "triangle-list", cullMode: "none" },
        depthStencil: {
          format: "depth24plus",
          depthWriteEnabled: true,
          depthCompare: "less-equal",
        },
        multisample: { count: this.sampleCount },
      });
      // The same mesh, outputting texture coordinates into a 1x1 target, for picking.
      const pick = await this.device.createRenderPipelineAsync({
        label: "pick",
        layout: this.device.createPipelineLayout({ bindGroupLayouts: [this.displayLayout] }),
        vertex: {
          module,
          entryPoint: "vertexMain",
          buffers: [
            { arrayStride: 12, attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }] },
            { arrayStride: 8, attributes: [{ shaderLocation: 1, offset: 0, format: "float32x2" }] },
          ],
        },
        fragment: { module, entryPoint: "pickMain", targets: [{ format: "rgba32float" }] },
        primitive: { topology: "triangle-list", cullMode: "none" },
        depthStencil: { format: "depth24plus", depthWriteEnabled: true, depthCompare: "less-equal" },
      });
      return () => {
        this.pipelines.display = pipeline;
        this.pipelines.pick = pick;
      };
    }, () => {
      delete this.pipelines.display;
      delete this.pipelines.pick;
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

  // Whether the post-processed values are for the current grid: after a resize, they aren't
  // until the next post-processing pass.
  postFits() {
    return this.postBuffer?.size == Math.max(16, this.backend.nX * this.backend.nY * 16);
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

  // The current state's textures, at bindings 2 and 12.
  stateEntries() {
    const views = this.backend.slots[1].views;
    return [
      { binding: 2, resource: views[0] },
      { binding: 12, resource: views[1] ?? views[0] },
    ];
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
    if (!this.pipelines.post || !this.backend.slots.length) return false;
    this.ensurePostBuffer();
    this.runField(this.pipelines.post, simValues, POST_VALUES, postValues, this.postBuffer);
    return true;
  }

  // Records a field shader pass over the current state, writing into output, at every node or
  // (if point is set) once.
  runField(pipeline, simValues, layout, values, output, point = false) {
    const backend = this.backend;
    // Each pass gets its own uniform and values buffers, as several passes may be recorded
    // before a submit (e.g. domain integrals at different times within a frame).
    const uniformBuffer = this.device.createBuffer({
      size: UNIFORM_STRIDE,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    const uniformData = new ArrayBuffer(UNIFORM_STRIDE);
    writeUniforms(new DataView(uniformData), 0, {
      nX: backend.nX,
      nY: backend.nY,
      ...simValues,
    });
    this.device.queue.writeBuffer(uniformBuffer, 0, uniformData);
    const valuesBuffer = this.device.createBuffer({
      size: 16 * Math.max(1, layout.entries.length),
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(valuesBuffer, 0, layout.pack(values));
    const bindGroup = this.device.createBindGroup({
      layout: this.postLayout,
      entries: [
        { binding: 0, resource: { buffer: uniformBuffer } },
        { binding: 1, resource: { buffer: backend.paramsBuffer } },
        ...this.stateEntries(),
        { binding: 3, resource: { buffer: output } },
        { binding: 4, resource: { buffer: valuesBuffer } },
        ...this.imageEntries(5),
        { binding: 8, resource: { buffer: backend.globalsBuffer } },
      ],
    });
    const pass = backend.getEncoder().beginComputePass();
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    if (point) pass.dispatchWorkgroups(1, 1);
    else {
      pass.dispatchWorkgroups(
        Math.ceil(backend.nX / WORKGROUP_SIZE[0]),
        Math.ceil(backend.nY / WORKGROUP_SIZE[1]),
      );
    }
    pass.end();
    backend.release(uniformBuffer, valuesBuffer);
  }

  // A scratch buffer of nX * nY vec4fs, for field passes whose results are reduced.
  ensureFieldBuffer() {
    const size = Math.max(16, this.backend.nX * this.backend.nY * 16);
    if (this.fieldBuffer?.size == size) return this.fieldBuffer;
    this.fieldBuffer?.destroy();
    this.fieldBuffer = this.device.createBuffer({ label: "field", size, usage: GPUBufferUsage.STORAGE });
    return this.fieldBuffer;
  }

  // Records a sum of `input`'s first `count` vec4fs (or, if masked, of r * (1 - g)), times
  // `scale`, into the first element of `output`.
  recordSum(input, count, { masked = false, scale = 1, output }) {
    const device = this.device;
    const params = (n, s) => {
      const buffer = device.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
      const data = new ArrayBuffer(16);
      new Uint32Array(data, 0, 1)[0] = n;
      new Float32Array(data, 4, 1)[0] = s;
      device.queue.writeBuffer(buffer, 0, data);
      return buffer;
    };
    const encoder = this.backend.getEncoder();
    const run = (pipeline, uniforms, from, to, groups) => {
      const pass = encoder.beginComputePass();
      pass.setPipeline(pipeline);
      pass.setBindGroup(
        0,
        device.createBindGroup({
          layout: pipeline.getBindGroupLayout(0),
          entries: [
            { binding: 0, resource: { buffer: uniforms } },
            { binding: 1, resource: { buffer: from } },
            { binding: 2, resource: { buffer: to } },
          ],
        }),
      );
      pass.dispatchWorkgroups(groups);
      pass.end();
      this.backend.release(uniforms);
    };
    run(
      masked ? this.pipelines.sumMasked : this.pipelines.sum,
      params(count, 1),
      input,
      this.partials,
      this.reduceGroups,
    );
    run(this.pipelines.sumSecond, params(this.reduceGroups, scale), this.partials, output, 1);
  }

  // Copies `bytes` bytes of a buffer from smallBuffer() to the CPU, after everything
  // recorded so far, then destroys the buffer.
  async readBack(buffer, bytes) {
    const staging = this.device.createBuffer({
      size: bytes,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });
    this.backend.getEncoder().copyBufferToBuffer(buffer, 0, staging, 0, bytes);
    this.backend.release(buffer);
    this.backend.flush();
    await staging.mapAsync(GPUMapMode.READ);
    const data = new Float32Array(staging.getMappedRange().slice(0));
    staging.destroy();
    return data;
  }

  /**
   * Updates the domain integrals Int(...) on the GPU, as updateGlobalIntegral() does: the
   * integrands are summed over the domain and scaled by the area element dA, into the buffer
   * every shader reads them from. Nothing is read back.
   */
  updateGlobals(simValues, dA) {
    if (!this.pipelines.integrands || !this.backend.slots.length) return;
    const field = this.ensureFieldBuffer();
    this.runField(this.pipelines.integrands, simValues, NO_VALUES, {}, field);
    this.recordSum(field, this.backend.nX * this.backend.nY, {
      scale: dA,
      output: this.backend.globalsBuffer,
    });
  }

  /**
   * Evaluates the probe, as WebGL's probe passes do: at the probe's position for a point
   * probe, returning the probe shader's output (value, 0, x, y); otherwise, its value summed
   * over the domain times dA, in the first component.
   * @returns {Promise<Float32Array>}
   */
  async probe(simValues, probeValues, dA) {
    // Not with a pipeline that's being replaced (e.g. for a new probe expression).
    if (["probePoint", "probeField"].some((kind) => this.backend.building.has(kind))) return null;
    if (probeValues.pointProbe) {
      if (!this.pipelines.probePoint) return null;
      const out = this.smallBuffer();
      this.runField(this.pipelines.probePoint, simValues, PROBE_VALUES, probeValues, out, true);
      return this.readBack(out, 16);
    }
    if (!this.pipelines.probeField) return null;
    const field = this.ensureFieldBuffer();
    this.runField(this.pipelines.probeField, simValues, PROBE_VALUES, probeValues, field);
    const out = this.smallBuffer();
    this.recordSum(field, this.backend.nX * this.backend.nY, { masked: true, scale: dA, output: out });
    return this.readBack(out, 16);
  }

  /**
   * The plotted value summed over the domain times dA, as updateIntegralDisplay() computes it
   * from the post-processed values.
   * @returns {Promise<number>}
   */
  async integral(dA) {
    if (!this.postFits()) return null;
    const out = this.smallBuffer();
    this.recordSum(this.postBuffer, this.backend.nX * this.backend.nY, {
      masked: true,
      scale: dA,
      output: out,
    });
    return (await this.readBack(out, 16))[0];
  }

  // A buffer for a single vec4f result, for readBack(), which destroys it. Each call returns
  // a fresh one, as several results may be pending at once.
  smallBuffer() {
    return this.device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });
  }

  /**
   * Reads the post-processed values back, as WebGL's fillBuffer() does (RGBA per node, row by
   * row from the bottom).
   * @returns {Promise<Float32Array>}
   */
  async readPost() {
    if (!this.postFits()) return null;
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
   * @param {Object[]} [options.meshes] - Instanced meshes to draw in a flat colour: geometry
   *   (a three.js BufferGeometry), matrices (each instance's world matrix, 16 floats apiece),
   *   viewMatrix (the camera's inverse world matrix) and colour (RGBA).
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
    meshes = [],
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
    meshes.forEach((m, k) => {
      const count = m.matrices.length / 16;
      if (!count) return;
      const g = this.meshGeometry(m.geometry);
      const r = this.meshResource(k, m.matrices.byteLength);
      const uniforms = new Float32Array(20);
      uniforms.set(toClip(m.viewMatrix), 0);
      uniforms.set(m.colour, 16);
      this.device.queue.writeBuffer(r.uniforms, 0, uniforms);
      this.device.queue.writeBuffer(r.instances, 0, m.matrices);
      pass.setPipeline(this.pipelines.mesh);
      pass.setBindGroup(0, r.bindGroup);
      pass.setVertexBuffer(0, g.positions);
      pass.setVertexBuffer(1, r.instances);
      pass.setIndexBuffer(g.index, "uint32");
      pass.drawIndexed(g.count, count);
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
      const bindGroup = this.displayBindGroup(this.cameraBuffer);
      pass.setPipeline(this.pipelines.display);
      pass.setBindGroup(0, bindGroup);
      pass.setVertexBuffer(0, this.geometry.buffers[0]);
      pass.setVertexBuffer(1, this.geometry.buffers[1]);
      pass.setIndexBuffer(this.geometry.buffers[2], "uint32");
      pass.drawIndexed(this.geometry.count);
    }
    pass.end();
  }

  displayBindGroup(cameraBuffer) {
    const backend = this.backend;
    return this.device.createBindGroup({
      layout: this.displayLayout,
      entries: [
        { binding: 0, resource: { buffer: this.simUniforms } },
        { binding: 1, resource: { buffer: backend.paramsBuffer } },
        ...this.stateEntries(),
        { binding: 3, resource: { buffer: this.postBuffer } },
        { binding: 4, resource: { buffer: this.displayValues } },
        ...this.imageEntries(5),
        { binding: 8, resource: { buffer: cameraBuffer } },
        { binding: 9, resource: { buffer: backend.globalsBuffer } },
        { binding: 10, resource: backend.images[2].createView() },
      ],
    });
  }

  /**
   * Finds the texture coordinates of the display mesh under a pixel, as setBrushCoords()
   * does on WebGL for surface plots: projection is the camera's projection with its view
   * offset set to that one pixel. Resolves to [u, v], or null if the pixel misses the mesh.
   * The mesh is drawn as last drawn by draw().
   * @returns {Promise<number[]|null>}
   */
  async pick(projection, modelView, heightMode) {
    if (!this.pipelines.pick || !this.geometry || !this.postBuffer) return null;
    const device = this.device;
    const target = device.createTexture({
      size: [1, 1],
      format: "rgba32float",
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
    });
    const depth = device.createTexture({
      size: [1, 1],
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    const camera = device.createBuffer({ size: 80, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    const cameraData = new ArrayBuffer(80);
    new Float32Array(cameraData, 0, 16).set(
      multiply(DEPTH_TO_WEBGPU, multiply(projection, modelView)),
    );
    new Uint32Array(cameraData, 64, 1)[0] = heightMode;
    device.queue.writeBuffer(camera, 0, cameraData);
    const encoder = this.backend.getEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        { view: target.createView(), clearValue: { r: -1, g: -1, b: 0, a: 0 }, loadOp: "clear", storeOp: "store" },
      ],
      depthStencilAttachment: {
        view: depth.createView(),
        depthClearValue: 1,
        depthLoadOp: "clear",
        depthStoreOp: "discard",
      },
    });
    pass.setPipeline(this.pipelines.pick);
    pass.setBindGroup(0, this.displayBindGroup(camera));
    pass.setVertexBuffer(0, this.geometry.buffers[0]);
    pass.setVertexBuffer(1, this.geometry.buffers[1]);
    pass.setIndexBuffer(this.geometry.buffers[2], "uint32");
    pass.drawIndexed(this.geometry.count);
    pass.end();
    const staging = device.createBuffer({ size: 16, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST });
    encoder.copyTextureToBuffer({ texture: target }, { buffer: staging, bytesPerRow: 256 }, [1, 1]);
    this.backend.flush();
    await staging.mapAsync(GPUMapMode.READ);
    const [u, v, , a] = new Float32Array(staging.getMappedRange().slice(0));
    staging.destroy();
    target.destroy();
    depth.destroy();
    camera.destroy();
    return a > 0 ? [u, v] : null;
  }

  // Makes a search for the minimum and maximum requested while the last was under way.
  requestMinMaxAgain() {
    const onResult = this.minMaxAgain;
    this.minMaxAgain = null;
    if (onResult) this.requestMinMax(onResult);
  }

  /**
   * Marks the minimum and maximum found so far, and any being found, as of a state that's
   * been replaced (e.g. by a reset), so that nothing (such as the check for NaNs) takes them
   * for the current state's.
   */
  discardMinMax() {
    this.minMaxGeneration++;
    this.minMaxCurrent = false;
  }

  /**
   * Starts finding the minimum and maximum post-processed values, unless a search is already
   * under way, and returns the most recent result. Readback is asynchronous, so the result
   * lags by a frame or so; onResult is called when a new one arrives.
   * @param {(minMax: number[]) => void} [onResult]
   * @returns {number[]}
   */
  requestMinMax(onResult) {
    if (this.minMaxPending) {
      // Found again once this search is done, as the values may have changed since it began.
      this.minMaxAgain = onResult ?? (() => {});
      return this.minMax;
    }
    if (!this.postFits()) return this.minMax;
    const generation = this.minMaxGeneration;
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
        this.minMaxPending = false;
        // Unless of a state since replaced, so of no use.
        if (generation == this.minMaxGeneration) {
          this.minMax = [low, high];
          this.minMaxCurrent = true;
          onResult?.(this.minMax);
        }
        this.requestMinMaxAgain();
      },
      () => {
        staging.destroy();
        this.minMaxPending = false;
        this.requestMinMaxAgain();
      },
    );
    return this.minMax;
  }
}
