// rand_shaders.js

export function randShader() {
  return `float RAND = fract(sin(dot(vec2(textureCoords.x,textureCoords.y),vec2(12.9898,78.233)))*43758.5453123);`;
}
