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
    uniform vec2 boundaryValues;

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
        updated.SPECIES = boundaryValues.SPECIES;
    }
    `
}

export function RDShaderBot() {
    return ` 
    gl_FragColor = vec4(updated.r, updated.g, 0.0, 1.0);
}`;
}

export function AlanShader() {
    return `precision highp float;
    varying vec2 textureCoords;
    uniform sampler2D textureSource;
    uniform sampler2D imageSource;
    uniform float dt;
    uniform float dx;
    uniform float dy;
    uniform float Du;
    uniform float Dv;
    uniform vec2 boundaryValues;

    float heaviside(float val, float edge) 
    {
        float res = step(edge, val);
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

        float T0 = 0.0;
        float T1 = 1.0 / 3.0;
        float T2 = 2.0 / 3.0;

        float U = texture2D(imageSource, textureCoords).r;
        float V = 1.0;
        float S = 2.0*heaviside(U,T1) + 18.0*heaviside(U,T2);
        float C = 1.0 - 2.0*heaviside(U,T2);

        float a1 = V - U;
        float a2 = 2.0*V;
        float b1 = (U - 2.0*V) / U;
        float b2 = (S*U + 2.0*U - 2.0*V) / V;
        float c1 = 1.0 / pow(U, 2.0);
        float c2 = - (S + 2.0) / V;
        
        float f = a1 + b1*uv.r*uv.r + c1*uv.r*uv.g - C * pow(uv.r - U, 3.0);
        float g = a2 + b2*uv.g + c2*uv.r*uv.g;

        vec2 lap = (uvL + uvR - 2.0*uv) / dx / dx + (uvT + uvB - 2.0*uv) / dy / dy;

        float du = Du * lap.r + f;
        float dv = Dv * lap.g + g;
        vec2 updated = uv + dt * vec2(du, dv);

        gl_FragColor = vec4(updated.r, updated.g, 0.0, 1.0);
        //gl_FragColor = texture2D(imageSource, textureCoords);
    }
    `
}