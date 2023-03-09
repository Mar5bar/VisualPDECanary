let canvas, gl, floatLinearExtAvailable;
let camera, simCamera, scene, simScene, renderer, aspectRatio;
let simTextureA, simTextureB, postTexture, interpolationTexture;
let displayMaterial,
  drawMaterial,
  simMaterial,
  clearMaterial,
  copyMaterial,
  postMaterial,
  interpolationMaterial;
let domain, simDomain;
let options, uniforms, funsObj;
let leftGUI,
  rightGUI,
  root,
  pauseButton,
  resetButton,
  backgroundColourController,
  brushRadiusController,
  fController,
  gController,
  hController,
  algebraicVController,
  algebraicWController,
  crossDiffusionController,
  domainIndicatorFunController,
  DuuController,
  DuvController,
  DuwController,
  DvuController,
  DvvController,
  DvwController,
  DwuController,
  DwvController,
  DwwController,
  dtController,
  whatToDrawController,
  whatToPlotController,
  minColourValueController,
  maxColourValueController,
  setColourRangeController,
  autoSetColourRangeController,
  clearValueUController,
  clearValueVController,
  clearValueWController,
  uBCsController,
  vBCsController,
  wBCsController,
  dirichletUController,
  dirichletVController,
  dirichletWController,
  neumannUController,
  neumannVController,
  neumannWController,
  robinUController,
  robinVController,
  robinWController,
  fMisc,
  imController,
  genericOptionsFolder,
  showAllStandardTools,
  showAll;
let isRunning, isDrawing, hasDrawn;
let inTex, outTex;
let nXDisc, nYDisc, domainWidth, domainHeight;
let parametersFolder,
  kineticParamsStrs = {},
  kineticParamsLabels = [],
  kineticParamsCounter = 0;
const listOfTypes = [
  "1Species", // 0
  "2Species", // 1
  "2SpeciesCrossDiffusion", // 2
  "2SpeciesCrossDiffusionAlgebraicV", // 3
  "3Species", // 4
  "3SpeciesCrossDiffusion", // 5
  "3SpeciesCrossDiffusionAlgebraicW", // 6
];
let equationType;

import {
  discShader,
  vLineShader,
  hLineShader,
  drawShaderBot,
  drawShaderTop,
} from "./drawing_shaders.js";
import {
  computeDisplayFunShaderTop,
  computeDisplayFunShaderMid,
  computeMaxSpeciesShaderMid,
  postGenericShaderBot,
  postShaderDomainIndicator,
  interpolationShader,
} from "./post_shaders.js";
import { copyShader } from "../copy_shader.js";
import {
  RDShaderTop,
  RDShaderBot,
  RDShaderDirichletX,
  RDShaderDirichletY,
  RDShaderDirichletIndicatorFun,
  RDShaderRobinX,
  RDShaderRobinY,
  RDShaderUpdateNormal,
  RDShaderUpdateCross,
  RDShaderAlgebraicV,
  RDShaderAlgebraicW,
} from "./simulation_shaders.js";
import { randShader } from "../rand_shader.js";
import { fiveColourDisplay } from "./display_shaders.js";
import { genericVertexShader } from "../generic_shaders.js";
import { getPreset } from "./presets.js";
import { clearShaderBot, clearShaderTop } from "./clear_shader.js";

// Setup some configurable options.
options = {};

funsObj = {
  reset: function () {
    resetSim();
  },
  pause: function () {
    if (isRunning) {
      pauseSim();
    } else {
      playSim();
    }
  },
  copyConfigAsURL: function () {
    let objDiff = diffObjects(options, getPreset("default"));
    objDiff.preset = "Custom";
    let str = [
      location.href.replace(location.search, ""),
      "?options=",
      encodeURI(btoa(JSON.stringify(objDiff))),
    ].join("");
    navigator.clipboard.writeText(str);
  },
  copyConfigAsJSON: function () {
    let objDiff = diffObjects(options, getPreset("default"));
    objDiff.preset = "PRESETNAME";
    if (objDiff.hasOwnProperty("kineticParams")) {
      // If kinetic params have been specified, replace any commas with semicolons
      // to allow for pretty formatting of the JSON.
      objDiff.kineticParams = objDiff.kineticParams.replaceAll(",", ";");
    }
    let str = JSON.stringify(objDiff)
      .replaceAll(",", ",\n\t")
      .replaceAll(":", ": ")
      .replace("{", "{\n\t")
      .replace("}", ",\n}");
    str = 'case "PRESETNAME":\n\toptions = ' + str + ";\nbreak;";
    navigator.clipboard.writeText(str);
  },
  setColourRange: function () {
    let valRange = getMinMaxVal();
    if (valRange[0] == valRange[1]) {
      // If the range is just one value, make the range width 1 centered on the given value.
      valRange[0] -= 0.5;
      valRange[1] += 0.5;
    }
    options.minColourValue = valRange[0];
    options.maxColourValue = valRange[1];
    uniforms.maxColourValue.value = options.maxColourValue;
    uniforms.minColourValue.value = options.minColourValue;
    maxColourValueController.updateDisplay();
    minColourValueController.updateDisplay();
  },
};

// Get the canvas to draw on, as specified by the html.
canvas = document.getElementById("simCanvas");

// Remove the back button if we're from an internal link.
if (!fromExternalLink()) {
  $("#back").hide();
  $("#equations").addClass("top");
}

var readFromTextureB = true;

// Load default options.
loadOptions("default");

// Initialise simulation and GUI.
init();

// Check URL for any preset or specified options.
const params = new URLSearchParams(window.location.search);
if (params.has("preset")) {
  // If a preset is specified, load it.
  loadPreset(params.get("preset"));
}
if (params.has("options")) {
  // If options have been provided, apply them on top of loaded options.
  loadPreset(JSON.parse(atob(decodeURI(params.get("options")))));
}

if (
  (fromExternalLink() || options.preset == "default") &&
  !options.suppressTryClickingPopup
) {
  $("#try_clicking").addClass("fading_in");
  setTimeout(fadeoutTryClicking, 5000);
}

// Begin the simulation.
animate();

//---------------

function init() {
  isDrawing = false;

  // Create a renderer.
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    preserveDrawingBuffer: true,
    powerPreference: "high-performance",
    antialias: false,
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.autoClear = false;
  gl = renderer.getContext();
  floatLinearExtAvailable =
    gl.getExtension("OES_texture_float_linear") &&
    gl.getExtension("EXT_float_blend");

  // Configure textures with placeholder sizes.
  simTextureA = new THREE.WebGLRenderTarget(options.maxDisc, options.maxDisc, {
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
  });
  simTextureB = simTextureA.clone();
  postTexture = simTextureA.clone();
  if (!floatLinearExtAvailable) {
    interpolationTexture = simTextureA.clone();
  }

  // Periodic boundary conditions (for now).
  simTextureA.texture.wrapS = THREE.RepeatWrapping;
  simTextureA.texture.wrapT = THREE.RepeatWrapping;
  simTextureB.texture.wrapS = THREE.RepeatWrapping;
  simTextureB.texture.wrapT = THREE.RepeatWrapping;
  postTexture.texture.wrapS = THREE.RepeatWrapping;
  postTexture.texture.wrapT = THREE.RepeatWrapping;

  // Create cameras for the simulation domain and the final output.
  camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, -1, 1);
  camera.position.z = 0;

  simCamera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, -1, 1);
  simCamera.position.z = 0;

  // Create two scenes: one for simulation, another for drawing.
  scene = new THREE.Scene();
  simScene = new THREE.Scene();

  scene.add(camera);

  // Define uniforms to be sent to the shaders.
  initUniforms();

  // This material will display the output of the simulation.
  displayMaterial = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: genericVertexShader(),
  });
  // This material performs any postprocessing before display.
  postMaterial = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: genericVertexShader(),
  });
  // This material performs bilinear interpolation.
  interpolationMaterial = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: genericVertexShader(),
    fragmentShader: interpolationShader(),
  });
  // This material allows for drawing via a number of fragment shaders, which will be swapped in before use.
  drawMaterial = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: genericVertexShader(),
  });
  // This material performs the timestepping.
  simMaterial = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: genericVertexShader(),
  });
  copyMaterial = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: genericVertexShader(),
    fragmentShader: copyShader(),
  });
  // A material for clearing the domain.
  clearMaterial = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: genericVertexShader(),
  });

  const plane = new THREE.PlaneGeometry(1.0, 1.0);
  domain = new THREE.Mesh(plane, displayMaterial);
  domain.position.z = 0;
  scene.add(domain);

  const simPlane = new THREE.PlaneGeometry(1.0, 1.0);
  simDomain = new THREE.Mesh(simPlane, simMaterial);
  simDomain.position.z = 0;
  simScene.add(simDomain);

  // Create a GUI.
  initGUI();

  // Set up the problem.
  updateProblem();

  // Set the brush type.
  setBrushType();

  // Set the size of the domain and related parameters.
  resize();

  // Add shaders to the textures.
  setDrawAndDisplayShaders();
  setClearShader();

  // Set the initial condition.
  resetSim();

  // Listen for pointer events.
  canvas.addEventListener("pointerdown", onDocumentPointerDown);
  canvas.addEventListener("pointerup", onDocumentPointerUp);
  canvas.addEventListener("pointermove", onDocumentPointerMove);

  document.addEventListener("keypress", function onEvent(event) {
    event = event || window.event;
    var target = event.target;
    var targetTagName =
      target.nodeType == 1 ? target.nodeName.toUpperCase() : "";
    if (!/INPUT|SELECT|TEXTAREA/.test(targetTagName)) {
      if (event.key === "r") {
        funsObj.reset();
      }
      if (event.key === " ") {
        if (isRunning) {
          pauseSim();
        } else {
          playSim();
        }
      }
    }
  });

  window.addEventListener("resize", resize, false);
}

