// presets.js

export function getPreset(id) {
  let options;
  switch (id) {
    case "bistableTravellingWave":
      options = {
        boundaryConditionsU: "neumann",
        diffusionStrVV: "0",
        diffusionStrWW: "0",
        dt: 0.005,
        kineticParams: "a=0.5",
        numSpecies: 1,
        preset: "bistableTravellingWave",
        reactionStrU: "u*(u-a)*(1-u)",
        reactionStrV: "0",
        reactionStrW: "0",
        typeOfBrush: "vline",
        whatToDraw: "u",
        whatToPlot: "u",
      };
      break;

    case "brusselator":
      options = {
        clearValueU: "a",
        clearValueV: "b/a",
        diffusionStrUU: "0.0001",
        diffusionStrVV: "0.0001*D",
        diffusionStrWW: "0",
        dt: 0.001,
        kineticParams: "a=2;b=3;D=8",
        maxColourValue: 4,
        minColourValue: 1,
        preset: "brusselator",
        reactionStrU: "a+u^2*v-(b+1)*u",
        reactionStrV: "b*u-u^2*v",
        reactionStrW: "0",
        whatToDraw: "u",
        whatToPlot: "u",
      };
      break;

    case "CahnHilliard":
      options = {
        algebraicV: true,
        clearValueU: "tanh(30*(RAND-0.5))",
        crossDiffusion: true,
        diffusionStrUU: "D*(3*u^2-1)",
        diffusionStrUV: "-D",
        diffusionStrVU: "D*a",
        diffusionStrVV: 0,
        diffusionStrWW: "0",
        dt: 0.0001,
        fixRandSeed: true,
        kineticParams: "a=1;dt=0.0000002;D=0.0001",
        minColourValue: -1,
        preset: "CahnHilliard",
        reactionStrU: "u*(1-u^2)",
        reactionStrV: "0",
        reactionStrW: "0",
        squareCanvas: true,
        whatToDraw: "u",
        whatToPlot: "u",
      };
      break;

    case "cyclicCompetition":
      options = {
        clearValueU: "0.1*RAND+x",
        clearValueV: "0.1*RAND",
        clearValueW: "0.1*RAND",
        dt: 0.005,
        kineticParams: "a=0.8;b=1.9",
        numSpecies: "3",
        preset: "cyclicCompetition",
        renderSize: 552,
        reactionStrU: "u*(1-u-a*v-b*w)",
        reactionStrV: "v*(1-b*u-v-a*w)",
        reactionStrW: "w*(1-a*u-b*v-w)",
        spatialStep: 0.002,
        whatToDraw: "u",
        whatToPlot: "u",
        diffusionUStr: "0.000001",
        diffusionVStr: "0.00004",
        diffusionWStr: "0.000008",
        diffusionU: 0.000001,
        diffusionV: 0.00004,
        diffusionW: 0.000008,
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
    case "complexGinzburgLandau":
      options = {
        brushValue: "0",
        brushRadius: 0.02,
        clearValueU: "RAND*sin(3.14*7*x)*cos(3.14*7*y)",
        clearValueV: "RAND*sin(3.14*7*x)*cos(3.14*7*y)",
        crossDiffusion: true,
        diffusionStrUU: "0.00001",
        diffusionStrVV: "0.0001",
        diffusionStrWW: "0",
        dt: 0.001,
        fixRandSeed: true,
        kineticParams: "a=3;c=-1",
        maxColourValue: 3.1,
        preset: "complexGinzburgLandau",
        reactionStrU: "a*u-(u+c*v)*(u^2+v^2)",
        reactionStrV: "a*v+(c*u-v)*(u^2+v^2)",
        reactionStrW: "0",
        spatialStep: 0.002,
        whatToDraw: "u",
        whatToPlot: "u^2+v^2",
        constantDiffusion: false,
      };
      break;

    case "GiererMeinhardt":
      options = {
        clearValueV: "1",
        diffusionStrUU: "0.00005",
        diffusionStrVV: "0.00005*D",
        diffusionStrWW: "0",
        dt: 0.0005,
        kineticParams: "a=0.5;b=1;c=6.1;D=100",
        maxColourValue: 25,
        preset: "GiererMeinhardt",
        reactionStrU: "a+u^2/v-b*u",
        reactionStrV: "u^2-c*v",
        reactionStrW: "0",
        whatToDraw: "u",
        whatToPlot: "u",
      };
      break;
		  
	case "FitzHugh-Nagumo":
	options = {
	"brushValue": "0",
	"brushRadius": 14,
	"clearValueU": "0*RAND",
	"diffusionStrUU": "1",
	"diffusionStrVV": "D",
	"diffusionStrWW": "0",
	"domainScale": 280,
	"dt": 0.001,
	"fixRandSeed": true,
	"kineticParams": "ev=0.5;av=1;az=-0.1;D=20;",
	"minColourValue": -1,
	"numSpecies": "2",
	"preset": "FitzHugh-Nagumo",
	"reactionStrU": "u-u^3-v",
	"reactionStrV": "ev*(u-av*v-az)",
	"reactionStrW": "0",
	"spatialStep": 1.4,
	"squareCanvas": true,
	"whatToDraw": "u",
	"whatToPlot": "u",
};
break;
		  
		  
	case "FitzHugh-Nagumo-Hopf":
	options = {
	"brushValue": "0",
	"brushRadius": 14,
	"clearValueU": "cos(m*x*pi/280)*cos(m*y*pi/280)",
	"diffusionStrUU": "1",
	"diffusionStrVV": "D",
	"diffusionStrWW": "0",
	"domainScale": 280,
	"dt": 0.001,
	"fixRandSeed": true,
	"kineticParams": "m=4;ev=0.2;av=.01;az=-0.1;D=26;",
	"minColourValue": -1,
	"numSpecies": "2",
	"preset": "FitzHugh-Nagumo-Hopf",
	"reactionStrU": "u-u^3-v",
	"reactionStrV": "ev*(u-av*v-az)",
	"reactionStrW": "0",
	"spatialStep": 1.4,
	"squareCanvas": true,
	"suppressTryClickingPopup": true,
	"whatToDraw": "u",
	"whatToPlot": "u",
};
break;

    case "FitzHugh-Nagumo-3":
	options = {
	"brushValue": "0",
	"brushRadius": 12.6,
	"clearValueU": "5*(1-sin(pi*x/340)*sin(pi*y/340))^3",
	"diffusionStrUU": "1",
	"diffusionStrVV": "Dv",
	"diffusionStrWW": "Dw",
	"domainScale": 340,
	"dt": 0.001,
	"fixRandSeed": true,
	"kineticParams": "m=4;ev=0.2;ew=1;av=.065;aw=0.5;az=-0.1;Dv=40;Dw=200",
	"minColourValue": -1,
	"numSpecies": "3",
	"preset": "FitzHugh-Nagumo-3",
	"reactionStrU": "u-u^3-v",
	"reactionStrV": "ev*(u-av*v-aw*w-az)",
	"reactionStrW": "ew*(u-w)",
	"spatialStep": 1.8,
	"squareCanvas": true,
	"suppressTryClickingPopup": true,
	"whatToDraw": "u",
	"whatToPlot": "u",
};
break;

	case "KellerSegel":
	options = {
	"brushValue": "RAND",
	"brushRadius": 5.6000000000000005,
	"clearValueU": "0.01*RAND",
	"crossDiffusion": true,
	"diffusionStrUU": "1",
	"diffusionStrUV": "-c*u/(1+u^2)",
	"diffusionStrVV": "D",
	"diffusionStrWW": "0",
	"domainScale": 100,
	"dt": 0.005,
	"kineticParams": "D=1;c=4;a=0.1;",
	"maxColourValue": 2.5,
	"minColourValue": 0.0004821050970349461,
	"preset": "KellerSegel",
	"reactionStrU": "u*(1-u)",
	"reactionStrV": "u-a*v",
	"reactionStrW": "0",
	"spatialStep": 0.2,
	"suppressTryClickingPopup": true,
	"whatToDraw": "u",
	"whatToPlot": "u",
};
break;
		  
	case "KellerSegelHeart":
	options = {
	"boundaryConditionsU": "dirichlet",
	"boundaryConditionsV": "dirichlet",
	"brushValue": "RAND",
	"brushRadius": 5.5,
	"clearValueU": "0.001",
	"crossDiffusion": true,
	"diffusionStrUU": "1",
	"diffusionStrUV": "-c*u/(1+u^2)",
	"diffusionStrVV": "D",
	"diffusionStrWW": "0",
	"domainIndicatorFun": "(((x-140)/80)^2 + ((y-140)/80)^2 - 1)^3 - ((x-140)/80)^2*((y-140)/80)^3 < 0",
	"domainScale": 280,
	"domainViaIndicatorFun": true,
	"dt": 0.005,
	"kineticParams": "D=1;c=4;a=0.1;",
	"maxColourValue": 2.5,
	"minColourValue": 0.0004821050970349461,
	"preset": "KellerSegelHeart",
	"reactionStrU": "u*(1-u)",
	"reactionStrV": "u-a*v",
	"reactionStrW": "0",
	"spatialStep": 0.5,
	"squareCanvas": true,
	"suppressTryClickingPopup": true,
	"whatToDraw": "u",
	"whatToPlot": "u",
};
break;
		  
    case "GiererMeinhardtStripes":
      options = {
        autoSetColourRange: true,
        clearValueV: "1",
        diffusionStrUU: "0.00005",
        diffusionStrVV: "0.00005*D",
        diffusionStrWW: "0",
        dt: 0.0005,
        kineticParams: "a=0.5;b=1;c=6.1;K=0.003;D=100",
        maxColourValue: 9.410100936889648,
        minColourValue: 1.0677992105484009,
        preset: "GiererMeinhardtStripes",
        reactionStrU: "a+u^2/(v*(1+K*u^2))-b*u",
        reactionStrV: "u^2-c*v",
        reactionStrW: "0",
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
        boundaryConditionsU: "neumann",
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
        boundaryConditionsU: "neumann",
        clearValueU: "0.1*exp(-10000*RAND)",
        diffusionStrUU: "0.00004",
        diffusionStrVV: "0",
        diffusionStrWW: "0",
        dt: 0.0001,
	kineticParams: "K=1",
        numSpecies: 1,
        preset: "harshEnvironment",
        reactionStrU: "u*(1-u/K)",
        reactionStrV: "0",
        reactionStrW: "0",
        squareCanvas: true,
        suppressTryClickingPopup: true,
        whatToDraw: "u",
        whatToPlot: "u",
      };
      break;
	  
		  
		  
    case "inhomogHeatEquation":
      options = {
        boundaryConditionsU: "neumann",
        diffusionStrUU: "D",
        diffusionStrVV: "0",
        diffusionStrWW: "0",
        dt: 0.004,
        kineticParams: "n=2;m=2;D=0.0001",
        minColourValue: -1,
        numSpecies: 1,
        preset: "inhomogHeatEquation",
        reactionStrU: "cos(n*pi*x)*cos(m*pi*y)*D*pi^2*(n^2+m^2)",
        reactionStrV: "0",
        reactionStrW: "0",
        squareCanvas: true,
        whatToDraw: "u",
        whatToPlot: "u",
      };
      break;

    case "inhomogDiffusionHeatEquation":
      options = {
        boundaryConditionsU: "dirichlet",
        clearValueU: "1",
        diffusionStrUU: "D*(1+E*cos(n*pi*(sqrt((x-0.5)^2+(y-0.5)^2))))",
        diffusionStrVV: "0",
        diffusionStrWW: "0",
        dt: 0.004,
        kineticParams: "D=0.0001;E=0.99;n=30",
        numSpecies: 1,
        preset: "inhomogDiffusionHeatEquation",
        reactionStrU: "0",
        reactionStrV: "0",
        reactionStrW: "0",
        squareCanvas: true,
        whatToDraw: "u",
        whatToPlot: "u",
      };
      break;

    case "inhomogWaveEquation":
      options = {
        boundaryConditionsU: "neumann",
        boundaryConditionsV: "neumann",
        brushRadius: 0.01,
        crossDiffusion: true,
        diffusionStrUU: "C*D",
        diffusionStrVU: "D*(1+E*sin(pi*m*x))*(1+E*sin(n*pi*y))",
        diffusionStrVV: "0",
        diffusionStrWW: "0",
        dt: 0.001,
        kineticParams: "D=0.0001;m=9;n=9; C=0.01;E=0.95",
        preset: "inhomogWaveEquation",
        reactionStrU: "v",
        reactionStrV: "0",
        reactionStrW: "0",
        squareCanvas: true,
        whatToPlot: "u",
      };
      break;

    case "travellingWave":
      options = {
        boundaryConditionsU: "neumann",
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
	suppressTryClickingPopup: true,
        whatToDraw: "u",
        whatToPlot: "u",
      };
      break;
    case "heatEquation":
      options = {
        boundaryConditionsU: "neumann",
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
        crossDiffusion: true,
        diffusionStrUU: "C*D",
        diffusionStrVU: "D",
        diffusionStrVV: "0",
        diffusionStrWW: "0",
        boundaryConditionsU: "neumann",
        boundaryConditionsV: "neumann",
        dt: 0.001,
        kineticParams: "D=0.0001; C=0.01",
        numTimestepsPerFrame: 200,
        preset: "waveEquation",
        renderSize: 512,
        reactionStrU: "v",
        reactionStrV: "0",
        reactionStrW: "0",
        squareCanvas: true,
      };
      break;

    case "waveEquationICs":
      options = {
        boundaryConditionsU: "neumann",
        boundaryConditionsV: "neumann",
        clearValueU: "cos(n*pi*x)*cos(m*pi*y)",
        crossDiffusion: true,
        diffusionStrUU: "C*D",
        diffusionStrVU: "D",
        diffusionStrVV: "0",
        diffusionStrWW: "0",
        dt: 0.001,
        kineticParams: "D=0.0001; C=0;n=4;m=4",
        minColourValue: -1,
        preset: "waveEquationICs",
        reactionStrU: "v",
        reactionStrV: "0",
        reactionStrW: "0",
        squareCanvas: true,
        whatToPlot: "u",
      };
      break;

    case "Schnakenberg":
      options = {
        autoSetColourRange: true,
        clearValueU: "a + b",
        clearValueV: "b / (a+b)^2",
        diffusionStrUU: "0.0001",
        diffusionStrVV: "0.0001*D",
        diffusionStrWW: "0",
        dt: 0.00024,
        kineticParams: "a = 0.01;b = 2;D=100",
        maxColourValue: 7.968624591827393,
        minColourValue: 0.028697576373815536,
        numTimestepsPerFrame: 200,
        preset: "Schnakenberg",
        reactionStrU: "a - u +u^2*v",
        reactionStrV: "b - u^2*v",
        reactionStrW: "0",
        whatToDraw: "u",
        whatToPlot: "u",
      };
      break;

    case "SchnakenbergHopf":
      options = {
        brushRadius: 0.02,
        clearValueU: "a+b",
        clearValueV: "b/(a+b)^2",
        diffusionStrUU: "0.00001",
        diffusionStrVV: "0.00001*D",
        diffusionStrWW: "0",
        dt: 0.001,
        kineticParams: "a = 0.05; b = 0.4;D=8",
        maxColourValue: 3.5,
        numTimestepsPerFrame: 200,
        preset: "SchnakenbergHopf",
        reactionStrU: "a - u +u^2*v",
        reactionStrV: "b - u^2*v",
        reactionStrW: "0",
        spatialStep: 0.003,
        whatToDraw: "u",
        whatToPlot: "u",
      };
      break;
      
      case "plateEquation":
	options = {
        suppressTryClickingPopup: true,
	"algebraicW": true,
        brushValue: "-8",
	"boundaryConditionsU": "dirichlet",
	"boundaryConditionsV": "dirichlet",
	"boundaryConditionsW": "dirichlet",
	"clearValueU": "-4",
	"crossDiffusion": true,
	"diffusionStrUU": "Dc*D",
	"diffusionStrVV": "0",
	"diffusionStrVW": "-D",
	"diffusionStrWU": "D",
	"diffusionStrWW": "0",
	"dt": 0.0001,
	"kineticParams": "D=0.001;q=0.003;C=0.1;Dc=0.1",
	"maxColourValue": 0,
	"minColourValue": -8,
	"numSpecies": "3",
	"preset": "plateEquation",
	"reactionStrU": "v",
	"reactionStrV": "-q-C*v",
	"reactionStrW": "0",
	"squareCanvas": true,
	"whatToDraw": "u",
	"whatToPlot": "u",
};
break;

    case "stabilizedSchrodingerEquation":
      options = {
        boundaryConditionsU: "dirichlet",
        boundaryConditionsV: "dirichlet",
        brushRadius: 0.01,
        clearValueU: "sin(n*pi*x)*sin(m*pi*y)",
        crossDiffusion: true,
        diffusionStrUU: "C*D",
        diffusionStrUV: "-D",
        diffusionStrVU: "D",
        diffusionStrVV: "C*D",
        diffusionStrWW: "0",
        dt: 0.0001,
        kineticParams: "D=0.0001; C=0.004;n=3;m=3",
        preset: "stabilizedSchrodingerEquation",
        reactionStrU: "0",
        reactionStrV: "0",
        reactionStrW: "0",
        squareCanvas: true,
        whatToDraw: "u",
        whatToPlot: "u^2+v^2",
      };
      break;

    case "stabilizedSchrodingerEquationPotential":
      options = {
        autoSetColourRange: true,
        boundaryConditionsU: "dirichlet",
        boundaryConditionsV: "dirichlet",
        brushRadius: 0.01,
        clearValueU: "(sin(pi*x)*sin(pi*y))^10",
        crossDiffusion: true,
        diffusionStrUU: "C*D",
        diffusionStrUV: "-D",
        diffusionStrVU: "D",
        diffusionStrVV: "C*D",
        diffusionStrWW: "0",
        dt: 0.0001,
        kineticParams: "D=0.0001; C=0.004;n=15;m=15",
        maxColourValue: 1.5228073596954346,
        preset: "stabilizedSchrodingerEquationPotential",
        reactionStrU: "-sin(n*pi*x)*sin(m*pi*y)*v",
        reactionStrV: "sin(n*pi*x)*sin(m*pi*y)*u",
        reactionStrW: "0",
        squareCanvas: true,
        whatToDraw: "u",
        whatToPlot: "u^2+v^2",
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
        algebraicV: true,
        autoSetColourRange: true,
        boundaryConditionsU: "neumann",
        boundaryConditionsV: "neumann",
        crossDiffusion: true,
        diffusionStrUU: "0",
        diffusionStrUV: "-D",
        diffusionStrVU: "D",
        diffusionStrVV: "0",
        diffusionStrWW: "0",
        dt: 0.0005,
        kineticParams: "r=0.1;D=0.0001;a=1;b=1",
        maxColourValue: 1.44703209400177,
        minColourValue: -1.2287852764129639,
        numTimestepsPerFrame: 200,
        preset: "swiftHohenberg",
        renderSize: 512,
        reactionStrU: "(r-1)*u-2*v+a*u^2+b*u^3-u^5",
        reactionStrV: "0",
        reactionStrW: "0",
        squareCanvas: true,
        whatToDraw: "u",
        whatToPlot: "u",
      };
      break;

    default:
      options = {
        algebraicV: false,
        algebraicW: false,
        autoSetColourRange: false,
        backgroundColour: 0xffffff,
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
        dirichletStrU: "0",
        dirichletStrV: "0",
        dirichletStrW: "0",
        domainIndicatorFun: "1",
        domainScale: 1,
        domainViaIndicatorFun: false,
        dt: 0.1,
        fixRandSeed: false,
        imagePath: "./images/Alan.png",
        kineticParams: "",
        maxColourValue: 1.0,
        minColourValue: 0.0,
        neumannStrU: "0",
        neumannStrV: "0",
        neumannStrW: "0",
        numSpecies: 2,
        numTimestepsPerFrame: 100,
        oneDimensional: false,
        onlyExposeOptions: [],
        preset: "default",
        renderSize: 512,
        reactionStrU: "-u*v^2 + 0.037*(1.0 - u)",
        reactionStrV: "u*v^2 - (0.037+0.06)*v",
        reactionStrW: "u*v^2 - (0.037+0.06)*v",
        robinStrU: "0",
        robinStrV: "0",
        robinStrW: "0",
        runningOnLoad: true,
        showAllOptionsOverride: false,
        smoothingScale: 2,
        spatialStep: 1 / 200,
        squareCanvas: false,
        suppressTryClickingPopup: false,
        typeOfBrush: "circle",
        whatToDraw: "v",
        whatToPlot: "v",
      };
  }
  return options;
}
