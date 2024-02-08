// clear_shader.js

export function clearShaderTop() {
  return `varying vec2 textureCoords;
    uniform sampler2D textureSource;
    uniform sampler2D imageSourceOne;
    uniform sampler2D imageSourceTwo;
    uniform float dx;
    uniform float dy;
    uniform float L;
    uniform float L_x;
    uniform float L_y;
    uniform float L_min;
    uniform float t;
    uniform int nXDisc;
    uniform int nYDisc;
    uniform float seed;

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
        float x = MINX + textureCoords.x * float(nXDisc) * dx;
        float y = MINY + textureCoords.y * float(nYDisc) * dy;
    `;
}

export function clearShaderBot() {
  return `
        gl_FragColor = vec4(u, v, w, q);
    }`;
}