function resize() {
  // Set the shape of the canvas.
  setCanvasShape();
  // Set the resolution of the simulation domain and the renderer.
  setSizes();
  // Assign sizes to textures.
  resizeTextures();
  // Update any uniforms.
  updateUniforms();
  render();
}

function roundBrushSizeToPix() {
  options.brushRadius =
    Math.round(uniforms.brushRadius.value / options.spatialStep) *
    options.spatialStep;
  uniforms.brushRadius.value = options.brushRadius;
  brushRadiusController.updateDisplay();
}

function updateUniforms() {
  uniforms.backgroundColour.value = new THREE.Color(options.backgroundColour);
  uniforms.brushRadius.value = options.brushRadius;
  uniforms.domainHeight.value = domainHeight;
  uniforms.domainWidth.value = domainWidth;
  uniforms.dt.value = options.dt;
  uniforms.dx.value = domainWidth / nXDisc;
  uniforms.dy.value = domainHeight / nYDisc;
  uniforms.L.value = options.domainScale;
  uniforms.maxColourValue.value = options.maxColourValue;
  uniforms.minColourValue.value = options.minColourValue;
  if (!options.fixRandSeed) {
    updateRandomSeed();
  }
}

function setSizes() {
  aspectRatio =
    canvas.getBoundingClientRect().height /
    canvas.getBoundingClientRect().width;
  // Set the domain size, setting the largest side to be of size options.domainScale.
  if (aspectRatio >= 1) {
    domainHeight = options.domainScale;
    domainWidth = domainHeight / aspectRatio;
  } else {
    domainWidth = options.domainScale;
    domainHeight = domainWidth * aspectRatio;
  }
  // Using the user-specified spatial step size, compute as close a discretisation as possible that
  // doesn't reduce the step size below the user's choice.
  nXDisc = Math.floor(domainWidth / options.spatialStep);
  nYDisc = Math.floor(domainHeight / options.spatialStep);
  // If the user has specified that this is a 1D problem, set nYDisc = 1.
  if (options.oneDimensional) {
    nYDisc = 1;
  }
  // Update these values in the uniforms.
  uniforms.nXDisc.value = nXDisc;
  uniforms.nYDisc.value = nYDisc;
  // Set the size of the renderer, which will interpolate from the textures.
  renderer.setSize(options.renderSize, options.renderSize, false);
}

function setCanvasShape() {
  if (options.squareCanvas) {
    document.getElementById("simCanvas").className = "squareCanvas";
  } else {
    document.getElementById("simCanvas").className = "fullCanvas";
  }
}

function resizeTextures() {
  // Resize the computational domain by interpolating the existing domain onto the new discretisation.
  simDomain.material = copyMaterial;

  if (!readFromTextureB) {
    uniforms.textureSource.value = simTextureA.texture;
    simTextureB.setSize(nXDisc, nYDisc);
    renderer.setRenderTarget(simTextureB);
    renderer.render(simScene, simCamera);
    simTextureA.dispose();
    simTextureA = simTextureB.clone();
    uniforms.textureSource.value = simTextureB.texture;
  } else {
    uniforms.textureSource.value = simTextureB.texture;
    simTextureA.setSize(nXDisc, nYDisc);
    renderer.setRenderTarget(simTextureA);
    renderer.render(simScene, simCamera);
    simTextureB.dispose();
    simTextureB = simTextureA.clone();
    uniforms.textureSource.value = simTextureA.texture;
  }
  readFromTextureB = !readFromTextureB;
  postTexture.setSize(nXDisc, nYDisc);
  // The interpolationTexture will be larger by a scale factor sf.
  if (!floatLinearExtAvailable) {
    let sf = options.smoothingScale;
    interpolationTexture.setSize(sf * nXDisc, sf * nYDisc);
  }

  render();
}

function initUniforms() {
  uniforms = {
    backgroundColour: {
      type: "v3",
    },
    boundaryValues: {
      type: "v2",
    },
    brushCoords: {
      type: "v2",
      value: new THREE.Vector2(0.5, 0.5),
    },
    brushRadius: {
      type: "f",
      value: options.domainScale / 100,
    },
    colour1: {
      type: "v4",
      value: new THREE.Vector4(0, 0, 0.0, 0),
    },
    colour2: {
      type: "v4",
      value: new THREE.Vector4(0, 1, 0, 0.2),
    },
    colour3: {
      type: "v4",
      value: new THREE.Vector4(1, 1, 0, 0.21),
    },
    colour4: {
      type: "v4",
      value: new THREE.Vector4(1, 0, 0, 0.4),
    },
    colour5: {
      type: "v4",
      value: new THREE.Vector4(1, 1, 1, 0.6),
    },
    domainHeight: {
      type: "f",
    },
    domainWidth: {
      type: "f",
    },
    dt: {
      type: "f",
      value: 0.01,
    },
    // Discrete step sizes in the texture, which will be set later.
    dx: {
      type: "f",
    },
    dy: {
      type: "f",
    },
    imageSource: {
      type: "t",
    },
    L: {
      type: "f",
    },
    maxColourValue: {
      type: "f",
      value: 1.0,
    },
    minColourValue: {
      type: "f",
      value: 0.0,
    },
    nXDisc: {
      type: "i",
    },
    nYDisc: {
      type: "i",
    },
    seed: {
      type: "f",
      value: 0.0,
    },
    textureSource: {
      type: "t",
    },
    time: {
      type: "f",
      value: 0.0,
    },
  };
}

