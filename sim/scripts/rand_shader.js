// rand_shaders.js

// The inverse error function, which randNShader() uses, as an approximation (Winitzki's),
// for shaders to declare (indented as they are).
export const ERFINV_GLSL = `    const float ALPHA = 0.147;
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
`;

export function randShader() {
  // Compute pseudorandom noise that is approximately a uniform distribution on [0,1]. It has slightly more mass at 0 and 1.
  return `float RAND = fract(3.0*fract(sin(seed + dot(vec2(textureCoords.x,textureCoords.y),vec2(12.9898,78.233)))*43758.5453123));
  float RANDVAL = fract(3.0*fract(sin(seed)));`;
}

export function randNShader() {
  // Compute pseudorandom noise that is approximately a normal distribution.
  return `
  float intermediateRAND = fract(3.0*fract(sin(seed + dot(vec2(textureCoords.x,textureCoords.y),vec2(12.9898,78.233)))*43758.5453123));
	float intermediateRANDTWO = fract(3.0*fract(sin(seed*100.0+1.0 + dot(vec2(textureCoords.x,textureCoords.y),vec2(12.9898,78.233)))*43758.5453123));
	float intermediateRANDTHREE = fract(3.0*fract(sin(seed*200.0+1.0 + dot(vec2(textureCoords.x,textureCoords.y),vec2(12.9898,78.233)))*43758.5453123));
	float intermediateRANDFOUR = fract(3.0*fract(sin(seed*300.0+1.0 + dot(vec2(textureCoords.x,textureCoords.y),vec2(12.9898,78.233)))*43758.5453123));
  float RANDN = sqrt(2.0) * erfinv(2.0 * intermediateRAND - 1.0);
	float RANDNTWO = sqrt(2.0) * erfinv(2.0 * intermediateRANDTWO - 1.0);
  float RANDNTHREE = sqrt(2.0) * erfinv(2.0 * intermediateRANDTHREE - 1.0);
  float RANDNFOUR = sqrt(2.0) * erfinv(2.0 * intermediateRANDFOUR - 1.0);`;
}
