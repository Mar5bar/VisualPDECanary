// clear_shader.js

export function clearShaderTop() {
    return `varying vec2 textureCoords;
    uniform sampler2D textureSource;
    uniform sampler2D imageSource;
    uniform float dx;
    uniform float dy;
    uniform int nXDisc;
    uniform int nYDisc;
    uniform float seed;
    const float pi = 3.141592653589793;

    float safepow(float x, float y) {
        if (x >= 0.0) {
            return pow(x,y);
        }
        if (mod(y,2.0) == 0.0) {
            return pow(-x,y);
        }
        return -pow(-x,y);
    }

    void main()
    {
        float x = textureCoords.x * float(nXDisc) * dx;
        float y = textureCoords.y * float(nYDisc) * dy;
        vec3 Tvec = texture2D(imageSource, textureCoords).rgb;
        float T = (Tvec.x + Tvec.y + Tvec.z) / 3.0;
    `;
}

export function clearShaderBot() {
    return `
        gl_FragColor = vec4(u, v, w, 1.0);
    }`;
}