function initGUI(startOpen) {
  // Initialise the left GUI.
  leftGUI = new dat.GUI({ closeOnTop: true });
  leftGUI.domElement.id = "leftGUI";

  // Initialise the right GUI.
  rightGUI = new dat.GUI({ closeOnTop: true });
  rightGUI.domElement.id = "rightGUI";

  if (inGUI("copyConfigAsURL")) {
    // Copy configuration as URL.
    rightGUI.add(funsObj, "copyConfigAsURL").name("Copy URL");
  }

  if (inGUI("copyConfigAsJSON")) {
    // Copy configuration as raw JSON.
    rightGUI.add(funsObj, "copyConfigAsJSON").name("Copy code");
  }

  leftGUI.open();
  rightGUI.open();
  if (startOpen != undefined && startOpen) {
    $("#leftGUI").show();
    $("#rightGUI").show();
  } else {
    $("#leftGUI").hide();
    $("#rightGUI").hide();
  }

  // Create a generic options folder for folderless controllers, which we'll hide later if it's empty.
  genericOptionsFolder = rightGUI.addFolder("Options");

  // Brush folder.
  if (inGUI("brushFolder")) {
    root = rightGUI.addFolder("Brush");
  } else {
    root = genericOptionsFolder;
  }

  if (inGUI("typeOfBrush")) {
    root
      .add(options, "typeOfBrush", {
        Disk: "circle",
        "Horizontal line": "hline",
        "Vertical line": "vline",
      })
      .name("Type")
      .onChange(setBrushType);
  }
  if (inGUI("brushValue")) {
    root.add(options, "brushValue").name("Value").onFinishChange(setBrushType);
  }
  if (inGUI("brushRadius")) {
    brushRadiusController = root
      .add(options, "brushRadius")
      .name("Radius")
      .onChange(updateUniforms);
    brushRadiusController.min(0);
  }
  if (inGUI("whatToDraw")) {
    whatToDrawController = root
      .add(options, "whatToDraw", { u: "u", v: "v", w: "w" })
      .name("Species")
      .onChange(setBrushType);
  }

  // Domain folder.
  if (inGUI("domainFolder")) {
    root = rightGUI.addFolder("Domain");
  } else {
    root = genericOptionsFolder;
  }
  if (inGUI("domainScale")) {
    root.add(options, "domainScale").name("Largest side").onChange(resize);
  }
  if (inGUI("spatialStep")) {
    const dxController = root
      .add(options, "spatialStep")
      .name("Space step")
      .onChange(function () {
        resize();
      })
      .onFinishChange(roundBrushSizeToPix);
    dxController.__precision = 12;
    dxController.min(0);
    dxController.updateDisplay();
  }
  if (inGUI("squareCanvas")) {
    root
      .add(options, "squareCanvas")
      .name("Square display")
      .onFinishChange(resize);
  }
  if (inGUI("oneDimensional")) {
    const oneDimensionalController = root
      .add(options, "oneDimensional")
      .name("1D")
      .onFinishChange(function () {
        resize();
        setRDEquations();
      });
  }
  if (inGUI("domainViaIndicatorFun")) {
    root
      .add(options, "domainViaIndicatorFun")
      .name("Implicit")
      .onFinishChange(function () {
        configureOptions();
        configureGUI();
        setRDEquations();
      });
  }
  if (inGUI("domainIndicatorFun")) {
    domainIndicatorFunController = root
      .add(options, "domainIndicatorFun")
      .name("Ind. fun")
      .onFinishChange(function () {
        configureOptions();
        configureGUI();
        setRDEquations();
        updateWhatToPlot();
      });
  }

  // Timestepping folder.
  if (inGUI("timesteppingFolder")) {
    root = rightGUI.addFolder("Timestepping");
  } else {
    root = genericOptionsFolder;
  }
  if (inGUI("numTimestepsPerFrame")) {
    root.add(options, "numTimestepsPerFrame", 1, 200, 1).name("Steps/frame");
  }
  if (inGUI("dt")) {
    dtController = root
      .add(options, "dt")
      .name("Timestep")
      .onChange(function () {
        updateUniforms();
      });
    dtController.__precision = 12;
    dtController.min(0);
    dtController.updateDisplay();
  }

  // Equations folder.
  if (inGUI("equationsFolder")) {
    root = rightGUI.addFolder("Equations");
  } else {
    root = genericOptionsFolder;
  }
  // Number of species.
  if (inGUI("numSpecies")) {
    root
      .add(options, "numSpecies", { 1: 1, 2: 2, 3: 3 })
      .name("No. species")
      .onChange(updateProblem);
  }
  // Cross diffusion.
  if (inGUI("crossDiffusion")) {
    crossDiffusionController = root
      .add(options, "crossDiffusion")
      .name("Cross diffusion")
      .onChange(updateProblem);
  }
  if (inGUI("algebraicV")) {
    algebraicVController = root
      .add(options, "algebraicV")
      .name("Algebraic v?")
      .onChange(updateProblem);
  }
  if (inGUI("algebraicW")) {
    algebraicWController = root
      .add(options, "algebraicW")
      .name("Algebraic w?")
      .onChange(updateProblem);
  }

  // Let's put these in the left GUI.
  root = leftGUI;
  if (inGUI("diffusionStrUU")) {
    DuuController = root
      .add(options, "diffusionStrUU")
      .name("$D_{uu}$")
      .onFinishChange(setRDEquations);
  }
  if (inGUI("diffusionStrUV")) {
    DuvController = root
      .add(options, "diffusionStrUV")
      .name("$D_{uv}$")
      .onFinishChange(setRDEquations);
  }
  if (inGUI("diffusionStrUW")) {
    DuwController = root
      .add(options, "diffusionStrUW")
      .name("$D_{uw}$")
      .onFinishChange(setRDEquations);
  }
  if (inGUI("diffusionStrVU")) {
    DvuController = root
      .add(options, "diffusionStrVU")
      .name("$D_{vu}$")
      .onFinishChange(setRDEquations);
  }
  if (inGUI("diffusionStrVV")) {
    DvvController = root
      .add(options, "diffusionStrVV")
      .name("$D_{vv}$")
      .onFinishChange(setRDEquations);
  }
  if (inGUI("diffusionStrVW")) {
    DvwController = root
      .add(options, "diffusionStrVW")
      .name("$D_{vw}$")
      .onFinishChange(setRDEquations);
  }
  if (inGUI("diffusionStrWU")) {
    DwuController = root
      .add(options, "diffusionStrWU")
      .name("$D_{wu}$")
      .onFinishChange(setRDEquations);
  }
  if (inGUI("diffusionStrWV")) {
    DwvController = root
      .add(options, "diffusionStrWV")
      .name("$D_{wv}$")
      .onFinishChange(setRDEquations);
  }
  if (inGUI("diffusionStrWW")) {
    DwwController = root
      .add(options, "diffusionStrWW")
      .name("$D_{ww}$")
      .onFinishChange(setRDEquations);
  }
  if (inGUI("reactionStrU")) {
    // Custom f(u,v) and g(u,v).
    fController = root
      .add(options, "reactionStrU")
      .name("$f(u,v,w)$")
      .onFinishChange(setRDEquations);
  }
  if (inGUI("reactionStrV")) {
    gController = root
      .add(options, "reactionStrV")
      .name("$g(u,v,w)$")
      .onFinishChange(setRDEquations);
  }
  if (inGUI("reactionStrW")) {
    hController = root
      .add(options, "reactionStrW")
      .name("$h(u,v,w)$")
      .onFinishChange(setRDEquations);
  }
  parametersFolder = leftGUI.addFolder("Parameters");
  setParamsFromKineticString();

  // Boundary conditions folder.
  if (inGUI("boundaryConditionsFolder")) {
    root = leftGUI.addFolder("Boundary conditions");
  } else {
    root = genericOptionsFolder;
  }
  if (inGUI("boundaryConditionsU")) {
    uBCsController = root
      .add(options, "boundaryConditionsU", {
        Periodic: "periodic",
        Dirichlet: "dirichlet",
        Neumann: "neumann",
        Robin: "robin",
      })
      .name("$u$")
      .onChange(function () {
        setRDEquations();
        setBCsGUI();
      });
  }
  if (inGUI("dirichletU")) {
    dirichletUController = root
      .add(options, "dirichletStrU")
      .name("$\\left.u\\right\\rvert_{\\boundary}$")
      .onFinishChange(setRDEquations);
  }
  if (inGUI("neumannStrU")) {
    neumannUController = root
      .add(options, "neumannStrU")
      .name("$\\left.\\pd{u}{n}\\right\\rvert_{\\boundary}$")
      .onFinishChange(setRDEquations);
  }
  if (inGUI("robinStrU")) {
    robinUController = root
      .add(options, "robinStrU")
      .name("$\\left.\\pd{u}{n}\\right\\rvert_{\\boundary}$")
      .onFinishChange(setRDEquations);
  }
  if (inGUI("boundaryConditionsV")) {
    vBCsController = root
      .add(options, "boundaryConditionsV", {
        Periodic: "periodic",
        Dirichlet: "dirichlet",
        Neumann: "neumann",
        Robin: "robin",
      })
      .name("$v$")
      .onChange(function () {
        setRDEquations();
        setBCsGUI();
      });
  }
  if (inGUI("dirichletV")) {
    dirichletVController = root
      .add(options, "dirichletStrV")
      .name("$\\left.v\\right\\rvert_{\\boundary}$")
      .onFinishChange(setRDEquations);
  }
  if (inGUI("neumannStrV")) {
    neumannVController = root
      .add(options, "neumannStrV")
      .name("$\\left.\\pd{v}{n}\\right\\rvert_{\\boundary}$")
      .onFinishChange(setRDEquations);
  }
  if (inGUI("robinStrV")) {
    robinVController = root
      .add(options, "robinStrV")
      .name("$\\left.\\pd{v}{n}\\right\\rvert_{\\boundary}$")
      .onFinishChange(setRDEquations);
  }
  if (inGUI("boundaryConditionsW")) {
    wBCsController = root
      .add(options, "boundaryConditionsW", {
        Periodic: "periodic",
        Dirichlet: "dirichlet",
        Neumann: "neumann",
        Robin: "robin",
      })
      .name("$w$")
      .onChange(function () {
        setRDEquations();
        setBCsGUI();
      });
  }
  if (inGUI("dirichletW")) {
    dirichletWController = root
      .add(options, "dirichletStrW")
      .name("$\\left.w\\right\\rvert_{\\boundary}$")
      .onFinishChange(setRDEquations);
  }
  if (inGUI("neumannStrW")) {
    neumannWController = root
      .add(options, "neumannStrW")
      .name("$\\left.\\pd{w}{n}\\right\\rvert_{\\boundary}$")
      .onFinishChange(setRDEquations);
  }
  if (inGUI("robinStrW")) {
    robinWController = root
      .add(options, "robinStrW")
      .name("$\\left.\\pd{w}{n}\\right\\rvert_{\\boundary}$")
      .onFinishChange(setRDEquations);
  }

  // Rendering folder.
  if (inGUI("renderingFolder")) {
    root = rightGUI.addFolder("Rendering");
  } else {
    root = genericOptionsFolder;
  }
  if (inGUI("renderSize")) {
    root
      .add(options, "renderSize", 1, 2048, 1)
      .name("Resolution")
      .onChange(setSizes);
  }
  if (inGUI("Smoothing scale") && !floatLinearExtAvailable) {
    root
      .add(options, "smoothingScale", 1, 16, 1)
      .name("Smoothing")
      .onChange(resizeTextures);
  }

  // Colour folder.
  if (inGUI("colourFolder")) {
    root = rightGUI.addFolder("Colour");
  } else {
    root = genericOptionsFolder;
  }
  if (inGUI("whatToPlot")) {
    whatToPlotController = root
      .add(options, "whatToPlot")
      .name("Colour by: ")
      .onFinishChange(updateWhatToPlot);
  }
  if (inGUI("colourmap")) {
    root
      .add(options, "colourmap", {
        Greyscale: "greyscale",
        Viridis: "viridis",
        Turbo: "turbo",
        BlckGrnYllwRdWht: "BlackGreenYellowRedWhite",
      })
      .onChange(setDisplayColourAndType)
      .name("Colourmap");
  }
  if (inGUI("minColourValue")) {
    minColourValueController = root
      .add(options, "minColourValue")
      .name("Min value")
      .onChange(function () {
        updateUniforms();
        render();
      });
    minColourValueController.__precision = 2;
  }
  if (inGUI("maxColourValue")) {
    maxColourValueController = root
      .add(options, "maxColourValue")
      .name("Max value")
      .onChange(function () {
        updateUniforms();
        render();
      });
    maxColourValueController.__precision = 2;
  }
  if (inGUI("setColourRange")) {
    setColourRangeController = root
      .add(funsObj, "setColourRange")
      .name("Snap range");
  }
  if (inGUI("autoColourRangeButton")) {
    autoSetColourRangeController = root
      .add(options, "autoSetColourRange")
      .name("Auto snap")
      .onChange(function () {
        if (options.autoSetColourRange) {
          funsObj.setColourRange();
          render();
        }
      });
  }
  if (inGUI("backgroundColour")) {
    backgroundColourController = root
      .addColor(options, "backgroundColour")
      .name("Background")
      .onChange(function () {
        updateUniforms();
      });
  }

  // Miscellaneous folder.
  if (inGUI("miscFolder")) {
    fMisc = rightGUI.addFolder("Misc.");
    root = fMisc;
  } else {
    root = genericOptionsFolder;
  }
  if (inGUI("clearValueU")) {
    clearValueUController = root
      .add(options, "clearValueU")
      .name("Initial $u$")
      .onFinishChange(setClearShader);
  }
  if (inGUI("clearValueV")) {
    clearValueVController = root
      .add(options, "clearValueV")
      .name("Initial $v$")
      .onFinishChange(setClearShader);
  }
  if (inGUI("clearValueW")) {
    clearValueWController = root
      .add(options, "clearValueW")
      .name("Initial $w$")
      .onFinishChange(setClearShader);
  }
  if (inGUI("preset")) {
    root
      .add(options, "preset", {
        "A harsh environment": "harshEnvironment",
        Alan: "Alan",
        Beginnings: "chemicalBasisOfMorphogenesis",
        "Bistable travelling waves": "bistableTravellingWave",
        Brusellator: "brusselator",
        "Cahn-Hilliard": "CahnHilliard",
        "Complex Ginzburg-Landau": "complexGinzburgLandau",
        "Cyclic competition": "cyclicCompetition",
        "Gierer-Meinhardt": "GiererMeinhardt",
        "Gierer-Meinhardt: stripes": "GiererMeinhardtStripes",
        "Gray-Scott": "subcriticalGS",
        "Heat equation": "heatEquation",
        "Inhomogeneous heat eqn": "inhomogHeatEquation",
        "Inhomogeneous wave eqn": "inhomogWaveEquation",
        "Localised patterns": "localisedPatterns",
        Schnakenberg: "Schnakenberg",
        "Schnakenberg-Hopf": "SchnakenbergHopf",
        "Schrodinger + potential": "stabilizedSchrodingerEquationPotential",
        Schrodinger: "stabilizedSchrodingerEquation",
        "Swift-Hohenberg": "swiftHohenberg",
        Thresholding: "thresholdSimulation",
        "Travelling waves": "travellingWave",
        "Variable diff heat eqn": "inhomogDiffusionHeatEquation",
        "Wave equation w/ ICs": "waveEquationICs",
        "Wave equation": "waveEquation",
      })
      .name("Preset")
      .onChange(loadPreset);
  }
  if (inGUI("fixRandSeed")) {
    root.add(options, "fixRandSeed").name("Fix random seed");
  }
  // Always make an image controller, but hide it if it's not wanted.
  createImageController();
  if (inGUI("image")) {
    showGUIController(imController);
  } else {
    hideGUIController(imController);
  }

  // Add a toggle for showing all options.
  if (options.onlyExposeOptions.length != 0) {
    rightGUI
      .add(options, "showAllOptionsOverride")
      .name("Show all")
      .onChange(function () {
        setShowAllToolsFlag();
        deleteGUI(rightGUI);
        initGUI(true);
      });
  }

  // If the generic options folder is empty, hide it.
  if (
    genericOptionsFolder.__controllers.length == 0 &&
    Object.keys(genericOptionsFolder.__folders).length == 0
  ) {
    genericOptionsFolder.hide();
  }
}

