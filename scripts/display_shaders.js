// display_shaders.js

export function fiveColourDisplay() {
    return `varying vec2 textureCoords;
    uniform sampler2D textureSource;
    uniform float minColourValue;
    uniform float maxColourValue;

    uniform vec4 color1;
    uniform vec4 color2;
    uniform vec4 color3;
    uniform vec4 color4;
    uniform vec4 color5;

    void main()
    {   
        float value = texture2D(textureSource, textureCoords).COLOURSPEC;
        float scaledValue = (value - minColourValue) / (maxColourValue - minColourValue);
        vec3 col = vec3(0.0, 0.0, 0.0);
        float a = 0.0;
        if (scaledValue <= color1.a)
        {
            col = color1.rgb;
        }
        if (scaledValue > color1.a && scaledValue <= color2.a)
        {
            a = (scaledValue - color1.a)/(color2.a - color1.a);
            col = mix(color1.rgb, color2.rgb, a);
        }
        if(scaledValue > color2.a && scaledValue <= color3.a)
        {
            a = (scaledValue - color2.a)/(color3.a - color2.a);
            col = mix(color2.rgb, color3.rgb, a);
        }
        if(scaledValue > color3.a && scaledValue <= color4.a)
        {
            a = (scaledValue - color3.a)/(color4.a - color3.a);
            col = mix(color3.rgb, color4.rgb, a);
        }
        if(scaledValue > color4.a && scaledValue <= color5.a)
        {
            a = (scaledValue - color4.a)/(color5.a - color4.a);
            col = mix(color4.rgb, color5.rgb, a);
        }
        if(scaledValue > color5.a)
            col = color5.rgb;
        
        gl_FragColor = vec4(col.r, col.g, col.b, 1.0);
        
    }`;
}

export function greyscaleDisplay() {
    return `varying vec2 textureCoords;
    uniform sampler2D textureSource;
    uniform float minColourValue;
    uniform float maxColourValue;

    void main()
    {   
        float value = texture2D(textureSource, textureCoords).COLOURSPEC;
        float scaledValue = (value - minColourValue) / (maxColourValue - minColourValue);
        gl_FragColor = vec4(scaledValue, scaledValue, scaledValue, 1.0);
        
    }`;
}

export function viridisDisplay() {
    return `varying vec2 textureCoords;
    uniform sampler2D textureSource;
    uniform float minColourValue;
    uniform float maxColourValue;

    void main()
    {   
        float value = texture2D(textureSource, textureCoords).COLOURSPEC;
        float scaledValue = (value - minColourValue) / (maxColourValue - minColourValue);
        gl_FragColor = vec4(scaledValue, scaledValue, scaledValue, 1.0);
        
    }`;
}