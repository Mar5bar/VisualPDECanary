let canvas;
let camera, simCamera, scene, simScene, renderer, aspectRatio;
let simTextureA, simTextureB, postTexture;
let displayMaterial,
  drawMaterial,
  simMaterial,
  clearMaterial,
  copyMaterial,
  postMaterial;
let domain, simDomain;
let options, uniforms, funsObj;
let gui,
  root,
  pauseButton,
  resetButton,
  brushRadiusController,
  lockCFLController,
  fController,
  gController,
  hController,
  DuuController,
  DuvController,
  DuwController,
  DvuController,
  DvvController,
  DvwController,
  DwuController,
  DwvController,
  DwwController,
  DuController,
  DvController,
  DwController,
  dtController,
  whatToDrawController,
  whatToPlotController,
  minColourValueController,
  maxColourValueController,
  autoMinMaxColourRangeController,
  clearValueUController,
  clearValueVController,
  clearValueWController,
  vBCsController,
  wBCsController,
  dirichletUController,
  dirichletVController,
  dirichletWController,
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

import {
  discShader,
  vLineShader,
  hLineShader,
  drawShaderBot,
  drawShaderTop,
} from "./drawing_shaders.js";
import {
  computeDisplayFunShaderTop,
  computeDisplayFunShaderBot,
  computeMaxSpeciesShader,
} from "./post_shaders.js";
import { copyShader } from "../copy_shader.js";
import {
  RDShaderTop,
  RDShaderBot,
  RDShaderDirichlet,
  RDShaderNoFlux,
  RDShaderRobin,
  RDShaderUpdate,
  RDShaderUpdateCross,
} from "./simulation_shaders.js";
import { randShader } from "../rand_shader.js";
import { fiveColourDisplay, largestSpeciesShader } from "./display_shaders.js";
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
    str = "case: PRESETNAME:\n\toptions = " + str + ";\nbreak;";
    navigator.clipboard.writeText(str);
  },
  autoMinMaxColourRange: function () {
    let valRange = getMinMaxVal();
    if (valRange[0] == valRange[1]) {
      // If the range is just one value, add one to the second entry.
      valRange[1] += 1;
    }
    options.minColourValue = valRange[0];
    options.maxColourValue = valRange[1];
    updateUniforms();
    refreshGUI(gui);
  },
};

// Get the canvas to draw on, as specified by the html.
canvas = document.getElementById("simCanvas");

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

  // Configure textures with placeholder sizes.
  simTextureA = new THREE.WebGLRenderTarget(options.maxDisc, options.maxDisc, {
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
  });
  simTextureB = simTextureA.clone();
  postTexture = simTextureA.clone();

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

  // Setup equations and BCs.
  setBCsEqs();

  // Set the brush type.
  setBrushType();

  // Show/hide any GUI elements based on current options.
  setNumberOfSpecies();
  setNonConstantDiffusionGUI();

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
      if (event.key === "s") {
        funsObj.copyConfig();
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
  uniforms.aspectRatio = aspectRatio;
  uniforms.brushRadius.value = options.brushRadius;
  uniforms.domainHeight.value = domainHeight;
  uniforms.domainWidth.value = domainWidth;
  uniforms.dt.value = options.dt;
  uniforms.Du.value = options.diffusionU;
  uniforms.Dv.value = options.diffusionV;
  uniforms.Dw.value = options.diffusionW;
  uniforms.dx.value = domainWidth / nXDisc;
  uniforms.dy.value = domainHeight / nYDisc;
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
  render();
}