function animate() {
  requestAnimationFrame(animate);

  hasDrawn = isDrawing;
  // Draw on any input from the user, which can happen even if timestepping is not running.
  if (isDrawing) {
    draw();
  }

  // Only timestep if the simulation is running.
  if (isRunning) {
    // Perform a number of timesteps per frame.
    for (let i = 0; i < options.numTimestepsPerFrame; i++) {
      timestep();
      uniforms.time.value += options.dt;
      // Make drawing more responsive by trying to draw every timestep.
      if (isDrawing) {
        draw();
      }
    }
  }

  // Render if something has happened.
  if (hasDrawn || isRunning) {
    render();
  }
}

function setDrawAndDisplayShaders() {
  // Configure the display material.
  setDisplayColourAndType();

  // Configure the postprocessing material.
  updateWhatToPlot();

  // Configure the drawing material.
  setBrushType();
}

function setBrushType() {
  // Construct a drawing shader based on the selected type and the value string.
  let shaderStr = drawShaderTop();
  if (options.typeOfBrush == "circle") {
    shaderStr += discShader();
  } else if (options.typeOfBrush == "hline") {
    shaderStr += hLineShader();
  } else if (options.typeOfBrush == "vline") {
    shaderStr += vLineShader();
  }
  // If a random number has been requested, insert calculation of a random number.
  if (options.brushValue.includes("RAND")) {
    shaderStr += randShader();
  }
  shaderStr +=
    "float brushValue = " + parseShaderString(options.brushValue) + "\n;";
  shaderStr += drawShaderBot();
  // Substitute in the correct colour code.
  shaderStr = selectColourspecInShaderStr(shaderStr);
  drawMaterial.fragmentShader = shaderStr;
  drawMaterial.needsUpdate = true;
}

function setDisplayColourAndType() {
  if (options.colourmap == "greyscale") {
    uniforms.colour1.value = new THREE.Vector4(0, 0, 0, 0);
    uniforms.colour2.value = new THREE.Vector4(0.25, 0.25, 0.25, 0.25);
    uniforms.colour3.value = new THREE.Vector4(0.5, 0.5, 0.5, 0.5);
    uniforms.colour4.value = new THREE.Vector4(0.75, 0.75, 0.75, 0.75);
    uniforms.colour5.value = new THREE.Vector4(1, 1, 1, 1);
    displayMaterial.fragmentShader = fiveColourDisplay();
  } else if (options.colourmap == "BlackGreenYellowRedWhite") {
    uniforms.colour1.value = new THREE.Vector4(0, 0, 0.0, 0);
    uniforms.colour2.value = new THREE.Vector4(0, 1, 0, 0.25);
    uniforms.colour3.value = new THREE.Vector4(1, 1, 0, 0.5);
    uniforms.colour4.value = new THREE.Vector4(1, 0, 0, 0.75);
    uniforms.colour5.value = new THREE.Vector4(1, 1, 1, 1.0);
    displayMaterial.fragmentShader = fiveColourDisplay();
  } else if (options.colourmap == "viridis") {
    uniforms.colour1.value = new THREE.Vector4(0.267, 0.0049, 0.3294, 0.0);
    uniforms.colour2.value = new THREE.Vector4(0.2302, 0.3213, 0.5455, 0.25);
    uniforms.colour3.value = new THREE.Vector4(0.1282, 0.5651, 0.5509, 0.5);
    uniforms.colour4.value = new THREE.Vector4(0.3629, 0.7867, 0.3866, 0.75);
    uniforms.colour5.value = new THREE.Vector4(0.9932, 0.9062, 0.1439, 1.0);
    displayMaterial.fragmentShader = fiveColourDisplay();
  } else if (options.colourmap == "turbo") {
    uniforms.colour1.value = new THREE.Vector4(0.19, 0.0718, 0.2322, 0.0);
    uniforms.colour2.value = new THREE.Vector4(0.1602, 0.7332, 0.9252, 0.25);
    uniforms.colour3.value = new THREE.Vector4(0.6384, 0.991, 0.2365, 0.5);
    uniforms.colour4.value = new THREE.Vector4(0.9853, 0.5018, 0.1324, 0.75);
    uniforms.colour5.value = new THREE.Vector4(0.4796, 0.01583, 0.01055, 1.0);
    displayMaterial.fragmentShader = fiveColourDisplay();
  }
  displayMaterial.needsUpdate = true;
  postMaterial.needsUpdate = true;
  render();
}

function selectColourspecInShaderStr(shaderStr) {
  let regex = /COLOURSPEC/g;
  shaderStr = shaderStr.replace(
    regex,
    speciesToChannelChar(options.whatToDraw)
  );
  return shaderStr;
}

function setDisplayFunInShader(shaderStr) {
  let regex = /FUN/g;
  shaderStr = shaderStr.replace(regex, parseShaderString(options.whatToPlot));
  return shaderStr;
}

function draw() {
  // Update the random seed if we're drawing using random.
  if (!options.fixRandSeed && options.brushValue.includes("RAND")) {
    updateRandomSeed();
  }
  // Toggle texture input/output.
  if (readFromTextureB) {
    inTex = simTextureB;
    outTex = simTextureA;
  } else {
    inTex = simTextureA;
    outTex = simTextureB;
  }
  readFromTextureB = !readFromTextureB;

  simDomain.material = drawMaterial;
  uniforms.textureSource.value = inTex.texture;
  renderer.setRenderTarget(outTex);
  renderer.render(simScene, simCamera);
  uniforms.textureSource.value = outTex.texture;
}

function timestep() {
  // We timestep by updating a texture that stores the solutions. We can't overwrite
  // the texture in the loop, so we'll use two textures and swap between them. These
  // textures are already defined above, and their resolution defines the resolution
  // of solution.

  if (readFromTextureB) {
    inTex = simTextureB;
    outTex = simTextureA;
  } else {
    inTex = simTextureA;
    outTex = simTextureB;
  }
  readFromTextureB = !readFromTextureB;

  simDomain.material = simMaterial;
  uniforms.textureSource.value = inTex.texture;
  renderer.setRenderTarget(outTex);
  renderer.render(simScene, simCamera);
  uniforms.textureSource.value = outTex.texture;
}

function render() {
  // If selected, set the colour range.
  if (options.autoSetColourRange) {
    funsObj.setColourRange();
  }

  // Perform any postprocessing.
  if (readFromTextureB) {
    inTex = simTextureB;
  } else {
    inTex = simTextureA;
  }

  simDomain.material = postMaterial;
  uniforms.textureSource.value = inTex.texture;
  renderer.setRenderTarget(postTexture);
  renderer.render(simScene, simCamera);
  uniforms.textureSource.value = postTexture.texture;

  // If the platform doesn't blend automatically, apply a bilinear filter.
  if (!floatLinearExtAvailable) {
    simDomain.material = interpolationMaterial;
    renderer.setRenderTarget(interpolationTexture);
    renderer.render(simScene, simCamera);
    uniforms.textureSource.value = interpolationTexture.texture;
  }

  // Render the output to the screen.
  renderer.setRenderTarget(null);
  renderer.render(scene, camera);
}

