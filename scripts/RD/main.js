let canvas;
let camera, simCamera, scene, simScene, renderer, aspectRatio;
let simTextureA, simTextureB;
let displayMaterial, drawMaterial, simMaterial, clearMaterial, copyMaterial;
let domain, simDomain;
let options, uniforms, funsObj;
let gui,
  root,
  pauseButton,
  clearButton,
  brushRadiusController,
  fController,
  gController,
  DvController,
  dtController,
  whatToPlotController,
  minColourValueUController,
  maxColourValueUController,
  minColourValueVController,
  maxColourValueVController,
  clearValueVController,
  clearValueUController,
  vBCsController,
  dirichletUController,
  dirichletVController,
  robinUController,
  robinVController,
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
} from "../drawing_shaders.js";
import { copyShader } from "../copy_shader.js";
import {
  RDShaderTop,
  RDShaderBot,
  RDShaderDirichlet,
  RDShaderNoFlux,
  RDShaderRobin,
  RDShaderUpdate,
} from "./simulation_shaders.js";
import { randShader } from "../rand_shader.js";
import { greyscaleDisplay, fiveColourDisplay } from "../display_shaders.js";
import { genericVertexShader } from "../generic_shaders.js";
import { getPreset } from "./presets.js";
import { clearShaderBot, clearShaderTop } from "../clear_shader.js";

// Setup some configurable options.
options = {};

