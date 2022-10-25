let canvas;
let camera, simCamera, scene, simScene, renderer, aspectRatio;
let simTextureA, simTextureB;
let displayMaterial, drawMaterial, simMaterial, clearMaterial, copyMaterial;
let domain, simDomain;
let options, uniforms, funsObj;
let gui,
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
  robinVController;
let isRunning, isDrawing;
let inTex, outTex;
let nXDisc, nYDisc, domainWidth, domainHeight;

import { discShader, vLineShader, hLineShader } from "../drawing_shaders.js";
import { copyShader } from "../copy_shader.js";
import {
  RDShaderTop,
  RDShaderBot,
  RDShaderDirichlet,
  RDShaderNoFlux,
  RDShaderRobin,
  RDShaderUpdate,
} from "./simulation_shaders.js";
import { greyscaleDisplay, fiveColourDisplay } from "../display_shaders.js";
import { genericVertexShader } from "../generic_shaders.js";
import { getPreset } from "./presets.js";

// Setup some configurable options.
options = {};

funsObj = {
  clear: function () {
    clearTextures();
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
  camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, -10000, 10000);
  camera.position.z = 100;

  simCamera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, -10000, 10000);
  simCamera.position.z = 100;

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
  clearMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

  const plane = new THREE.PlaneGeometry(1.0, 1.0);
  domain = new THREE.Mesh(plane, displayMaterial);
  domain.position.z = 0;
  scene.add(domain);

  const simPlane = new THREE.PlaneGeometry(1.0, 1.0);
  simDomain = new THREE.Mesh(simPlane, simMaterial);
  simDomain.position.z = 0;
  simScene.add(simDomain);

  // Add shaders to the textures.
  setDrawAndDisplayShaders();

  // Render black onto the sim textures.
  clearTextures();

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
  uniforms.boundaryValues.value = new THREE.Vector2(
    options.dirichletU,
    options.dirichletV
  );
  uniforms.brushRadius.value = options.brushRadius;
  uniforms.brushValue.value = options.brushValue;
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
  // Set the size of the renderer, which will interpolate from the textures.
  renderer.setSize(options.renderSize, options.renderSize, false);
  // Update uniforms.
  updateUniforms();
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
    brushValue: {
      type: "f",
      value: 1.0,
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
    maxColourValue: {
      type: "f",
      value: 1.0,
    },
    minColourValue: {
      type: "f",
      value: 0.0,
    },
    textureSource: {
      type: "t",
    },
  };
}

