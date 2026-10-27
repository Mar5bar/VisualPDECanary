// simulation_shaders.js

import {
  groupOfSpecies,
  channelCharOfSpecies,
  diffusionLabel,
  reactionTokenOfSpecies,
} from "./species_config.js";
import { BASE_STENCIL, stencilName, outsideTests } from "./derivatives.js";

const glslFloat = (n) => (Number.isInteger(n) ? n.toFixed(1) : String(n));

/**
 * Adds stencil points beyond the 9 that the simulation's templates hard-code (needed by
 * derivatives of expressions, see derivatives.js) to RDShaderTop/RDShaderMain or their MRT
 * counterparts. Each point (i, j) is fetched, passed to computeRHS and declared exactly as the
 * BB point is, alongside it, so the templates are unchanged when there are none.
 * @param {string} shader - The template's code.
 * @param {number[][]} extra - The points to add, as [i, j] offsets in nodes.
 * @param {string[]} [prefixes] - The stencil prefixes, one per species group.
 * @returns {string} The shader code.
 */
export function addStencilPoints(shader, extra, prefixes = ["uvwq"]) {
  if (!extra.length) return shader;
  const names = extra.map(([i, j]) => stencilName(i, j));
  const each = (indent, f) => names.map((n, k) => "\n" + indent + f(n, k)).join("");
  shader = shader.replace(/^([ \t]*)vec2 textureCoordsBB = .*$/gm, (m, indent) =>
    m +
    each(
      indent,
      (n, k) =>
        `vec2 textureCoords${n} = textureCoords + vec2(${glslFloat(extra[k][0])}*step_x, ${glslFloat(extra[k][1])}*step_y);`,
    ),
  );
  for (const P of prefixes) {
    shader = shader
      .replace(new RegExp(`\\bvec4 ${P}BBIn\\b`, "g"), (m) =>
        names.reduce((s, n) => s + `, vec4 ${P}${n}In`, m),
      )
      .replace(new RegExp(`^([ \\t]*)vec4 ${P}BB = ${P}BBIn;$`, "gm"), (m, indent) =>
        m + each(indent, (n) => `vec4 ${P}${n} = ${P}${n}In;`),
      )
      .replace(new RegExp(`^([ \\t]*)vec4 ${P}BB;$`, "gm"), (m, indent) =>
        m + each(indent, (n) => `vec4 ${P}${n};`),
      )
      .replace(
        new RegExp(`^([ \\t]*)${P}BB = (.*\\btextureCoordsBB\\b.*);$`, "gm"),
        (m, indent, value) =>
          m +
          each(
            indent,
            (n) => `${P}${n} = ${value.replaceAll(/\btextureCoordsBB\b/g, "textureCoords" + n)};`,
          ),
      )
      // computeRHS calls.
      .replace(new RegExp(`\\b${P}BB(?=, )`, "g"), (m) =>
        names.reduce((s, n) => s + `, ${P}${n}`, m),
      );
  }
  return shader;
}

const isFirstRing = ([i, j]) => Math.abs(i) + Math.abs(j) <= 1;

// For a point (i, j) beyond an edge of the domain, from a node c nodes in from that edge
// along the given axis (0 for x, 1 for y): how many nodes beyond the edge it is, its mirror
// image in the edge node, and the edge node itself, all as offsets from the current node.
// Only defined for the c that put the point beyond the edge, i.e. c < |offset along axis|.
function beyondEdge([i, j], axis, c) {
  const d = axis == 0 ? i : j;
  const s = Math.sign(d);
  const m = Math.abs(d) - c;
  const along = (k) => (axis == 0 ? [k, j] : [i, k]);
  return { m, mirror: along(s * (2 * c - Math.abs(d))), edge: along(s * c) };
}

/**
 * The stencil points needed to fill in the given points wherever they lie beyond the domain's
 * edges (see extendedGhostShader): the points themselves, plus the mirror images and edge
 * nodes those are filled from, repeatedly. In a domain given by an indicator function, any
 * node on the line through a point along each axis, as far from the node on either side, can
 * be its mirror image or edge node, or be tested to find the edge.
 * @param {number[][]} offsets - [i, j] offsets in nodes.
 * @param {boolean} twoD - Whether there are edges in y.
 * @param {Object} [opts]
 * @param {boolean} [opts.customDomain] - Whether the domain is given by an indicator function.
 * @param {boolean} [opts.firstRing] - Whether the first ring's points need filling in too,
 *   as where no boundary condition shaders have filled them (see stateStencilShader).
 * @param {number} [opts.below] - How many nodes on the near side of the edge are used.
 * @returns {number[][]} Every point needed, sorted so that the order is stable.
 */
export function stencilClosure(
  offsets,
  twoD,
  { customDomain = false, firstRing = false, below = 0 } = {},
) {
  const points = new Map(offsets.map((p) => [p.join(","), p]));
  const queue = [...offsets];
  while (queue.length) {
    const p = queue.pop();
    if (isFirstRing(p) && !(firstRing && p.some((c) => c != 0))) continue;
    for (const axis of twoD ? [0, 1] : [0]) {
      const d = Math.abs(p[axis]);
      if (d == 0) continue;
      const sources = [];
      if (customDomain) {
        // The edge is found along the axis through the node, and applies to the point's line.
        for (let t = -d - below; t <= d; t++) {
          sources.push(axis == 0 ? [t, p[1]] : [p[0], t], axis == 0 ? [t, 0] : [0, t]);
        }
      } else {
        for (let c = 0; c < d; c++) {
          const { mirror, edge } = beyondEdge(p, axis, c);
          sources.push(mirror, edge);
        }
      }
      for (const q of sources) {
        {
          if (!points.has(q.join(","))) {
            points.set(q.join(","), q);
            queue.push(q);
          }
        }
      }
    }
  }
  return [...points.values()].sort((a, b) => a[1] - b[1] || a[0] - b[0]);
}

/**
 * The stencil points of `points` that the templates don't already fetch.
 * @param {number[][]} points
 * @returns {number[][]}
 */
export function extraStencilPoints(points) {
  const base = new Set(BASE_STENCIL.map((p) => p.join(",")));
  return points.filter((p) => !base.has(p.join(",")));
}

/**
 * Fills in the stencil points beyond the first ring (LL, RT and so on) wherever they lie
 * beyond the domain's edges, consistently with each species' boundary conditions, as the
 * Neumann, Robin and ghost shaders do for L, R, T and B:
 *   - Neumann and Robin: even reflection in the edge node, plus the flux, so the point m
 *     nodes beyond the edge is its mirror image plus 2*m*dx*robinRHS.
 *   - Dirichlet: odd reflection in the edge node (2*edge - mirror).
 *   - Ghost: the ghost value.
 *   - Periodic: unchanged, as the textures wrap.
 * Points beyond an edge in x are filled first, then those beyond an edge in y, from points
 * that have already been filled in x, which handles the corners.
 *
 * In a domain given by an indicator function (customDomain), the edge along each axis is
 * instead the last node before the first one, going out from the node along that axis, that
 * customDomain.outside says is outside, as RDShaderRobinCustomDomainX/Y find it for L, R, T
 * and B. The edges are found along the axes through the node, and points are reflected in
 * them along their own row or column, so a point outside the domain only because of an edge
 * in x isn't reflected in y as well. There, Neumann conditions reflect as above, except where the mirror image is itself
 * outside (a part of the domain too thin to reflect in), when the point m nodes beyond the
 * edge is the edge node plus m*dx*robinRHS, as those shaders' one-sided fallback. Dirichlet
 * conditions need nothing, as every node outside the domain holds the boundary value.
 * @param {number[][]} points - Every stencil point, from stencilClosure.
 * @param {Object[]} species - Per species: its stencil prefix ("uvwq" or "uvwq2"), channel
 *   ("r" etc.) and name, and its rule at each edge, {L, R, T, B}, each one of
 *   {type: "periodic"}, {type: "reflect"}, {type: "dirichlet"} or {type: "ghost", value}.
 * @param {boolean} twoD - Whether there are edges in y.
 * @param {{outside: (q: number[], axis: number) => string}} [customDomain] - outside gives a
 *   GLSL bool for whether the node at offset q is outside the domain, tested along axis.
 * @returns {string} The shader code.
 */
export function extendedGhostShader(points, species, twoD, customDomain) {
  if (customDomain) return customDomainGhostShader(points, species, twoD, customDomain);
  const conditions = {
    L: (c) => `textureCoords.x < ${glslFloat(c + 1)}*step_x`,
    R: (c) => `textureCoords.x > 1.0 - ${glslFloat(c + 1)}*step_x`,
    B: (c) => `textureCoords.y < ${glslFloat(c + 1)}*step_y`,
    T: (c) => `textureCoords.y > 1.0 - ${glslFloat(c + 1)}*step_y`,
  };
  let out = "";
  for (const axis of twoD ? [0, 1] : [0]) {
    for (const p of points) {
      if (isFirstRing(p) || p[axis] == 0) continue;
      const side = axis == 0 ? (p[0] < 0 ? "L" : "R") : p[1] < 0 ? "B" : "T";
      const h = axis == 0 ? "dx" : "dy";
      for (const { prefix, channel, name, rules } of species) {
        const rule = rules[side];
        if (rule.type == "periodic") continue;
        const at = (q) => prefix + stencilName(...q) + "." + channel;
        const branches = [];
        for (let c = 0; c < Math.abs(p[axis]); c++) {
          const { m, mirror, edge } = beyondEdge(p, axis, c);
          let value;
          if (rule.type == "reflect") {
            value = `${at(mirror)} + ${glslFloat(2 * m)}*(${h} * robinRHS${name}${side})`;
          } else if (rule.type == "dirichlet") {
            value = `2.0*${at(edge)} - ${at(mirror)}`;
          } else {
            value = `(${rule.value})`;
          }
          branches.push(`if (${conditions[side](c)}) {\n        ${at(p)} = ${value};\n    }`);
        }
        out += "\n    " + branches.join(" else ") + "\n";
      }
    }
  }
  return out;
}

function customDomainGhostShader(points, species, twoD, { outside }) {
  const tests = outsideTests(outside);
  let out = "";
  for (const axis of twoD ? [0, 1] : [0]) {
    for (const p of points) {
      if (isFirstRing(p) || p[axis] == 0) continue;
      const s = Math.sign(p[axis]);
      const d = Math.abs(p[axis]);
      // Points on the point's line, and nodes on the axis through the node.
      const along = (t) => (axis == 0 ? [s * t, p[1]] : [p[0], s * t]);
      const onAxis = (t) => (axis == 0 ? [s * t, 0] : [0, s * t]);
      const side = axis == 0 ? (s < 0 ? "L" : "R") : s < 0 ? "B" : "T";
      const h = axis == 0 ? "dx" : "dy";
      for (const { prefix, channel, name, rules } of species) {
        if (rules[side].type != "reflect") continue;
        const at = (q) => prefix + stencilName(...q) + "." + channel;
        const flux = `(${h} * robinRHS${name}${side})`;
        const branches = [];
        for (let k = 1; k <= d; k++) {
          // The edge node is the last before the first node outside, k nodes along.
          const edge = k - 1;
          const m = d - edge;
          const mirror = along(edge - m);
          const value =
            `${tests.test(onAxis(edge - m), axis)} ? ${at(along(edge))} + ${glslFloat(m)}*${flux}` +
            ` : ${at(mirror)} + ${glslFloat(2 * m)}*${flux}`;
          branches.push(`if (${tests.test(onAxis(k), axis)}) {\n        ${at(p)} = ${value};\n    }`);
        }
        out += "\n    " + branches.join(" else ") + "\n";
      }
    }
  }
  return out ? tests.declarations() + out : "";
}