funsObj = {
  clear: function () {
    clearTextures();
    uniforms.time.value = 0.0;
  },
  pause: function () {
    if (isRunning) {
      pauseSim();
    } else {
      playSim();
    }
  },
  copyConfig: function () {
    let str = [
      location.href.replace(location.search, ""),
      "?options=",
      encodeURI(btoa(JSON.stringify(options))),
    ].join("");
    navigator.clipboard.writeText(str);
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
  isRunning = true;
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

  // Periodic boundary conditions (for now).
  simTextureA.texture.wrapS = THREE.RepeatWrapping;
  simTextureA.texture.wrapT = THREE.RepeatWrapping;
  simTextureB.texture.wrapS = THREE.RepeatWrapping;
  simTextureB.texture.wrapT = THREE.RepeatWrapping;

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

  // Set the size of the domain and related parameters.
  resize();

  // Add shaders to the textures.
  setDrawAndDisplayShaders();
  setClearShader();

  // Set the initial condition.
  clearTextures();

  // Listen for pointer events.
  canvas.addEventListener("pointerdown", onDocumentPointerDown);
  canvas.addEventListener("pointerup", onDocumentPointerUp);
  canvas.addEventListener("pointermove", onDocumentPointerMove);

  document.addEventListener("keypress", function onEvent(event) {
    if (event.key === "c") {
      funsObj.clear();
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
  uniforms.dx.value = domainWidth / nXDisc;
  uniforms.dy.value = domainHeight / nYDisc;
  if (options.whatToPlot == "u") {
    uniforms.maxColourValue.value = options.maxColourValueU;
    uniforms.minColourValue.value = options.minColourValueU;
  } else if (options.whatToPlot == "v") {
    uniforms.maxColourValue.value = options.maxColourValueV;
    uniforms.minColourValue.value = options.minColourValueV;
  }
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
  clearButton = gui.add(funsObj, "clear").name("Clear (c)");

  if (options.showCopyButton) {
    // Copy configuration as URL.
    gui.add(funsObj, "copyConfig").name("Copy setup URL (s)");
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
    root
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
      .add(options, "numSpecies", { 1: 1, 2: 2 })
      .name("No. species")
      .onChange(setNumberOfSpecies);
  }
  // Du and Dv.
  if (inGUI("diffusionU")) {
    const DuController = root
      .add(options, "diffusionU")
      .name("Du")
      .onChange(function () {
        setTimestepForCFL();
        updateUniforms();
      });
    DuController.__precision = 12;
    DuController.updateDisplay();
  }
  if (inGUI("diffusionV")) {
    DvController = root
      .add(options, "diffusionV")
      .name("Dv")
      .onChange(function () {
        setTimestepForCFL();
        updateUniforms();
      });
    DvController.__precision = 12;
    DvController.updateDisplay();
  }
  if (inGUI("reactionStrU")) {
    // Custom f(u,v) and g(u,v).
    fController = root
      .add(options, "reactionStrU")
      .name("f(u,v)")
      .onFinishChange(setRDEquations);
  }
  if (inGUI("reactionStrV")) {
    gController = root
      .add(options, "reactionStrV")
      .name("g(u,v)")
      .onFinishChange(setRDEquations);
  }
  if (inGUI("kineticParams")) {
    root
      .add(options, "kineticParams")
      .name("Kinetic params")
      .onFinishChange(setRDEquations);
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
      .add(options, "whatToPlot", { u: "u", v: "v" })
      .name("Colour by: ")
      .onChange(updateWhatToPlot);
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
  if (inGUI("minColourValueU")) {
    minColourValueUController = root
      .add(options, "minColourValueU")
      .name("Min value")
      .onChange(updateUniforms);
  }
  if (inGUI("maxColourValueU")) {
    maxColourValueUController = root
      .add(options, "maxColourValueU")
      .name("Max value")
      .onChange(updateUniforms);
  }
  if (inGUI("minColourValueV")) {
    minColourValueVController = root
      .add(options, "minColourValueV")
      .name("Min value")
      .onChange(updateUniforms);
  }
  if (inGUI("maxColourValueV")) {
    maxColourValueVController = root
      .add(options, "maxColourValueV")
      .name("Max value")
      .onChange(updateUniforms);
    selectColorRangeControls();
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
      .name("u on clear")
      .onFinishChange(setClearShader);
  }
  if (inGUI("clearValueV")) {
    clearValueVController = root
      .add(options, "clearValueV")
      .name("v on clear")
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
    displayMaterial.fragmentShader = selectColourspecInShaderStr(
      greyscaleDisplay()
    );
  } else if (options.colourmap == "BlackGreenYellowRedWhite") {
    displayMaterial.fragmentShader = selectColourspecInShaderStr(
      fiveColourDisplay()
    );
    uniforms.colour1.value = new THREE.Vector4(0, 0, 0.0, 0);
    uniforms.colour2.value = new THREE.Vector4(0, 1, 0, 0.25);
    uniforms.colour3.value = new THREE.Vector4(1, 1, 0, 0.5);
    uniforms.colour4.value = new THREE.Vector4(1, 0, 0, 0.75);
    uniforms.colour5.value = new THREE.Vector4(1, 1, 1, 1.0);
  } else if (options.colourmap == "viridis") {
    displayMaterial.fragmentShader = selectColourspecInShaderStr(
      fiveColourDisplay()
    );
    uniforms.colour1.value = new THREE.Vector4(0.267, 0.0049, 0.3294, 0.0);
    uniforms.colour2.value = new THREE.Vector4(0.2302, 0.3213, 0.5455, 0.25);
    uniforms.colour3.value = new THREE.Vector4(0.1282, 0.5651, 0.5509, 0.5);
    uniforms.colour4.value = new THREE.Vector4(0.3629, 0.7867, 0.3866, 0.75);
    uniforms.colour5.value = new THREE.Vector4(0.9932, 0.9062, 0.1439, 1.0);
  } else if (options.colourmap == "turbo") {
    displayMaterial.fragmentShader = selectColourspecInShaderStr(
      fiveColourDisplay()
    );
    uniforms.colour1.value = new THREE.Vector4(0.19, 0.0718, 0.2322, 0.0);
    uniforms.colour2.value = new THREE.Vector4(0.1602, 0.7332, 0.9252, 0.25);
    uniforms.colour3.value = new THREE.Vector4(0.6384, 0.991, 0.2365, 0.5);
    uniforms.colour4.value = new THREE.Vector4(0.9853, 0.5018, 0.1324, 0.75);
    uniforms.colour5.value = new THREE.Vector4(0.4796, 0.01583, 0.01055, 1.0);
  }

  displayMaterial.needsUpdate = true;
}

function selectColourspecInShaderStr(shaderStr) {
  let regex = /COLOURSPEC/g;
  let channel = mapSpeciesToChannel(options.whatToPlot);
  shaderStr = shaderStr.replace(regex, channel);
  return shaderStr;
}

function selectColorRangeControls() {
  switch (options.whatToPlot) {
    case "u":
      // Show u range controllers.
      showGUIController(minColourValueUController);
      showGUIController(maxColourValueUController);

      // Hide v range controllers.
      hideGUIController(minColourValueVController);
      hideGUIController(maxColourValueVController);

      break;
    case "v":
      // Show v range controllers.
      showGUIController(minColourValueVController);
      showGUIController(maxColourValueVController);

      // Hide u range controllers.
      hideGUIController(minColourValueUController);
      hideGUIController(maxColourValueUController);
  }
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
}

function pauseSim() {
  pauseButton.name("Play (space)");
  isRunning = false;
}

function playSim() {
  pauseButton.name("Pause (space)");
  isRunning = true;
}

function parseReactionStrings() {
  // Parse the user-defined shader strings into valid GLSL and output their concatenation. We won't worry about code injection.
  let out = "";

  // Prepare the f string.
  out += "float f = " + parseShaderString(options.reactionStrU) + ";\n";
  // Prepare the g string.
  out += "float g = " + parseShaderString(options.reactionStrV) + ";\n";

  return out;
}

function parseShaderString(str) {
  // Parse a string into valid GLSL by replacing u,v,^, and integers.
  // Pad the string.
  str = " " + str + " ";

  // Replace u and v with uv.r and uv.g via placeholders.
  str = str.replace(/u/g, "U");
  str = str.replace(/v/g, "V");
  str = str.replace(/U/g, "uv." + mapSpeciesToChannel("u"));
  str = str.replace(/V/g, "uv." + mapSpeciesToChannel("v"));

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

  // Record no-flux species.
  if (options.boundaryConditionsU == "noflux") {
    noFluxSpecies += "u";
  }
  if (options.boundaryConditionsV == "noflux") {
    noFluxSpecies += "v";
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

  // Insert any user-defined kinetic parameters, given as a string that needs parsing.
  // Extract variable definitions, separated by commas or semicolons, ignoring whitespace.
  // We'll inject this shader string before any boundary conditions etc, so that these params
  // are also available in BCs.
  let regex = /[,;\s]*(.+?)(?:$|[,;])+/g;
  let kineticStr = parseShaderString(
    options.kineticParams.replace(regex, "float $1;\n")
  );

  simMaterial.fragmentShader = [
    RDShaderTop(),
    kineticStr,
    selectSpeciesInShaderStr(RDShaderNoFlux(), noFluxSpecies),
    robinShader,
    parseReactionStrings(),
    RDShaderUpdate(),
    dirichletShader,
    RDShaderBot(),
  ].join(" ");
  simMaterial.needsUpdate = true;
}

function parseRobinRHS(string, species) {
  return "float robinRHS" + species + " = " + parseShaderString(string) + ";\n";
}

function loadPreset(preset) {
  // Updates the values stored in options.
  loadOptions(preset);

  // Replace the GUI.
  deleteGUI(gui);
  initGUI();

  setNumberOfSpecies();
  if (gui != undefined) {
    // Refresh the whole gui.
    selectColorRangeControls();
    refreshGUI(gui);
  }

  // Trigger a resize, which will refresh all uniforms and set sizes.
  resize();

  // Configure the simulation material.
  setBCsEqs();

  // Set the draw and display shaders.
  setDrawAndDisplayShaders();

  // Set the display color and brush type.
  setDisplayColourAndType();
  setBrushType();

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
      console.log(folder.__controllers[i]);
      folder.__controllers[i].remove();
    }
    // If this is the top-level GUI, destroy it.
    console.log(folder);
    if (folder == gui) {
      console.log("Here");
      gui.destroy();
    }
  }
}
function setNumberOfSpecies() {
  switch (parseInt(options.numSpecies)) {
    case 1:
      //Ensure that u is being displayed on the screen (and the brush target).
      options.whatToPlot = "u";
      updateWhatToPlot();

      // Set the diffusion of v to zero to prevent it causing numerical instability.
      options.diffusionV = 0;

      // Set v to be periodic to reduce computational overhead.
      options.boundaryConditionsV = "periodic";
      options.clearValueV = "0";
      options.reactionStrV = "0";
      updateUniforms();

      // Hide GUI panels related to v.
      hideGUIController(DvController);
      hideGUIController(gController);
      hideGUIController(whatToPlotController);
      hideGUIController(clearValueVController);
      hideGUIController(vBCsController);

      // Remove references to v in labels.
      if (fController != undefined) {
        fController.name("f(u)");
      }

      break;
    case 2:
      // Show GUI panels related to v.
      showGUIController(DvController);
      showGUIController(gController);
      showGUIController(whatToPlotController);
      showGUIController(clearValueVController);
      showGUIController(vBCsController);

      // Ensure correct references to v in labels are present.
      if (fController != undefined) {
        fController.name("f(u,v)");
      }
      break;
  }
  refreshGUI(gui);
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
  let channel = mapSpeciesToChannel(species);
  shaderStr = shaderStr.replace(regex, channel);
  return shaderStr;
}

function mapSpeciesToChannel(speciesStr) {
  let channel = "";
  if (speciesStr.includes("u")) {
    channel += "r";
  }
  if (speciesStr.includes("v")) {
    channel += "g";
  }
  return channel;
}

function setBCsEqs() {
  // Configure the shaders.
  setRDEquations();

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
}

function setTimestepForCFL() {
  if (options.setTimestepForStability) {
    let CFLValue =
      Math.max(options.diffusionU, options.diffusionV) /
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
  shaderStr += "float u = " + parseShaderString(options.clearValueU) + ";\n";
  shaderStr += "float v = " + parseShaderString(options.clearValueV) + ";\n";
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
  selectColorRangeControls();
  setDisplayColourAndType();
  setBrushType();
  updateUniforms();
}

function inGUI(name) {
  return showAllStandardTools || options.onlyExposeOptions.includes(name);
}

function setShowAllToolsFlag() {
  showAllStandardTools =
    options.showAllOptionsOverride || options.onlyExposeOptions.length == 0;
}
