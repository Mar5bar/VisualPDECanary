// post_shaders.js

export function computeDisplayFunShader() {
    return `varying vec2 textureCoords;
    uniform sampler2D textureSource;

    void main()
    {
        vec4 uvw = texture2D(textureSource, textureCoords);
        float value = FUN;
        gl_FragColor = vec4(value, 0.0, 0.0, 1.0);

    }`
}