/**
 * Generates the top part of a shader for reaction-diffusion simulation based on the given timestepping scheme.
 * @param {string} type - The timestepping scheme to generate the shader for.
 * @returns {string} The generated shader code.
 */
export function RDShaderTop(type) {
  let numInputs = 0;
  switch (type) {
    case "FE":
      numInputs = 2;
      break;
    case "AB2":
      numInputs = 2;
      break;
    case "Mid1":
      numInputs = 1;
      break;
    case "Mid2":
      numInputs = 2;
      break;
    case "RK41":
      numInputs = 1;
      break;
    case "RK42":
      numInputs = 2;
      break;
    case "RK43":
      numInputs = 3;
      break;
    case "RK44":
      numInputs = 4;
      break;
  }
  let parts = [];
  parts[0] =
    "precision highp float; precision highp sampler2D; varying vec2 textureCoords;";
  parts[1] = "uniform sampler2D textureSource;";
  parts[2] = "uniform sampler2D textureSource1;";
  parts[3] = "uniform sampler2D textureSource2;";
  parts[4] = "uniform sampler2D textureSource3;";
  return (
    parts.slice(0, numInputs + 1).join("\n") +
    `
    uniform float dt;
    uniform float dx;
    uniform float dy;
    uniform float L;
    uniform float L_x;
    uniform float L_y;
    uniform float L_min;
    uniform float t;
    uniform float seed;
    uniform float globalIntegralValue1;
    uniform float globalIntegralValue2;
    uniform float globalIntegralValue3;
    uniform float globalIntegralValue4;
    uniform sampler2D imageSourceOne;
    uniform sampler2D imageSourceTwo;

    AUXILIARY_GLSL_FUNS

    const float ALPHA = 0.147;
    const float INV_ALPHA = 1.0 / ALPHA;
    const float BETA = 2.0 / (pi * ALPHA);
    float erfinv(float pERF) {
      float yERF;
      if (pERF == -1.0) {
        yERF = log(1.0 - (-0.99)*(-0.99));
      } else {
        yERF = log(1.0 - pERF*pERF);
      }
      float zERF = BETA + 0.5 * yERF;
      return sqrt(sqrt(zERF*zERF - yERF * INV_ALPHA) - zERF) * sign(pERF);
    }

    void computeRHS(sampler2D textureSource, float t, vec4 uvwqIn, vec4 uvwqLIn, vec4 uvwqRIn, vec4 uvwqTIn, vec4 uvwqBIn, vec4 uvwqLLIn, vec4 uvwqRRIn, vec4 uvwqTTIn, vec4 uvwqBBIn, out highp vec4 result) {

        ivec2 texSize = textureSize(textureSource,0);
        float step_x = 1.0 / float(texSize.x);
        float step_y = 1.0 / float(texSize.y);
        float x = textureCoords.x * L_x + MINX;
        float y = textureCoords.y * L_y + MINY;
        float interior = float(textureCoords.x > 0.75*step_x && textureCoords.x < 1.0 - 0.75*step_x && textureCoords.y > 0.5*step_y && textureCoords.y < 1.0 - 0.75*step_y);
        float exterior = 1.0 - interior;
        vec2 dSquared = 1.0/vec2(dx*dx, dy*dy);
        vec2 textureCoordsL = textureCoords + vec2(-step_x, 0.0);
        vec2 textureCoordsLL = textureCoordsL + vec2(-step_x, 0.0);
        vec2 textureCoordsR = textureCoords + vec2(+step_x, 0.0);
        vec2 textureCoordsRR = textureCoordsR + vec2(+step_x, 0.0);
        vec2 textureCoordsT = textureCoords + vec2(0.0, +step_y);
        vec2 textureCoordsTT = textureCoordsT + vec2(0.0, +step_y);
        vec2 textureCoordsB = textureCoords + vec2(0.0, -step_y);
        vec2 textureCoordsBB = textureCoordsB + vec2(0.0, -step_y);

        vec4 uvwq = uvwqIn;
        vec4 uvwqL = uvwqLIn;
        vec4 uvwqLL = uvwqLLIn;
        vec4 uvwqR = uvwqRIn;
        vec4 uvwqRR = uvwqRRIn;
        vec4 uvwqT = uvwqTIn;
        vec4 uvwqTT = uvwqTTIn;
        vec4 uvwqB = uvwqBIn;
        vec4 uvwqBB = uvwqBBIn;
    `
  );
}

/**
 * Generates shader code based on the timestepping scheme.
 * @param {string} type - The type of timestepping scheme ("FE", "AB2", "Mid1", "Mid2", "RK41", "RK42", "RK43", "RK44").
 * @returns {string} - The generated shader code.
 */
