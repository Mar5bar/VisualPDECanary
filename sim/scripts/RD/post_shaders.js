// post_shaders.js

export function computeDisplayFunShaderTop() {
  return `varying vec2 textureCoords;
    uniform sampler2D textureSource;
    uniform float dx;
    uniform float dy;
    uniform float L;
    uniform float L_x;
    uniform float L_y;
    uniform float L_min;
    uniform float t;
    uniform float globalIntegralValue1;
    uniform float globalIntegralValue2;
    uniform float globalIntegralValue3;
    uniform float globalIntegralValue4;
    uniform bool customSurface;
    uniform bool vectorField;
    uniform bool overlayLine;
    uniform sampler2D imageSourceOne;
    uniform sampler2D imageSourceTwo;

    AUXILIARY_GLSL_FUNS

    const float ALPHA = 0.147;
    const float INV_ALPHA = 1.0 / ALPHA;
    const float BETA = 2.0 / (pi * ALPHA);
    float erfinv(float pERF) {
      float yERF;
      if (pERF == -1.0) {
        yERF = log(1.0 - (-0.99)*(-0.99));
      } else {
        yERF = log(1.0 - pERF*pERF);
      }
      float zERF = BETA + 0.5 * yERF;
      return sqrt(sqrt(zERF*zERF - yERF * INV_ALPHA) - zERF) * sign(pERF);
    }

    void main()
    {
       `;
}

export function computeDisplayFunShaderMid() {
  return `
        ivec2 texSize = textureSize(textureSource,0);
        float step_x = 1.0 / float(texSize.x);
        float step_y = 1.0 / float(texSize.y);
        float x = MINX + textureCoords.x * L_x;
        float y = MINY + textureCoords.y * L_y;

        // The stencil locals (see stateStencilShader in derivatives.js).
        STATE_STENCIL

        float value = FUN;
				float height = value;
                float yVecComp;
				if (customSurface) {
					height = (HEIGHT) / L;
				}
        if (vectorField) {
          height = XVECFUN;
          yVecComp = YVECFUN;
          VECFIELDPLACEHOLDER
        }
        if (overlayLine) {
          height = OVERLAYEXPR;
        }
        // Runtime +inf: a constant 1.0/0.0 is folded by ANGLE into uintBitsToFloat(), which
        // fails to compile on some drivers (e.g. Firefox/Linux/NVIDIA, pre-GLSL 330).
        if (isnan(value)) {
          value = 1.0 / (0.0 * gl_FragCoord.x);
        }
        gl_FragColor = vec4(value, 0.0, height, yVecComp);`;
}

// MRT counterpart of computeDisplayFunShaderTop(), used only once
// numGroups(numSpecies)>1 (numSpecies>4). Adds a second sampler for group 1's current
// state, so a display/probe expression (FUN, HEIGHT, OVERLAYEXPR, PROBE_FUN, ...) can
// reference species 5-8 as well. Still single-output (gl_FragColor) - unlike the main
// simulation shader, display/post-processing never needs to *write* raw per-species state,
// only read it to compute one derived value, so no GLSL3/MRT output plumbing is needed here.
export function computeDisplayFunShaderTopMRT() {
  return computeDisplayFunShaderTop().replace(
    "uniform sampler2D textureSource;",
    "uniform sampler2D textureSource;\n    uniform sampler2D textureSourceGroup1;",
  );
}

// MRT counterpart of computeDisplayFunShaderMid(): samples group 1's 5-point stencil
// (uvwq2-family) from textureSourceGroup1, in addition to the existing group-0 stencil, so
// FUN/HEIGHT/XVECFUN/YVECFUN/OVERLAYEXPR substitutions (already group-aware via
// parseShaderString) resolve correctly for group-1 species references.
export function computeDisplayFunShaderMidMRT() {
  return computeDisplayFunShaderMid().replace(
    "STATE_STENCIL",
    "STATE_STENCIL\n        STATE_STENCIL_GROUP1",
  );
}

// If the sample point is near the edge of the domain, set all vector components to zero.
export function postShaderDomainIndicatorVField(fun) {
  return `
  if (float(indicatorFunL) <= 0.0 || float(indicatorFunR) <= 0.0 || float(indicatorFunT) <= 0.0 || float(indicatorFunB) <= 0.0) {
    height = 0.0;
    yVecComp = 0.0;
  }
  `
    .replace(
      /indicatorFunL/,
      fun.replaceAll(/\bx\b/g, "(x-dx)").replaceAll(/\buvwq\./g, "uvwqL."),
    )
    .replace(
      /indicatorFunR/,
      fun.replaceAll(/\bx\b/g, "(x+dx)").replaceAll(/\buvwq\./g, "uvwqR."),
    )
    .replace(
      /indicatorFunT/,
      fun.replaceAll(/\by\b/g, "(y+dy)").replaceAll(/\buvwq\./g, "uvwqT."),
    )
    .replace(
      /indicatorFunB/,
      fun.replaceAll(/\by\b/g, "(y-dy)").replaceAll(/\buvwq\./g, "uvwqB."),
    );
}

export function postShaderDomainIndicator() {
  return `
  gl_FragColor.g = float(float(indicatorFun) <= 0.0);`;
}

export function postGenericShaderBot() {
  return `}`;
}

