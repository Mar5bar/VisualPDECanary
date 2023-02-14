// copy_shaders.js

export function copyShader() {
    return `varying vec2 textureCoords;
    uniform sampler2D textureSource;

    void main()
    {   
        gl_FragColor = texture2D(textureSource, textureCoords);
    }`;
}