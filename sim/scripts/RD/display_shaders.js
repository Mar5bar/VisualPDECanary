// display_shaders.js

export function fiveColourDisplayTop() {
  return `varying vec2 textureCoords;
    uniform sampler2D textureSource;
    uniform float minColourValue;
    uniform float maxColourValue;
    const float pi = 3.141592653589793;
    uniform float dx;
    uniform float dy;

    uniform vec4 colour1;
    uniform vec4 colour2;
    uniform vec4 colour3;
    uniform vec4 colour4;
    uniform vec4 colour5;
		
    uniform float dxUpscaledScale;
    uniform float dyUpscaledScale;
    uniform float embossAmbient;
    uniform float embossDiffuse;
    uniform float embossShiny;
    uniform float embossSmoothness;
    uniform float embossSpecular;
    uniform vec3 embossLightDir;

    uniform vec3 contourColour;
    uniform float contourEpsilon;
    uniform float contourStep;

    vec3 colFromValue(float val) {
        vec3 col;
        float a = 0.0;
        if (val <= colour1.a)
        {
            col = colour1.rgb;
        }
        if (val > colour1.a && val <= colour2.a)
        {
            a = (val - colour1.a)/(colour2.a - colour1.a);
            col = mix(colour1.rgb, colour2.rgb, a);
        }
        if(val > colour2.a && val <= colour3.a)
        {
            a = (val - colour2.a)/(colour3.a - colour2.a);
            col = mix(colour2.rgb, colour3.rgb, a);
        }
        if(val > colour3.a && val <= colour4.a)
        {
            a = (val - colour3.a)/(colour4.a - colour3.a);
            col = mix(colour3.rgb, colour4.rgb, a);
        }
        if(val > colour4.a && val <= colour5.a)
        {
            a = (val - colour4.a)/(colour5.a - colour4.a);
            col = mix(colour4.rgb, colour5.rgb, a);
        }
        if(val > colour5.a)
        {
            col = colour5.rgb;
        }
      return clamp(col, 0.0, 1.0);
    }

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
        vec3 col = colFromValue(scaledValue);
				`;
}

export function fiveColourDisplayBot() {
  return `gl_FragColor = vec4(col, 1.0); 
	}`;
}

export function embossShader() {
  return `ivec2 texSize = textureSize(textureSource,0);
    float step_x = 1.0 / float(texSize.x);
    float step_y = 1.0 / float(texSize.y);
    float gradX = (texture2D(textureSource, textureCoords + vec2(+step_x, 0.0)).r - texture2D(textureSource, textureCoords + vec2(-step_x, 0.0)).r);
    float gradY = (texture2D(textureSource, textureCoords + vec2(0.0, +step_y)).r - texture2D(textureSource, textureCoords + vec2(0.0, -step_y)).r);
    vec3 normal = normalize(vec3 (-gradX/dx * dxUpscaledScale, -gradY/dy * dyUpscaledScale, embossSmoothness * (maxColourValue - minColourValue)));
    float diff = max(0.0, dot(normal, embossLightDir));
    float rz = max(0.0, 2.0*diff*normal.z - embossLightDir.z);
    col = col*(embossDiffuse*diff + embossAmbient) + embossSpecular*pow(rz, embossShiny);
    `;
}

export function contourShader() {
  return `for (float contourVal = contourStep; contourVal < 1.0; contourVal += contourStep) {
    col = mix(col, contourColour, float(abs(scaledValue - contourVal) < contourEpsilon));
  }`;
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
