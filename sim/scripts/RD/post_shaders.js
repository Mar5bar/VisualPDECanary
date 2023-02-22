// post_shaders.js

export function computeDisplayFunShaderTop() {
    return `varying vec2 textureCoords;
    uniform sampler2D textureSource;

    void main()
    {
       `;
}

export function computeDisplayFunShaderBot() {
    return `
        vec4 uvw = texture2D(textureSource, textureCoords);
        float value = FUN;
        gl_FragColor = vec4(value, 0.0, 0.0, 1.0);

    }`;
}

export function computeMaxSpeciesShader() {
    return `varying vec2 textureCoords;
    uniform sampler2D textureSource;

    void main()
    {
        float value = 0.0;
        vec4 uvw = texture2D(textureSource, textureCoords);
        if (uvw.r >= uvw.g && uvw.r >= uvw.b) {
            value = 0.0;
        }
        else if (uvw.g >= uvw.r && uvw.g >= uvw.b) {
            value = 0.5;
        }
        else if (uvw.b >= uvw.r && uvw.b >= uvw.g) {
            value = 1.0;
        }
        gl_FragColor = vec4(value, 0.0, 0.0, 1.0);
    }`;
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
            
            gl_FragColor = vec4(value, 0.0, 0.0, 1.0);
    }
       `;
		 }