function initUniforms() {
  uniforms = {
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
    // Diffusion coefficients.
    Du: {
      type: "f",
      value: 0.000004,
    },
    Dv: {
      type: "f",
      value: 0.000002,
    },
    Dw: {
      type: "f",
      value: 0.000002,
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
  // Initialise a GUI.
  gui = new dat.GUI({ closeOnTop: true });

  // Basic GUI elements. Always present.
  pauseButton = gui.add(funsObj, "pause");
  if (isRunning) {
    pauseButton.name("Pause (space)");
  } else {
    pauseButton.name("Play (space)");
  }
  resetButton = gui.add(funsObj, "reset").name("Reset (r)");

  if (inGUI("copyConfigAsURL")) {
    // Copy configuration as URL.
    gui.add(funsObj, "copyConfigAsURL").name("Copy setup URL (s)");
  }

  if (inGUI("copyConfigAsJSON")) {
    // Copy configuration as raw JSON.
    gui.add(funsObj, "copyConfigAsJSON").name("Copy setup JSON");
  }

  if (startOpen != undefined && startOpen) {
    gui.open();
  } else {
    gui.close();
  }

  // Create a generic options folder for folderless controllers, which we'll hide later if it's empty.
  genericOptionsFolder = gui.addFolder("Options");

  // Brush folder.
  if (inGUI("brushFolder")) {
    root = gui.addFolder("Brush");
  } else {
    root = genericOptionsFolder;
  }

  if (inGUI("typeOfBrush")) {
    root
      .add(options, "typeOfBrush", {
        Circle: "circle",
        "Horizontal line": "hline",
        "Vertical line": "vline",
      })
      .name("Brush type")
      .onChange(setBrushType);
  }
  if (inGUI("brushValue")) {
    root
      .add(options, "brushValue")
      .name("Brush value")
      .onFinishChange(setBrushType);
  }
  if (inGUI("brushRadius")) {
    brushRadiusController = root
      .add(options, "brushRadius")
      .name("Brush radius")
      .onChange(updateUniforms);
    brushRadiusController.min(0);
  }
  if (inGUI("whatToDraw")) {
    whatToDrawController = root
      .add(options, "whatToDraw", { u: "u", v: "v", w: "w" })
      .name("Draw species")
      .onChange(setBrushType);
  }

  // Domain folder.
  if (inGUI("domainFolder")) {
    root = gui.addFolder("Domain");
  } else {
    root = genericOptionsFolder;
  }
  if (inGUI("domainScale")) {
    root
      .add(options, "domainScale", 0.001, 10)
      .name("Largest side")
      .onChange(resize);
  }
  if (inGUI("spatialStep")) {
    const dxController = root
      .add(options, "spatialStep")
      .name("Space step")
      .onChange(function () {
        setTimestepForCFL();
        resize();
      })
      .onFinishChange(roundBrushSizeToPix);
    dxController.__precision = 12;
    dxController.min(0);
    dxController.updateDisplay();
  }

  // Timestepping folder.
  if (inGUI("timesteppingFolder")) {
    root = gui.addFolder("Timestepping");
  } else {
    root = genericOptionsFolder;
  }
  if (inGUI("numTimestepsPerFrame")) {
    root.add(options, "numTimestepsPerFrame", 1, 200, 1).name("TPF");
  }
  if (inGUI("dt")) {
    dtController = root
      .add(options, "dt")
      .name("Timestep")
      .onChange(function () {
        setTimestepForCFL();
        updateUniforms();
      });
    dtController.__precision = 12;
    dtController.min(0);
    dtController.updateDisplay();
  }
  if (inGUI("setTimestepForStability")) {
    lockCFLController = root
      .add(options, "setTimestepForStability")
      .name("Lock CFL cond.")
      .onChange(setTimestepForCFL);
  }

  // Equations folder.
  if (inGUI("equationsFolder")) {
    root = gui.addFolder("Equations");
  } else {
    root = genericOptionsFolder;
  }
  // Number of species.
  if (inGUI("numSpecies")) {
    root
      .add(options, "numSpecies", { 1: 1, 2: 2, 3: 3 })
      .name("No. species")
      .onChange(setNumberOfSpecies);
  }
  // Number of species.
  if (inGUI("constantDiffusion")) {
    root
      .add(options, "constantDiffusion")
      .name("Const. D?")
      .onChange(function () {
        setNonConstantDiffusionGUI();
        setRDEquations();
        if (!options.constantDiffusion) {
          options.setTimestepForStability = false;
          refreshGUI(gui);
          hideGUIController(lockCFLController);
        } else {
          showGUIController(lockCFLController);
        }
      });
  }
  // Du and Dv.
  if (inGUI("diffusionUStr")) {
    DuController = root
      .add(options, "diffusionUStr")
      .name("D<sub>u<sub>")
      .onFinishChange(function () {
        updateDiffusionCoeffs();
        setTimestepForCFL();
        updateUniforms();
      });
  }
  if (inGUI("diffusionVStr")) {
    DvController = root
      .add(options, "diffusionVStr")
      .name("D<sub>v<sub>")
      .onFinishChange(function () {
        updateDiffusionCoeffs();
        setTimestepForCFL();
        updateUniforms();
      });
  }
  if (inGUI("diffusionWStr")) {
    DwController = root
      .add(options, "diffusionWStr")
      .name("D<sub>w<sub>")
      .onFinishChange(function () {
        updateDiffusionCoeffs();
        setTimestepForCFL();
        updateUniforms();
      });
  }
  if (inGUI("nonconstantDiffusionStrUU")) {
    DuuController = root
      .add(options, "nonconstantDiffusionStrUU")
      .name("D<sub>uu<sub>")
      .onFinishChange(setRDEquations);
  }
  if (inGUI("nonconstantDiffusionStrUV")) {
    DuvController = root
      .add(options, "nonconstantDiffusionStrUV")
      .name("D<sub>uv<sub>")
      .onFinishChange(setRDEquations);
  }
  if (inGUI("nonconstantDiffusionStrUW")) {
    DuwController = root
      .add(options, "nonconstantDiffusionStrUW")
      .name("D<sub>uw<sub>")
      .onFinishChange(setRDEquations);
  }
  if (inGUI("nonconstantDiffusionStrVU")) {
    DvuController = root
      .add(options, "nonconstantDiffusionStrVU")
      .name("D<sub>vu<sub>")
      .onFinishChange(setRDEquations);
  }
  if (inGUI("nonconstantDiffusionStrVV")) {
    DvvController = root
      .add(options, "nonconstantDiffusionStrVV")
      .name("D<sub>vv<sub>")
      .onFinishChange(setRDEquations);
  }
  if (inGUI("nonconstantDiffusionStrVW")) {
    DvwController = root
      .add(options, "nonconstantDiffusionStrVW")
      .name("D<sub>vw<sub>")
      .onFinishChange(setRDEquations);
  }
  if (inGUI("nonconstantDiffusionStrWU")) {
    DwuController = root
      .add(options, "nonconstantDiffusionStrWU")
      .name("D<sub>wu<sub>")
      .onFinishChange(setRDEquations);
  }
  if (inGUI("nonconstantDiffusionStrWV")) {
    DwvController = root
      .add(options, "nonconstantDiffusionStrWV")
      .name("D<sub>wv<sub>")
      .onFinishChange(setRDEquations);
  }
  if (inGUI("nonconstantDiffusionStrWW")) {
    DwwController = root
      .add(options, "nonconstantDiffusionStrWW")
      .name("D<sub>ww<sub>")
      .onFinishChange(setRDEquations);
  }
  if (inGUI("reactionStrU")) {
    // Custom f(u,v) and g(u,v).
    fController = root
      .add(options, "reactionStrU")
      .name("f(u,v,w)")
      .onFinishChange(setRDEquations);
  }
  if (inGUI("reactionStrV")) {
    gController = root
      .add(options, "reactionStrV")
      .name("g(u,v,w)")
      .onFinishChange(setRDEquations);
  }
  if (inGUI("reactionStrW")) {
    hController = root
      .add(options, "reactionStrW")
      .name("h(u,v,w)")
      .onFinishChange(setRDEquations);
  }
  if (inGUI("kineticParams")) {
    root
      .add(options, "kineticParams")
      .name("Kinetic params")
      .onFinishChange(function () {
        setRDEquations();
        setClearShader();
        setPostFunFragShader();
      });
  }

  // Boundary conditions folder.
  if (inGUI("boundaryConditionsFolder")) {
    root = gui.addFolder("Boundary conditions");
  } else {
    root = genericOptionsFolder;
  }
  if (inGUI("boundaryConditionsU")) {
    root
      .add(options, "boundaryConditionsU", {
        Periodic: "periodic",
        "No flux": "noflux",
        Dirichlet: "dirichlet",
        Robin: "robin",
      })
      .name("u")
      .onChange(setBCsEqs);
  }
  if (inGUI("dirichletU")) {
    dirichletUController = root
      .add(options, "dirichletU")
      .name("u(boundary) = ")
      .onFinishChange(setRDEquations);
  }
  if (inGUI("robinStrU")) {
    robinUController = root
      .add(options, "robinStrU")
      .name("du/dn = ")
      .onFinishChange(setRDEquations);
  }
  if (inGUI("boundaryConditionsV")) {
    vBCsController = root
      .add(options, "boundaryConditionsV", {
        Periodic: "periodic",
        "No flux": "noflux",
        Dirichlet: "dirichlet",
        Robin: "robin",
      })
      .name("v")
      .onChange(setBCsEqs);
  }
  if (inGUI("dirichletV")) {
    dirichletVController = root
      .add(options, "dirichletV")
      .name("v(boundary) = ")
      .onFinishChange(setRDEquations);
  }
  if (inGUI("robinStrV")) {
    robinVController = root
      .add(options, "robinStrV")
      .name("dv/dn = ")
      .onFinishChange(setRDEquations);
  }
  if (inGUI("boundaryConditionsW")) {
    wBCsController = root
      .add(options, "boundaryConditionsW", {
        Periodic: "periodic",
        "No flux": "noflux",
        Dirichlet: "dirichlet",
        Robin: "robin",
      })
      .name("w")
      .onChange(setBCsEqs);
  }
  if (inGUI("dirichletW")) {
    dirichletWController = root
      .add(options, "dirichletW")
      .name("w(boundary) = ")
      .onFinishChange(setRDEquations);
  }
  if (inGUI("robinStrW")) {
    robinWController = root
      .add(options, "robinStrW")
      .name("dw/dn = ")
      .onFinishChange(setRDEquations);
  }

  // Rendering folder.
  if (inGUI("renderingFolder")) {
    root = gui.addFolder("Rendering");
  } else {
    root = genericOptionsFolder;
  }
  if (inGUI("squareCanvas")) {
    root
      .add(options, "squareCanvas")
      .name("Square display")
      .onFinishChange(resize);
  }
  if (inGUI("renderSize")) {
    root
      .add(options, "renderSize", 1, 2048, 1)
      .name("Render res")
      .onChange(setSizes);
  }

  // Colour folder.
  if (inGUI("colourFolder")) {
    root = gui.addFolder("Colour");
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
  if (inGUI("autoMinMaxColourRange")) {
    autoMinMaxColourRangeController = root
      .add(funsObj, "autoMinMaxColourRange")
      .name("Auto colour");
  }

  // Miscellaneous folder.
  if (inGUI("miscFolder")) {
    fMisc = gui.addFolder("Misc.");
    root = fMisc;
  } else {
    root = genericOptionsFolder;
  }
  if (inGUI("clearValueU")) {
    clearValueUController = root
      .add(options, "clearValueU")
      .name("Initial u")
      .onFinishChange(setClearShader);
  }
  if (inGUI("clearValueV")) {
    clearValueVController = root
      .add(options, "clearValueV")
      .name("Initial v")
      .onFinishChange(setClearShader);
  }
  if (inGUI("clearValueW")) {
    clearValueWController = root
      .add(options, "clearValueW")
      .name("Initial w")
      .onFinishChange(setClearShader);
  }
  if (inGUI("preset")) {
    root
      .add(options, "preset", {
        None: "default",
        "Heat equation": "heatEquation",
        Subcriticality: "subcriticalGS",
        Alan: "Alan",
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
    gui
      .add(options, "showAllOptionsOverride")
      .name("Show all")
      .onChange(function () {
        setShowAllToolsFlag();
        deleteGUI(gui);
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

  // Make sure we're showing/hiding the correct parts of the GUI.
  setNumberOfSpecies();
  setBCsEqs();
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
    setPostFunFragShader();
  } else if (options.colourmap == "BlackGreenYellowRedWhite") {
    uniforms.colour1.value = new THREE.Vector4(0, 0, 0.0, 0);
    uniforms.colour2.value = new THREE.Vector4(0, 1, 0, 0.25);
    uniforms.colour3.value = new THREE.Vector4(1, 1, 0, 0.5);
    uniforms.colour4.value = new THREE.Vector4(1, 0, 0, 0.75);
    uniforms.colour5.value = new THREE.Vector4(1, 1, 1, 1.0);
    displayMaterial.fragmentShader = fiveColourDisplay();
    setPostFunFragShader();
  } else if (options.colourmap == "viridis") {
    uniforms.colour1.value = new THREE.Vector4(0.267, 0.0049, 0.3294, 0.0);
    uniforms.colour2.value = new THREE.Vector4(0.2302, 0.3213, 0.5455, 0.25);
    uniforms.colour3.value = new THREE.Vector4(0.1282, 0.5651, 0.5509, 0.5);
    uniforms.colour4.value = new THREE.Vector4(0.3629, 0.7867, 0.3866, 0.75);
    uniforms.colour5.value = new THREE.Vector4(0.9932, 0.9062, 0.1439, 1.0);
    displayMaterial.fragmentShader = fiveColourDisplay();
    setPostFunFragShader();
  } else if (options.colourmap == "turbo") {
    uniforms.colour1.value = new THREE.Vector4(0.19, 0.0718, 0.2322, 0.0);
    uniforms.colour2.value = new THREE.Vector4(0.1602, 0.7332, 0.9252, 0.25);
    uniforms.colour3.value = new THREE.Vector4(0.6384, 0.991, 0.2365, 0.5);
    uniforms.colour4.value = new THREE.Vector4(0.9853, 0.5018, 0.1324, 0.75);
    uniforms.colour5.value = new THREE.Vector4(0.4796, 0.01583, 0.01055, 1.0);
    displayMaterial.fragmentShader = fiveColourDisplay();
    setPostFunFragShader();
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
  pauseButton.name("Play (space)");
  isRunning = false;
}

function playSim() {
  pauseButton.name("Pause (space)");
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

function parseCrossDiffusionStrings() {
  // Parse the user-defined shader strings into valid GLSL and output their concatenation. We won't worry about code injection.
  let out = "";

  // Prepare Duu, evaluating it at five points.
  out += constantDiffusionEvaluateInSpaceStr(
    parseShaderString(options.nonconstantDiffusionStrUU) + ";\n",
    "uu"
  );

  // Prepare Duv, evaluating it at five points.
  out += constantDiffusionEvaluateInSpaceStr(
    parseShaderString(options.nonconstantDiffusionStrUV) + ";\n",
    "uv"
  );

  // Prepare Duw, evaluating it at five points.
  out += constantDiffusionEvaluateInSpaceStr(
    parseShaderString(options.nonconstantDiffusionStrUW) + ";\n",
    "uw"
  );

  // Prepare Dvu, evaluating it at five points.
  out += constantDiffusionEvaluateInSpaceStr(
    parseShaderString(options.nonconstantDiffusionStrVU) + ";\n",
    "vu"
  );

  // Prepare Dvv, evaluating it at five points.
  out += constantDiffusionEvaluateInSpaceStr(
    parseShaderString(options.nonconstantDiffusionStrVV) + ";\n",
    "vv"
  );

  // Prepare Dvw, evaluating it at five points.
  out += constantDiffusionEvaluateInSpaceStr(
    parseShaderString(options.nonconstantDiffusionStrVW) + ";\n",
    "vw"
  );

  // Prepare Dwu, evaluating it at five points.
  out += constantDiffusionEvaluateInSpaceStr(
    parseShaderString(options.nonconstantDiffusionStrWU) + ";\n",
    "wu"
  );

  // Prepare Dwv, evaluating it at five points.
  out += constantDiffusionEvaluateInSpaceStr(
    parseShaderString(options.nonconstantDiffusionStrWV) + ";\n",
    "wv"
  );

  // Prepare Dww, evaluating it at five points.
  out += constantDiffusionEvaluateInSpaceStr(
    parseShaderString(options.nonconstantDiffusionStrWW) + ";\n",
    "ww"
  );

  return out;
}

function constantDiffusionEvaluateInSpaceStr(str, label) {
  let out = "";
  let xRegex = /(?![^x])*x(?=[^x])*/g;
  let yRegex = /(?![^y])*y(?=[^y])*/g;

  out += "float D" + label + " = " + str;
  out += "float D" + label + "L = " + str.replaceAll(xRegex, "(x-dx)");
  out += "float D" + label + "R = " + str.replaceAll(xRegex, "(x+dx)");
  out += "float D" + label + "T = " + str.replaceAll(yRegex, "(y+dy)");
  out += "float D" + label + "B = " + str.replaceAll(yRegex, "(y-dy)");
  return out;
}

function parseShaderString(str) {
  // Parse a string into valid GLSL by replacing u,v,^, and integers.
  // Pad the string.
  str = " " + str + " ";

  // Replace u, v, and w with uvw.r, uvw.g, and uvw.b via placeholders.
  str = str.replace(/u/g, "U");
  str = str.replace(/v/g, "V");
  str = str.replace(/w/g, "W");
  str = str.replace(/U/g, "uvw." + speciesToChannelChar("u"));
  str = str.replace(/V/g, "uvw." + speciesToChannelChar("v"));
  str = str.replace(/W/g, "uvw." + speciesToChannelChar("w"));

  // Replace integers with floats.
  while (str != (str = str.replace(/([^.0-9])(\d+)([^.0-9])/g, "$1$2.$3")));
  // Replace powers with pow, including nested powers.
  while (
    str !=
    (str = str.replace(
      /\(((?:[^\(]|pow\()+?)\)\^(\(+.*\)+|[A-z0-9.]*)/g,
      "pow($1,$2)"
    ))
  );
  str = str.replace(/([A-z0-9.]*)\^([A-z0-9.]*)/g, "pow($1, $2)");
  return str;
}

function setRDEquations() {
  let noFluxSpecies = "";
  let dirichletShader = "";
  let robinShader = "";
  let updateShader = "";

  // Record no-flux species.
  if (options.boundaryConditionsU == "noflux") {
    noFluxSpecies += "u";
  }
  if (options.boundaryConditionsV == "noflux") {
    noFluxSpecies += "v";
  }
  if (options.boundaryConditionsW == "noflux") {
    noFluxSpecies += "w";
  }

  // Create Dirichlet shaders.
  if (options.boundaryConditionsU == "dirichlet") {
    dirichletShader +=
      selectSpeciesInShaderStr(RDShaderDirichlet(), "u") +
      parseShaderString(options.dirichletU) +
      ";\n}\n";
  }
  if (options.boundaryConditionsV == "dirichlet") {
    dirichletShader +=
      selectSpeciesInShaderStr(RDShaderDirichlet(), "v") +
      parseShaderString(options.dirichletV) +
      ";\n}\n";
  }
  if (options.boundaryConditionsW == "dirichlet") {
    dirichletShader +=
      selectSpeciesInShaderStr(RDShaderDirichlet(), "w") +
      parseShaderString(options.dirichletW) +
      ";\n}\n";
  }

  // Create a Robin shader block for each species separately.
  if (options.boundaryConditionsU == "robin") {
    robinShader += parseRobinRHS(options.robinStrU, "SPECIES");
    robinShader += RDShaderRobin();
    robinShader = selectSpeciesInShaderStr(robinShader, "u");
  }
  if (options.boundaryConditionsV == "robin") {
    robinShader += parseRobinRHS(options.robinStrV, "SPECIES");
    robinShader += RDShaderRobin();
    robinShader = selectSpeciesInShaderStr(robinShader, "v");
  }
  if (options.boundaryConditionsW == "robin") {
    robinShader += parseRobinRHS(options.robinStrW, "SPECIES");
    robinShader += RDShaderRobin();
    robinShader = selectSpeciesInShaderStr(robinShader, "w");
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
  if (!options.constantDiffusion) {
    updateShader = parseCrossDiffusionStrings() + "\n" + RDShaderUpdateCross();
  } else {
    updateShader = RDShaderUpdate();
  }

  simMaterial.fragmentShader = [
    RDShaderTop(),
    kineticStr,
    selectSpeciesInShaderStr(RDShaderNoFlux(), noFluxSpecies),
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
  deleteGUI(gui);
  initGUI();

  setNumberOfSpecies();
  setNonConstantDiffusionGUI();
  if (gui != undefined) {
    // Refresh the whole gui.
    refreshGUI(gui);
  }

  // Trigger a resize, which will refresh all uniforms and set sizes.
  resize();

  // Configure the simulation material.
  setBCsEqs();

  // Set the draw, display, and clear shaders.
  setDrawAndDisplayShaders();
  setClearShader();

  // Reset the state of the simulation.
  resetSim();

  // To get around an annoying bug in dat.gui.image, in which the
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
      .name("T(x,y) = Image:")
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

  // Loop through newOptions and overwrite anything already present.
  Object.assign(options, newOptions);

  // Set a flag if we will be showing all tools.
  setShowAllToolsFlag();

  // Check if the simulation should be running on load.
  isRunning = options.runningOnLoad;

  // Compute any derived values.
  updateDiffusionCoeffs();
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
    if (folder == gui) {
      gui.destroy();
    }
  }
}

function setNumberOfSpecies() {
  switch (parseInt(options.numSpecies)) {
    case 1:
      // Ensure that u is being displayed on the screen (and the brush target).
      options.whatToPlot = "u";
      updateWhatToPlot();

      // Set the diffusion of v and w to zero to prevent them from causing numerical instability.
      if (!options.constantDiffusion) {
        options.nonconstantDiffusionStrUV = "0.0";
        options.nonconstantDiffusionStrUW = "0.0";
        options.nonconstantDiffusionStrVU = "0.0";
        options.nonconstantDiffusionStrVV = "0.0";
        options.nonconstantDiffusionStrVW = "0.0";
        options.nonconstantDiffusionStrWU = "0.0";
        options.nonconstantDiffusionStrWV = "0.0";
        options.nonconstantDiffusionStrWW = "0.0";
      } else {
        options.diffusionV = 0;
        options.diffusionW = 0;
      }

      // Set v and w to be periodic to reduce computational overhead.
      options.boundaryConditionsV = "periodic";
      options.clearValueV = "0";
      options.reactionStrV = "0";
      options.boundaryConditionsW = "periodic";
      options.clearValueW = "0";
      options.reactionStrW = "0";
      updateUniforms();

      // Hide GUI panels related to v and w.
      hideVGUIPanels();
      hideWGUIPanels();

      // Remove references to v and w in labels.
      if (fController != undefined) {
        fController.name("f(u)");
      }

      break;
    case 2:
      // Ensure that u or v is being displayed on the screen (and the brush target).
      if (options.whatToDraw == "w") {
        options.whatToDraw == "u";
      }
      if (options.whatToPlot == "w") {
        options.whatToPlot == "u";
      }

      // Set the diffusion of w to zero to prevent it from causing numerical instability.
      if (!options.constantDiffusion) {
        options.nonconstantDiffusionStrUV = "0.0";
        options.nonconstantDiffusionStrVU = "0.0";
        options.nonconstantDiffusionStrVV = "0.0";
      } else {
        options.diffusionW = 0;
      }

      // Set w to be periodic to reduce computational overhead.
      options.boundaryConditionsW = "periodic";
      options.clearValueW = "0";
      options.reactionStrW = "0";
      updateUniforms();

      // Show GUI panels related to v, and hide those related to w.
      showVGUIPanels();
      hideWGUIPanels();

      // Ensure correct references to v and w in labels are present.
      if (fController != undefined) {
        fController.name("f(u,v)");
      }
      if (gController != undefined) {
        gController.name("g(u,v)");
      }
      break;
    case 3:
      // Show GUI panels related to v and w.
      showVGUIPanels();
      showWGUIPanels();

      // Ensure correct references to v and w in labels are present.
      if (fController != undefined) {
        fController.name("f(u,v,w)");
      }
      if (gController != undefined) {
        gController.name("g(u,v,w)");
      }
      if (hController != undefined) {
        hController.name("h(u,v,w)");
      }
  }
  refreshGUI(gui);
}

function setTypeOfDiffusion() {
  if (!options.constantDiffusion) {
    // Show all panels related to nonconstant diffusion.
    showGUIController();

    // Hide all panels related to constant diffusion.
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

function selectSpeciesInShaderStr(shaderStr, species) {
  // If there are no species, then return an empty string.
  if (species.length == 0) {
    return "";
  }
  let regex = /SPECIES/g;
  let channel = speciesToChannelChar(species);
  shaderStr = shaderStr.replace(regex, channel);
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

function setBCsEqs() {
  // Configure the shaders.
  setRDEquations();

  setNonConstantDiffusionGUI();

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
}

function setTimestepForCFL() {
  if (options.setTimestepForStability) {
    let CFLValue =
      Math.max(options.diffusionU, options.diffusionV, options.diffusionW) /
      options.spatialStep ** 2;
    // We decrease dt so that it satisfies the CFL condition for the pure diffusion condition.
    // However, as the inhomogeneity seems to reduce stability, we conservatively take twice as
    // many timesteps needed for diffusion in the hope of the RD system being stable.
    if (options.dt > (0.5 * 0.25) / CFLValue) {
      dtController.setValue((0.5 * 0.25) / CFLValue);
    }
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
    .name("T(x,y) = Image:")
    .onChange(loadImageSource);
}

function updateWhatToPlot() {
  if (options.whatToPlot == "MAX") {
    setPostFunMaxFragShader();
    hideGUIController(minColourValueController);
    hideGUIController(maxColourValueController);
    hideGUIController(autoMinMaxColourRangeController);
  } else {
    setPostFunFragShader();
    showGUIController(minColourValueController);
    showGUIController(maxColourValueController);
    showGUIController(autoMinMaxColourRangeController);
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
  if (!options.constantDiffusion) {
    showGUIController(DuvController);
    showGUIController(DvuController);
    showGUIController(DvvController);
  } else {
    showGUIController(DvController);
  }
  showGUIController(gController);
  showGUIController(clearValueVController);
  showGUIController(vBCsController);
}

function showWGUIPanels() {
  if (!options.constantDiffusion) {
    showGUIController(DuwController);
    showGUIController(DvwController);
    showGUIController(DwuController);
    showGUIController(DwvController);
    showGUIController(DwwController);
  } else {
    showGUIController(DwController);
  }
  showGUIController(hController);
  showGUIController(clearValueWController);
  showGUIController(wBCsController);
}

function hideVGUIPanels() {
  hideGUIController(DvController);
  hideGUIController(DuvController);
  hideGUIController(DvuController);
  hideGUIController(DvvController);
  hideGUIController(gController);
  hideGUIController(clearValueVController);
  hideGUIController(vBCsController);
}

function hideWGUIPanels() {
  hideGUIController(DwController);
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
  for (let i = 0; i < buffer.length / 4; i += 4) {
    minVal = Math.min(minVal, buffer[i]);
    maxVal = Math.max(maxVal, buffer[i]);
  }
  return [minVal, maxVal];
}

function evaluateDiffusionStr(str) {
  // Take a string that specifies a diffusion coefficient in terms of basic mathops and
  // set parameters (predominantly domainLength as L).
  // This will be very dangerous, as code injection will certainly be possible.
  let regex = /L/g;
  str = str.replace(regex, options.domainScale);

  regex = /\^/g;
  str = str.replace(regex, "**");

  return eval(str);
}

function updateDiffusionCoeffs() {
  options.diffusionU = evaluateDiffusionStr(options.diffusionUStr);
  options.diffusionV = evaluateDiffusionStr(options.diffusionVStr);
  options.diffusionW = evaluateDiffusionStr(options.diffusionWStr);
}

function setPostFunFragShader() {
  let shaderStr = computeDisplayFunShaderTop();
  let regex = /[;,\s]*(.+?)(?:$|[;,])+/g;
  let kineticStr = parseShaderString(
    options.kineticParams.replace(regex, "float $1;\n")
  );
  shaderStr += kineticStr;
  shaderStr += computeDisplayFunShaderBot();
  postMaterial.fragmentShader = setDisplayFunInShader(shaderStr);
  postMaterial.needsUpdate = true;
}

function setPostFunMaxFragShader() {
  postMaterial.fragmentShader = computeMaxSpeciesShader();
  postMaterial.needsUpdate = true;
  options.minColourValue = 0.0;
  options.maxColourValue = 1.0;
  updateUniforms();
}

function setNonConstantDiffusionGUI() {
  switch (parseInt(options.numSpecies)) {
    case 1:
      if (!options.constantDiffusion) {
        hideGUIController(DuController);
        showGUIController(DuuController);
      } else {
        showGUIController(DuController);
        hideGUIController(DuuController);
      }
      break;
    case 2:
      if (!options.constantDiffusion) {
        hideGUIController(DuController);
        hideGUIController(DvController);
        showGUIController(DuuController);
        showGUIController(DuvController);
        showGUIController(DvuController);
        showGUIController(DvvController);
      } else {
        showGUIController(DuController);
        showGUIController(DvController);
        hideGUIController(DuuController);
        hideGUIController(DuvController);
        hideGUIController(DvuController);
        hideGUIController(DvvController);
      }
      break;
    case 3:
      if (!options.constantDiffusion) {
        hideGUIController(DuController);
        hideGUIController(DvController);
        hideGUIController(DwController);
        showGUIController(DuuController);
        showGUIController(DuvController);
        showGUIController(DuwController);
        showGUIController(DvuController);
        showGUIController(DvvController);
        showGUIController(DvwController);
        showGUIController(DwuController);
        showGUIController(DwvController);
        showGUIController(DwwController);
      } else {
        showGUIController(DuController);
        showGUIController(DvController);
        showGUIController(DwController);
        hideGUIController(DuuController);
        hideGUIController(DuvController);
        hideGUIController(DuwController);
        hideGUIController(DvuController);
        hideGUIController(DvvController);
        hideGUIController(DvwController);
        hideGUIController(DwuController);
        hideGUIController(DwvController);
        hideGUIController(DwwController);
      }
      break;
  }
}