export function RDShaderMain(type) {
  let update = {};
  update.FE = `uvwq = texture2D(textureSource, textureCoords);
    uvwqL = texture2D(textureSource, textureCoordsL);
    uvwqR = texture2D(textureSource, textureCoordsR);
    uvwqT = texture2D(textureSource, textureCoordsT);
    uvwqB = texture2D(textureSource, textureCoordsB);
    uvwqLL = texture2D(textureSource, textureCoordsLL);
    uvwqRR = texture2D(textureSource, textureCoordsRR);
    uvwqTT = texture2D(textureSource, textureCoordsTT);
    uvwqBB = texture2D(textureSource, textureCoordsBB);
    computeRHS(textureSource, t, uvwq, uvwqL, uvwqR, uvwqT, uvwqB, uvwqLL, uvwqRR, uvwqTT, uvwqBB, RHS);
    vec4 timescales = TIMESCALES;
    updated = dt * RHS / timescales + uvwq;`;
  update.AB2 = `uvwq = texture2D(textureSource, textureCoords);
    uvwqL = texture2D(textureSource, textureCoordsL);
    uvwqR = texture2D(textureSource, textureCoordsR);
    uvwqT = texture2D(textureSource, textureCoordsT);
    uvwqB = texture2D(textureSource, textureCoordsB);
    uvwqLL = texture2D(textureSource, textureCoordsLL);
    uvwqRR = texture2D(textureSource, textureCoordsRR);
    uvwqTT = texture2D(textureSource, textureCoordsTT);
    uvwqBB = texture2D(textureSource, textureCoordsBB);
    computeRHS(textureSource, t, uvwq, uvwqL, uvwqR, uvwqT, uvwqB, uvwqLL, uvwqRR, uvwqTT, uvwqBB, RHS1);
    uvwq = texture2D(textureSource1, textureCoords);
    uvwqL = texture2D(textureSource1, textureCoordsL);
    uvwqR = texture2D(textureSource1, textureCoordsR);
    uvwqT = texture2D(textureSource1, textureCoordsT);
    uvwqB = texture2D(textureSource1, textureCoordsB);
    uvwqLL = texture2D(textureSource1, textureCoordsLL);
    uvwqRR = texture2D(textureSource1, textureCoordsRR);
    uvwqTT = texture2D(textureSource1, textureCoordsTT);
    uvwqBB = texture2D(textureSource1, textureCoordsBB);
    computeRHS(textureSource1, t - dt, uvwq, uvwqL, uvwqR, uvwqT, uvwqB, uvwqLL, uvwqRR, uvwqTT, uvwqBB, RHS2);
    RHS = 1.5 * RHS1 - 0.5 * RHS2;
    vec4 timescales = TIMESCALES;
    updated = dt * RHS / timescales + texture2D(textureSource, textureCoords);`;
  update.Mid1 = `uvwq = texture2D(textureSource, textureCoords);
    uvwqL = texture2D(textureSource, textureCoordsL);
    uvwqR = texture2D(textureSource, textureCoordsR);
    uvwqT = texture2D(textureSource, textureCoordsT);
    uvwqB = texture2D(textureSource, textureCoordsB);
    uvwqLL = texture2D(textureSource, textureCoordsLL);
    uvwqRR = texture2D(textureSource, textureCoordsRR);
    uvwqTT = texture2D(textureSource, textureCoordsTT);
    uvwqBB = texture2D(textureSource, textureCoordsBB);
    computeRHS(textureSource, t, uvwq, uvwqL, uvwqR, uvwqT, uvwqB, uvwqLL, uvwqRR, uvwqTT, uvwqBB, RHS);
    vec4 timescales = TIMESCALES;
    updated = RHS / timescales;`;
  update.Mid2 = `uvwqLast = texture2D(textureSource, textureCoords);
    uvwq = uvwqLast + 0.5*dt*texture2D(textureSource1, textureCoords);
    uvwqL = texture2D(textureSource, textureCoordsL) + 0.5*dt*texture2D(textureSource1, textureCoordsL);
    uvwqR = texture2D(textureSource, textureCoordsR) + 0.5*dt*texture2D(textureSource1, textureCoordsR);
    uvwqT = texture2D(textureSource, textureCoordsT) + 0.5*dt*texture2D(textureSource1, textureCoordsT);
    uvwqB = texture2D(textureSource, textureCoordsB) + 0.5*dt*texture2D(textureSource1, textureCoordsB);
    uvwqLL = texture2D(textureSource, textureCoordsLL) + 0.5*dt*texture2D(textureSource1, textureCoordsLL);
    uvwqRR = texture2D(textureSource, textureCoordsRR) + 0.5*dt*texture2D(textureSource1, textureCoordsRR);
    uvwqTT = texture2D(textureSource, textureCoordsTT) + 0.5*dt*texture2D(textureSource1, textureCoordsTT);
    uvwqBB = texture2D(textureSource, textureCoordsBB) + 0.5*dt*texture2D(textureSource1, textureCoordsBB);
    computeRHS(textureSource, t, uvwq, uvwqL, uvwqR, uvwqT, uvwqB, uvwqLL, uvwqRR, uvwqTT, uvwqBB, RHS);
    vec4 timescales = TIMESCALES;
    updated = dt * RHS / timescales + uvwqLast;`;
  update.RK41 = `uvwq = texture2D(textureSource, textureCoords);
    uvwqL = texture2D(textureSource, textureCoordsL);
    uvwqR = texture2D(textureSource, textureCoordsR);
    uvwqT = texture2D(textureSource, textureCoordsT);
    uvwqB = texture2D(textureSource, textureCoordsB);
    uvwqLL = texture2D(textureSource, textureCoordsLL);
    uvwqRR = texture2D(textureSource, textureCoordsRR);
    uvwqTT = texture2D(textureSource, textureCoordsTT);
    uvwqBB = texture2D(textureSource, textureCoordsBB);
    computeRHS(textureSource, t, uvwq, uvwqL, uvwqR, uvwqT, uvwqB, uvwqLL, uvwqRR, uvwqTT, uvwqBB, RHS);
    vec4 timescales = TIMESCALES;
    updated = RHS / timescales;`;
  update.RK42 = `uvwq = texture2D(textureSource, textureCoords) + 0.5*dt*texture2D(textureSource1, textureCoords);
    uvwqL = texture2D(textureSource, textureCoordsL) + 0.5*dt*texture2D(textureSource1, textureCoordsL);
    uvwqR = texture2D(textureSource, textureCoordsR) + 0.5*dt*texture2D(textureSource1, textureCoordsR);
    uvwqT = texture2D(textureSource, textureCoordsT) + 0.5*dt*texture2D(textureSource1, textureCoordsT);
    uvwqB = texture2D(textureSource, textureCoordsB) + 0.5*dt*texture2D(textureSource1, textureCoordsB);
    uvwqLL = texture2D(textureSource, textureCoordsLL) + 0.5*dt*texture2D(textureSource1, textureCoordsLL);
    uvwqRR = texture2D(textureSource, textureCoordsRR) + 0.5*dt*texture2D(textureSource1, textureCoordsRR);
    uvwqTT = texture2D(textureSource, textureCoordsTT) + 0.5*dt*texture2D(textureSource1, textureCoordsTT);
    uvwqBB = texture2D(textureSource, textureCoordsBB) + 0.5*dt*texture2D(textureSource1, textureCoordsBB);
    computeRHS(textureSource, t, uvwq, uvwqL, uvwqR, uvwqT, uvwqB, uvwqLL, uvwqRR, uvwqTT, uvwqBB, RHS);
    vec4 timescales = TIMESCALES;
    updated = RHS / timescales;`;
  update.RK43 = `uvwq = texture2D(textureSource, textureCoords) + 0.5*dt*texture2D(textureSource2, textureCoords);
    uvwqL = texture2D(textureSource, textureCoordsL) + 0.5*dt*texture2D(textureSource2, textureCoordsL);
    uvwqR = texture2D(textureSource, textureCoordsR) + 0.5*dt*texture2D(textureSource2, textureCoordsR);
    uvwqT = texture2D(textureSource, textureCoordsT) + 0.5*dt*texture2D(textureSource2, textureCoordsT);
    uvwqB = texture2D(textureSource, textureCoordsB) + 0.5*dt*texture2D(textureSource2, textureCoordsB);
    uvwqLL = texture2D(textureSource, textureCoordsLL) + 0.5*dt*texture2D(textureSource2, textureCoordsLL);
    uvwqRR = texture2D(textureSource, textureCoordsRR) + 0.5*dt*texture2D(textureSource2, textureCoordsRR);
    uvwqTT = texture2D(textureSource, textureCoordsTT) + 0.5*dt*texture2D(textureSource2, textureCoordsTT);
    uvwqBB = texture2D(textureSource, textureCoordsBB) + 0.5*dt*texture2D(textureSource2, textureCoordsBB);
    computeRHS(textureSource, t, uvwq, uvwqL, uvwqR, uvwqT, uvwqB, uvwqLL, uvwqRR, uvwqTT, uvwqBB, RHS);
    vec4 timescales = TIMESCALES;
    updated = RHS / timescales;`;
  update.RK44 = `uvwqLast = texture2D(textureSource, textureCoords);
    uvwq = uvwqLast + dt*texture2D(textureSource3, textureCoords);
    uvwqL = texture2D(textureSource, textureCoordsL) + dt*texture2D(textureSource3, textureCoordsL);
    uvwqR = texture2D(textureSource, textureCoordsR) + dt*texture2D(textureSource3, textureCoordsR);
    uvwqT = texture2D(textureSource, textureCoordsT) + dt*texture2D(textureSource3, textureCoordsT);
    uvwqB = texture2D(textureSource, textureCoordsB) + dt*texture2D(textureSource3, textureCoordsB);
    uvwqLL = texture2D(textureSource, textureCoordsLL) + dt*texture2D(textureSource3, textureCoordsLL);
    uvwqRR = texture2D(textureSource, textureCoordsRR) + dt*texture2D(textureSource3, textureCoordsRR);
    uvwqTT = texture2D(textureSource, textureCoordsTT) + dt*texture2D(textureSource3, textureCoordsTT);
    uvwqBB = texture2D(textureSource, textureCoordsBB) + dt*texture2D(textureSource3, textureCoordsBB);
    computeRHS(textureSource, t, uvwq, uvwqL, uvwqR, uvwqT, uvwqB, uvwqLL, uvwqRR, uvwqTT, uvwqBB, RHS1);
    vec4 timescales = TIMESCALES;
    // The stored stage slopes k1-k3 are already divided by the timescales, so multiply them
    // back here: the final update (and any algebraic species) then divides exactly once.
    RHS = (timescales * (texture2D(textureSource1, textureCoords) + 2.0*(texture2D(textureSource2, textureCoords) + texture2D(textureSource3, textureCoords))) + RHS1) / 6.0;
    updated = dt * RHS / timescales + uvwqLast;`;
  return (
    `
  void main()
  {
      ivec2 texSize = textureSize(textureSource,0);
      float step_x = 1.0 / float(texSize.x);
      float step_y = 1.0 / float(texSize.y);
      float x = textureCoords.x * L_x + MINX;
      float y = textureCoords.y * L_y + MINY;
      float interior = float(textureCoords.x > 0.75*step_x && textureCoords.x < 1.0 - 0.75*step_x && textureCoords.y > 0.5*step_y && textureCoords.y < 1.0 - 0.75*step_y);
      float exterior = 1.0 - interior;

      vec2 textureCoordsL = textureCoords + vec2(-step_x, 0.0);
      vec2 textureCoordsLL = textureCoordsL + vec2(-step_x, 0.0);
      vec2 textureCoordsR = textureCoords + vec2(+step_x, 0.0);
      vec2 textureCoordsRR = textureCoordsR + vec2(+step_x, 0.0);
      vec2 textureCoordsT = textureCoords + vec2(0.0, +step_y);
      vec2 textureCoordsTT = textureCoordsT + vec2(0.0, +step_y);
      vec2 textureCoordsB = textureCoords + vec2(0.0, -step_y);
      vec2 textureCoordsBB = textureCoordsB + vec2(0.0, -step_y);
      
      vec4 RHS;
      vec4 RHS1;
      vec4 RHS2;
      vec4 updated;
      vec4 uvwq;
      vec4 uvwqL;
      vec4 uvwqLL;
      vec4 uvwqR;
      vec4 uvwqRR;
      vec4 uvwqT;
      vec4 uvwqTT;
      vec4 uvwqB;
      vec4 uvwqBB;
      vec4 uvwqLast;
  ` + update[type]
  );
}

// ---------------------------------------------------------------------------------------
// MRT (multiple render target) shader variants, used only once numGroups(numSpecies)>1
// (i.e. numSpecies>4), supporting all 8 timestepping schemes (Forward Euler, AB2, Midpoint,
// RK4). Group 0 (species 1-4) is computed exactly as RDShaderTop/RDShaderMain/
// RDShaderUpdateNormal/RDShaderUpdateCross/RDShaderBot already do; these MRT variants ADD
// group 1 (species 5-8) alongside it in the same computeRHS call and fragment shader
// invocation, writing group 0 to output 0 and group 1 to output 1 via GLSL ES 300's
// layout(location=N) out qualifiers. None of the non-MRT functions above are modified, so
// the numSpecies<=4 shader text/behaviour is unaffected.
//
// Naming conventions used below (must stay in sync with main.js's Stage 5 diffusion/
// reaction string builders, which *define* the tokens these functions *reference*):
//   - Stencil samples for species 1-4 use the existing "uvwq"-prefixed locals; species 5-8
//     use "uvwq2"-prefixed locals (a second full set of the same 9 stencil points).
//   - Reaction tokens: reactionTokenOfSpecies(i) (species_config.js) - "UFUN".."QFUN" for
//     species 1-4 (unchanged), "UFUN5".."UFUN8" for species 5-8.
//   - Diffusion coefficient tokens: "D" + diffusionLabel(i,j) (species_config.js) - legacy
//     letter-pairs ("Duu","Duv",...) when both i,j<4 (byte-identical to today), numeric
//     pairs ("D5_5","D1_5",...) if either index is >=4.
// ---------------------------------------------------------------------------------------

// Ordered list of the 9 stencil-point suffixes used throughout these MRT builders (matches
// the suffixes on uvwq/uvwq2's L/R/T/B/LL/RR/TT/BB locals and the textureCoords* locals
// declared in RDShaderTopMRT/RDShaderMainMRT).
const STENCIL_SUFFIXES = ["", "L", "R", "T", "B", "LL", "RR", "TT", "BB"];

/**
 * Builds the 18 texture2D-sampling lines (9 for group 0's uvwq* locals, 9 for group 1's
 * uvwq2* locals) shared by every RDShaderMainMRT() scheme body. Optionally combines each
 * sample with a second texture at a given coefficient (used by the Midpoint/RK4 schemes'
 * intermediate stencils, e.g. "uvwqL = texture2D(tex0,coordsL) + 0.5*dt*texture2D(tex1,coordsL)").
 * @param {string} tex0 - Group 0's sampler uniform name.
 * @param {string} tex1 - Group 1's sampler uniform name.
 * @param {string} [combineTex0] - Group 0's second sampler to combine in, if any.
 * @param {string} [combineTex1] - Group 1's second sampler to combine in, if any.
 * @param {string} [coefficient] - GLSL expression multiplying the combined sample (e.g. "dt").
 * @returns {string} The generated shader code.
 */
function stencilBlockMRT(tex0, tex1, combineTex0, combineTex1, coefficient) {
  function line(varPrefix, tex, combineTex) {
    return STENCIL_SUFFIXES.map(function (suffix) {
      const coords = "textureCoords" + suffix;
      const base = "texture2D(" + tex + ", " + coords + ")";
      const combined =
        combineTex != null
          ? base +
            " + " +
            coefficient +
            "*texture2D(" +
            combineTex +
            ", " +
            coords +
            ")"
          : base;
      return varPrefix + suffix + " = " + combined + ";";
    }).join("\n    ");
  }
  return (
    line("uvwq", tex0, combineTex0) +
    "\n    " +
    line("uvwq2", tex1, combineTex1)
  );
}

/**
 * Builds a single computeRHS(...) call using the already-sampled uvwq (group 0) and uvwq2
 * (group 1) stencil locals, writing its two outputs into the given variable names.
 * @param {string} tex - Sampler passed as computeRHS's first argument (used only for its
 *   textureSize(), regardless of which texture(s) the stencil values actually came from -
 *   matches the non-MRT RDShaderMain's same convention, e.g. Mid2/RK42-44's combined-stencil
 *   calls still pass the scheme's primary "textureSource").
 * @param {string} rhsOut - Group 0's result variable name.
 * @param {string} rhsOutGroup1 - Group 1's result variable name.
 * @param {string} [time] - GLSL expression for the time at which to evaluate the RHS.
 * @returns {string} The generated shader code.
 */
function computeRHSCallMRT(tex, rhsOut, rhsOutGroup1, time = "t") {
  return (
    "computeRHS(" +
    tex +
    ", " +
    time +
    ", uvwq, uvwqL, uvwqR, uvwqT, uvwqB, uvwqLL, uvwqRR, uvwqTT, uvwqBB, " +
    "uvwq2, uvwq2L, uvwq2R, uvwq2T, uvwq2B, uvwq2LL, uvwq2RR, uvwq2TT, uvwq2BB, " +
    rhsOut +
    ", " +
    rhsOutGroup1 +
    ");"
  );
}