export function interpolationShader() {
  return `varying vec2 textureCoords;
    uniform sampler2D textureSource;

    void main()
    {
			// Bilinear interpolation of scalar values.
            ivec2 texSize = textureSize(textureSource,0);
            float fx = fract(textureCoords.x * float(texSize.x) - 0.5);
            float fy = fract(textureCoords.y * float(texSize.y) - 0.5);
            float lowerx = textureCoords.x - fx / float(texSize.x);
            float lowery = textureCoords.y - fy / float(texSize.y);
            float upperx = lowerx + 1.0 / float(texSize.x);
            float uppery = lowery + 1.0 / float(texSize.y);

            float valueLB = texture2D(textureSource, vec2(lowerx, lowery)).r;
            float valueLT = texture2D(textureSource, vec2(lowerx, uppery)).r;
            float valueRB = texture2D(textureSource, vec2(upperx, lowery)).r;
            float valueRT = texture2D(textureSource, vec2(upperx, uppery)).r;

            float value = mix(mix(valueLB, valueRB, fx), mix(valueLT, valueRT, fx), fy);
            
            gl_FragColor = texture2D(textureSource, textureCoords);
            gl_FragColor.r = value;
      }`;
}

export function minMaxShader() {
  return `varying vec2 textureCoords;
    uniform sampler2D textureSource;
    uniform vec2 srcResolution;
    uniform bool firstFlag;

    void main()
    {
      // The min and max of the 2x2 block of source texels that this texel reduces. The
      // texels are found by index, as each reduction texture is half the size of its
      // source rounded up, so normalised coordinates don't line up with the blocks when a
      // size is odd (and texels would be skipped).
      ivec2 outTexel = ivec2(gl_FragCoord.xy);
      float minVal = 1e38;
      float maxVal = -1e38;
      vec2 vals;
      for (int y = 0; y < 2; ++y) {
        for (int x = 0; x < 2; ++x) {
          ivec2 srcTexel = outTexel * 2 + ivec2(x, y);
          if (srcTexel.x < int(srcResolution.x) && srcTexel.y < int(srcResolution.y)) {
            vals = texture2D(textureSource, (vec2(srcTexel) + 0.5) / srcResolution).rg;
            if (firstFlag) {
              vals.g = vals.r;
            }
            minVal = min(minVal, vals.r);
            maxVal = max(maxVal, vals.g);
          }
        }
      }
      gl_FragColor = vec4(minVal, maxVal, 0.0, 0.0);
    }`;
}

export function sumShader() {
  return `varying vec2 textureCoords;
    uniform sampler2D textureSource;
    uniform vec2 srcResolution;

    void main()
    {
      // Sum the nearby pixels in the texture source, independently per channel (so this can
      // reduce up to 4 quantities packed into r/g/b/a at once - e.g. the global integrals -
      // as well as the single-channel case, which just leaves g/b/a as 0).
      ivec2 outTexel = ivec2(gl_FragCoord.xy);
      vec4 sumVal = vec4(0.0);
      for (int y = 0; y < 2; ++y) {
        for (int x = 0; x < 2; ++x) {
          ivec2 srcTexel = outTexel * 2 + ivec2(x, y);
          if (srcTexel.x < int(srcResolution.x) && srcTexel.y < int(srcResolution.y)) {
            sumVal += texture2D(textureSource, (vec2(srcTexel) + 0.5) / srcResolution);
          }
        }
      }
      gl_FragColor = sumVal;
    }`;
}

export function probeShader() {
  return `varying vec2 textureCoords;
    uniform sampler2D textureSource;
    uniform float dx;
    uniform float dy;
    uniform float L;
    uniform float L_x;
    uniform float L_y;
    uniform float L_min;
    uniform float t;
    uniform float globalIntegralValue1;
    uniform float globalIntegralValue2;
    uniform float globalIntegralValue3;
    uniform float globalIntegralValue4;
		uniform bool pointProbe;
    uniform bool probeUVs;
    uniform float probeU;
    uniform float probeV;
    uniform sampler2D imageSourceOne;
    uniform sampler2D imageSourceTwo;

    AUXILIARY_GLSL_FUNS
    
    void main() 
    {
			
      // x and y coordinates of the probe point.
      float x;
      float y;
			vec2 probeTexCoords;
			if (pointProbe)
			{
      	if (probeUVs) {
        	x = probeU * L_x + MINX;
        	y = probeV * L_y + MINY;
     		} else {
        	x = PROBE_X;
        	y = PROBE_Y;
      	}
      	probeTexCoords = vec2((x - MINX) / L_x, (y - MINY) / L_y);
			} else {
				probeTexCoords = textureCoords;
				x = textureCoords.x * L_x + MINX;
				y = textureCoords.y * L_y + MINY;
			}
      ivec2 texSize = textureSize(textureSource,0);
      float step_x = 1.0 / float(texSize.x);
      float step_y = 1.0 / float(texSize.y);
      // The stencil locals at the probe (see stateStencilShader in derivatives.js).
      STATE_STENCIL

      // Compute the probe value.
      gl_FragColor = vec4(PROBE_FUN, 0.0, x, y);
    }`;
}

// MRT counterpart of probeShader(), used only once numGroups(numSpecies)>1. Adds a second
// sampler for group 1's current state, sampling the same 9-point stencil (at probeTexCoords)
// so PROBE_FUN can reference species 5-8 as well. Still single-output (gl_FragColor) - see
// computeDisplayFunShaderTopMRT's comment for why no GLSL3/MRT output plumbing is needed.
export function probeShaderMRT() {
  return probeShader()
    .replace(
      "uniform sampler2D textureSource;",
      "uniform sampler2D textureSource;\n    uniform sampler2D textureSourceGroup1;",
    )
    .replace("STATE_STENCIL", "STATE_STENCIL\n      STATE_STENCIL_GROUP1");
}
