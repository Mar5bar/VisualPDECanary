// rand_shaders.js

export function randShader() {
  // Compute pseudorandom noise that is approximately a uniform distribution on [0,1]. It has slightly more mass at 0 and 1.
  return `float RAND = fract(3.0*fract(sin(seed + dot(vec2(textureCoords.x,textureCoords.y),vec2(12.9898,78.233)))*43758.5453123));`;
}