function onDocumentPointerDown(event) {
  setBrushCoords(event, canvas);
  isDrawing = true;
}

function onDocumentPointerUp(event) {
  isDrawing = false;
}

function onDocumentPointerMove(event) {
  setBrushCoords(event, canvas);
}

function setBrushCoords(event, container) {
  var cRect = container.getBoundingClientRect();
  let x = (event.clientX - cRect.x) / cRect.width;
  let y = 1 - (event.clientY - cRect.y) / cRect.height;
  // Round to the centre of a pixel.
  x = (Math.floor(x * nXDisc) + 0.5) / nXDisc;
  y = (Math.floor(y * nYDisc) + 0.5) / nYDisc;
  uniforms.brushCoords.value = new THREE.Vector2(x, y);
}

function clearTextures() {
  if (!options.fixRandSeed) {
    updateRandomSeed();
  }
  simDomain.material = clearMaterial;
  renderer.setRenderTarget(simTextureA);
  renderer.render(simScene, simCamera);
  renderer.setRenderTarget(simTextureB);
  renderer.render(simScene, simCamera);
  render();
}

function pauseSim() {
  $("#pause").hide();
  $("#play").show();
  isRunning = false;
}

function playSim() {
  $("#play").hide();
  $("#pause").show();
  isRunning = true;
}

function resetSim() {
  clearTextures();
  uniforms.time.value = 0.0;
}

function parseReactionStrings() {
  // Parse the user-defined shader strings into valid GLSL and output their concatenation. We won't worry about code injection.
  let out = "";

  // Prepare the f string.
  out += "float f = " + parseShaderString(options.reactionStrU) + ";\n";
  // Prepare the g string.
  out += "float g = " + parseShaderString(options.reactionStrV) + ";\n";
  // Prepare the w string.
  out += "float h = " + parseShaderString(options.reactionStrW) + ";\n";

  return out;
}

function parseNormalDiffusionStrings() {
  // Parse the user-defined shader strings into valid GLSL and output their concatenation. We won't worry about code injection.
  let out = "";

  // Prepare Duu, evaluating it at five points.
  out += nonConstantDiffusionEvaluateInSpaceStr(
    parseShaderString(options.diffusionStrUU) + ";\n",
    "uu"
  );

  // Prepare Dvv, evaluating it at five points.
  out += nonConstantDiffusionEvaluateInSpaceStr(
    parseShaderString(options.diffusionStrVV) + ";\n",
    "vv"
  );

  // Prepare Dww, evaluating it at five points.
  out += nonConstantDiffusionEvaluateInSpaceStr(
    parseShaderString(options.diffusionStrWW) + ";\n",
    "ww"
  );

  return out;
}

function parseCrossDiffusionStrings() {
  // Parse the user-defined shader strings into valid GLSL and output their concatenation. We won't worry about code injection.
  let out = "";

  // Prepare Duv, evaluating it at five points.
  out += nonConstantDiffusionEvaluateInSpaceStr(
    parseShaderString(options.diffusionStrUV) + ";\n",
    "uv"
  );

  // Prepare Duw, evaluating it at five points.
  out += nonConstantDiffusionEvaluateInSpaceStr(
    parseShaderString(options.diffusionStrUW) + ";\n",
    "uw"
  );

  // Prepare Dvu, evaluating it at five points.
  out += nonConstantDiffusionEvaluateInSpaceStr(
    parseShaderString(options.diffusionStrVU) + ";\n",
    "vu"
  );

  // Prepare Dvw, evaluating it at five points.
  out += nonConstantDiffusionEvaluateInSpaceStr(
    parseShaderString(options.diffusionStrVW) + ";\n",
    "vw"
  );

  // Prepare Dwu, evaluating it at five points.
  out += nonConstantDiffusionEvaluateInSpaceStr(
    parseShaderString(options.diffusionStrWU) + ";\n",
    "wu"
  );

  // Prepare Dwv, evaluating it at five points.
  out += nonConstantDiffusionEvaluateInSpaceStr(
    parseShaderString(options.diffusionStrWV) + ";\n",
    "wv"
  );

  return out;
}

function nonConstantDiffusionEvaluateInSpaceStr(str, label) {
  let out = "";
  let xRegex = /\bx\b/g;
  let yRegex = /\by\b/g;
  let uvwRegex = /\buvw\.\b/g;

  out += "float D" + label + " = " + str;
  out +=
    "float D" +
    label +
    "L = " +
    str.replaceAll(xRegex, "(x-dx)").replaceAll(uvwRegex, "uvwL.");
  out +=
    "float D" +
    label +
    "R = " +
    str.replaceAll(xRegex, "(x+dx)").replaceAll(uvwRegex, "uvwR.");
  out +=
    "float D" +
    label +
    "T = " +
    str.replaceAll(yRegex, "(y+dy)").replaceAll(uvwRegex, "uvwT.");
  out +=
    "float D" +
    label +
    "B = " +
    str.replaceAll(yRegex, "(y-dy)").replaceAll(uvwRegex, "uvwB.");
  return out;
}

function parseShaderString(str) {
  // Parse a string into valid GLSL by replacing u,v,^, and integers.
  // Pad the string.
  str = " " + str + " ";

  // Replace powers with pow, including nested powers.
  str = replaceCaratWithPow(str);

  // Replace u, v, and w with uvw.r, uvw.g, and uvw.b via placeholders.
  str = str.replace(/\bu\b/g, "uvw." + speciesToChannelChar("u"));
  str = str.replace(/\bv\b/g, "uvw." + speciesToChannelChar("v"));
  str = str.replace(/\bw\b/g, "uvw." + speciesToChannelChar("w"));

  // Replace integers with floats.
  while (str != (str = str.replace(/([^.0-9])(\d+)([^.0-9])/g, "$1$2.$3")));

  return str;
}

function replaceCaratWithPow(str) {
  // Take a string and replace all instances of a carat with a pow function,
  // matching balanced brackets.
  if (str.indexOf("^") > -1) {
    var tab = [];
    var powfunc = "safepow";
    var joker = "___joker___";
    while (str.indexOf("(") > -1) {
      str = str.replace(/(\([^\(\)]*\))/g, function (m, t) {
        tab.push(t);
        return joker + (tab.length - 1);
      });
    }

    tab.push(str);
    str = joker + (tab.length - 1);
    while (str.indexOf(joker) > -1) {
      str = str.replace(new RegExp(joker + "(\\d+)", "g"), function (m, d) {
        return tab[d].replace(/([\w.]*)\^([\w.]*)/g, powfunc + "($1,$2)");
      });
    }
  }
  return str;
}

function setRDEquations() {
  let neumannShader = "";
  let dirichletShader = "";
  let robinShader = "";
  let updateShader = "";

  // Create a Neumann shader block for each species separately, which is just a special case of Robin.
  if (options.boundaryConditionsU == "neumann") {
    neumannShader += parseRobinRHS(options.neumannStrU, "u");
    neumannShader += selectSpeciesInShaderStr(RDShaderRobinX(), "u");
    if (!options.oneDimensional) {
      neumannShader += selectSpeciesInShaderStr(RDShaderRobinY(), "u");
    }
  }
  if (options.boundaryConditionsV == "neumann") {
    neumannShader += parseRobinRHS(options.neumannStrV, "v");
    neumannShader += selectSpeciesInShaderStr(RDShaderRobinX(), "v");
    if (!options.oneDimensional) {
      neumannShader += selectSpeciesInShaderStr(RDShaderRobinY(), "v");
    }
  }
  if (options.boundaryConditionsW == "neumann") {
    neumannShader += parseRobinRHS(options.neumannStrW, "w");
    neumannShader += selectSpeciesInShaderStr(RDShaderRobinX(), "w");
    if (!options.oneDimensional) {
      neumannShader += selectSpeciesInShaderStr(RDShaderRobinY(), "w");
    }
  }

  // Create Dirichlet shaders.
  if (options.domainViaIndicatorFun) {
    // If the domain is being set by an indicator function, Dirichlet is the only allowable BC.
    let str = RDShaderDirichletIndicatorFun().replace(
      /indicatorFun/g,
      parseShaderString(options.domainIndicatorFun)
    );
    dirichletShader +=
      selectSpeciesInShaderStr(str, "u") +
      parseShaderString(options.dirichletStrU) +
      ";\n}\n";
    dirichletShader +=
      selectSpeciesInShaderStr(str, "v") +
      parseShaderString(options.dirichletStrV) +
      ";\n}\n";
    dirichletShader +=
      selectSpeciesInShaderStr(str, "w") +
      parseShaderString(options.dirichletStrW) +
      ";\n}\n";
  } else {
    if (options.boundaryConditionsU == "dirichlet") {
      dirichletShader +=
        selectSpeciesInShaderStr(RDShaderDirichletX(), "u") +
        parseShaderString(options.dirichletStrU) +
        ";\n}\n";
      if (!options.oneDimensional) {
        dirichletShader +=
          selectSpeciesInShaderStr(RDShaderDirichletY(), "u") +
          parseShaderString(options.dirichletStrU) +
          ";\n}\n";
      }
    }
    if (options.boundaryConditionsV == "dirichlet") {
      dirichletShader +=
        selectSpeciesInShaderStr(RDShaderDirichletX(), "v") +
        parseShaderString(options.dirichletStrV) +
        ";\n}\n";
      if (!options.oneDimensional) {
        dirichletShader +=
          selectSpeciesInShaderStr(RDShaderDirichletY(), "v") +
          parseShaderString(options.dirichletStrV) +
          ";\n}\n";
      }
    }
    if (options.boundaryConditionsW == "dirichlet") {
      dirichletShader +=
        selectSpeciesInShaderStr(RDShaderDirichletX(), "w") +
        parseShaderString(options.dirichletStrW) +
        ";\n}\n";
      if (!options.oneDimensional) {
        dirichletShader +=
          selectSpeciesInShaderStr(RDShaderDirichletY(), "w") +
          parseShaderString(options.dirichletStrW) +
          ";\n}\n";
      }
    }
  }

  // Create a Robin shader block for each species separately.
  if (options.boundaryConditionsU == "robin") {
    robinShader += parseRobinRHS(options.robinStrU, "u");
    robinShader += selectSpeciesInShaderStr(RDShaderRobinX(), "u");
    if (!options.oneDimensional) {
      robinShader += selectSpeciesInShaderStr(RDShaderRobinY(), "u");
    }
  }
  if (options.boundaryConditionsV == "robin") {
    robinShader += parseRobinRHS(options.robinStrV, "v");
    robinShader += selectSpeciesInShaderStr(RDShaderRobinX(), "v");
    if (!options.oneDimensional) {
      robinShader += selectSpeciesInShaderStr(RDShaderRobinY(), "v");
    }
  }
  if (options.boundaryConditionsW == "robin") {
    robinShader += parseRobinRHS(options.robinStrW, "w");
    robinShader += selectSpeciesInShaderStr(RDShaderRobinX(), "w");
    if (!options.oneDimensional) {
      robinShader += selectSpeciesInShaderStr(RDShaderRobinY(), "w");
    }
  }

  // Insert any user-defined kinetic parameters, given as a string that needs parsing.
  // Extract variable definitions, separated by semicolons or commas, ignoring whitespace.
  // We'll inject this shader string before any boundary conditions etc, so that these params
  // are also available in BCs.
  let regex = /[;,\s]*(.+?)(?:$|[;,])+/g;
  let kineticStr = parseShaderString(
    options.kineticParams.replace(regex, "float $1;\n")
  );

  // Choose what sort of update we are doing: normal, or cross-diffusion enabled?
  updateShader = parseNormalDiffusionStrings() + "\n";
  if (options.crossDiffusion) {
    updateShader += parseCrossDiffusionStrings() + "\n" + RDShaderUpdateCross();
  } else {
    updateShader += RDShaderUpdateNormal();
  }

  // If v should be algebraic, append this to the normal update shader.
  if (options.algebraicV && options.crossDiffusion) {
    updateShader += selectSpeciesInShaderStr(RDShaderAlgebraicV(), "v");
  }

  // If w should be algebraic, append this to the normal update shader.
  if (options.algebraicW && options.crossDiffusion) {
    updateShader += selectSpeciesInShaderStr(RDShaderAlgebraicW(), "w");
  }

  simMaterial.fragmentShader = [
    RDShaderTop(),
    kineticStr,
    neumannShader,
    robinShader,
    parseReactionStrings(),
    updateShader,
    dirichletShader,
    RDShaderBot(),
  ].join(" ");
  simMaterial.needsUpdate = true;
}

