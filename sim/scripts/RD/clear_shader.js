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
    const float pi = 3.141592653589793;

    float H(float val) 
    {
        float res = smoothstep(-0.01, 0.01, val);
        return res;
    }

    float H(float val, float edge) 
    {
        float res = smoothstep(-0.01, 0.01, val - edge);
        return res;
    }

    float safetanh(float val)
    {
        return 1.0 - 2.0/(1.0+exp(2.0*val));
    }

    float safepow(float x, float y) {
        if (x >= 0.0) {
            return pow(x,y);
        }
        if (mod(round(y),2.0) == 0.0) {
            return pow(-x,y);
        }
        return -pow(-x,y);
    }

    float Gauss(float x, float y, float mx, float my, float sx, float sy, float rho) {
      return exp(-((x-mx)*(x-mx)/(2.0*sx*sx)+(y-my)*(y-my)/(2.0*sy*sy)-rho*(x-mx)*(y-my)/(sx*sy))/(1.0-rho*rho))/(2.0*pi*sx*sy*sqrt(1.0-rho*rho));
    }

    float Bump(float x, float y, float mx, float my, float maxr) {
      float r = ((x-mx)*(x-mx)+(y-my)*(y-my)) / (maxr*maxr);
      if (r < 1.0) {
        return exp(1.0-1.0/(1.0-r));
      } else {
        return 0.0;
      }
    }

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
