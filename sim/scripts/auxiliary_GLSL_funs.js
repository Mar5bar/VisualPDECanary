// auxiliary_GLSL_funs.js
export function auxiliary_GLSL_funs() {
  return `const float pi = 3.141592653589793;
  uniform bool isTwoD;
  float H(float VALUE) 
    {
        float RES = smoothstep(-0.01, 0.01, VALUE);
        return RES;
    }

    float H(float VALUE, float EDGE) 
    {
        float RES = smoothstep(-0.01, 0.01, VALUE - EDGE);
        return RES;
    }

    // Bilinear interpolation of a texture, honouring its wrap mode. Simulation textures use
    // nearest filtering, so that stencil reads at texel centres are exact, so lookups at
    // arbitrary points (u[x,y], probes, overlays, resampling) interpolate with this instead.
    // Weights within rounding error of a texel centre are snapped, so sampling at a node
    // returns exactly its value.
    vec4 textureBilinear(sampler2D tex, vec2 uv) {
      vec2 size = vec2(textureSize(tex, 0));
      vec2 st = uv * size - 0.5;
      vec2 base = floor(st);
      vec2 f = st - base;
      f = mix(f, vec2(0.0), vec2(lessThan(f, vec2(1e-4))));
      f = mix(f, vec2(1.0), vec2(greaterThan(f, vec2(1.0 - 1e-4))));
      vec2 c0 = (base + 0.5) / size;
      vec2 c1 = (base + 1.5) / size;
      return mix(
        mix(texture(tex, c0), texture(tex, vec2(c1.x, c0.y)), f.x),
        mix(texture(tex, vec2(c0.x, c1.y)), texture(tex, c1), f.x),
        f.y
      );
    }

    float safetanh(float VALUE)
    {
        return 1.0 - 2.0/(1.0+exp(2.0*VALUE));
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

    float Gauss(float x, float y, float MX, float MY, float SX, float SY, float CORR) {
      return exp(-((x-MX)*(x-MX)/(2.0*SX*SX)+(y-MY)*(y-MY)/(2.0*SY*SY)-CORR*(x-MX)*(y-MY)/(SX*SY))/(1.0-CORR*CORR))/(2.0*pi*SX*SY*sqrt(1.0-CORR*CORR));
    }

    float Bump(float x, float y, float MX, float MY, float MAXR) {
      float yDiff = 0.0;
      if (isTwoD) {
        yDiff = y - MY;
      }
      float RADIUSSQ = ((x-MX)*(x-MX)+(yDiff)*(yDiff)) / (MAXR*MAXR);
      if (RADIUSSQ < 1.0) {
        return exp(1.0-1.0/(1.0-RADIUSSQ));
      } else {
        return 0.0;
      }
    }`;
}