function parseRobinRHS(string, species) {
  return "float robinRHS" + species + " = " + parseShaderString(string) + ";\n";
}

function loadPreset(preset) {
  // First, reload the default preset.
  loadOptions("default");

  // Updates the values stored in options.
  loadOptions(preset);

  // Replace the GUI.
  deleteGUIs();
  initGUI();

  // Update the equations, setup and GUI in line with new options.
  updateProblem();

  // Trigger a resize, which will refresh all uniforms and set sizes.
  resize();

  // Set the draw, display, and clear shaders.
  setDrawAndDisplayShaders();
  setClearShader();

  // Reset the state of the simulation.
  resetSim();

  // To get around an annoying bug in dat.GUI.image, in which the
  // controller doesn't update the value of the underlying property,
  // we'll destroy and create a new image controller everytime we load
  // a preset.
  if (inGUI("image")) {
    imController.remove();
    if (inGUI("miscFolder")) {
      root = fMisc;
    } else {
      root = genericOptionsFolder;
    }
    imController = root
      .addImage(options, "imagePath")
      .name("$T(x,y)$")
      .onChange(loadImageSource);
  }
}

function loadOptions(preset) {
  let newOptions;
  if (preset == undefined) {
    // If no argument is given, load whatever is set in options.preset.
    newOptions = getPreset(options.preset);
  } else if (typeof preset == "string") {
    // If an argument is given and it's a string, try to load the corresponding preset.
    newOptions = getPreset(preset);
  } else if (typeof preset == "object") {
    // If the argument is an object, then assume it is an options object.
    newOptions = preset;
  } else {
    // Otherwise, fall back to default.
    newOptions = getPreset("default");
  }

  // Reset the kinetic parameters.
  kineticParamsCounter = 0;
  kineticParamsLabels = [];
  kineticParamsStrs = {};

  // Loop through newOptions and overwrite anything already present.
  Object.assign(options, newOptions);

  // Set a flag if we will be showing all tools.
  setShowAllToolsFlag();

  // Check if the simulation should be running on load.
  isRunning = options.runningOnLoad;
}

function refreshGUI(folder) {
  if (folder != undefined) {
    // Traverse through all the subfolders and recurse.
    for (let subfolderName in folder.__folders) {
      refreshGUI(folder.__folders[subfolderName]);
    }
    // Update all the controllers at this level.
    for (let i = 0; i < folder.__controllers.length; i++) {
      folder.__controllers[i].updateDisplay();
    }
  }
  // Run MathJax to texify the parameter names (e.g. D_uu) which appear dynamically.
  // No need to do this on page load (and indeed will throw an error) so check
  // MathJax is defined first.
  if (MathJax.typeset != undefined) {
    MathJax.typeset();
  }
}

function deleteGUIs() {
  deleteGUI(leftGUI);
  deleteGUI(rightGUI);
}

function deleteGUI(folder) {
  if (folder != undefined) {
    // Traverse through all the subfolders and recurse.
    for (let subfolderName in folder.__folders) {
      deleteGUI(folder.__folders[subfolderName]);
      folder.removeFolder(folder.__folders[subfolderName]);
    }
    // Delete all the controllers at this level.
    for (let i = 0; i < folder.__controllers.length; i++) {
      folder.__controllers[i].remove();
    }
    // If this is the top-level GUI, destroy it.
    if (folder == rightGUI) {
      rightGUI.destroy();
    } else if (folder == leftGUI) {
      leftGUI.destroy();
    }
  }
}

function hideGUIController(cont) {
  if (cont != undefined) {
    cont.__li.style.display = "none";
  }
}

function showGUIController(cont) {
  if (cont != undefined) {
    cont.__li.style.display = "";
  }
}

function setGUIControllerName(cont, str) {
  if (cont != undefined) {
    cont.name(str);
  }
}

function selectSpeciesInShaderStr(shaderStr, species) {
  // If there are no species, then return an empty string.
  if (species.length == 0) {
    return "";
  }
  let regex = /\bSPECIES\b/g;
  let channel = speciesToChannelChar(species);
  shaderStr = shaderStr.replace(regex, channel);
  regex = /\brobinRHSSPECIES\b/g;
  shaderStr = shaderStr.replace(regex, "robinRHS" + species);
  return shaderStr;
}

function speciesToChannelChar(speciesStr) {
  let channel = "";
  let listOfChannels = "rgba";
  for (let i = 0; i < speciesStr.length; i++) {
    channel += listOfChannels[speciesToChannelInd(speciesStr[i])];
  }
  return channel;
}

function speciesToChannelInd(speciesStr) {
  let channel;
  if (speciesStr.includes("u")) {
    channel = 0;
  }
  if (speciesStr.includes("v")) {
    channel = 1;
  }
  if (speciesStr.includes("w")) {
    channel = 2;
  }
  return channel;
}

function setBCsGUI() {
  // Update the GUI.
  if (options.boundaryConditionsU == "dirichlet") {
    showGUIController(dirichletUController);
  } else {
    hideGUIController(dirichletUController);
  }
  if (options.boundaryConditionsV == "dirichlet") {
    showGUIController(dirichletVController);
  } else {
    hideGUIController(dirichletVController);
  }
  if (options.boundaryConditionsW == "dirichlet") {
    showGUIController(dirichletWController);
  } else {
    hideGUIController(dirichletWController);
  }

  if (options.boundaryConditionsU == "neumann") {
    showGUIController(neumannUController);
  } else {
    hideGUIController(neumannUController);
  }
  if (options.boundaryConditionsV == "neumann") {
    showGUIController(neumannVController);
  } else {
    hideGUIController(neumannVController);
  }
  if (options.boundaryConditionsW == "neumann") {
    showGUIController(neumannWController);
  } else {
    hideGUIController(neumannWController);
  }

  if (options.boundaryConditionsU == "robin") {
    showGUIController(robinUController);
  } else {
    hideGUIController(robinUController);
  }
  if (options.boundaryConditionsV == "robin") {
    showGUIController(robinVController);
  } else {
    hideGUIController(robinVController);
  }
  if (options.boundaryConditionsW == "robin") {
    showGUIController(robinWController);
  } else {
    hideGUIController(robinWController);
  }

  if (options.domainViaIndicatorFun) {
    hideGUIController(uBCsController);
    hideGUIController(vBCsController);
    hideGUIController(wBCsController);
  } else {
    showGUIController(uBCsController);
  }
}

function updateRandomSeed() {
  // Update the random seed used in the shaders.
  uniforms.seed.value = performance.now() % 1000;
}

