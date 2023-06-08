// display_shaders.js

export function fiveColourDisplayTop() {
  return `varying vec2 textureCoords;
    uniform sampler2D textureSource;
    uniform float minColourValue;
    uniform float maxColourValue;
    const float pi = 3.141592653589793;

    uniform vec4 colour1;
    uniform vec4 colour2;
    uniform vec4 colour3;
    uniform vec4 colour4;
    uniform vec4 colour5;
		
    uniform float embossAmbient;
    uniform float embossDiffuse;
    uniform float embossSpecular;
    uniform vec3 embossLightDir;
		uniform float smoothingScale;

    void main()
    {   
        vec2 values = texture2D(textureSource, textureCoords).rg;
        if (values.g > 0.5)
        {
            gl_FragColor = vec4(0);
            return;
        }
        float value = values.r;
        float scaledValue = (value - minColourValue) / (maxColourValue - minColourValue);
        vec3 col = vec3(0.0, 0.0, 0.0);
        float a = 0.0;
        if (scaledValue <= colour1.a)
        {
            col = colour1.rgb;
        }
        if (scaledValue > colour1.a && scaledValue <= colour2.a)
        {
            a = (scaledValue - colour1.a)/(colour2.a - colour1.a);
            col = mix(colour1.rgb, colour2.rgb, a);
        }
        if(scaledValue > colour2.a && scaledValue <= colour3.a)
        {
            a = (scaledValue - colour2.a)/(colour3.a - colour2.a);
            col = mix(colour2.rgb, colour3.rgb, a);
        }
        if(scaledValue > colour3.a && scaledValue <= colour4.a)
        {
            a = (scaledValue - colour3.a)/(colour4.a - colour3.a);
            col = mix(colour3.rgb, colour4.rgb, a);
        }
        if(scaledValue > colour4.a && scaledValue <= colour5.a)
        {
            a = (scaledValue - colour4.a)/(colour5.a - colour4.a);
            col = mix(colour4.rgb, colour5.rgb, a);
        }
        if(scaledValue > colour5.a)
        {
            col = colour5.rgb;
        }
        col = clamp(col, 0.0, 1.0);
				`;
}

export function fiveColourDisplayBot() {
  return `gl_FragColor = vec4(col.r, col.g, col.b, 1.0); 
	}`;
}

export function embossShader() {
  return `ivec2 texSize = textureSize(textureSource,0);
    const float spec_exp = 10.0;
    float step_x = 1.0 / float(texSize.x);
    float step_y = 1.0 / float(texSize.y);
    float gradX = (texture2D(textureSource, textureCoords + vec2(+step_x, 0.0)).r - texture2D(textureSource, textureCoords + vec2(-step_x, 0.0)).r) / (maxColourValue - minColourValue);
    float gradY = (texture2D(textureSource, textureCoords + vec2(0.0, +step_y)).r - texture2D(textureSource, textureCoords + vec2(0.0, -step_y)).r) / (maxColourValue - minColourValue);
    vec3 normal = normalize(vec3 (-gradX, -gradY, 1.0 / smoothingScale));
    float diff = max(0.0, dot(normal, embossLightDir));
    float rz = max(0.0, 2.0*diff*normal.z - embossLightDir.z);
    col = col*(embossDiffuse*diff + embossAmbient) + embossSpecular*pow(rz, spec_exp);
    `;
}

export function largestSpeciesShader() {
  return `varying vec2 textureCoords;
      uniform sampler2D textureSource;
  
      void main()
      {   
          gl_FragColor = texture2D(textureSource, textureCoords);
      }`;
}

export function surfaceVertexShader() {
  return `varying vec2 textureCoords;
    uniform sampler2D textureSource;
    uniform float minColourValue;
    uniform float maxColourValue;
    uniform float heightScale;
    void main()
    {      
        textureCoords = uv;
        vec3 newPosition = position;
        float value = texture2D(textureSource, textureCoords).r;
        float scaledValue = clamp((value - minColourValue) / (maxColourValue - minColourValue) - 0.5, -0.5, 0.5);
        newPosition.z += heightScale * scaledValue;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }`;
}
