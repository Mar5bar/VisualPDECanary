// presets.js

export function getPreset(id) {
  let options;
  switch (id) {
    case "cyclicCompetition":
      options = {
        clearValueU: "0.01*RAND",
        clearValueV: "0.01*RAND",
        clearValueW: "0.01*RAND",
        diffusionStrUU: "0.000002",
        diffusionStrVV: "0.00004",
        diffusionStrWW: "0.000008",
        dt: 0.005,
        kineticParams: "a=0.8; b=1.9",
        numSpecies: "3",
        preset: "cyclicCompetition",
        reactionStrU: "u*(1-u-a*v-b*w)",
        reactionStrV: "v*(1-b*u-v-a*w)",
        reactionStrW: "w*(1-a*u-b*v-w)",
        spatialStep: 0.002,
        whatToPlot: "MAX",
      };
      break;
    case "chemicalBasisOfMorphogenesis":
      options = {
        diffusionStrUU: "0.0000042",
        diffusionStrVV: "0.0002",
        diffusionStrWW: "0",
        dt: 0.001,
        imagePath: "./images/chemicalBasisOfMorphogenesis.png",
        maxColourValue: 2.3,
        numTimestepsPerFrame: 8,
        preset: "chemicalBasisOfMorphogenesis",
        renderSize: 652,
        reactionStrU: "(1-T) - u + u^2*v",
        reactionStrV: "1 - u^2*v",
        reactionStrW: "0",
        showAllOptionsOverride: true,
        spatialStep: 0.002,
        squareCanvas: true,
        whatToDraw: "u",
        whatToPlot: "u",
      };
      break;
    case "localisedPatterns":
      options = {
        brushValue: "9",
        brushRadius: 0.1,
        clearValueU: "1",
        clearValueV: "0.99",
        diffusionStrUU: "0.0010",
        diffusionStrVV: "0.5",
        diffusionStrWW: "0",
        domainScale: 10,
        dt: 0.000625,
        maxColourValue: 9,
        minColourValue: 2,
        numTimestepsPerFrame: 200,
        preset: "localisedPatterns",
        renderSize: 700,
        reactionStrU: "(1+tanh(1*((x-5)*(x-5)+(y-5)*(y-5)-20)))-u+u^2*v",
        reactionStrV: "0.99 - u^2*v",
        reactionStrW: "0",
        spatialStep: 0.05,
        squareCanvas: true,
        whatToDraw: "u",
        whatToPlot: "u",
      };
      break;
    case "thresholdSimulation":
      options = {
        boundaryConditionsU: "noflux",
        brushRadius: 0.005,
        diffusionStrUU: "0.0001",
        diffusionStrVV: "0",
        diffusionStrWW: "0",
        dt: 0.002,
        numSpecies: 1,
        numTimestepsPerFrame: 200,
        preset: "thresholdSimulation",
        renderSize: 700,
        reactionStrU: "u*(1-u)*(u-0.4)",
        reactionStrV: "0",
        reactionStrW: "0",
        whatToDraw: "u",
        whatToPlot: "u",
      };
      break;
    case "harshEnvironment":
      options = {
        boundaryConditionsU: "dirichlet",
        diffusionStrUU: "0.0001",
        diffusionStrVV: "0",
        diffusionStrWW: "0",
        dt: 0.00006,
        numSpecies: 1,
        numTimestepsPerFrame: 200,
        preset: "harshEnvironment",
        renderSize: 700,
        reactionStrU: "u*(1-u)",
        reactionStrV: "0",
        reactionStrW: "0",
        whatToDraw: "u",
        whatToPlot: "u",
      };
      break;
    case "travellingWave":
      options = {
        boundaryConditionsU: "noflux",
        diffusionStrUU: "0.000001",
        diffusionStrVV: "0",
        diffusionStrWW: "0",
        dt: 0.002,
        numSpecies: 1,
        numTimestepsPerFrame: 200,
        preset: "travellingWave",
        renderSize: 700,
        reactionStrU: "u*(1-u)",
        reactionStrV: "0",
        reactionStrW: "0",
        typeOfBrush: "vline",
        whatToDraw: "u",
        whatToPlot: "u",
      };
      break;
    case "Alan":
      options = {
        boundaryConditionsU: "periodic",
        boundaryConditionsV: "periodic",
        diffusionStrUU: "0.0000042",
        diffusionStrVV: "0.0002",
        dt: 0.001,
        imagePath: "./images/Alan.png",
        maxColourValue: 2.3,
        numTimestepsPerFrame: 200,
        preset: "Alan",
        renderSize: 652,
        reactionStrU: "(1-T) - u + u^2*v",
        reactionStrV: "1 - u^2*v",
        showAllOptionsOverride: true,
        spatialStep: 0.002,
        squareCanvas: true,
        whatToDraw: "u",
        whatToPlot: "u",
      };
      break;
    case "heatEquation":
      options = {
        boundaryConditionsU: "noflux",
        diffusionStrUU: "0.00001",
        dt: 0.01,
        numSpecies: 1,
        onlyExposeOptions: [],
        preset: "heatEquation",
        reactionStrU: "0",
        spatialStep: 0.005,
        whatToDraw: "u",
        whatToPlot: "u",
      };
      break;
      
      
     
    case "waveEquation":
      options = {
	      "crossDiffusion": true,
  	      "diffusionStrUU": "C*D",
	      "diffusionStrVU": "D",
	      "diffusionStrVV": "0",
  	      "diffusionStrWW": "0",
	      "boundaryConditionsU": "noflux",
	      "boundaryConditionsV": "noflux",
	      "dt": 0.001,
	      "kineticParams": "D=0.0001; C=0.01",
	      "numTimestepsPerFrame": 200,
	      "renderSize": 512,
	      "reactionStrU": "v",
	      "reactionStrV": "0",
	      "reactionStrW": "0",
	      "squareCanvas": true,
      };
      break;
      
      
    case "subcriticalGS":
      options = {
        preset: "subcriticalGS",
        reactionStrU: "-u*v^2 + 0.037*(1.0 - u)",
        reactionStrV: "u*v^2 - (0.037+0.06)*v",
        whatToDraw: "v",
        whatToPlot: "v",
      };
      break;


    case "swiftHohenberg":
        options = {
	"algebraicV": true,
	"autoSetColourRange": true,
	"boundaryConditionsU": "noflux",
	"boundaryConditionsV": "noflux",
	"crossDiffusion": true,
	"diffusionStrUU": "0",
	"diffusionStrUV": "-D",
	"diffusionStrVU": "D",
	"diffusionStrVV": "0",
	"diffusionStrWW": "0",
	"dt": 0.0005,
	"kineticParams": "r=0.1;D=0.0001;a=1;b=1",
	"maxColourValue": 1.44703209400177,
	"minColourValue": -1.2287852764129639,
	"numTimestepsPerFrame": 200,
	"renderSize": 512,
	"reactionStrU": "(r-1)*u-2*v+a*u^2+b*u^3-u^5",
	"reactionStrV": "0",
	"reactionStrW": "0",
	"squareCanvas": true,
	"whatToDraw": "u",
	"whatToPlot": "u",
    };
    break;

    default:
      options = {
        algebraicV: false,
        autoSetColourRange: false,
        boundaryConditionsU: "periodic",
        boundaryConditionsV: "periodic",
        boundaryConditionsW: "periodic",
        brushValue: "1",
        brushRadius: 1 / 20,
        clearValueU: "0",
        clearValueV: "0",
        clearValueW: "0",
        colourmap: "turbo",
        crossDiffusion: false,
        diffusionStrUU: "0.000004",
        diffusionStrUV: "0",
        diffusionStrUW: "0",
        diffusionStrVU: "0",
        diffusionStrVV: "0.000002",
        diffusionStrVW: "0",
        diffusionStrWU: "0",
        diffusionStrWV: "0",
        diffusionStrWW: "0.000002",
        dirichletU: "0",
        dirichletV: "0",
        dirichletW: "0",
        domainScale: 1,
        dt: 0.1,
        fixRandSeed: false,
        imagePath: "./images/Alan.png",
        kineticParams: "",
        maxColourValue: 1.0,
        minColourValue: 0.0,
        numSpecies: 2,
        numTimestepsPerFrame: 100,
        onlyExposeOptions: [],
        preset: "default",
        renderSize: 256,
        reactionStrU: "-u*v^2 + 0.037*(1.0 - u)",
        reactionStrV: "u*v^2 - (0.037+0.06)*v",
        reactionStrW: "u*v^2 - (0.037+0.06)*v",
        robinStrU: "0",
        robinStrV: "0",
        robinStrW: "0",
        runningOnLoad: true,
        showAllOptionsOverride: false,
        spatialStep: 1 / 200,
        squareCanvas: false,
        typeOfBrush: "circle",
        whatToDraw: "v",
        whatToPlot: "v",
      };
  }
  return options;
}
