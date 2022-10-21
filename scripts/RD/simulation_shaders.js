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

    void main()
    {
        ivec2 texSize = textureSize(textureSource,0);
        float step_x = 1.0 / float(texSize.x);
        float step_y = 1.0 / float(texSize.y);

        vec2 uv = texture2D(textureSource, textureCoords).rg;
        vec2 uvL = texture2D(textureSource, textureCoords + vec2(-step_x, 0.0)).rg;
        vec2 uvR = texture2D(textureSource, textureCoords + vec2(+step_x, 0.0)).rg;
        vec2 uvT = texture2D(textureSource, textureCoords + vec2(0.0, -step_y)).rg;
        vec2 uvB = texture2D(textureSource, textureCoords + vec2(0.0, +step_y)).rg;
    `;
}

export function RDShaderPeriodic(){
    return ``;
}

export function RDShaderNoFlux() {
    return `
    if (textureCoords.x - step_x < 0.0) {
        uvL = uvR;
    }
    if (textureCoords.x + step_x > 1.0) {
        uvR = uvL;
    }
    if (textureCoords.y - step_y < 0.0) {
        uvT = uvB;
    }
    if (textureCoords.y + step_y > 1.0){
        uvB = uvT;
    }
    `;
}

export function RDShaderFG() {
    return ` float f = - uv.r*uv.g*uv.g + 0.037*(1.0 - uv.r);
    float g = uv.r*uv.g*uv.g - (0.037+0.06)*uv.g;
    `;
}

export function RDShaderBot() {
    return ` 
    vec2 lap = (uvL + uvR - 2.0*uv) / dx / dx + (uvT + uvB - 2.0*uv) / dy / dy;

    float du = Du * lap.r + f;
    float dv = Dv * lap.g + g;
    vec2 updated = uv + dt * vec2(du, dv);

    gl_FragColor = vec4(updated.r, updated.g, 0.0, 1.0);
}`;
}