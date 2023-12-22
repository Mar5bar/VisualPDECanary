// generic_shaders.js

export function genericVertexShader() {
    return `varying vec2 textureCoords;
    void main()
    {      
        textureCoords = uv;
        gl_Position = projectionMatrix * (modelViewMatrix * vec4(position, 1.0));
    }`
}