function initGUI() {
  gui = new dat.GUI({ closeOnTop: true });
  pauseButton = gui.add(funsObj, "pause");
  if (isRunning) {
    pauseButton.name("Pause (space)");
  } else {
    pauseButton.name("Play (space)");
  }
  clearButton = gui.add(funsObj, "clear").name("Clear (c)");
  // Copy configuration as URL.
  gui.add(funsObj, "copyConfig").name("Copy setup URL (s)");

  // Brush folder.
  const fBrush = gui.addFolder("Brush");
  fBrush
    .add(options, "typeOfBrush", {
      Circle: "circle",
      "Horizontal line": "hline",
      "Vertical line": "vline",
    })
    .name("Brush type")
    .onChange(setBrushType);
  fBrush
    .add(options, "brushValue")
    .name("Brush value")
    .onChange(updateUniforms);
  brushRadiusController = fBrush
    .add(options, "brushRadius")
    .name("Brush radius")
    .onChange(updateUniforms);
  brushRadiusController.min(0);
  fBrush.open();

  // Domain folder.
  const fDomain = gui.addFolder("Domain");
  fDomain
    .add(options, "domainScale", 0.001, 10)
    .name("Largest side")
    .onChange(resize);
  const dxController = fDomain
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

  // Timestepping folder.
  const fTimestepping = gui.addFolder("Timestepping");
  fTimestepping.add(options, "numTimestepsPerFrame", 1, 200, 1).name("TPF");
  dtController = fTimestepping
    .add(options, "dt")
    .name("Timestep")
    .onChange(function () {
      setTimestepForCFL();
      updateUniforms;
    });
  dtController.__precision = 12;
  dtController.min(0);
  dtController.updateDisplay();
  fTimestepping
    .add(options, "setTimestepForStability")
    .name("Lock CFL cond.")
    .onChange(setTimestepForCFL);

  // Equations folder.
  const fEquations = gui.addFolder("Equations");
  // Number of species.
  fEquations
    .add(options, "numSpecies", {1: 1, 2: 2})
    .name("No. species")
    .onChange(setNumberOfSpecies);
  // Du and Dv.
  const DuController = fEquations
    .add(options, "diffusionU")
    .name("Du")
    .onChange(function () {
      setTimestepForCFL();
      updateUniforms();
    });
  DuController.__precision = 12;
  DuController.updateDisplay();
  DvController = fEquations
    .add(options, "diffusionV")
    .name("Dv")
    .onChange(function () {
      setTimestepForCFL();
      updateUniforms();
    });
  DvController.__precision = 12;
  DvController.updateDisplay();
  // Custom f(u,v) and g(u,v).
  fController = fEquations
    .add(options, "reactionStrU")
    .name("f(u,v)")
    .onFinishChange(setRDEquations);
  gController = fEquations
    .add(options, "reactionStrV")
    .name("g(u,v)")
    .onFinishChange(setRDEquations);
  fEquations.open();

  // Boundary conditions folder.
  const fBCs = gui.addFolder("Boundary conditions");
  fBCs
    .add(options, "boundaryConditionsU", {
      Periodic: "periodic",
      "No flux": "noflux",
      Dirichlet: "dirichlet",
      Robin: "robin",
    })
    .name("u")
    .onChange(setBCsEqs);
  dirichletUController = fBCs
    .add(options, "dirichletU")
    .name("u(boundary) = ")
    .onChange(updateUniforms);
  dirichletUController.__precision = 12;
  dirichletUController.updateDisplay();
  robinUController = fBCs
    .add(options, "robinStrU")
    .name("du/dn = ")
    .onChange(setRDEquations);
  vBCsController = fBCs
    .add(options, "boundaryConditionsV", {
      Periodic: "periodic",
      "No flux": "noflux",
      Dirichlet: "dirichlet",
      Robin: "robin",
    })
    .name("v")
    .onChange(setBCsEqs);
  dirichletVController = fBCs
    .add(options, "dirichletV")
    .name("v(boundary) = ")
    .onFinishChange(updateUniforms);
  robinVController = fBCs
    .add(options, "robinStrV")
    .name("dv/dn = ")
    .onFinishChange(setRDEquations);

  // Rendering folder.
  const fRendering = gui.addFolder("Rendering");
  fRendering
    .add(options, "squareCanvas")
    .name("Square display")
    .onFinishChange(resize);
  fRendering
    .add(options, "renderSize", 1, 2048, 1)
    .name("Render res")
    .onChange(setSizes);

  // Colour folder.
  const fColour = gui.addFolder("Colour");
  whatToPlotController = fColour
    .add(options, "whatToPlot", { u: "u", v: "v" })
    .name("Colour by: ")
    .onChange(function () {
      selectColorRangeControls();
      setDisplayColourAndType();
      setBrushType();
      updateUniforms();
    });
  fColour
    .add(options, "colourmap", {
      Greyscale: "greyscale",
      Viridis: "viridis",
      Turbo: "turbo",
      BlckGrnYllwRdWht: "BlackGreenYellowRedWhite",
    })
    .onChange(setDisplayColourAndType)
    .name("Colourmap");
  minColourValueUController = fColour
    .add(options, "minColourValueU")
    .name("Min value")
    .onChange(updateUniforms);
  maxColourValueUController = fColour
    .add(options, "maxColourValueU")
    .name("Max value")
    .onChange(updateUniforms);
  minColourValueVController = fColour
    .add(options, "minColourValueV")
    .name("Min value")
    .onChange(updateUniforms);
  maxColourValueVController = fColour
    .add(options, "maxColourValueV")
    .name("Max value")
    .onChange(updateUniforms);
  selectColorRangeControls();

  // Miscellaneous folder.
  const fMisc = gui.addFolder("Misc.");
  clearValueUController = fMisc
    .add(options, "clearValueU")
    .name("u on clear")
    .onChange(setClearValues);
  clearValueUController.__precision = 12;
  clearValueUController.updateDisplay();
  clearValueVController = fMisc
    .add(options, "clearValueV")
    .name("v on clear")
    .onChange(setClearValues);
  clearValueVController.__precision = 12;
  clearValueVController.updateDisplay();
  fMisc
    .add(options, "preset", {
      None: "default",
      "Heat equation": "heatEquation",
      Subcriticality: "subcriticalGS",
    })
    .name("Preset")
    .onChange(loadPreset);
}