function setClearShader() {
  let shaderStr = clearShaderTop();
  if (
    options.clearValueU.includes("RAND") ||
    options.clearValueV.includes("RAND")
  ) {
    shaderStr += randShader();
  }
  // Insert any user-defined kinetic parameters, given as a string that needs parsing.
  // Extract variable definitions, separated by semicolons or commas, ignoring whitespace.
  // We'll inject this shader string before any boundary conditions etc, so that these params
  // are also available in BCs.
  let regex = /[;,\s]*(.+?)(?:$|[;,])+/g;
  let kineticStr = parseShaderString(
    options.kineticParams.replace(regex, "float $1;\n")
  );
  shaderStr += kineticStr;
  shaderStr += "float u = " + parseShaderString(options.clearValueU) + ";\n";
  shaderStr += "float v = " + parseShaderString(options.clearValueV) + ";\n";
  shaderStr += "float w = " + parseShaderString(options.clearValueW) + ";\n";
  shaderStr += clearShaderBot();
  clearMaterial.fragmentShader = shaderStr;
  clearMaterial.needsUpdate = true;
}

function loadImageSource() {
  let image = new Image();
  image.src = imController.__image.src;
  let texture = new THREE.Texture();
  texture.image = image;
  image.onload = function () {
    texture.needsUpdate = true;
    uniforms.imageSource.value = texture;
  };
  texture.dispose();
}

function createImageController() {
  // This is a bad solution to a problem that shouldn't exist.
  // The image controller does not modify the value that you assign to it, and doesn't respond to it being changed.
  // Hence, we create a function used solely to create the controller, which we'll do everytime a preset is loaded.
  if (inGUI("miscFolder")) {
    root = fMisc;
  } else {
    root = genericOptionsFolder;
  }
  imController = root
    .addImage(options, "imagePath")
    .name("$T(x,y)$")
    .onChange(loadImageSource);
}

function updateWhatToPlot() {
  if (options.whatToPlot == "MAX") {
    setPostFunMaxFragShader();
    hideGUIController(minColourValueController);
    hideGUIController(maxColourValueController);
    hideGUIController(setColourRangeController);
    hideGUIController(autoSetColourRangeController);
  } else {
    setPostFunFragShader();
    showGUIController(minColourValueController);
    showGUIController(maxColourValueController);
    showGUIController(setColourRangeController);
    showGUIController(autoSetColourRangeController);
  }
  render();
}

function inGUI(name) {
  return showAllStandardTools || options.onlyExposeOptions.includes(name);
}

function setShowAllToolsFlag() {
  showAllStandardTools =
    options.showAllOptionsOverride || options.onlyExposeOptions.length == 0;
}

function showVGUIPanels() {
  if (options.crossDiffusion) {
    showGUIController(DuvController);
    showGUIController(DvuController);
  } else {
    hideGUIController(DuvController);
    hideGUIController(DvuController);
  }
  showGUIController(DvvController);
  showGUIController(gController);
  showGUIController(clearValueVController);
  showGUIController(vBCsController);
}

function showWGUIPanels() {
  if (options.crossDiffusion) {
    showGUIController(DuwController);
    showGUIController(DvwController);
    showGUIController(DwuController);
    showGUIController(DwvController);
  } else {
    hideGUIController(DuwController);
    hideGUIController(DvwController);
    hideGUIController(DwuController);
    hideGUIController(DwvController);
  }
  showGUIController(DwwController);
  showGUIController(hController);
  showGUIController(clearValueWController);
  showGUIController(wBCsController);
}

function hideVGUIPanels() {
  hideGUIController(DuvController);
  hideGUIController(DvuController);
  hideGUIController(DvvController);
  hideGUIController(gController);
  hideGUIController(clearValueVController);
  hideGUIController(vBCsController);
}

function hideWGUIPanels() {
  hideGUIController(DuwController);
  hideGUIController(DvwController);
  hideGUIController(DwuController);
  hideGUIController(DwvController);
  hideGUIController(DwwController);
  hideGUIController(hController);
  hideGUIController(clearValueWController);
  hideGUIController(wBCsController);
}

function diffObjects(o1, o2) {
  return Object.fromEntries(
    Object.entries(o1).filter(
      ([k, v]) => JSON.stringify(o2[k]) !== JSON.stringify(v)
    )
  );
}

function getMinMaxVal() {
  // Return the min and max values in the simulation textures in channel channelInd.
  let buffer = new Float32Array(nXDisc * nYDisc * 4);
  renderer.readRenderTargetPixels(postTexture, 0, 0, nXDisc, nYDisc, buffer);
  let minVal = Infinity;
  let maxVal = -Infinity;
  for (let i = 0; i < buffer.length; i += 4) {
    minVal = Math.min(minVal, buffer[i]);
    maxVal = Math.max(maxVal, buffer[i]);
  }
  return [minVal, maxVal];
}

function setPostFunFragShader() {
  let shaderStr = computeDisplayFunShaderTop();
  let regex = /[;,\s]*(.+?)(?:$|[;,])+/g;
  let kineticStr = parseShaderString(
    options.kineticParams.replace(regex, "float $1;\n")
  );
  shaderStr += kineticStr;
  shaderStr += computeDisplayFunShaderMid();
  postMaterial.fragmentShader =
    setDisplayFunInShader(shaderStr) +
    postShaderDomainIndicator().replace(
      /indicatorFun/g,
      parseShaderString(options.domainIndicatorFun)
    ) +
    postGenericShaderBot();
  postMaterial.needsUpdate = true;
}

function setPostFunMaxFragShader() {
  postMaterial.fragmentShader =
    computeMaxSpeciesShaderMid() +
    postShaderDomainIndicator().replace(
      /indicatorFun/g,
      parseShaderString(options.domainIndicatorFun)
    ) +
    postGenericShaderBot();
  postMaterial.needsUpdate = true;
  options.minColourValue = 0.0;
  options.maxColourValue = 1.0;
  updateUniforms();
}

function problemTypeFromOptions() {
  // Use the currently selected options to specify an equation type as an index into listOfTypes.
  switch (parseInt(options.numSpecies)) {
    case 1:
      // 1Species
      equationType = 0;
      break;
    case 2:
      if (options.crossDiffusion) {
        if (options.algebraicV) {
          // 2SpeciesCrossDiffusionAlgebraicV
          equationType = 3;
        } else {
          // 2SpeciesCrossDiffusion
          equationType = 2;
        }
      } else {
        // 2Species
        equationType = 1;
      }
      break;
    case 3:
      if (options.crossDiffusion) {
        if (options.algebraicW) {
          // 3SpeciesCrossDiffusionAlgebraicW
          equationType = 6;
        } else {
          // 3SpeciesCrossDiffusion
          equationType = 5;
        }
      } else {
        // 3Species
        equationType = 4;
      }
      break;
  }
}

function configureGUI() {
  // Set up the GUI based on the the current options: numSpecies, crossDiffusion, and algebraicV.
  // We need a separate block for each of the six cases.

  switch (equationType) {
    case 0:
      // 1Species
      // Hide everything to do with v and w.
      hideVGUIPanels();
      hideWGUIPanels();

      // Hide the cross diffusion controller, the algebraicV controller, and the algebraicW controller.
      hideGUIController(crossDiffusionController);
      hideGUIController(algebraicVController);
      hideGUIController(algebraicWController);

      // Configure the controller names.
      setGUIControllerName(DuuController, "$D_u$");
      setGUIControllerName(fController, "$f(u)$");

      break;

    case 1:
      // 2Species
      // Show v panels.
      showVGUIPanels();
      // Hide w panels.
      hideWGUIPanels();

      // Show the cross diffusion controller.
      showGUIController(crossDiffusionController);
      // Hide the algebraicV and algebraicW controllers.
      hideGUIController(algebraicVController);
      hideGUIController(algebraicWController);

      // Configure the controller names.
      setGUIControllerName(DuuController, "$D_u$");
      setGUIControllerName(DvvController, "$D_v$");
      setGUIControllerName(fController, "$f(u,v)$");
      setGUIControllerName(gController, "$g(u,v)$");

      break;

    case 2:
      // 2SpeciesCrossDiffusion
      // Show v panels.
      showVGUIPanels();
      // Hide w panels.
      hideWGUIPanels();

      // Show the cross diffusion controller.
      showGUIController(crossDiffusionController);
      // Hide the algebraicV and algebraicW controllers.
      showGUIController(algebraicVController);
      hideGUIController(algebraicWController);

      // Configure the controller names.
      setGUIControllerName(DuuController, "$D_{uu}$");
      setGUIControllerName(DvvController, "$D_{vv}$");
      setGUIControllerName(fController, "$f(u,v)$");
      setGUIControllerName(gController, "$g(u,v)$");
      break;

    case 3:
      // 2SpeciesCrossDiffusionAlgebraicV
      // Show v panels.
      showVGUIPanels();
      hideGUIController(DvvController);
      // Hide w panels.
      hideWGUIPanels();

      // Show the cross diffusion controller.
      showGUIController(crossDiffusionController);
      // Show the algebraicV controller.
      showGUIController(algebraicVController);
      // Hide the algebraicW controller.
      hideGUIController(algebraicWController);

      // Configure the controller names.
      setGUIControllerName(DuuController, "$D_{uu}$");
      setGUIControllerName(fController, "$f(u,v)$");
      setGUIControllerName(gController, "$g(u)$");
      break;

    case 4:
      // 3Species
      // Show v panels.
      showVGUIPanels();
      // Show w panels.
      showWGUIPanels();

      // Show the cross diffusion controller.
      showGUIController(crossDiffusionController);
      // Hide the algebraicV and algebraicW controllers.
      hideGUIController(algebraicVController);
      hideGUIController(algebraicWController);

      // Configure the controller names.
      setGUIControllerName(DuuController, "$D_u$");
      setGUIControllerName(DvvController, "$D_v$");
      setGUIControllerName(DwwController, "$D_w$");
      setGUIControllerName(fController, "$f(u,v,w)$");
      setGUIControllerName(gController, "$g(u,v,w)$");
      setGUIControllerName(hController, "$h(u,v,w)$");
      break;

    case 5:
      // 3SpeciesCrossDiffusion
      // Show v panels.
      showVGUIPanels();
      // Show w panels.
      showWGUIPanels();

      // Show the cross diffusion controller.
      showGUIController(crossDiffusionController);
      // Hide the algebraicV controller.
      hideGUIController(algebraicVController);
      // Show the algebraicW controller.
      showGUIController(algebraicWController);

      // Configure the controller names.
      setGUIControllerName(DuuController, "$D_{uu}$");
      setGUIControllerName(DvvController, "$D_{vv}$");
      setGUIControllerName(DwwController, "$D_{ww}$");
      setGUIControllerName(fController, "$f(u,v,w)$");
      setGUIControllerName(gController, "$g(u,v,w)$");
      setGUIControllerName(hController, "$h(u,v,w)$");
      break;

    case 6:
      // 3SpeciesCrossDiffusionAlgebraicW
      // Show v panels.
      showVGUIPanels();
      // Show w panels.
      showWGUIPanels();
      hideGUIController(DwwController);

      // Show the cross diffusion controller.
      showGUIController(crossDiffusionController);
      // Hide the algebraicV controller.
      hideGUIController(algebraicVController);
      // Show the algebraicW controller.
      showGUIController(algebraicWController);

      // Configure the controller names.
      setGUIControllerName(DuuController, "$D_{uu}$");
      setGUIControllerName(DvvController, "$D_{vv}$");
      setGUIControllerName(fController, "$f(u,v,w)$");
      setGUIControllerName(gController, "$g(u,v,w)$");
      setGUIControllerName(hController, "$h(u,v)$");
      break;
  }
  if (options.domainViaIndicatorFun) {
    showGUIController(domainIndicatorFunController);
    showGUIController(backgroundColourController);
  } else {
    hideGUIController(domainIndicatorFunController);
    hideGUIController(backgroundColourController);
  }
  // Hide or show GUI elements that depend on the BCs.
  setBCsGUI();
  // Refresh the GUI displays.
  refreshGUI(leftGUI);
  refreshGUI(rightGUI);
}

