// simulation_shaders.js

export function RDShaderTop() {
    return `precision highp float;
    varying vec2 textureCoords;
    uniform sampler2D textureSource;
    uniform float dt;
    uniform float dx;
    uniform float dy;
    uniform float Du;
    uniform float Dv;
    uniform float time;
    uniform vec2 boundaryValues;
    uniform sampler2D imageSource;

    float H(float val, float edge) 
    {
        float res = smoothstep(-0.01, 0.01, val - edge);
        return res;
    }

    void main()
    {
        ivec2 texSize = textureSize(textureSource,0);
        float step_x = 1.0 / float(texSize.x);
        float step_y = 1.0 / float(texSize.y);
        float x = textureCoords.x * float(texSize.x) * dx;
        float y = textureCoords.y * float(texSize.y) * dy;

        vec2 uv = texture2D(textureSource, textureCoords).rg;
        vec2 uvL = texture2D(textureSource, textureCoords + vec2(-step_x, 0.0)).rg;
        vec2 uvR = texture2D(textureSource, textureCoords + vec2(+step_x, 0.0)).rg;
        vec2 uvT = texture2D(textureSource, textureCoords + vec2(0.0, +step_y)).rg;
        vec2 uvB = texture2D(textureSource, textureCoords + vec2(0.0, -step_y)).rg;

        vec3 Tvec = texture2D(imageSource, textureCoords).rgb;
        float T = (Tvec.x + Tvec.y + Tvec.z) / 3.0;
    `;
}

export function RDShaderPeriodic() {
    return ``;
}

export function RDShaderNoFlux() {
    return `
    if (textureCoords.x - step_x < 0.0) {
        uvL.SPECIES = uvR.SPECIES;
    }
    if (textureCoords.x + step_x > 1.0) {
        uvR.SPECIES = uvL.SPECIES;
    }
    if (textureCoords.y + step_y > 1.0){
        uvT.SPECIES = uvB.SPECIES;
    }
    if (textureCoords.y - step_y < 0.0) {
        uvB.SPECIES = uvT.SPECIES;
    }
    `;
}

export function RDShaderRobin() {
    return `
    if (textureCoords.x - step_x < 0.0) {
        uvL.SPECIES = uvR.SPECIES - dx * robinRHSSPECIES;
    }
    if (textureCoords.x + step_x > 1.0) {
        uvR.SPECIES = uvL.SPECIES + dx * robinRHSSPECIES;
    }
    if (textureCoords.y + step_y > 1.0){
        uvT.SPECIES = uvB.SPECIES + dy * robinRHSSPECIES;
    }
    if (textureCoords.y - step_y < 0.0) {
        uvB.SPECIES = uvT.SPECIES - dy * robinRHSSPECIES;
    }
    `;
}

export function RDShaderFG() {
    return ` float f = - uv.r*uv.g*uv.g + 0.037*(1.0 - uv.r);
    float g = uv.r*uv.g*uv.g - (0.037+0.06)*uv.g;
    `;
}

export function RDShaderUpdate() {
    return `
    vec2 lap = (uvL + uvR - 2.0*uv) / dx / dx + (uvT + uvB - 2.0*uv) / dy / dy;

    float du = Du * lap.r + f;
    float dv = Dv * lap.g + g;
    vec2 updated = uv + dt * vec2(du, dv);
    `;
}

export function RDShaderDirichlet() {
    return `
    if ((textureCoords.x - step_x < 0.0) || (textureCoords.x + step_x > 1.0) || (textureCoords.y + step_y > 1.0) || (textureCoords.y - step_y < 0.0)) {
        updated.SPECIES = `
}

export function RDShaderBot() {
    return ` 
    gl_FragColor = vec4(updated.r, updated.g, 0.0, 1.0);
}`;
}