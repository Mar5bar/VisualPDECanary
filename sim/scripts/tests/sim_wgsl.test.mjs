import { test } from "node:test";
import assert from "node:assert/strict";
import {
  WORKGROUP_SIZE,
  workgroupSizeFor,
  parseWorkgroupSize,
  timestepShader,
  clearShader,
} from "../RD/webgpu/sim_wgsl.js";

// The limits every WebGPU device supports.
const LIMITS = {
  maxComputeWorkgroupSizeX: 256,
  maxComputeWorkgroupSizeY: 256,
  maxComputeInvocationsPerWorkgroup: 256,
};

test("workgroupSizeFor: by vendor, whatever its case, and the default for others or none", () => {
  assert.deepEqual(workgroupSizeFor("arm"), [8, 8]);
  assert.deepEqual(workgroupSizeFor("ARM"), [8, 8]);
  assert.deepEqual(workgroupSizeFor("apple"), WORKGROUP_SIZE);
  assert.deepEqual(workgroupSizeFor(""), WORKGROUP_SIZE);
  assert.deepEqual(workgroupSizeFor(undefined), WORKGROUP_SIZE);
});

test("parseWorkgroupSize: WxH within the device's limits, and null otherwise", () => {
  assert.deepEqual(parseWorkgroupSize("8x8", LIMITS), [8, 8]);
  assert.deepEqual(parseWorkgroupSize("256x1", LIMITS), [256, 1]);
  assert.equal(parseWorkgroupSize("32x16", LIMITS), null);
  assert.equal(parseWorkgroupSize("0x8", LIMITS), null);
  assert.equal(parseWorkgroupSize("8", LIMITS), null);
  assert.equal(parseWorkgroupSize("8x8;", LIMITS), null);
  assert.equal(parseWorkgroupSize(null, LIMITS), null);
});

function parts(overrides = {}) {
  return {
    numGroups: 1,
    formats: ["r32float"],
    clamp: [[false, false]],
    paramNames: [],
    minX: "0.0",
    minY: "0.0",
    timescales: "vec4(1.0, 1.0, 1.0, 1.0)",
    timescalesGroup1: "vec4(1.0, 1.0, 1.0, 1.0)",
    bot: { FE: "" },
    middle: "result = vec4(0.0); }",
    body: "float u = 0.0; float v = 0.0; float w = 0.0; float q = 0.0;",
    ...overrides,
  };
}

test("kernels use the parts' workgroup size, or WORKGROUP_SIZE", () => {
  assert.match(timestepShader("FE", parts()), new RegExp(`@workgroup_size\\(${WORKGROUP_SIZE.join(", ")}\\)`));
  assert.match(timestepShader("FE", parts({ workgroupSize: [8, 4] })), /@workgroup_size\(8, 4\)/);
  assert.match(clearShader(parts({ workgroupSize: [8, 4] })), /@workgroup_size\(8, 4\)/);
});
