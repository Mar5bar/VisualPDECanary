// drawing_shaders.js

export function discShader() {
    return `varying vec2 textureCoords;
    uniform sampler2D textureSource;

    uniform vec2 brushCoords;
    uniform float brushRadius;
    uniform float brushValue;
    uniform float aspectRatio;

    void main()
    {   
        gl_FragColor = texture2D(textureSource, textureCoords);

        ivec2 texSize = textureSize(textureSource,0);
        vec2 diff = textureCoords - brushCoords;
        if (length(diff * vec2(texSize)) < brushRadius) {
            gl_FragColor.g = brushValue;
        }

    }`;
}

export function vLineShader() {
    return `varying vec2 textureCoords;
    uniform sampler2D textureSource;

    uniform vec2 brushCoords;
    uniform float brushRadius;
    uniform float brushValue;

    void main()
    {   
        gl_FragColor = texture2D(textureSource, textureCoords);

        ivec2 texSize = textureSize(textureSource,0);
        vec2 diff = textureCoords - brushCoords;
        if (float(texSize.x) * length(diff.x) < brushRadius) {
            gl_FragColor.g = brushValue;
        }

    }`;
}

export function hLineShader() {
    return `varying vec2 textureCoords;
    uniform sampler2D textureSource;

    uniform vec2 brushCoords;
    uniform float brushRadius;
    uniform float brushValue;

    void main()
    {   
        gl_FragColor = texture2D(textureSource, textureCoords);

        ivec2 texSize = textureSize(textureSource,0);
        vec2 diff = textureCoords - brushCoords;
        if (float(texSize.y) * length(diff.y) < brushRadius) {
            gl_FragColor.g = brushValue;
        }

    }`;
}