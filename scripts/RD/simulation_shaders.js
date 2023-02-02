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
    uniform float Dw;
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

        vec3 uvw = texture2D(textureSource, textureCoords).rgb;
        vec3 uvwL = texture2D(textureSource, textureCoords + vec2(-step_x, 0.0)).rgb;
        vec3 uvwR = texture2D(textureSource, textureCoords + vec2(+step_x, 0.0)).rgb;
        vec3 uvwT = texture2D(textureSource, textureCoords + vec2(0.0, +step_y)).rgb;
        vec3 uvwB = texture2D(textureSource, textureCoords + vec2(0.0, -step_y)).rgb;

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
        uvwL.SPECIES = uvwR.SPECIES;
    }
    if (textureCoords.x + step_x > 1.0) {
        uvwR.SPECIES = uvwL.SPECIES;
    }
    if (textureCoords.y + step_y > 1.0){
        uvwT.SPECIES = uvwB.SPECIES;
    }
    if (textureCoords.y - step_y < 0.0) {
        uvwB.SPECIES = uvwT.SPECIES;
    }
    `;
}

export function RDShaderRobin() {
    return `
    if (textureCoords.x - step_x < 0.0) {
        uvwL.SPECIES = uvwR.SPECIES - dx * robinRHSSPECIES;
    }
    if (textureCoords.x + step_x > 1.0) {
        uvwR.SPECIES = uvwL.SPECIES + dx * robinRHSSPECIES;
    }
    if (textureCoords.y + step_y > 1.0){
        uvwT.SPECIES = uvwB.SPECIES + dy * robinRHSSPECIES;
    }
    if (textureCoords.y - step_y < 0.0) {
        uvwB.SPECIES = uvwT.SPECIES - dy * robinRHSSPECIES;
    }
    `;
}

export function RDShaderUpdate() {
    return `
    vec3 lap = (uvwL + uvwR - 2.0*uvw) / dx / dx + (uvwT + uvwB - 2.0*uvw) / dy / dy;

    float du = Du * lap.r + f;
    float dv = Dv * lap.g + g;
    float dw = Dw * lap.b + h;
    vec3 updated = uvw + dt * vec3(du, dv, dw);
    `;
}

export function RDShaderDirichlet() {
    return `
    if ((textureCoords.x - step_x < 0.0) || (textureCoords.x + step_x > 1.0) || (textureCoords.y + step_y > 1.0) || (textureCoords.y - step_y < 0.0)) {
        updated.SPECIES = `
}

export function RDShaderBot() {
    return ` 
    gl_FragColor = vec4(updated.r, updated.g, updated.b, 1.0);
}`;
}