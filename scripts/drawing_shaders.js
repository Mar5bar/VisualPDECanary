// drawing_shaders.js

export function discShader() {
    return `varying vec2 textureCoords;
    uniform sampler2D textureSource;

    uniform vec2 brushCoords;
    uniform float brushRadius;
    uniform float brushValue;
    uniform float domainWidth;
    uniform float domainHeight;

    void main()
    {   
        gl_FragColor = texture2D(textureSource, textureCoords);

        ivec2 texSize = textureSize(textureSource,0);
        vec2 diff = textureCoords - brushCoords;
        if (length(diff * vec2(domainWidth, domainHeight)) < brushRadius) {
            gl_FragColor.COLOURSPEC = brushValue;
        }

    }`;
}

export function vLineShader() {
    return `varying vec2 textureCoords;
    uniform sampler2D textureSource;

    uniform vec2 brushCoords;
    uniform float brushRadius;
    uniform float brushValue;
    uniform float domainWidth;

    void main()
    {   
        gl_FragColor = texture2D(textureSource, textureCoords);

        ivec2 texSize = textureSize(textureSource,0);
        vec2 diff = textureCoords - brushCoords;
        if (domainWidth * length(diff.x) < brushRadius) {
            gl_FragColor.COLOURSPEC = brushValue;
        }

    }`;
}

export function hLineShader() {
    return `varying vec2 textureCoords;
    uniform sampler2D textureSource;

    uniform vec2 brushCoords;
    uniform float brushRadius;
    uniform float brushValue;
    uniform float domainHeight;

    void main()
    {   
        gl_FragColor = texture2D(textureSource, textureCoords);

        ivec2 texSize = textureSize(textureSource,0);
        vec2 diff = textureCoords - brushCoords;
        if (domainHeight * length(diff.y) < brushRadius) {
            gl_FragColor.COLOURSPEC = brushValue;
        }

    }`;
}