/**
 * MRT counterpart of RDShaderTop(type). Adds a "Group1" sampler for each of the scheme's
 * inputs (group 1's counterpart of textureSource/1/2/3) and doubles computeRHS's stencil
 * parameters/locals so a single call can compute both groups' RHS in one pass. The two
 * layout(location=N) out variables are declared here (GLSL ES 300 requires out variables to
 * be declared at global scope, before use in main()) rather than in RDShaderBotMRT, which
 * only assigns them.
 * @param {string} type - The timestepping scheme to generate the shader for.
 * @returns {string} The generated shader code.
 */
export function RDShaderTopMRT(type) {
  let numInputs = 0;
  switch (type) {
    case "FE":
      numInputs = 2;
      break;
    case "AB2":
      numInputs = 2;
      break;
    case "Mid1":
      numInputs = 1;
      break;
    case "Mid2":
      numInputs = 2;
      break;
    case "RK41":
      numInputs = 1;
      break;
    case "RK42":
      numInputs = 2;
      break;
    case "RK43":
      numInputs = 3;
      break;
    case "RK44":
      numInputs = 4;
      break;
  }
  let parts = [];
  parts[0] =
    "uniform sampler2D textureSource;\n    uniform sampler2D textureSourceGroup1;";
  parts[1] =
    "uniform sampler2D textureSource1;\n    uniform sampler2D textureSource1Group1;";
  parts[2] =
    "uniform sampler2D textureSource2;\n    uniform sampler2D textureSource2Group1;";
  parts[3] =
    "uniform sampler2D textureSource3;\n    uniform sampler2D textureSource3Group1;";
  return (
    `
    precision highp float; precision highp sampler2D; varying vec2 textureCoords;
    ` +
    parts.slice(0, numInputs).join("\n    ") +
    `
    layout(location = 0) out highp vec4 fragColor0;
    layout(location = 1) out highp vec4 fragColor1;
    uniform float dt;
    uniform float dx;
    uniform float dy;
    uniform float L;
    uniform float L_x;
    uniform float L_y;
    uniform float L_min;
    uniform float t;
    uniform float seed;
    uniform float globalIntegralValue1;
    uniform float globalIntegralValue2;
    uniform float globalIntegralValue3;
    uniform float globalIntegralValue4;
    uniform sampler2D imageSourceOne;
    uniform sampler2D imageSourceTwo;

    AUXILIARY_GLSL_FUNS

    const float ALPHA = 0.147;
    const float INV_ALPHA = 1.0 / ALPHA;
    const float BETA = 2.0 / (pi * ALPHA);
    float erfinv(float pERF) {
      float yERF;
      if (pERF == -1.0) {
        yERF = log(1.0 - (-0.99)*(-0.99));
      } else {
        yERF = log(1.0 - pERF*pERF);
      }
      float zERF = BETA + 0.5 * yERF;
      return sqrt(sqrt(zERF*zERF - yERF * INV_ALPHA) - zERF) * sign(pERF);
    }

    void computeRHS(sampler2D textureSource, float t,
      vec4 uvwqIn, vec4 uvwqLIn, vec4 uvwqRIn, vec4 uvwqTIn, vec4 uvwqBIn, vec4 uvwqLLIn, vec4 uvwqRRIn, vec4 uvwqTTIn, vec4 uvwqBBIn,
      vec4 uvwq2In, vec4 uvwq2LIn, vec4 uvwq2RIn, vec4 uvwq2TIn, vec4 uvwq2BIn, vec4 uvwq2LLIn, vec4 uvwq2RRIn, vec4 uvwq2TTIn, vec4 uvwq2BBIn,
      out highp vec4 result0, out highp vec4 result1) {

        ivec2 texSize = textureSize(textureSource,0);
        float step_x = 1.0 / float(texSize.x);
        float step_y = 1.0 / float(texSize.y);
        float x = textureCoords.x * L_x + MINX;
        float y = textureCoords.y * L_y + MINY;
        float interior = float(textureCoords.x > 0.75*step_x && textureCoords.x < 1.0 - 0.75*step_x && textureCoords.y > 0.5*step_y && textureCoords.y < 1.0 - 0.75*step_y);
        float exterior = 1.0 - interior;
        vec2 dSquared = 1.0/vec2(dx*dx, dy*dy);
        vec2 textureCoordsL = textureCoords + vec2(-step_x, 0.0);
        vec2 textureCoordsLL = textureCoordsL + vec2(-step_x, 0.0);
        vec2 textureCoordsR = textureCoords + vec2(+step_x, 0.0);
        vec2 textureCoordsRR = textureCoordsR + vec2(+step_x, 0.0);
        vec2 textureCoordsT = textureCoords + vec2(0.0, +step_y);
        vec2 textureCoordsTT = textureCoordsT + vec2(0.0, +step_y);
        vec2 textureCoordsB = textureCoords + vec2(0.0, -step_y);
        vec2 textureCoordsBB = textureCoordsB + vec2(0.0, -step_y);

        vec4 uvwq = uvwqIn;
        vec4 uvwqL = uvwqLIn;
        vec4 uvwqLL = uvwqLLIn;
        vec4 uvwqR = uvwqRIn;
        vec4 uvwqRR = uvwqRRIn;
        vec4 uvwqT = uvwqTIn;
        vec4 uvwqTT = uvwqTTIn;
        vec4 uvwqB = uvwqBIn;
        vec4 uvwqBB = uvwqBBIn;
        vec4 uvwq2 = uvwq2In;
        vec4 uvwq2L = uvwq2LIn;
        vec4 uvwq2LL = uvwq2LLIn;
        vec4 uvwq2R = uvwq2RIn;
        vec4 uvwq2RR = uvwq2RRIn;
        vec4 uvwq2T = uvwq2TIn;
        vec4 uvwq2TT = uvwq2TTIn;
        vec4 uvwq2B = uvwq2BIn;
        vec4 uvwq2BB = uvwq2BBIn;
    `
  );
}

/**
 * MRT counterpart of RDShaderMain(type). Samples both groups' 9-point stencils (via the
 * scheme's required textures), calls the doubled computeRHS from RDShaderTopMRT, and
 * computes both groups' update (updated/updated2). Each scheme's group-0 logic is identical
 * to RDShaderMain(type)'s corresponding `update[type]` body (only the variable names for
 * intermediate RHS values differ, to avoid colliding with the group-1 "RHS2" name already
 * established by the Forward Euler case) - group 1's logic mirrors it exactly, using
 * uvwq2-prefixed locals and "Group1"-suffixed textures/timescales. Not closed with "}" - as
 * with RDShaderMain, the Dirichlet/algebraic shaders and RDShaderBotMRT supply the rest of
 * main()'s body and its closing brace.
 * @param {string} type - The timestepping scheme to generate the shader for.
 * @returns {string} The generated shader code.
 */
export function RDShaderMainMRT(type) {
  let update = {};
  update.FE = `
    ${stencilBlockMRT("textureSource", "textureSourceGroup1")}
    ${computeRHSCallMRT("textureSource", "RHS", "RHS2")}
    vec4 timescales = TIMESCALES;
    vec4 timescalesGroup1 = TIMESCALESGROUP1;
    updated = dt * RHS / timescales + uvwq;
    updated2 = dt * RHS2 / timescalesGroup1 + uvwq2;`;
  update.AB2 = `
    ${stencilBlockMRT("textureSource", "textureSourceGroup1")}
    ${computeRHSCallMRT("textureSource", "RHSCur", "RHSCurGroup1")}
    ${stencilBlockMRT("textureSource1", "textureSource1Group1")}
    ${computeRHSCallMRT("textureSource1", "RHSPrev", "RHSPrevGroup1", "t - dt")}
    RHS = 1.5 * RHSCur - 0.5 * RHSPrev;
    RHS2 = 1.5 * RHSCurGroup1 - 0.5 * RHSPrevGroup1;
    vec4 timescales = TIMESCALES;
    vec4 timescalesGroup1 = TIMESCALESGROUP1;
    updated = dt * RHS / timescales + texture2D(textureSource, textureCoords);
    updated2 = dt * RHS2 / timescalesGroup1 + texture2D(textureSourceGroup1, textureCoords);`;
  update.Mid1 = `
    ${stencilBlockMRT("textureSource", "textureSourceGroup1")}
    ${computeRHSCallMRT("textureSource", "RHS", "RHS2")}
    vec4 timescales = TIMESCALES;
    vec4 timescalesGroup1 = TIMESCALESGROUP1;
    updated = RHS / timescales;
    updated2 = RHS2 / timescalesGroup1;`;
  update.Mid2 = `
    uvwqLast = texture2D(textureSource, textureCoords);
    uvwq2Last = texture2D(textureSourceGroup1, textureCoords);
    ${stencilBlockMRT("textureSource", "textureSourceGroup1", "textureSource1", "textureSource1Group1", "0.5*dt")}
    ${computeRHSCallMRT("textureSource", "RHS", "RHS2")}
    vec4 timescales = TIMESCALES;
    vec4 timescalesGroup1 = TIMESCALESGROUP1;
    updated = dt * RHS / timescales + uvwqLast;
    updated2 = dt * RHS2 / timescalesGroup1 + uvwq2Last;`;
  update.RK41 = `
    ${stencilBlockMRT("textureSource", "textureSourceGroup1")}
    ${computeRHSCallMRT("textureSource", "RHS", "RHS2")}
    vec4 timescales = TIMESCALES;
    vec4 timescalesGroup1 = TIMESCALESGROUP1;
    updated = RHS / timescales;
    updated2 = RHS2 / timescalesGroup1;`;
  update.RK42 = `
    ${stencilBlockMRT("textureSource", "textureSourceGroup1", "textureSource1", "textureSource1Group1", "0.5*dt")}
    ${computeRHSCallMRT("textureSource", "RHS", "RHS2")}
    vec4 timescales = TIMESCALES;
    vec4 timescalesGroup1 = TIMESCALESGROUP1;
    updated = RHS / timescales;
    updated2 = RHS2 / timescalesGroup1;`;
  update.RK43 = `
    ${stencilBlockMRT("textureSource", "textureSourceGroup1", "textureSource2", "textureSource2Group1", "0.5*dt")}
    ${computeRHSCallMRT("textureSource", "RHS", "RHS2")}
    vec4 timescales = TIMESCALES;
    vec4 timescalesGroup1 = TIMESCALESGROUP1;
    updated = RHS / timescales;
    updated2 = RHS2 / timescalesGroup1;`;
  update.RK44 = `
    uvwqLast = texture2D(textureSource, textureCoords);
    uvwq2Last = texture2D(textureSourceGroup1, textureCoords);
    ${stencilBlockMRT("textureSource", "textureSourceGroup1", "textureSource3", "textureSource3Group1", "dt")}
    ${computeRHSCallMRT("textureSource", "RHS1", "RHS1Group1")}
    vec4 timescales = TIMESCALES;
    vec4 timescalesGroup1 = TIMESCALESGROUP1;
    // See the non-MRT RK44: the stored stage slopes are already divided by the timescales.
    RHS = (timescales * (texture2D(textureSource1, textureCoords) + 2.0*(texture2D(textureSource2, textureCoords) + texture2D(textureSource3, textureCoords))) + RHS1) / 6.0;
    RHS2 = (timescalesGroup1 * (texture2D(textureSource1Group1, textureCoords) + 2.0*(texture2D(textureSource2Group1, textureCoords) + texture2D(textureSource3Group1, textureCoords))) + RHS1Group1) / 6.0;
    updated = dt * RHS / timescales + uvwqLast;
    updated2 = dt * RHS2 / timescalesGroup1 + uvwq2Last;`;
  return (
    `
  void main()
  {
      ivec2 texSize = textureSize(textureSource,0);
      float step_x = 1.0 / float(texSize.x);
      float step_y = 1.0 / float(texSize.y);
      float x = textureCoords.x * L_x + MINX;
      float y = textureCoords.y * L_y + MINY;
      float interior = float(textureCoords.x > 0.75*step_x && textureCoords.x < 1.0 - 0.75*step_x && textureCoords.y > 0.5*step_y && textureCoords.y < 1.0 - 0.75*step_y);
      float exterior = 1.0 - interior;

      vec2 textureCoordsL = textureCoords + vec2(-step_x, 0.0);
      vec2 textureCoordsLL = textureCoordsL + vec2(-step_x, 0.0);
      vec2 textureCoordsR = textureCoords + vec2(+step_x, 0.0);
      vec2 textureCoordsRR = textureCoordsR + vec2(+step_x, 0.0);
      vec2 textureCoordsT = textureCoords + vec2(0.0, +step_y);
      vec2 textureCoordsTT = textureCoordsT + vec2(0.0, +step_y);
      vec2 textureCoordsB = textureCoords + vec2(0.0, -step_y);
      vec2 textureCoordsBB = textureCoordsB + vec2(0.0, -step_y);

      vec4 RHS;
      vec4 RHS2;
      vec4 RHS1;
      vec4 RHS1Group1;
      vec4 RHSCur;
      vec4 RHSCurGroup1;
      vec4 RHSPrev;
      vec4 RHSPrevGroup1;
      vec4 updated;
      vec4 updated2;
      vec4 uvwq;
      vec4 uvwqL;
      vec4 uvwqLL;
      vec4 uvwqR;
      vec4 uvwqRR;
      vec4 uvwqT;
      vec4 uvwqTT;
      vec4 uvwqB;
      vec4 uvwqBB;
      vec4 uvwqLast;
      vec4 uvwq2;
      vec4 uvwq2L;
      vec4 uvwq2LL;
      vec4 uvwq2R;
      vec4 uvwq2RR;
      vec4 uvwq2T;
      vec4 uvwq2TT;
      vec4 uvwq2B;
      vec4 uvwq2BB;
      vec4 uvwq2Last;
  ` + update[type]
  );
}

