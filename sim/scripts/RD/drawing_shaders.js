// drawing_shaders.js

export function drawShaderTop() {
  return `varying vec2 textureCoords;
    uniform sampler2D textureSource;
	  uniform sampler2D imageSource;
    uniform vec2 brushCoords;
    uniform float brushRadius;
    uniform float domainWidth;
    uniform float domainHeight;
    uniform float seed;
    uniform float t;
    uniform float dx;
    uniform float dy;
    const float pi = 3.141592653589793;

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
        vec4 uvw = texture2D(textureSource, textureCoords);
        gl_FragColor = uvw;
        vec3 Tvec = texture2D(imageSource, textureCoords).rgb;
        float T = (Tvec.x + Tvec.y + Tvec.z) / 3.0;

        ivec2 texSize = textureSize(textureSource,0);
        float x = textureCoords.x * float(texSize.x) * dx;
        float y = textureCoords.y * float(texSize.y) * dy;
        vec2 diff = textureCoords - brushCoords;\n`;
}

export function discShader() {
  return `if (length(diff * vec2(domainWidth, domainHeight)) <= brushRadius) {`;
}

export function vLineShader() {
  return `if (domainWidth * length(diff.x) <= brushRadius) {`;
}

export function hLineShader() {
  return `if (domainHeight * length(diff.y) <= brushRadius) {`;
}

export function drawShaderBot() {
  return ` gl_FragColor.COLOURSPEC = brushValue;
        }

    }`;
}
