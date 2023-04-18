// post_shaders.js

export function computeDisplayFunShaderTop() {
  return `varying vec2 textureCoords;
    uniform sampler2D textureSource;
    const float pi = 3.141592653589793;
    uniform float dx;
    uniform float dy;
    uniform float L;
    uniform float L_x;
    uniform float L_y;
    uniform float t;
    uniform sampler2D imageSourceOne;
    uniform sampler2D imageSourceTwo;

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

    void main()
    {
       `;
}

export function computeDisplayFunShaderMid() {
  return `
        vec4 uvwq = texture2D(textureSource, textureCoords);
        ivec2 texSize = textureSize(textureSource,0);
        float x = textureCoords.x * float(texSize.x) * dx;
        float y = textureCoords.y * float(texSize.y) * dy;

        vec4 Svec = texture2D(imageSourceOne, textureCoords);
        float S = (Svec.x + Svec.y + Svec.z) / 3.0;
        float SR = Svec.r;
        float SG = Svec.g;
        float SB = Svec.b;
        float SA = Svec.a;
        vec4 Tvec = texture2D(imageSourceTwo, textureCoords);
        float T = (Tvec.x + Tvec.y + Tvec.z) / 3.0;
        float TR = Tvec.r;
        float TG = Tvec.g;
        float TB = Tvec.b;
        float TA = Tvec.a;

        float value = FUN;
        gl_FragColor = vec4(value, 0.0, 0.0, 1.0);`;
}

export function computeMaxSpeciesShaderMid() {
  return `varying vec2 textureCoords;
    uniform sampler2D textureSource;

    void main()
    {
        float value = 0.0;
        vec4 uvwq = texture2D(textureSource, textureCoords);
        if (uvwq.r >= uvwq.g && uvwq.r >= uvwq.b) {
            value = 0.0;
        }
        else if (uvwq.g >= uvwq.r && uvwq.g >= uvwq.b) {
            value = 0.5;
        }
        else if (uvwq.b >= uvwq.r && uvwq.b >= uvwq.g) {
            value = 1.0;
        }
        gl_FragColor = vec4(value, 0.0, 0.0, 1.0);`;
}

export function postShaderDomainIndicator() {
  return `
  gl_FragColor.g = float(float(indicatorFun) <= 0.0);`
}

export function postGenericShaderBot() {
  return `}`
}

export function interpolationShader() {
  return `varying vec2 textureCoords;
    uniform sampler2D textureSource;

    void main()
    {
			// Bilinear interpolation of scalar values.
            ivec2 texSize = textureSize(textureSource,0);
            float fx = fract(textureCoords.x * float(texSize.x) - 0.5);
            float fy = fract(textureCoords.y * float(texSize.y) - 0.5);
            float lowerx = textureCoords.x - fx / float(texSize.x);
            float lowery = textureCoords.y - fy / float(texSize.y);
            float upperx = lowerx + 1.0 / float(texSize.x);
            float uppery = lowery + 1.0 / float(texSize.y);

            float valueLB = texture2D(textureSource, vec2(lowerx, lowery)).r;
            float valueLT = texture2D(textureSource, vec2(lowerx, uppery)).r;
            float valueRB = texture2D(textureSource, vec2(upperx, lowery)).r;
            float valueRT = texture2D(textureSource, vec2(upperx, uppery)).r;

            float value = mix(mix(valueLB, valueRB, fx), mix(valueLT, valueRT, fx), fy);
            
            gl_FragColor = texture2D(textureSource, textureCoords);
            gl_FragColor.r = value;
      }`;
}
