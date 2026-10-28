import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { encodeOptions, decodeOptions, payloadV1 } from "../RD/url_codec.js";
import { minifyPreset } from "../RD/minify_preset.js";
import {
  getResolvedPreset,
  getListOfPresetNames,
  getFieldsInView,
} from "../RD/presets.js";
import { LZString } from "../lz-string.min.js";

// The data that links in format v1 depend on. If this fails, url_codec_v1_data.js's data has
// been changed, which would break existing links: revert it, and add a new format instead.
// The data is hashed, rather than the file, so that reformatting the file doesn't count.
test("url_codec_v1_data.js is unchanged", async () => {
  const data = await import("../RD/url_codec_v1_data.js");
  const hash = createHash("sha256")
    .update(JSON.stringify(Object.keys(data).sort().map((k) => [k, data[k]])))
    .digest("hex");
  assert.equal(
    hash,
    "a697321a2310bf07de94bc713da10f36600a2eb63211dfd751e31fc3d23c9983",
  );
});

/**
 * Approximates the options of a loaded preset: the resolved preset, with its views filled in
 * from the top level as configureViews() does.
 */
function loadedOptions(name) {
  const options = getResolvedPreset(name);
  const fields = getFieldsInView();
  const fromTop = () =>
    Object.fromEntries(
      fields.filter((k) => k in options).map((k) => [k, options[k]]),
    );
  options.views = options.views.length
    ? options.views.map((view) => Object.assign(fromTop(), view))
    : [Object.assign(fromTop(), { name: "1" })];
  return JSON.parse(JSON.stringify(options));
}

test("encodeOptions/decodeOptions round-trip every preset", () => {
  for (const name of getListOfPresetNames()) {
    const options = loadedOptions(name);
    const encoded = encodeOptions(options);
    assert.match(encoded, /^_1[A-Za-z0-9_-]+$/);
    const decoded = decodeOptions(encoded);
    const expected = Object.assign({}, options, {
      preset: "Custom",
      parent: null,
    });
    assert.deepEqual(decoded, expected, name);
  }
});

test("encodeOptions is deterministic", () => {
  const options = loadedOptions("DurhamConvection");
  assert.equal(
    encodeOptions(options),
    encodeOptions(JSON.parse(JSON.stringify(options))),
  );
});

test("encodeOptions produces much shorter strings than the legacy format", () => {
  for (const name of ["DurhamConvection", "NavierStokes", "GrayScott"]) {
    const options = loadedOptions(name);
    const legacy = LZString.compressToEncodedURIComponent(
      JSON.stringify(minifyPreset(options)),
    );
    assert.ok(encodeOptions(options).length < legacy.length / 3, name);
  }
});

test("decodeOptions: decodes a legacy minified link", () => {
  // As produced by the GrayScott preset before format v1.
  const decoded = decodeOptions(
    "N4IgxiBcIG4JYCc4BM4GcQBoTIKq6hAEYscA1MwgJlOQHU7CAGWjaIpz0sA6F7MJXakA1oQCGAXiYA6JgGYA7AAI4AO2UBtJpllEAugG4ARtLkA2VRu1yALLpkHDpALbjmMpa7jNSAB0IAYQBXNAAXAHsXfwQI4wBTADFgtUJgmLj4gBl4tQBzMIALKHlOHRAEXhBggD0qACoYZQBaZQAKcQBqYwBKevTsBCEQZtqGps7lcXq2ohblGB7SBEY+UjQA6Hl11OhghdIwuBd4tDBxABtTqDCEYPjsGChNUHEEWIB3QIiLiOCEKDmACsQPkQOwb0+ABFcmg4GEAJ5QWTgkCQiIfHL5IoAWXEAA9CCQIe8MQBlc5XCTBSKkdEfAAahCyAH18QB6KjzQkkz4ATWZLIRnPmSIhNIiZPiYW+v3+ACVxPl4lAAGaXNAPcDiE4IcQAFUK0vckFKAh18T1AAVCj5TeVzrrxAAtCJRZEyAAcAh+fwQbk2sEQKHQ3F9-2MbzVGq1YAiaki-zY6oump9Cb9sr9yPTiYQAFE-HDfrtZEwiLm-QA5YLRSCosChSIuMn-dVgFWQFNpkDxFzGCJoZMx7B9gdDgCC-bguTCHtRY8HaChcFVqtCndk5lH-aXNrtRBkQMUTG9vd3Q7JtrUSMgHB347QZJcbqKalObFkVAfS7JfnijYXFGkBfj+Q6GsaHqKJ6QL2CAqoXHAfj-sgWb-AG0aplqiHvnQKC4sEFxQBWIBuPiaFDJc9weF42AuOoFFkFRnYgPwIARDAlpAbe3ZahxXHiAiFE5uxnEINxhbFvGHqcKi-HiYJ+b4n4ALCNg8ncVk6jxHhyAEURd7YH4vxhPqCL-oQxlKiqRmxMY6h5JhPYqZkyS7NUGQJFiBTFPanC2ZkZkWdA6hhPEeR6kRAUJEyazRfEApxSAaBtuIHZub42BFAg8TxFCAAS8RwHkhRhBSlybjIiiPABkQIIkM4XMgTlah8hTiKZERWiZaSkGoFpEiAAC++jYB8zV7KQHyBgMyXHPq8JUtAADieoIoAyAQUhEYRzkNQA",
  );
  assert.equal(decoded.preset, "Custom");
  assert.equal(
    decoded.kineticParams,
    "a=0.037 in [0,0.1];b=0.06 in [0.04,0.1];",
  );
  assert.equal(decoded.reactionStr_1, "u^2*v - (a+b)*u");
  assert.equal(decoded.views.length, 1);
  assert.equal(decoded.views[0].colourmap, "viridis");
});

