// drawing_shaders.js

export function drawShaderTop() {
  return `varying vec2 textureCoords;
    uniform sampler2D textureSource;
	  uniform sampler2D imageSourceOne;
	  uniform sampler2D imageSourceTwo;
    uniform vec2 brushCoords;
    uniform float L;
    uniform float L_x;
    uniform float L_y;
    uniform float L_min;
    uniform float seed;
    uniform float t;
    uniform float dx;
    uniform float dy;
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
        vec4 uvwq = texture2D(textureSource, textureCoords);
        vec4 uvwqBrush = texture2D(textureSource, brushCoords);
        gl_FragColor = uvwq;
        vec4 Svec = texture2D(imageSourceOne, textureCoords);
        float I_S = (Svec.x + Svec.y + Svec.z) / 3.0;
        float I_SR = Svec.r;
        float I_SG = Svec.g;
        float I_SB = Svec.b;
        float I_SA = Svec.a;
        vec4 Tvec = texture2D(imageSourceTwo, textureCoords);
        float I_T = (Tvec.x + Tvec.y + Tvec.z) / 3.0;
        float I_TR = Tvec.r;
        float I_TG = Tvec.g;
        float I_TB = Tvec.b;
        float I_TA = Tvec.a;

        vec4 SBrushvec = texture2D(imageSourceOne, brushCoords);
        float I_SBrush = (SBrushvec.x + SBrushvec.y + SBrushvec.z) / 3.0;
        float I_SBrushR = SBrushvec.r;
        float I_SBrushG = SBrushvec.g;
        float I_SBrushB = SBrushvec.b;
        float I_SBrushA = SBrushvec.a;
        vec4 TBrushvec = texture2D(imageSourceTwo, brushCoords);
        float I_TBrush = (TBrushvec.x + TBrushvec.y + TBrushvec.z) / 3.0;
        float I_TBrushR = TBrushvec.r;
        float I_TBrushG = TBrushvec.g;
        float I_TBrushB = TBrushvec.b;
        float I_TBrushA = TBrushvec.a;

        ivec2 texSize = textureSize(textureSource,0);
        float x = textureCoords.x * float(texSize.x) * dx;
        float y = textureCoords.y * float(texSize.y) * dy;
        vec2 diff = textureCoords - brushCoords;\n`;
}

export function drawShaderShapeDisc() {
  return `float distance = length(diff * vec2(L_x, L_y));\n`;
}

export function drawShaderShapeVLine() {
  return `float distance = L_x * length(diff.x);\n`;
}

export function drawShaderShapeHLine() {
  return `float distance = L_y * length(diff.y);\n`;
}

export function drawShaderFactorSharp() {
  return `float factor = float(distance <= brushRadius);\n`
}

export function drawShaderFactorSmooth() {
  return `float factor = 0.0;
    if (distance < brushRadius) {
        factor = exp(1.0-1.0/(1.0-pow(distance / brushRadius, 2.0)));
    } else {
          factor = 0.0;
    }\n;`;
}

export function drawShaderBotReplace() {
  return ` if (factor > 0.0) {
              gl_FragColor.COLOURSPEC = brushValue * factor;
          }
        }`;
}

export function drawShaderBotAdd() {
  return `gl_FragColor.COLOURSPEC = uvwq.COLOURSPEC + brushValue * factor;
        }`;
}
