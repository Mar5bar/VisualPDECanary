// clear_shader.js

export function clearShaderTop() {
    return `varying vec2 textureCoords;
    uniform sampler2D textureSource;
    uniform sampler2D imageSourceOne;
    uniform sampler2D imageSourceTwo;
    uniform float dx;
    uniform float dy;
    uniform int nXDisc;
    uniform int nYDisc;
    uniform float seed;
    const float pi = 3.141592653589793;

    float H(float val, float edge) 
    {
        float res = smoothstep(-0.01, 0.01, val - edge);
        return res;
    }

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
        float x = textureCoords.x * float(nXDisc) * dx;
        float y = textureCoords.y * float(nYDisc) * dy;
        vec4 Svec = texture2D(imageSourceOne, textureCoords);
        float S = (Svec.x + Svec.y + Svec.z) / 3.0;
        float SR = Svec.r;
        float SG = Svec.g;
        float SB = Svec.b;
        float SA = Svec.a;
        vec4 Tvec = texture2D(imageSourceTwo, textureCoords);
        float T = (Tvec.x + Tvec.y + Tvec.z) / 3.0;
        float TR = Tvec.r;
        float TG = Tvec.g;
        float TB = Tvec.b;
        float TA = Tvec.a;
    `;
}

export function clearShaderBot() {
    return `
        gl_FragColor = vec4(u, v, w, 1.0);
    }`;
}