/**
 * @param {number} s - 0-based species index.
 * @returns {string} "uvwq" for species 1-4 (group 0), "uvwq2" for species 5-8 (group 1).
 */
function stencilPrefixOfSpecies(s) {
  return groupOfSpecies(s) === 0 ? "uvwq" : "uvwq2";
}

/**
 * MRT counterpart of RDShaderUpdateNormal, generalized to however many species are active
 * across both groups (numSpecies in 5..8, since this is only ever used once numGroups>1;
 * group 0/species 1-4 are always fully present in that case). Closes computeRHS's body
 * (opened by RDShaderTopMRT) with the result0/result1 assignments.
 * @param {number} numSpecies - Number of active species (5-8).
 * @returns {string} The generated shader code.
 */
export function RDShaderUpdateNormalMRT(numSpecies) {
  let shader = "";
  for (let s = 0; s < numSpecies; s++) {
    const p = stencilPrefixOfSpecies(s);
    const ch = channelCharOfSpecies(s);
    const label = diffusionLabel(s, s);
    const reac = reactionTokenOfSpecies(s);
    shader += `
    float LDself${s} = 0.5*((D${label}x*(${p}R.${ch} + ${p}L.${ch} - 2.0*${p}.${ch}) + D${label}xR*(${p}R.${ch} - ${p}.${ch}) + D${label}xL*(${p}L.${ch} - ${p}.${ch})) / dx) / dx + 0.5*((D${label}y*(${p}T.${ch} + ${p}B.${ch} - 2.0*${p}.${ch}) + D${label}yT*(${p}T.${ch} - ${p}.${ch}) + D${label}yB*(${p}B.${ch} - ${p}.${ch})) / dy) / dy;
    float d${s} = LDself${s} + ${reac};
    `;
  }
  const group1Terms = [];
  for (let ch = 0; ch < 4; ch++) {
    const s = 4 + ch;
    group1Terms.push(s < numSpecies ? `d${s}` : "0.0");
  }
  shader += `result0 = vec4(d0,d1,d2,d3);\n`;
  shader += `result1 = vec4(${group1Terms.join(",")});\n`;
  return shader + `\n}`;
}

/**
 * MRT counterpart of RDShaderUpdateCross: a full N x N cross-diffusion matrix (any species
 * can cross-diffuse with any other, regardless of group), generalized the same way as
 * RDShaderUpdateNormalMRT. Closes computeRHS's body with the result0/result1 assignments.
 * @param {number} numSpecies - Number of active species (5-8).
 * @returns {string} The generated shader code.
 */
export function RDShaderUpdateCrossMRT(numSpecies) {
  let shader = "";
  for (let s = 0; s < numSpecies; s++) {
    const pS = stencilPrefixOfSpecies(s);
    const terms = [];
    for (let k = 0; k < numSpecies; k++) {
      const pK = stencilPrefixOfSpecies(k);
      const chK = channelCharOfSpecies(k);
      const label = diffusionLabel(s, k);
      shader += `
      vec2 LD_${s}_${k} = vec2(D${label}x*(${pK}R.${chK} + ${pK}L.${chK} - 2.0*${pK}.${chK}) + D${label}xR*(${pK}R.${chK} - ${pK}.${chK}) + D${label}xL*(${pK}L.${chK} - ${pK}.${chK}), D${label}y*(${pK}T.${chK} + ${pK}B.${chK} - 2.0*${pK}.${chK}) + D${label}yT*(${pK}T.${chK} - ${pK}.${chK}) + D${label}yB*(${pK}B.${chK} - ${pK}.${chK}));`;
      terms.push(`LD_${s}_${k}`);
    }
    shader += `
    float d${s} = 0.5*dot(dSquared, ${terms.join(" + ")}) + ${reactionTokenOfSpecies(s)};
    `;
  }
  const group1Terms = [];
  for (let ch = 0; ch < 4; ch++) {
    const s = 4 + ch;
    group1Terms.push(s < numSpecies ? `d${s}` : "0.0");
  }
  shader += `result0 = vec4(d0,d1,d2,d3);\n`;
  shader += `result1 = vec4(${group1Terms.join(",")});\n`;
  return shader + `\n}`;
}

/**
 * MRT counterpart of RDShaderBot. The layout(location=N) out variables themselves are
 * declared in RDShaderTopMRT (GLSL ES 300 requires them at global scope, before use); this
 * just assigns the final per-group results and closes main().
 * @returns {string} The generated shader code.
 */
export function RDShaderBotMRT() {
  return `
    fragColor0 = updated;
    fragColor1 = updated2;
}`;
}

/**
 * Returns the shader code for a reaction-diffusion simulation with periodic boundary conditions.
 * @returns {string} The shader code.
 */
export function RDShaderPeriodic() {
  return ``;
}

/**
 * Generates shader code for specifying the values of ghost cells in the x-direction.
 * @param {string} [LR] - Determines whether to apply the condition at the left ("L"), right ("R"), or both ("LR"). If undefined, returns both.
 * @returns {string} The shader code for setting the species of ghost cells in the x-direction.
 */
export function RDShaderGhostX(LR) {
  const L = `
    if (textureCoords.x - step_x < 0.0) {
        uvwqL.SPECIES = GHOSTSPECIES;
    }
    `;
  const R = `
    if (textureCoords.x + step_x > 1.0) {
        uvwqR.SPECIES = GHOSTSPECIES;
    }
    `;
  if (LR == undefined) return L + R;
  if (LR == "L") return L;
  if (LR == "R") return R;
  return "";
}

/**
 * Generates shader code for specifying the values of ghost cells in the y-direction.
 * @param {string} [TB] - Determines whether to apply the condition at the top ("T"), bottom ("B"), or both ("TB"). If undefined, returns both.
 * @returns {string} The shader code for setting the species of ghost cells in the y-direction.
 */
export function RDShaderGhostY(TB) {
  const T = `
    if (textureCoords.y + step_y > 1.0){
        uvwqT.SPECIES = GHOSTSPECIES;
    }
    `;
  const B = `
    if (textureCoords.y - step_y < 0.0) {
        uvwqB.SPECIES = GHOSTSPECIES;
    }
    `;
  if (TB == undefined) return T + B;
  if (TB == "T") return T;
  if (TB == "B") return B;
  return "";
}

/**
 * Returns a string containing the Robin boundary condition shader code in the x-direction.
 * @param {string} [LR] - Determines whether to apply the condition at the left ("L"), right ("R"), or both ("LR"). If undefined, returns both.
 * @returns {string} The Robin boundary condition shader code.
 */
export function RDShaderRobinX(LR) {
  const L = `
    if (textureCoords.x - step_x < 0.0) {
        uvwqL.SPECIES = 2.0 * (dx * robinRHSSPECIESL) + uvwqR.SPECIES;
    }
    `;
  const R = `
    if (textureCoords.x + step_x > 1.0) {
        uvwqR.SPECIES = 2.0 * (dx * robinRHSSPECIESR) + uvwqL.SPECIES;
    }
    `;
  if (LR == undefined) return L + R;
  if (LR == "L") return L;
  if (LR == "R") return R;
  return "";
}

/**
 * Returns a string containing the Robin boundary condition shader code in the y-direction.
 * @param {string} [TB] - Determines whether to apply the condition at the top ("T"), bottom ("B"), or both ("TB"). If undefined, returns both.
 * @returns {string} The Robin boundary condition shader code.
 */
export function RDShaderRobinY(TB) {
  const T = `
    if (textureCoords.y + step_y > 1.0){
        uvwqT.SPECIES = 2.0 * (dy * robinRHSSPECIEST) + uvwqB.SPECIES;
    }
    `;
  const B = `
    if (textureCoords.y - step_y < 0.0) {
        uvwqB.SPECIES = 2.0 * (dy * robinRHSSPECIESB) + uvwqT.SPECIES;
    }
    `;
  if (TB == undefined) return T + B;
  if (TB == "T") return T;
  if (TB == "B") return B;
  return "";
}

/**
 * Generates a Robin boundary condition shader for a custom domain in the x-direction.
 * @param {string} TB - Determines whether to apply the condition at the left ("L"), right ("R"), or both ("LR"). If undefined, returns both.
 * @param {string} fun - A function that defines the custom domain.
 * @returns {string} The generated shader code.
 */
