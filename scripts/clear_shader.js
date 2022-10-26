// clear_shader.js

export function clearShaderTop() {
    return `varying vec2 textureCoords;
    uniform sampler2D textureSource;
    uniform float dx;
    uniform float dy;
    uniform int nXDisc;
    uniform int nYDisc;
    uniform float seed;

    void main()
    {
        float x = textureCoords.x * float(nXDisc) * dx;
        float y = textureCoords.y * float(nYDisc) * dy;
    `;
}

export function clearShaderBot() {
    return `
        gl_FragColor = vec4(u, v, 0.0, 1.0);
    }`;
}