test("decodeOptions: decodes a legacy link without minified names", () => {
  const encoded = LZString.compressToEncodedURIComponent(
    JSON.stringify({ preset: "Custom", numSpecies: 3, kineticParams: "a = 1" }),
  );
  assert.deepEqual(decodeOptions(encoded), {
    preset: "Custom",
    numSpecies: 3,
    kineticParams: "a = 1",
  });
});

test("decodeOptions: decodes legacy links whose + has become a space", () => {
  const options = { p: "Custom", k: "a = 1;b = 2;c = 3;d = 4;e = 5;" };
  const encoded = LZString.compressToEncodedURIComponent(
    JSON.stringify(options),
  );
  assert.equal(
    decodeOptions(encoded.replaceAll("+", " ")).kineticParams,
    options.k,
  );
});

test("decodeOptions: throws on damaged or unknown links", () => {
  const encoded = encodeOptions(loadedOptions("DurhamConvection"));
  assert.throws(() => decodeOptions(encoded.slice(0, encoded.length / 2)));
  assert.throws(() => decodeOptions("_9abc"));
  assert.throws(() => decodeOptions("not a link"));
});

test("decodeOptions: gives links from before overlayLineStyle a solid overlay", () => {
  // NoisyFHN (with an overlay in some of its views), as encoded before overlayLineStyle.
  const decoded = decodeOptions(
    "_1jZ2xEYAwDANnIhRswQqMQEPL7ihyzo5yDlBjOKBIYll-NxycDPNK0Y7d0C4ul_r3O7P5PFNeOPj8IjEqdV7DvYvEz4LgYkbQr3mU8tzvYS3OgWVUd6_AXOIYloDMafp12MG6BTYDbeDOymB7vYMcwvOLvX1EUk74rczKckBlFexrmoYajon29RXg2zuK1V2o6NNRtJ9oWlH6trG6WxnE2uQUrt7LS4jwUQsutzX4rfQFW6BuBPyCoLoB0D1cj_W_BJ7UhKw3gex-AA",
  );
  assert.equal(decoded.overlayLineStyle, "solid");
  assert.ok(decoded.views.length > 1);
  for (const view of decoded.views) assert.equal(view.overlayLineStyle, "solid");
});

test("encodeOptions: leaves a solid overlay out of links, and keeps any other", () => {
  const options = loadedOptions("NoisyFHN");
  assert.doesNotMatch(payloadV1(options), /oLS|overlayLineStyle/);
  // As choosing styles in the first and second views would leave them.
  options.overlayLineStyle = options.views[0].overlayLineStyle = "dotted";
  options.views[1].overlayLineStyle = "looselyDashed";
  const decoded = decodeOptions(encodeOptions(options));
  assert.equal(decoded.overlayLineStyle, "dotted");
  assert.equal(decoded.views[0].overlayLineStyle, "dotted");
  assert.equal(decoded.views[1].overlayLineStyle, "looselyDashed");
});