export function RDShaderRobinCustomDomainX(LR, fun) {
  const L = `
    if (float(indicatorFunL) <= 0.0 || textureCoords.x - 2.0*step_x < 0.0) {
      if (float(indicatorFunR) <= 0.0) {
        uvwqL.SPECIES = dx * robinRHSSPECIESL + uvwq.SPECIES;
      } else {
        uvwqL.SPECIES = 2.0 * (dx * robinRHSSPECIESL) + uvwqR.SPECIES;
      }
    }
    `
    .replace(
      /indicatorFunL/,
      fun.replaceAll(/\bx\b/g, "(x-1.25*dx)").replaceAll(/\buvwq\./g, "uvwqL."),
    )
    .replace(
      /indicatorFunR/,
      fun.replaceAll(/\bx\b/g, "(x+1.25*dx)").replaceAll(/\buvwq\./g, "uvwqR."),
    );
  const R = `
    if (float(indicatorFunR) <= 0.0 || textureCoords.x + 2.0*step_x > 1.0) {
      if (float(indicatorFunL) <= 0.0) {
        uvwqR.SPECIES = dx * robinRHSSPECIESR + uvwq.SPECIES;
      } else {
        uvwqR.SPECIES = 2.0 * (dx * robinRHSSPECIESR) + uvwqL.SPECIES;
      }
    }
    `
    .replace(
      /indicatorFunR/,
      fun.replaceAll(/\bx\b/g, "(x+1.25*dx)").replaceAll(/\buvwq\./g, "uvwqR."),
    )
    .replace(
      /indicatorFunL/,
      fun.replaceAll(/\bx\b/g, "(x-1.25*dx)").replaceAll(/\buvwq\./g, "uvwqL."),
    );
  if (LR == undefined) return L + R;
  if (LR == "L") return L;
  if (LR == "R") return R;
  return "";
}

/**
 * Generates a Robin boundary condition shader for a custom domain in the y-direction.
 * @param {string} TB - Determines whether to apply the condition at the top ("T"), bottom ("B"), or both ("TB"). If undefined, returns both.
 * @param {string} fun - A function that defines the custom domain.
 * @returns {string} The generated shader code.
 */
export function RDShaderRobinCustomDomainY(TB, fun) {
  const T = `
    if (float(indicatorFunT) <= 0.0 || textureCoords.y + 2.0*step_y > 1.0){
      if (float(indicatorFunB) <= 0.0) {
        uvwqT.SPECIES = dy * robinRHSSPECIEST + uvwq.SPECIES;
      } else {
        uvwqT.SPECIES = 2.0 * (dy * robinRHSSPECIEST) + uvwqB.SPECIES;
      }
    }
    `
    .replace(
      /indicatorFunT/,
      fun.replaceAll(/\by\b/g, "(y+1.25*dy)").replaceAll(/\buvwq\./g, "uvwqT."),
    )
    .replace(
      /indicatorFunB/,
      fun.replaceAll(/\by\b/g, "(y-1.25*dy)").replaceAll(/\buvwq\./g, "uvwqB."),
    );
  const B = `
    if (float(indicatorFunB) <= 0.0 || textureCoords.y - 2.0*step_y < 0.0) {
      if (float(indicatorFunT) <= 0.0) {
        uvwqB.SPECIES = dy * robinRHSSPECIESB + uvwq.SPECIES;
      } else {
        uvwqB.SPECIES = 2.0 * (dy * robinRHSSPECIESB) + uvwqT.SPECIES;
      }
    }
    `
    .replace(
      /indicatorFunB/,
      fun.replaceAll(/\by\b/g, "(y-1.25*dy)").replaceAll(/\buvwq\./g, "uvwqB."),
    )
    .replace(
      /indicatorFunT/,
      fun.replaceAll(/\by\b/g, "(y+1.25*dy)").replaceAll(/\buvwq\./g, "uvwqT."),
    );
  if (TB == undefined) return T + B;
  if (TB == "T") return T;
  if (TB == "B") return B;
  return "";
}

/**
 * Returns the shader code for computing advection before boundary conditions have been applied.
 * @returns {string} The shader code.
 */
export function RDShaderAdvectionPreBC() {
  return `
    vec4 uvwqX = (uvwqR - uvwqL) / (2.0*dx);
    vec4 uvwqY = (uvwqT - uvwqB) / (2.0*dy);
    vec4 uvwqXF = (uvwqR - uvwq) / dx;
    vec4 uvwqYF = (uvwqT - uvwq) / dy;
    vec4 uvwqXB = (uvwq - uvwqL) / dx;
    vec4 uvwqYB = (uvwq - uvwqB) / dy;
    vec4 uvwqXFXF = (4.0*uvwqR - 3.0*uvwq - uvwqRR) / (2.0*dx);
    vec4 uvwqYFYF = (4.0*uvwqT - 3.0*uvwq - uvwqTT) / (2.0*dy);
    vec4 uvwqXBXB = (3.0*uvwq - 4.0*uvwqL + uvwqLL) / (2.0*dx);
    vec4 uvwqYBYB = (3.0*uvwq - 4.0*uvwqB + uvwqBB) / (2.0*dy);
    `;
}

/**
 * Returns the shader code for computing advection after boundary conditions have been applied.
 * @returns {string} The shader code.
 */
export function RDShaderAdvectionPostBC() {
  return `
    uvwqX = (uvwqR - uvwqL) / (2.0*dx);
    uvwqY = (uvwqT - uvwqB) / (2.0*dy);
    uvwqXF = (uvwqR - uvwq) / dx;
    uvwqYF = (uvwqT - uvwq) / dy;
    uvwqXB = (uvwq - uvwqL) / dx;
    uvwqYB = (uvwq - uvwqB) / dy;
    uvwqXFXF = (4.0*uvwqR - 3.0*uvwq - uvwqRR) / (2.0*dx);
    uvwqYFYF = (4.0*uvwqT - 3.0*uvwq - uvwqTT) / (2.0*dy);
    uvwqXBXB = (3.0*uvwq - 4.0*uvwqL + uvwqLL) / (2.0*dx);
    uvwqYBYB = (3.0*uvwq - 4.0*uvwqB + uvwqBB) / (2.0*dy);
    `;
}

/**
 * Returns the shader code for computing diffusion before boundary conditions have been applied.
 * @returns {string} The shader code.
 */
export function RDShaderDiffusionPreBC() {
  return `
    vec4 uvwqXX = (uvwqR - 2.0*uvwq + uvwqL) / (dx*dx);
    vec4 uvwqYY = (uvwqT - 2.0*uvwq + uvwqB) / (dy*dy);
    `;
}

/**
 * Returns the shader code for computing diffusion after boundary conditions have been applied.
 * @returns {string} The shader code.
 */
export function RDShaderDiffusionPostBC() {
  return `
    uvwqXX = (uvwqR - 2.0*uvwq + uvwqL) / (dx*dx);
    uvwqYY = (uvwqT - 2.0*uvwq + uvwqB) / (dy*dy);
    `;
}

/**
 * Generates a shader for updating a reaction-diffusion system without cross diffusion.
 * @param {number} [numSpecies=4] - The number of species. Defaults to 4.
 * @returns {string} - The shader code for the update.
 */
export function RDShaderUpdateNormal(numSpecies) {
  if (numSpecies == undefined) numSpecies = 4;
  let shader = "";
  shader += `
  float LDuuU = 0.5*((Duux*(uvwqR.r + uvwqL.r - 2.0*uvwq.r) + DuuxR*(uvwqR.r - uvwq.r) + DuuxL*(uvwqL.r - uvwq.r)) / dx) / dx +  0.5*((Duuy*(uvwqT.r + uvwqB.r - 2.0*uvwq.r) + DuuyT*(uvwqT.r - uvwq.r) + DuuyB*(uvwqB.r - uvwq.r)) / dy) / dy;
  float du = LDuuU + UFUN;
  `;
  if (numSpecies > 1) {
    shader += `
    float LDvvV = 0.5*((Dvvx*(uvwqR.g + uvwqL.g - 2.0*uvwq.g) + DvvxR*(uvwqR.g - uvwq.g) + DvvxL*(uvwqL.g - uvwq.g)) / dx) / dx +  0.5*((Dvvy*(uvwqT.g + uvwqB.g - 2.0*uvwq.g) + DvvyT*(uvwqT.g - uvwq.g) + DvvyB*(uvwqB.g - uvwq.g)) / dy) / dy;
    float dv = LDvvV + VFUN;
    `;
  }
  if (numSpecies > 2) {
    shader += `
    float LDwwW = 0.5*((Dwwx*(uvwqR.b + uvwqL.b - 2.0*uvwq.b) + DwwxR*(uvwqR.b - uvwq.b) + DwwxL*(uvwqL.b - uvwq.b)) / dx) / dx +  0.5*((Dwwy*(uvwqT.b + uvwqB.b - 2.0*uvwq.b) + DwwyT*(uvwqT.b - uvwq.b) + DwwyB*(uvwqB.b - uvwq.b)) / dy) / dy;
    float dw = LDwwW + WFUN;
    `;
  }
  if (numSpecies > 3) {
    shader += `
    float LDqqQ = 0.5*((Dqqx*(uvwqR.a + uvwqL.a - 2.0*uvwq.a) + DqqxR*(uvwqR.a - uvwq.a) + DqqxL*(uvwqL.a - uvwq.a)) / dx) / dx +  0.5*((Dqqy*(uvwqT.a + uvwqB.a - 2.0*uvwq.a) + DqqyT*(uvwqT.a - uvwq.a) + DqqyB*(uvwqB.a - uvwq.a)) / dy) / dy;
    float dq = LDqqQ + QFUN;
    `;
  }
  // Add the final line of the shader.
  switch (numSpecies) {
    case 1:
      shader += `result = vec4(du,0.0,0.0,0.0);`;
      break;
    case 2:
      shader += `result = vec4(du,dv,0.0,0.0);`;
      break;
    case 3:
      shader += `result = vec4(du,dv,dw,0.0);`;
      break;
    case 4:
      shader += `result = vec4(du,dv,dw,dq);`;
      break;
  }
  return (
    shader +
    `
    }`
  );
}

/**
 * Generates a shader for updating a reaction-diffusion system with cross diffusion.
 * @param {number} [numSpecies=4] - The number of species in the system.
 * @returns {string} The generated shader code.
 */
