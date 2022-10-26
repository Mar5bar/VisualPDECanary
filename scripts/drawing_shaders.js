// drawing_shaders.js

export function drawShaderTop() {
    return `varying vec2 textureCoords;
    uniform sampler2D textureSource;

    uniform vec2 brushCoords;
    uniform float brushRadius;
    uniform float brushValue;
    uniform float domainWidth;
    uniform float domainHeight;
    uniform float seed;

    void main()
    {   
        gl_FragColor = texture2D(textureSource, textureCoords);

        ivec2 texSize = textureSize(textureSource,0);
        vec2 diff = textureCoords - brushCoords;\n`
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