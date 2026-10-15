// values.js
//
// Passes named values (the uniforms GLSL shaders read, such as colour limits or the brush
// position) to WGSL without a hand-written struct per shader.

/**
 * Describes a block of named values (uniforms the GLSL shaders read, such as colour limits),
 * each stored in one vec4f of a storage buffer, so that any set of them can be passed
 * without a hand-written struct.
 */
export class ValueLayout {
  /** @param {[string, "f32"|"vec2f"|"vec3f"|"vec4f"|"bool"][]} entries */
  constructor(entries) {
    this.entries = entries;
  }

  /** WGSL declaring each value as a local, read from the array named `array`. */
  lets(array) {
    const swizzle = { f32: ".x", vec2f: ".xy", vec3f: ".xyz", vec4f: "" };
    return this.entries
      .map(([name, type], k) =>
        type == "bool"
          ? `  let ${name} = ${array}[${k}].x != 0.0;`
          : `  let ${name} = ${array}[${k}]${swizzle[type]};`,
      )
      .join("\n");
  }

  /**
   * Packs values (numbers, booleans, arrays or three.js vectors and colours) into a buffer.
   * @param {Object} values
   */
  pack(values) {
    const data = new Float32Array(4 * Math.max(1, this.entries.length));
    this.entries.forEach(([name], k) => {
      const v = values[name];
      let components;
      if (typeof v == "boolean") components = [v ? 1 : 0];
      else if (typeof v == "number") components = [v];
      else if (Array.isArray(v)) components = v;
      else if (v && "r" in v && "g" in v) components = [v.r, v.g, v.b];
      else if (v && "x" in v) components = [v.x, v.y, v.z ?? 0, v.w ?? 0];
      else components = [0];
      data.set(components.slice(0, 4), 4 * k);
    });
    return data;
  }
}