export function RDShaderUpdateCross(numSpecies) {
  if (numSpecies == undefined) numSpecies = 4;
  let shader = "";
  shader +=
    [
      `vec2 LDuuU = vec2(Duux*(uvwqR.r + uvwqL.r - 2.0*uvwq.r) + DuuxR*(uvwqR.r - uvwq.r) + DuuxL*(uvwqL.r - uvwq.r), Duuy*(uvwqT.r + uvwqB.r - 2.0*uvwq.r) + DuuyT*(uvwqT.r - uvwq.r) + DuuyB*(uvwqB.r - uvwq.r));`,
      `vec2 LDuvV = vec2(Duvx*(uvwqR.g + uvwqL.g - 2.0*uvwq.g) + DuvxR*(uvwqR.g - uvwq.g) + DuvxL*(uvwqL.g - uvwq.g), Duvy*(uvwqT.g + uvwqB.g - 2.0*uvwq.g) + DuvyT*(uvwqT.g - uvwq.g) + DuvyB*(uvwqB.g - uvwq.g));`,
      `vec2 LDuwW = vec2(Duwx*(uvwqR.b + uvwqL.b - 2.0*uvwq.b) + DuwxR*(uvwqR.b - uvwq.b) + DuwxL*(uvwqL.b - uvwq.b), Duwy*(uvwqT.b + uvwqB.b - 2.0*uvwq.b) + DuwyT*(uvwqT.b - uvwq.b) + DuwyB*(uvwqB.b - uvwq.b));`,
      `vec2 LDuqQ = vec2(Duqx*(uvwqR.a + uvwqL.a - 2.0*uvwq.a) + DuqxR*(uvwqR.a - uvwq.a) + DuqxL*(uvwqL.a - uvwq.a), Duqy*(uvwqT.a + uvwqB.a - 2.0*uvwq.a) + DuqyT*(uvwqT.a - uvwq.a) + DuqyB*(uvwqB.a - uvwq.a));`,
    ]
      .slice(0, numSpecies)
      .join("\n") +
    `\nfloat du = 0.5*dot(dSquared,` +
    [`LDuuU`, `LDuvV`, `LDuwW`, `LDuqQ`].slice(0, numSpecies).join(" + ") +
    `) + UFUN;\n`;
  // If there is more than one species, add the second species.
  if (numSpecies > 1) {
    // Compute the cross-diffusion terms.
    shader +=
      [
        `vec2 LDvuU = vec2(Dvux*(uvwqR.r + uvwqL.r - 2.0*uvwq.r) + DvuxR*(uvwqR.r - uvwq.r) + DvuxL*(uvwqL.r - uvwq.r), Dvuy*(uvwqT.r + uvwqB.r - 2.0*uvwq.r) + DvuyT*(uvwqT.r - uvwq.r) + DvuyB*(uvwqB.r - uvwq.r));`,
        `vec2 LDvvV = vec2(Dvvx*(uvwqR.g + uvwqL.g - 2.0*uvwq.g) + DvvxR*(uvwqR.g - uvwq.g) + DvvxL*(uvwqL.g - uvwq.g), Dvvy*(uvwqT.g + uvwqB.g - 2.0*uvwq.g) + DvvyT*(uvwqT.g - uvwq.g) + DvvyB*(uvwqB.g - uvwq.g));`,
        `vec2 LDvwW = vec2(Dvwx*(uvwqR.b + uvwqL.b - 2.0*uvwq.b) + DvwxR*(uvwqR.b - uvwq.b) + DvwxL*(uvwqL.b - uvwq.b), Dvwy*(uvwqT.b + uvwqB.b - 2.0*uvwq.b) + DvwyT*(uvwqT.b - uvwq.b) + DvwyB*(uvwqB.b - uvwq.b));`,
        `vec2 LDvqQ = vec2(Dvqx*(uvwqR.a + uvwqL.a - 2.0*uvwq.a) + DvqxR*(uvwqR.a - uvwq.a) + DvqxL*(uvwqL.a - uvwq.a), Dvqy*(uvwqT.a + uvwqB.a - 2.0*uvwq.a) + DvqyT*(uvwqT.a - uvwq.a) + DvqyB*(uvwqB.a - uvwq.a));`,
      ]
        .slice(0, numSpecies)
        .join("\n") +
      `\nfloat dv = 0.5*dot(dSquared,` +
      [`LDvuU`, `LDvvV`, `LDvwW`, `LDvqQ`].slice(0, numSpecies).join(" + ") +
      `) + VFUN;\n`;
  }
  // If there are more than two species, add the third species.
  if (numSpecies > 2) {
    // Compute the cross-diffusion terms.
    shader +=
      [
        `vec2 LDwuU = vec2(Dwux*(uvwqR.r + uvwqL.r - 2.0*uvwq.r) + DwuxR*(uvwqR.r - uvwq.r) + DwuxL*(uvwqL.r - uvwq.r), Dwuy*(uvwqT.r + uvwqB.r - 2.0*uvwq.r) + DwuyT*(uvwqT.r - uvwq.r) + DwuyB*(uvwqB.r - uvwq.r));`,
        `vec2 LDwvV = vec2(Dwvx*(uvwqR.g + uvwqL.g - 2.0*uvwq.g) + DwvxR*(uvwqR.g - uvwq.g) + DwvxL*(uvwqL.g - uvwq.g), Dwvy*(uvwqT.g + uvwqB.g - 2.0*uvwq.g) + DwvyT*(uvwqT.g - uvwq.g) + DwvyB*(uvwqB.g - uvwq.g));`,
        `vec2 LDwwW = vec2(Dwwx*(uvwqR.b + uvwqL.b - 2.0*uvwq.b) + DwwxR*(uvwqR.b - uvwq.b) + DwwxL*(uvwqL.b - uvwq.b), Dwwy*(uvwqT.b + uvwqB.b - 2.0*uvwq.b) + DwwyT*(uvwqT.b - uvwq.b) + DwwyB*(uvwqB.b - uvwq.b));`,
        `vec2 LDwqQ = vec2(Dwqx*(uvwqR.a + uvwqL.a - 2.0*uvwq.a) + DwqxR*(uvwqR.a - uvwq.a) + DwqxL*(uvwqL.a - uvwq.a), Dwqy*(uvwqT.a + uvwqB.a - 2.0*uvwq.a) + DwqyT*(uvwqT.a - uvwq.a) + DwqyB*(uvwqB.a - uvwq.a));`,
      ]
        .slice(0, numSpecies)
        .join("\n") +
      `\nfloat dw = 0.5*dot(dSquared,` +
      [`LDwuU`, `LDwvV`, `LDwwW`, `LDwqQ`].slice(0, numSpecies).join(" + ") +
      `) + WFUN;\n`;
  }
  // If there are more than three species, add the fourth species.
  if (numSpecies > 3) {
    // Compute the cross-diffusion terms.
    shader +=
      [
        `vec2 LDquU = vec2(Dqux*(uvwqR.r + uvwqL.r - 2.0*uvwq.r) + DquxR*(uvwqR.r - uvwq.r) + DquxL*(uvwqL.r - uvwq.r), Dquy*(uvwqT.r + uvwqB.r - 2.0*uvwq.r) + DquyT*(uvwqT.r - uvwq.r) + DquyB*(uvwqB.r - uvwq.r));`,
        `vec2 LDqvV = vec2(Dqvx*(uvwqR.g + uvwqL.g - 2.0*uvwq.g) + DqvxR*(uvwqR.g - uvwq.g) + DqvxL*(uvwqL.g - uvwq.g), Dqvy*(uvwqT.g + uvwqB.g - 2.0*uvwq.g) + DqvyT*(uvwqT.g - uvwq.g) + DqvyB*(uvwqB.g - uvwq.g));`,
        `vec2 LDqwW = vec2(Dqwx*(uvwqR.b + uvwqL.b - 2.0*uvwq.b) + DqwxR*(uvwqR.b - uvwq.b) + DqwxL*(uvwqL.b - uvwq.b), Dqwy*(uvwqT.b + uvwqB.b - 2.0*uvwq.b) + DqwyT*(uvwqT.b - uvwq.b) + DqwyB*(uvwqB.b - uvwq.b));`,
        `vec2 LDqqQ = vec2(Dqqx*(uvwqR.a + uvwqL.a - 2.0*uvwq.a) + DqqxR*(uvwqR.a - uvwq.a) + DqqxL*(uvwqL.a - uvwq.a), Dqqy*(uvwqT.a + uvwqB.a - 2.0*uvwq.a) + DqqyT*(uvwqT.a - uvwq.a) + DqqyB*(uvwqB.a - uvwq.a));`,
      ]
        .slice(0, numSpecies)
        .join("\n") +
      `\nfloat dq = 0.5*dot(dSquared,` +
      [`LDquU`, `LDqvV`, `LDqwW`, `LDqqQ`].slice(0, numSpecies).join(" + ") +
      `) + QFUN;\n`;
  }
  // Add the final line of the shader.
  switch (numSpecies) {
    case 1:
      shader += `result = vec4(du,0.0,0.0,0.0);`;
      break;
    case 2:
      shader += `result = vec4(du,dv,0.0,0.0);`;
      break;
    case 3:
      shader += `result = vec4(du,dv,dw,0.0);`;
      break;
    case 4:
      shader += `result = vec4(du,dv,dw,dq);`;
      break;
  }
  return (
    shader +
    `
    }`
  );
}

/**
 * Returns the shader code for updating the algebraic species in a reaction-diffusion simulation.
 * @returns {string} The shader code for updating the algebraic species.
 */
export function RDShaderAlgebraicSpecies() {
  return `
    updated.SPECIES = RHS.SPECIES / timescales.SPECIES;
    `;
}

/**
 * Returns the shader code for applying Dirichlet boundary conditions in the x-direction.
 * @param {string} [LR] - Optional argument to specify whether to return the shader code for the left boundary ("L"), right boundary ("R"), or both boundaries (undefined).
 * @returns {string} The shader code for applying Dirichlet boundary conditions in the x-direction.
 */
export function RDShaderDirichletX(LR) {
  const L = `
    if (textureCoords.x - step_x < 0.0) {
        updated.SPECIES = dirichletRHSSPECIESL;
    }
    `;
  const R = `
    if (textureCoords.x + step_x > 1.0) {
        updated.SPECIES = dirichletRHSSPECIESR;
    }
    `;
  if (LR == undefined) return L + R;
  if (LR == "L") return L;
  if (LR == "R") return R;
  return "";
}

/**
 * Returns the shader code for applying Dirichlet boundary conditions in the y-direction.
 * @param {string} [LR] - Optional argument to specify whether to return the shader code for the top boundary ("T"), bottom boundary ("B"), or both boundaries (undefined).
 * @returns {string} The shader code for applying Dirichlet boundary conditions in the y-direction.
 */
export function RDShaderDirichletY(TB) {
  const T = `
    if (textureCoords.y + step_y > 1.0) {
        updated.SPECIES = dirichletRHSSPECIEST;
    }
    `;
  const B = `
    if (textureCoords.y - step_y < 0.0) {
        updated.SPECIES = dirichletRHSSPECIESB;
    }
    `;
  if (TB == undefined) return T + B;
  if (TB == "T") return T;
  if (TB == "B") return B;
  return "";
}

/**
 * Returns a shader fragment that updates the SPECIES based on an indicator function.
 * @returns {string} The shader function as a string.
 */
export function RDShaderDirichletIndicatorFun() {
  return `
    if (float(indicatorFun) <= 0.0) {
        updated.SPECIES = `;
}

// For each timestepping pass: the offset from the pass's uniform t to the time of the state
// the pass produces, and, for passes that produce a stage slope k rather than a state, the
// coefficient c in the intermediate state u + c*dt*k that the slope is used to form. See
// timestep() in main.js for the uniform t during each pass.
const DIRICHLET_STAGE_TIMING = {
  FE: { offset: "dt" },
  AB2: { offset: "dt" },
  Mid1: { offset: "0.5*dt", c: "0.5" },
  Mid2: { offset: "0.5*dt" },
  RK41: { offset: "0.5*dt", c: "0.5" },
  RK42: { offset: "0.0", c: "0.5" },
  RK43: { offset: "0.5*dt", c: "1.0" },
  RK44: { offset: "0.0" },
};