function configureOptions() {
  // Configure any options that depend on the equation type.

  if (options.domainViaIndicatorFun) {
    // Only allow Dirichlet conditions.
    options.boundaryConditionsU = "dirichlet";
    options.boundaryConditionsV = "dirichlet";
    options.boundaryConditionsW = "dirichlet";
  }

  // Set options that only depend on the number of species.
  switch (parseInt(options.numSpecies)) {
    case 1:
      options.crossDiffusion = false;
      options.algebraicV = false;
      options.algebraicW = false;

      // Ensure that u is being displayed on the screen (and the brush target).
      options.whatToDraw = "u";
      options.whatToPlot = "u";

      // Set the diffusion of v and w to zero to prevent them from causing numerical instability.
      options.diffusionStrUV = "0";
      options.diffusionStrUW = "0";
      options.diffusionStrVU = "0";
      options.diffusionStrVV = "0";
      options.diffusionStrVW = "0";
      options.diffusionStrWU = "0";
      options.diffusionStrWV = "0";
      options.diffusionStrWW = "0";

      // Set v and w to be periodic to reduce computational overhead.
      options.boundaryConditionsV = "periodic";
      options.clearValueV = "0";
      options.reactionStrV = "0";
      options.boundaryConditionsW = "periodic";
      options.clearValueW = "0";
      options.reactionStrW = "0";

      // If the f string contains any v or w references, clear it.
      if (/\b[vw]\b/.test(options.reactionStrU)) {
        options.reactionStrU = "0";
      }
      break;
    case 2:
      // Ensure that u or v is being displayed on the screen (and the brush target).
      if (options.whatToDraw == "w") {
        options.whatToDraw = "u";
      }
      if (options.whatToPlot == "w") {
        options.whatToPlot = "u";
      }
      options.algebraicW = false;

      // Set the diffusion of w to zero to prevent it from causing numerical instability.
      options.diffusionStrUW = "0";
      options.diffusionStrVW = "0";
      options.diffusionStrWU = "0";
      options.diffusionStrWV = "0";
      options.diffusionStrWW = "0";

      // Set w to be periodic to reduce computational overhead.
      options.boundaryConditionsW = "periodic";
      options.clearValueW = "0";
      options.reactionStrW = "0";

      // If the f or g strings contains any w references, clear them.
      if (/\bw\b/.test(options.reactionStrU)) {
        options.reactionStrU = "0";
      }
      if (/\bw\b/.test(options.reactionStrV)) {
        options.reactionStrV = "0";
      }
      break;
    case 3:
      options.algebraicV = false;
      break;
  }

  // Configure any type-specific options.
  switch (equationType) {
    case 3:
      // 2SpeciesCrossDiffusionAlgebraicV
      options.diffusionStrVV = "0";
      break;
    case 6:
      // 3SpeciesCrossDiffusionAlgebraicW
      options.diffusionStrWW = "0";
  }

  // Refresh the GUI displays.
  refreshGUI(leftGUI);
  refreshGUI(rightGUI);
}

function updateProblem() {
  // Update the problem based on the current options.
  problemTypeFromOptions();
  configureOptions();
  configureGUI();
  updateWhatToPlot();
  setBrushType();
  setRDEquations();
  setEquationDisplayType();
  resetSim();
}

function setEquationDisplayType() {
  // Given an equation type (specified as an integer selector), set the type of
  // equation in the UI element that displays the equations.
  if ($("#equation_display").length) {
    // If it exists
    // Remove all existing equations.
    for (let i = 0; i < listOfTypes.length; i++) {
      $("#equation" + i).hide();
    }
    // Display the correct equation.
    $("#equation" + equationType).show();
  }
}

function removeWhitespace(str) {
  str = str.replace(/\s+/g, "  ").trim();
  return str;
}

function createParameterController(label, isNextParam) {
  if (isNextParam) {
    kineticParamsLabels.push(label);
    kineticParamsStrs[label] = "";
    let controller = parametersFolder.add(kineticParamsStrs, label).name("");
    controller.onFinishChange(function () {
      const index = kineticParamsLabels.indexOf(label);
      // Remove excess whitespace.
      let str = removeWhitespace(
        kineticParamsStrs[kineticParamsLabels.at(index)]
      );
      if (str == "") {
        // If the string is empty, do nothing.
      } else {
        // A parameter has been added! So, we create a new controller and assign it to this parameter,
        // delete this controller, and make a new blank controller.
        createParameterController(kineticParamsLabels.at(index), false);
        kineticParamsCounter += 1;
        let newLabel = "params" + kineticParamsCounter;
        this.remove();
        createParameterController(newLabel, true);
        // If it's non-empty, update any dependencies.
        setKineticStringFromParams();
      }
    });
  } else {
    let controller = parametersFolder.add(kineticParamsStrs, label).name("");
    controller.onFinishChange(function () {
      // Remove excess whitespace.
      let str = removeWhitespace(kineticParamsStrs[label]);
      if (str == "") {
        // If the string is empty, delete this controller.
        this.remove();
        // Remove the associated label and the (empty) kinetic parameters string.
        const index = kineticParamsLabels.indexOf(label);
        kineticParamsLabels.splice(index, 1);
        delete kineticParamsStrs[label];
      } else {
        // If it's non-empty, update any dependencies.
        setKineticStringFromParams();
      }
    });
  }
}

function setParamsFromKineticString() {
  // Take the kineticParams string in the options and
  // use it to populate a GUI containing these parameters
  // as individual options.
  let label, str;
  let strs = options.kineticParams.split(";");
  for (var index = 0; index < strs.length; index++) {
    str = removeWhitespace(strs[index]);
    if (str == "") {
      // If the string is empty, do nothing.
    } else {
      label = "param" + kineticParamsCounter;
      kineticParamsCounter += 1;
      kineticParamsLabels.push(label);
      kineticParamsStrs[label] = str;
      createParameterController(label, false);
    }
  }
  // Finally, create an empty controller for adding parameters.
  label = "param" + kineticParamsCounter;
  kineticParamsLabels.push(label);
  kineticParamsStrs[label] = str;
  createParameterController(label, true);
}

function setKineticStringFromParams() {
  options.kineticParams = Object.values(kineticParamsStrs).join(";");
  setRDEquations();
  setClearShader();
  updateWhatToPlot();
}

/* GUI settings and equations buttons */
$("#settings").click(function () {
  $("#rightGUI").toggle();
});
$("#equations").click(function () {
  $("#equation_display").toggle();
  $("#leftGUI").toggle();
});
$("#pause").click(function () {
  pauseSim();
});
$("#play").click(function () {
  playSim();
});
$("#erase").click(function () {
  resetSim();
});

$("#back").click(function () {
  const link = document.createElement("a");
  link.href = document.referrer; // This resolves the URL.
  // If the user arrived by typing in a URL or from an external link, have this button
  // point to the visualPDE homepage.
  if (fromExternalLink()) {
    window.location.href = window.location.origin;
  } else {
    // Otherwise, simply take them back a page.
    history.back();
  }
});

function fromExternalLink() {
  const link = document.createElement("a");
  link.href = document.referrer; // This resolves the URL.
  return (
    link.href == window.location || !link.href.includes(window.location.origin)
  );
}

function fadeoutTryClicking() {
  let id = "#try_clicking";
  $(id).removeClass("fading_in");
  $(id).addClass("fading_out");
  $(id).bind(
    "webkitTransitionEnd oTransitionEnd transitionend msTransitionEnd",
    function () {
      $(this).removeClass("fading_out");
    }
  );
}

$("#simCanvas").one("click", fadeoutTryClicking);