function animate() {
  requestAnimationFrame(animate);

  // Draw on any input from the user, which can happen even if timestepping is not running.
  if (isDrawing) {
    draw();
  }

  // Only timestep if the simulation is running.
  if (isRunning) {
    // Perform a number of timesteps per frame.
    for (let i = 0; i < options.numTimestepsPerFrame; i++) {
      timestep();
      // Make drawing more responsive by trying to draw every timestep.
      if (isDrawing) {
        draw();
      }
    }
  }

  // Always render, in case the user has drawn.
  render();
}

function setDrawAndDisplayShaders() {
  // Configure the display material.
  setDisplayColourAndType();

  // Configure the drawing material.
  setBrushType();
}

function setBrushType() {
  // Assign the selected drawing shader to the material.
  if (options.typeOfBrush == "circle") {
    drawMaterial.fragmentShader = selectColourspecInShaderStr(discShader());
  } else if (options.typeOfBrush == "hline") {
    drawMaterial.fragmentShader = selectColourspecInShaderStr(hLineShader());
  } else if (options.typeOfBrush == "vline") {
    drawMaterial.fragmentShader = selectColourspecInShaderStr(vLineShader());
  }
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
  str = str.replace(/([^.0-9])(\d+)([^.0-9])/g, "$1$2.$3");
  // Replace powers with pow.
  str = str.replace(/([a-z0-9.]*)\^([a-z0-9.]*)/g, "pow($1, $2)");

  return str;
}

function setRDEquations() {
  let noFluxSpecies = "";
  let dirichletSpecies = "";
  let robinShader = "";

  // Record no-flux species.
  if (options.boundaryConditionsU == "noflux") {
    noFluxSpecies += "u";
  }
  if (options.boundaryConditionsV == "noflux") {
    noFluxSpecies += "v";
  }

  // Record Dirichlet species.
  if (options.boundaryConditionsU == "dirichlet") {
    dirichletSpecies += "u";
  }
  if (options.boundaryConditionsV == "dirichlet") {
    dirichletSpecies += "v";
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

  simMaterial.fragmentShader = [
    RDShaderTop(),
    selectSpeciesInShaderStr(RDShaderNoFlux(), noFluxSpecies),
    robinShader,
    parseReactionStrings(),
    RDShaderUpdate(),
    selectSpeciesInShaderStr(RDShaderDirichlet(), dirichletSpecies),
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

  // Refresh the whole gui.
  refreshGUI(gui);
  selectColorRangeControls();
  setNumberOfSpecies();

  // Trigger a resize, which will refresh all uniforms and set sizes.
  resize();

  // Configure the simulation material.
  setBCsEqs();

  // Set the draw and display shaders.
  setDrawAndDisplayShaders();

  // Set the display color and brush type.
  setDisplayColourAndType();
  setBrushType();
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
}

function refreshGUI(folder) {
  // Traverse through all the subfolders and recurse.
  for (let subfolderName in folder.__folders) {
    refreshGUI(folder.__folders[subfolderName]);
  }
  // Update all the controllers at this level.
  for (let i = 0; i < folder.__controllers.length; i++) {
    folder.__controllers[i].updateDisplay();
  }
}

function setNumberOfSpecies() {
  switch (parseInt(options.numSpecies)) {
    case 1:
      //Ensure that u is being displayed on the screen (and the brush target).
      whatToPlotController.setValue("u");

      // Hide GUI panels related to v.
      DvController.setValue(0);
      hideGUIController(DvController);
      hideGUIController(gController);
      hideGUIController(whatToPlotController);
      hideGUIController(clearValueVController);
      hideGUIController(vBCsController);

      // Set v to be periodic to reduce computational overhead.
      vBCsController.setValue("periodic");
      clearValueVController.setValue(0);

      // Remove references to v in labels.
      fController.name("f(u)");

      break;
    case 2:
      // Show GUI panels related to v.
      showGUIController(DvController);
      showGUIController(gController);
      showGUIController(whatToPlotController);
      showGUIController(clearValueVController);
      showGUIController(vBCsController);

      // Ensure correct references to v in labels are present.
      fController.name("f(u,v)");

      break;
  }
}

function setClearValues() {
  clearMaterial.color = new THREE.Color(
    options.clearValueU,
    options.clearValueV,
    0.0
  );
  clearMaterial.needsUpdate = true;
}

function hideGUIController(cont) {
  cont.__li.style.display = "none";
}

function showGUIController(cont) {
  cont.__li.style.display = "";
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