/**
 * Wraps the Dirichlet-condition code (which assigns boundary values to "updated", and
 * "updated2" for species 5-8) for use at the end of a timestepping pass, so that:
 * - boundary values are evaluated at the time of the state the pass produces, by shadowing t;
 * - in passes producing a Midpoint/RK4 stage slope k, the boundary nodes get whichever slope
 *   makes the intermediate state u + c*dt*k equal to the boundary value. The slope is
 *   converted to that state, the Dirichlet code applied, and the slope recovered only where a
 *   value actually changed, so interior slopes stay exact.
 * @param {string} type - The pass ("FE", "AB2", "Mid1", "Mid2", "RK41", ..., "RK44").
 * @param {string} dirichletShader - The Dirichlet-condition code.
 * @param {boolean} [isMRT] - Whether the pass also produces species 5-8 in updated2.
 * @returns {string} The shader code, or "" if there are no Dirichlet conditions.
 */
export function RDShaderDirichletForStage(type, dirichletShader, isMRT = false) {
  if (!dirichletShader.trim()) return "";
  const { offset, c } = DIRICHLET_STAGE_TIMING[type];
  const block = `
    float tDirichlet = t + ${offset};
    {
      float t = tDirichlet;
      ${dirichletShader}
    }
    `;
  if (c == undefined) return block;
  const groups = [["updated", "textureSource", "stage"]];
  if (isMRT) groups.push(["updated2", "textureSourceGroup1", "stage2"]);
  const toState = groups
    .map(
      ([v, tex, name]) => `
    vec4 ${name}Base = texture2D(${tex}, textureCoords);
    vec4 ${name}Slope = ${v};
    ${v} = ${name}Base + ${c}*dt*${name}Slope;
    vec4 ${name}State = ${v};`,
    )
    .join("");
  const toSlope = groups
    .map(
      ([v, , name]) => `
    ${v} = mix(${name}Slope, (${v} - ${name}Base) / (${c}*dt), vec4(notEqual(${v}, ${name}State)));`,
    )
    .join("");
  return toState + block + toSlope;
}

/**
 * Returns the final part of shader code for a reaction-diffusion simulation.
 * @returns {string} The shader code.
 */
export function RDShaderBot() {
  return ` 
    gl_FragColor = updated;
}`;
}

/**
 * Returns the top part of shader code for enforcing Dirichlet boundary conditions.
 * @returns {string} The shader code.
 */
export function RDShaderEnforceDirichletTop() {
  return `precision highp float;
    varying vec2 textureCoords;
    uniform sampler2D textureSource;
    uniform float dx;
    uniform float dy;
    uniform float L;
    uniform float L_x;
    uniform float L_y;
    uniform float L_min;
    uniform float t;
    uniform float globalIntegralValue1;
    uniform float globalIntegralValue2;
    uniform float globalIntegralValue3;
    uniform float globalIntegralValue4;
    uniform sampler2D imageSourceOne;
    uniform sampler2D imageSourceTwo;

    AUXILIARY_GLSL_FUNS

    const float ALPHA = 0.147;
    const float INV_ALPHA = 1.0 / ALPHA;
    const float BETA = 2.0 / (pi * ALPHA);
    float erfinv(float pERF) {
      float yERF;
      if (pERF == -1.0) {
        yERF = log(1.0 - (-0.99)*(-0.99));
      } else {
        yERF = log(1.0 - pERF*pERF);
      }
      float zERF = BETA + 0.5 * yERF;
      return sqrt(sqrt(zERF*zERF - yERF * INV_ALPHA) - zERF) * sign(pERF);
    }

    void main()
    {
        ivec2 texSize = textureSize(textureSource,0);
        float step_x = 1.0 / float(texSize.x);
        float step_y = 1.0 / float(texSize.y);
        float x = textureCoords.x * L_x + MINX;
        float y = textureCoords.y * L_y + MINY;
        float interior = float(textureCoords.x > 0.75*step_x && textureCoords.x < 1.0 - 0.75*step_x && textureCoords.y > 0.5*step_y && textureCoords.y < 1.0 - 0.75*step_y);
        float exterior = 1.0 - interior;

        vec4 uvwq = texture2D(textureSource, textureCoords);
        gl_FragColor = uvwq;
    `;
}

// MRT counterpart of RDShaderEnforceDirichletTop(), used only once numGroups(numSpecies)>1
// (Stage 11.5 of the 8-species upgrade - enforceDirichlet() was previously not MRT-aware at
// all, so Dirichlet BCs silently had no effect on any species once numSpecies>4). Declares
// updated/updated2 (rather than writing gl_FragColor directly, as the non-MRT version does)
// so per-species override blocks built via selectSpeciesInShaderStr - which already knows
// how to target updated vs updated2 based on a species' group - work unmodified; the final
// fragColor0/fragColor1 assignment happens once, in RDShaderEnforceDirichletBotMRT() below.
export function RDShaderEnforceDirichletTopMRT() {
  return RDShaderEnforceDirichletTop()
    .replace(
      "uniform sampler2D textureSource;",
      `uniform sampler2D textureSource;
    uniform sampler2D textureSourceGroup1;
    layout(location = 0) out highp vec4 fragColor0;
    layout(location = 1) out highp vec4 fragColor1;`,
    )
    .replace(
      "gl_FragColor = uvwq;",
      `vec4 uvwq2 = texture2D(textureSourceGroup1, textureCoords);
        vec4 updated = uvwq;
        vec4 updated2 = uvwq2;`,
    );
}

/**
 * MRT counterpart of RDShaderBot(), closing RDShaderEnforceDirichletTopMRT()'s computeRHS-
 * style body with the final dual-output assignment, once all per-species Dirichlet override
 * blocks have been concatenated in between.
 * @returns {string} The shader code.
 */
export function RDShaderEnforceDirichletBotMRT() {
  return `
    fragColor0 = updated;
    fragColor1 = updated2;
}`;
}

/**
 * Generates shader code for clamping species values to the edge of a texture in a given direction.
 * @param {string} direction - The direction in which to clamp the species values. Can include "H" for horizontal and/or "V" for vertical.
 * @returns {string} The generated GLSL code.
 */
export function clampSpeciesToEdgeShader(direction) {
  // Each neighbour becomes the value a clamped texture would give: the edge node. The second
  // neighbours (LL etc.) are clamped after the first, as within two nodes of the edge their
  // clamped value is the (now clamped) first neighbour.
  let out = "";
  if (direction.includes("H")) {
    out += `
    if (textureCoords.x - step_x < 0.0) {
      uvwqL.SPECIES = uvwq.SPECIES;
    }
    if (textureCoords.x + step_x > 1.0) {
      uvwqR.SPECIES = uvwq.SPECIES;
    }
    if (textureCoords.x - 2.0*step_x < 0.0) {
      uvwqLL.SPECIES = uvwqL.SPECIES;
    }
    if (textureCoords.x + 2.0*step_x > 1.0) {
      uvwqRR.SPECIES = uvwqR.SPECIES;
    }`;
  }
  if (direction.includes("V")) {
    out += `
    if (textureCoords.y + step_y > 1.0) {
      uvwqT.SPECIES = uvwq.SPECIES;
    }
    if (textureCoords.y - step_y < 0.0) {
      uvwqB.SPECIES = uvwq.SPECIES;
    }
    if (textureCoords.y + 2.0*step_y > 1.0) {
      uvwqTT.SPECIES = uvwqT.SPECIES;
    }
    if (textureCoords.y - 2.0*step_y < 0.0) {
      uvwqBB.SPECIES = uvwqB.SPECIES;
    }`;
  }
  return out;
}

export function globalIntegralShader() {
  return `varying vec2 textureCoords;
    uniform sampler2D textureSource;
    uniform float dx;
    uniform float dy;
    uniform float L;
    uniform float L_x;
    uniform float L_y;
    uniform float L_min;
    uniform float t;
    uniform float globalIntegralValue1;
    uniform float globalIntegralValue2;
    uniform float globalIntegralValue3;
    uniform float globalIntegralValue4;
    uniform bool customSurface;
    uniform bool vectorField;
    uniform bool overlayLine;
    uniform sampler2D imageSourceOne;
    uniform sampler2D imageSourceTwo;

    AUXILIARY_GLSL_FUNS

    const float ALPHA = 0.147;
    const float INV_ALPHA = 1.0 / ALPHA;
    const float BETA = 2.0 / (pi * ALPHA);
    float erfinv(float pERF) {
      float yERF;
      if (pERF == -1.0) {
        yERF = log(1.0 - (-0.99)*(-0.99));
      } else {
        yERF = log(1.0 - pERF*pERF);
      }
      float zERF = BETA + 0.5 * yERF;
      return sqrt(sqrt(zERF*zERF - yERF * INV_ALPHA) - zERF) * sign(pERF);
    }

    void main()
    {
      ivec2 texSize = textureSize(textureSource,0);
      float step_x = 1.0 / float(texSize.x);
      float step_y = 1.0 / float(texSize.y);
      float x = MINX + textureCoords.x * L_x;
      float y = MINY + textureCoords.y * L_y;

      // The stencil locals (see stateStencilShader in derivatives.js).
      STATE_STENCIL

      float value1 = GLOBAL_INTEGRAL_FUN1;
      float value2 = GLOBAL_INTEGRAL_FUN2;
      float value3 = GLOBAL_INTEGRAL_FUN3;
      float value4 = GLOBAL_INTEGRAL_FUN4;
      // Runtime +inf (see computeDisplayFunShaderMid): avoids ANGLE folding 1.0/0.0.
      if (isnan(value1)) { value1 = 1.0 / (0.0 * gl_FragCoord.x); }
      if (isnan(value2)) { value2 = 1.0 / (0.0 * gl_FragCoord.x); }
      if (isnan(value3)) { value3 = 1.0 / (0.0 * gl_FragCoord.x); }
      if (isnan(value4)) { value4 = 1.0 / (0.0 * gl_FragCoord.x); }
      float in_domain = float(float(indicatorFun) > 0.0);
      gl_FragColor = vec4(value1 * in_domain, value2 * in_domain, value3 * in_domain, value4 * in_domain);
    }`;
}

// MRT counterpart of globalIntegralShader(), used only once numGroups(numSpecies)>1. The
// plan's Stage 7 text assumed no change was needed here (assuming Stage 5's substitution
// resolving species 5-8 was sufficient) - but like computeDisplayFunShaderMid/probeShader,
// this template only declares group-0's stencil, so a GLOBAL_INTEGRAL_FUN referencing a
// group-1 species would compile to reference an undeclared uvwq2. Adds a second sampler +
// group-1 5-point stencil, mirroring computeDisplayFunShaderMidMRT. Still single-output.
export function globalIntegralShaderMRT() {
  return globalIntegralShader()
    .replace(
      "uniform sampler2D textureSource;",
      "uniform sampler2D textureSource;\n    uniform sampler2D textureSourceGroup1;",
    )
    .replace("STATE_STENCIL", "STATE_STENCIL\n      STATE_STENCIL_GROUP1");
}
