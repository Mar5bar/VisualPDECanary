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
        vec4 uvwq = texture2D(textureSource, textureCoords);
        vec4 uvwqBrush = texture2D(textureSource, brushCoords);
        gl_FragColor = uvwq;
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

        vec4 SBrushvec = texture2D(imageSourceOne, brushCoords);
        float SBrush = (SBrushvec.x + SBrushvec.y + SBrushvec.z) / 3.0;
        float SBrushR = SBrushvec.r;
        float SBrushG = SBrushvec.g;
        float SBrushB = SBrushvec.b;
        float SBrushA = SBrushvec.a;
        vec4 TBrushvec = texture2D(imageSourceTwo, brushCoords);
        float TBrush = (TBrushvec.x + TBrushvec.y + TBrushvec.z) / 3.0;
        float TBrushR = TBrushvec.r;
        float TBrushG = TBrushvec.g;
        float TBrushB = TBrushvec.b;
        float TBrushA = TBrushvec.a;

        ivec2 texSize = textureSize(textureSource,0);
        float x = textureCoords.x * float(texSize.x) * dx;
        float y = textureCoords.y * float(texSize.y) * dy;
        vec2 diff = textureCoords - brushCoords;\n`;
}

export function discShader() {
  return `if (length(diff * vec2(L_x, L_y)) <= brushRadius) {`;
}

export function vLineShader() {
  return `if (L_x * length(diff.x) <= brushRadius) {`;
}

export function hLineShader() {
  return `if (L_y * length(diff.y) <= brushRadius) {`;
}

export function drawShaderBot() {
  return ` gl_FragColor.COLOURSPEC = brushValue;
        }

    }`;
}
