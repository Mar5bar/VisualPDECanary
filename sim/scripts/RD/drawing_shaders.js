// drawing_shaders.js

export function drawShaderTop() {
  return `varying vec2 textureCoords;
    uniform sampler2D textureSource;
	  uniform sampler2D imageSourceOne;
	  uniform sampler2D imageSourceTwo;
    uniform vec2 brushCoords;
    uniform float brushValueModifier;
    uniform float L;
    uniform float L_x;
    uniform float L_y;
    uniform float L_min;
    uniform float seed;
    uniform float t;
    uniform float dx;
    uniform float dy;

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
        vec4 uvwq = texture2D(textureSource, textureCoords);
        vec4 uvwqBrush = texture2D(textureSource, brushCoords);
        gl_FragColor = uvwq;
        vec4 Svec = texture2D(imageSourceOne, textureCoords);

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
        float x = MINX + textureCoords.x * L_x;
        float y = MINY + textureCoords.y * L_y;
        float xB = MINX + brushCoords.x * L_x;
        float yB = MINY + brushCoords.y * L_y;
        vec2 diff = textureCoords - brushCoords;
        float distance = 0.0;
        float factor = 0.0;\n`;
}

export function drawShaderShapeDisc() {
  return `distance = length(diff * vec2(L_x, L_y));\n`;
}

export function drawShaderShapeVLine() {
  return `distance = L_x * length(diff.x);\n`;
}

export function drawShaderShapeHLine() {
  return `distance = L_y * length(diff.y);\n`;
}

export function drawShaderShapeSquare() {
  return `distance = max(abs(L_x * diff.x),abs(L_y * diff.y));\n`;
}

export function drawShaderFactorSharp() {
  return `factor = float(distance <= brushRadius);\n`;
}

export function drawShaderFactorSmooth() {
  return `
  factor = Bump(distance, 0.0, 0.0, 0.0, brushRadius);`;
}

export function drawShaderCustom() {
  return `
  if (brushRadius > 0.0) {
    factor = 1.0;
  } else {
    factor = 0.0;
  }\n;`;
}

export function drawShaderBotReplace() {
  return ` if (factor > 0.0) {
              gl_FragColor.COLOURSPEC = brushValueModifier * brushValue * factor;
          }
        }`;
}

export function drawShaderBotAdd() {
  return `gl_FragColor.COLOURSPEC = uvwq.COLOURSPEC + brushValueModifier * brushValue * factor;
        }`;
}

// A shader that colours by texture uv coordinates.
export function uvFragShader() {
  return `varying vec2 textureCoords;
    void main() {
        gl_FragColor = vec4(textureCoords, 0.0, 1.0);
    }`;
}
