let canvas, gl, manualInterpolationNeeded;
let camera,
  simCamera,
  scene,
  simScene,
  renderer,
  aspectRatio,
  controls,
  raycaster,
  clampedCoords;
let simTextureA, simTextureB, postTexture, interpolationTexture, simTextureOpts;
let basicMaterial,
  displayMaterial,
  drawMaterial,
  simMaterial,
  dirichletMaterial,
  clearMaterial,
  copyMaterial,
  postMaterial,
  interpolationMaterial;
let domain, simDomain, clickDomain;
let options, uniforms, funsObj;
let leftGUI,
  rightGUI,
  root,
  pauseButton,
  resetButton,
  typeOfBrushController,
  brushRadiusController,
  drawIn3DController,
  fController,
  gController,
  hController,
  jController,
  algebraicVController,
  algebraicWController,
  algebraicQController,
  crossDiffusionController,
  domainIndicatorFunController,
  DuuController,
  DuvController,
  DuwController,
  DuqController,
  DvuController,
  DvvController,
  DvwController,
  DvqController,
  DwuController,
  DwvController,
  DwwController,
  DwqController,
  DquController,
  DqvController,
  DqwController,
  DqqController,
  dtController,
  whatToDrawController,
  threeDHeightScaleController,
  cameraThetaController,
  cameraPhiController,
  cameraZoomController,
  forceManualInterpolationController,
  smoothingScaleController,
  whatToPlotController,
  minColourValueController,
  maxColourValueController,
  setColourRangeController,
  autoSetColourRangeController,
  clearValueUController,
  clearValueVController,
  clearValueWController,
  clearValueQController,
  uBCsController,
  vBCsController,
  wBCsController,
  qBCsController,
  dirichletUController,
  dirichletVController,
  dirichletWController,
  dirichletQController,
  neumannUController,
  neumannVController,
  neumannWController,
  neumannQController,
  robinUController,
  robinVController,
  robinWController,
  robinQController,
  fIm,
  fMisc,
  imControllerOne,
  imControllerTwo,
  genericOptionsFolder,
  showAllStandardTools,
  showAll;
let isRunning,
  isDrawing,
  hasDrawn,
  lastBadParam,
  anyDirichletBCs,
  nudgedUp = false;
let inTex, outTex;
let nXDisc, nYDisc, domainWidth, domainHeight, maxDim;
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
  "4Species", // 7
  "4SpeciesCrossDiffusion", // 8
  "4SpeciesCrossDiffusionAlgebraicW", // 9
  "4SpeciesCrossDiffusionAlgebraicQ", // 10
  "4SpeciesCrossDiffusionAlgebraicWQ", // 11
];
let equationType, savedHTML;
let takeAScreenshot = false;
let buffer,
  bufferFilled = false;
const numsAsWords = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
];

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
  RDShaderAlgebraicQ,
  RDShaderEnforceDirichletTop,
} from "./simulation_shaders.js";
import { randShader } from "../rand_shader.js";
import { fiveColourDisplay, surfaceVertexShader } from "./display_shaders.js";
import { genericVertexShader } from "../generic_shaders.js";
import { getPreset } from "./presets.js";
import { clearShaderBot, clearShaderTop } from "./clear_shader.js";
import * as THREE from "../three.module.js";
import { OrbitControls } from "../OrbitControls.js";
import { minifyPreset, maxifyPreset } from "./minify_preset.js";
import { LZString } from "../lz-string.min.js";
import { equationTEXFun, substituteGreek } from "./TEX.js";
let equationTEX = equationTEXFun();

// Setup some configurable options.
options = {};

// An object with functions as fields that the GUI controllers can call.
funsObj = {
  reset: function () {
    resetSim();
  },
  toggleRunning: function () {
    isRunning ? pauseSim() : playSim();
  },
  copyConfigAsURL: function () {
    // Encode the current simulation configuration as a URL and put it on the clipboard.
    let objDiff = diffObjects(options, getPreset("default"));
    objDiff.preset = "Custom";
    // Minify the field names in order to generate shorter URLs.
    objDiff = minifyPreset(objDiff);
    let str = [
      location.href.replace(location.search, ""),
      "?options=",
      LZString.compressToEncodedURIComponent(JSON.stringify(objDiff)),
    ].join("");
    navigator.clipboard.writeText(str);
  },
  copyConfigAsJSON: function () {
    // Encode the current simulation configuration as raw JSON and put it on the clipboard.
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
    // Set the range of the colour axis based on the extremes of the computed values.
    let valRange = getMinMaxVal();
    if (Math.abs(valRange[0] - valRange[1]) < 0.005) {
      // If the range is just one value, make the range width equal to 0.005 centered on the given value.
      const meanVal = (valRange[0] + valRange[1]) / 2;
      valRange[0] = meanVal - 0.0025;
      valRange[1] = meanVal + 0.0025;
    }
    options.minColourValue = valRange[0];
    options.maxColourValue = valRange[1];
    uniforms.maxColourValue.value = options.maxColourValue;
    uniforms.minColourValue.value = options.minColourValue;
    maxColourValueController.updateDisplay();
    minColourValueController.updateDisplay();
    updateColourbarLims();
  },
  debug: function () {
    // Write lots of data to the clipboard for debugging.
    let str = "";
    str += JSON.stringify(options);
    str += JSON.stringify(uniforms);
    str += JSON.stringify({
      nXDisc: nXDisc,
      nYDisc: nYDisc,
      domainHeight: domainHeight,
      domainWidth: domainWidth,
      aspectRatio: aspectRatio,
      canvas: canvas.getBoundingClientRect(),
    });
    navigator.clipboard.writeText(str);
  },
};

// Get the canvas to draw on, as specified by the html.
canvas = document.getElementById("simCanvas");

// Warn the user if any errors occur.
console.error = function (error) {
  let errorStr = error.toString();
  console.log(errorStr);
  let regex = /ERROR.*/;
  regex.test(errorStr) ? (errorStr = errorStr.match(regex)) : {};
  $("#error_description").html(errorStr);
  fadein("#error");
  $("#error").one("click", () => fadeout("#error"));
};

// Remove the logo if we're from an internal link.
if (!fromExternalLink()) {
  $("#logo").hide();
}

// Arbitrarily choose to first read from the "B" texture, noting that we will
// flip-flop between two textures, A and B.
var readFromTextureB = true;

// Warn the user about flashing images and ask for cookie permission to store this.
if (!warningCookieExists()) {
  // Display the warning message.
  $("#warning").css("display", "block");
  const permission = await Promise.race([
    waitListener(document.getElementById("warning_ok"), "click", true),
    waitListener(document.getElementById("warning_no"), "click", false),
  ]);
  if (permission) {
    setWarningCookie();
  }
  $("#warning").css("display", "none");
}

// Load default options.
loadOptions("default");

// Initialise simulation and GUI.
init();

// Unless this value is set to false later, we will load a default preset.
let shouldLoadDefault = true;
// Check URL for any preset or specified options.
const params = new URLSearchParams(window.location.search);
if (params.has("preset")) {
  // If a preset is specified, load it.
  loadPreset(params.get("preset"));
  shouldLoadDefault = false;
}
if (params.has("options")) {
  // If options have been provided, apply them on top of loaded options.
  var newParams = JSON.parse(
    LZString.decompressFromEncodedURIComponent(params.get("options"))
  );
  if (newParams.hasOwnProperty("p")) {
    // This has been minified, so maxify before loading.
    newParams = maxifyPreset(newParams);
  }
  loadPreset(newParams);
  shouldLoadDefault = false;
}
if (shouldLoadDefault) {
  // Load a specific preset as the default.
  loadPreset("GrayScott");
}

// If the "Try clicking!" popup is allowed, show it iff we're from an external link
// or have loaded the default simulation.
if (
  (fromExternalLink() || shouldLoadDefault) &&
  !options.suppressTryClickingPopup
) {
  $("#try_clicking").html("<p>" + options.tryClickingText + "</p>");
  fadein("#try_clicking");
  // Fadeout either after the user clicks on the canvas or 5s passes.
  setTimeout(() => fadeout("#try_clicking"), 5000);
  $("#simCanvas").one("pointerdown touchstart", () => fadeout("#try_clicking"));
}

/* GUI settings and equations buttons */
$("#settings").click(function () {
  $("#rightGUI").toggle();
});
$("#equations").click(function () {
  $("#left_ui").toggle();
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
$("#warning_restart").click(function () {
  $("#oops_hit_nan").hide();
  resetSim();
});
$("#screenshot").click(function () {
  takeAScreenshot = true;
  render();
});

// Begin the simulation.
animate();

//---------------

// Initialise all aspects of the site, including both the simulation and the GUI.
function init() {
  // Define uniforms to be sent to the shaders.
  initUniforms();

  // Define a quantity to track if the user is drawing.
  isDrawing = false;

  // Define a raycaster to be used in 3D plotting.
  raycaster = new THREE.Raycaster();

  // Initialise a vector of grid-clamped coordinates.
  clampedCoords = new THREE.Vector2();

  // Create a renderer.
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    preserveDrawingBuffer: true,
    powerPreference: "high-performance",
    antialias: false,
  });
  renderer.autoClear = true;
  gl = renderer.getContext();

  // Check if we should be interpolating manually due to extensions not being supported.
  manualInterpolationNeeded = !(
    gl.getExtension("OES_texture_float_linear") &&
    gl.getExtension("EXT_float_blend")
  );

  // Configure textures with placeholder sizes. We'll need two textures for simulation (A,B), one for
  // post processing, and another for (optional) manual interpolation.
  simTextureOpts = {
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
    minFilter: THREE.NearestFilter,
  };
  // If you're on Android, you must use a NEAREST magnification filter to avoid rounding issues.
  manualInterpolationNeeded |= /android/i.test(navigator.userAgent);
  manualInterpolationNeeded
    ? (simTextureOpts.magFilter = THREE.NearestFilter)
    : (simTextureOpts.magFilter = THREE.LinearFilter);
  simTextureA = new THREE.WebGLRenderTarget(
    options.maxDisc,
    options.maxDisc,
    simTextureOpts
  );
  simTextureB = simTextureA.clone();
  postTexture = simTextureA.clone();
  interpolationTexture = simTextureA.clone();

  // Periodic boundary conditions (for now).
  simTextureA.texture.wrapS = THREE.RepeatWrapping;
  simTextureA.texture.wrapT = THREE.RepeatWrapping;
  simTextureB.texture.wrapS = THREE.RepeatWrapping;
  simTextureB.texture.wrapT = THREE.RepeatWrapping;

  // The post and interpolation materials, used for display, will always edge clamp to avoid artefacts.
  postTexture.texture.wrapS = THREE.ClampToEdgeWrapping;
  postTexture.texture.wrapT = THREE.ClampToEdgeWrapping;
  interpolationTexture.texture.wrapS = THREE.ClampToEdgeWrapping;
  interpolationTexture.texture.wrapT = THREE.ClampToEdgeWrapping;

  // Create cameras for the simulation domain and the final output.
  camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, -1, 10);
  controls = new OrbitControls(camera, canvas);
  controls.listenToKeyEvents(document);
  controls.addEventListener("change", function () {
    if (options.dimension == 3) {
      options.cameraTheta =
        90 - (180 * Math.atan2(camera.position.z, camera.position.y)) / Math.PI;
      options.cameraPhi =
        (180 * Math.atan2(camera.position.x, camera.position.z)) / Math.PI;
      options.cameraZoom = camera.zoom;
      refreshGUI(rightGUI);
      render();
    }
  });

  simCamera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, -1, 10);
  simCamera.position.z = 1;

  // Create two scenes: one for simulation, another for drawing.
  scene = new THREE.Scene();
  simScene = new THREE.Scene();

  scene.add(camera);
  scene.background = new THREE.Color(options.backgroundColour);

  basicMaterial = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
  // This material will display the output of the simulation.
  displayMaterial = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: genericVertexShader(),
    transparent: true,
    side: THREE.DoubleSide,
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
  // A material for enforcing Dirichlet conditions.
  dirichletMaterial = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: genericVertexShader(),
  });

  createDisplayDomains();

  const simPlane = new THREE.PlaneGeometry(1.0, 1.0);
  simDomain = new THREE.Mesh(simPlane, simMaterial);
  simDomain.position.z = 0;
  simScene.add(simDomain);

  // Configure the camera.
  configureCameraAndClicks();

  // Set the size of the domain and related parameters.
  setCanvasShape();
  resize();

  // Create a GUI.
  initGUI();

  // Configure the GUI.
  configureGUI();

  // Set up the problem.
  updateProblem();

  // Set the brush type.
  setBrushType();

  // Add shaders to the textures.
  setDrawAndDisplayShaders();
  setClearShader();

  // Configure interpolation.
  configureManualInterpolation();

  // Set the initial condition.
  resetSim();

  // Listen for pointer events.
  canvas.addEventListener("pointerdown", onDocumentPointerDown);
  canvas.addEventListener("pointerup", onDocumentPointerUp);
  canvas.addEventListener("pointermove", onDocumentPointerMove);

  // Listen for keypresses.
  document.addEventListener("keypress", function onEvent(event) {
    event = event || window.event;
    var target = event.target;
    var targetTagName =
      target.nodeType == 1 ? target.nodeName.toUpperCase() : "";
    if (!/INPUT|SELECT|TEXTAREA/.test(targetTagName)) {
      if (event.key === "r") {
        $("#erase").click();
      }
      if (event.key === " ") {
        funsObj.toggleRunning();
      }
    }
  });

  window.addEventListener("resize", resize, false);
}

function resize() {
  // Set the resolution of the simulation domain and the renderer.
  setSizes();
  // Assign sizes to textures.
  resizeTextures();
  // Update any uniforms.
  updateUniforms();
  // Create new display domains with the correct sizes.
  replaceDisplayDomains();
  // Configure the camera.
  configureCameraAndClicks();
  // Check if the colourbar lies on top of the logo. If so, remove the logo.
  checkColourbarLogoCollision();
  render();
}

function replaceDisplayDomains() {
  domain.geometry.dispose();
  scene.remove(domain);
  clickDomain.geometry.dispose();
  scene.remove(clickDomain);
  createDisplayDomains();
}

function configureCameraAndClicks() {
  // Setup the camera position, orientation, and the invisible surface used for click detection.
  computeCanvasSizesAndAspect();
  switch (options.plotType) {
    case "line":
      options.cameraTheta = 0.5;
      options.cameraPhi = 0;
      controls.enabled = false;
      camera.zoom = 0.8;
      setCameraPos();
      displayMaterial.vertexShader = surfaceVertexShader();
      break;
    case "plane":
      controls.enabled = false;
      controls.reset();
      displayMaterial.vertexShader = genericVertexShader();
      break;
    case "surface":
      controls.enabled = true;
      camera.zoom = options.cameraZoom;
      setCameraPos();
      displayMaterial.vertexShader = surfaceVertexShader();
      break;
  }
  displayMaterial.needsUpdate = true;
  camera.left = -domainWidth / (2 * maxDim);
  camera.right = domainWidth / (2 * maxDim);
  camera.top = domainHeight / (2 * maxDim);
  camera.bottom = -domainHeight / (2 * maxDim);
  camera.updateProjectionMatrix();
  setDomainOrientation();
}

function updateUniforms() {
  uniforms.L.value = options.domainScale;
  uniforms.L_y.value = domainHeight;
  uniforms.L_x.value = domainWidth;
  uniforms.dt.value = options.dt;
  uniforms.dx.value = domainWidth / nXDisc;
  uniforms.dy.value = domainHeight / nYDisc;
  uniforms.heightScale.value = options.threeDHeightScale;
  uniforms.maxColourValue.value = options.maxColourValue;
  uniforms.minColourValue.value = options.minColourValue;
  if (!options.fixRandSeed) {
    updateRandomSeed();
  }
}

function computeCanvasSizesAndAspect() {
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
  uniforms.L_x.value = domainWidth;
  uniforms.L_y.value = domainHeight;
  maxDim = Math.max(domainWidth, domainHeight);
}

function setSizes() {
  computeCanvasSizesAndAspect();
  // Using the user-specified spatial step size, compute as close a discretisation as possible that
  // doesn't reduce the step size below the user's choice.
  if (options.spatialStep == 0) {
    // Prevent a crash if a 0 spatial step is specified.
    alert(
      "Oops! A spatial step of 0 would almost certainly crash your device. We've reset it to 1% of the maximum domain length to prevent this."
    );
    options.spatialStep = options.domainScale / 100;
  }
  nXDisc = Math.floor(domainWidth / options.spatialStep);
  nYDisc = Math.floor(domainHeight / options.spatialStep);
  // If the user has specified that this is a 1D problem, set nYDisc = 1.
  if (options.dimension == 1) {
    nYDisc = 1;
  }
  // Update these values in the uniforms.
  uniforms.nXDisc.value = nXDisc;
  uniforms.nYDisc.value = nYDisc;
  // Set the size of the renderer, which will interpolate from the textures.
  renderer.setSize(options.renderSize, options.renderSize, false);
  buffer = new Float32Array(nXDisc * nYDisc * 4);
  bufferFilled = false;
}

function createDisplayDomains() {
  computeCanvasSizesAndAspect();
  const plane = new THREE.PlaneGeometry(
    domainWidth / maxDim,
    domainHeight / maxDim,
    options.renderSize,
    options.renderSize
  );
  domain = new THREE.Mesh(plane, displayMaterial);
  domain.position.z = 0;
  scene.add(domain);

  // Create an invisible, low-poly plane used for raycasting.
  const simplePlane = new THREE.PlaneGeometry(
    domainWidth / maxDim,
    domainHeight / maxDim,
    1,
    1
  );
  clickDomain = new THREE.Mesh(simplePlane, basicMaterial);
  clickDomain.position.z = 0;
  clickDomain.visible = false;
  scene.add(clickDomain);
  setDomainOrientation();
}

function setDomainOrientation() {
  // Configure the orientation of the simulation domain and the click domain, which we modify for 3D to make
  // convenient use of Euler angles for the camera controls.
  switch (options.plotType) {
    case "line":
      domain.rotation.x = -Math.PI / 2;
      clickDomain.rotation.x = -Math.PI / 2;
      break;
    case "plane":
      domain.rotation.x = 0;
      clickDomain.rotation.x = 0;
      break;
    case "surface":
      domain.rotation.x = -Math.PI / 2;
      clickDomain.rotation.x = -Math.PI / 2;
      break;
  }
}

function setCanvasShape() {
  options.squareCanvas
    ? $("#simCanvas").addClass("squareCanvas")
    : $("#simCanvas").removeClass("squareCanvas");
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
  // The interpolationTexture will be larger by a scale factor options.smoothingScale + 1.
  interpolationTexture.setSize(
    (options.smoothingScale + 1) * nXDisc,
    (options.smoothingScale + 1) * nYDisc
  );
}

function initUniforms() {
  // Initialise the uniforms to be passed to the shaders.
  uniforms = {
    brushCoords: {
      type: "v2",
      value: new THREE.Vector2(0.5, 0.5),
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
    L: {
      type: "f",
    },
    L_x: {
      type: "f",
    },
    L_y: {
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
    heightScale: {
      type: "f",
    },
    imageSourceOne: {
      type: "t",
    },
    imageSourceTwo: {
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
    t: {
      type: "f",
      value: 0.0,
    },
  };
}

function initGUI(startOpen) {
  // Initialise the left GUI.
  leftGUI = new dat.GUI({ closeOnTop: true, autoPlace: false });
  leftGUI.domElement.id = "leftGUI";
  document.getElementById("leftGUIContainer").appendChild(leftGUI.domElement);

  // Initialise the right GUI.
  rightGUI = new dat.GUI({ closeOnTop: true });
  rightGUI.domElement.id = "rightGUI";

  leftGUI.open();
  rightGUI.open();
  if (startOpen != undefined && startOpen) {
    $("#rightGUI").show();
    $("#left_ui").show();
  } else {
    $("#left_ui").hide();
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
    typeOfBrushController = root
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
      .onChange(setBrushType);
  }
  if (inGUI("whatToDraw")) {
    whatToDrawController = root
      .add(options, "whatToDraw", { u: "u", v: "v", w: "w", q: "q" })
      .name("Species")
      .onChange(setBrushType);
  }
  if (inGUI("drawIn3D")) {
    drawIn3DController = root.add(options, "drawIn3D").name("3D enabled");
  }

  // Domain folder.
  if (inGUI("domainFolder")) {
    root = rightGUI.addFolder("Domain");
  } else {
    root = genericOptionsFolder;
  }
  if (inGUI("dimension")) {
    root
      .add(options, "dimension", { 1: 1, 2: 2 })
      .name("Dimension")
      .onChange(function () {
        configureDimension();
        render();
      });
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
      });
    dxController.__precision = 12;
    dxController.min(0);
    dxController.updateDisplay();
  }
  if (inGUI("squareCanvas")) {
    root
      .add(options, "squareCanvas")
      .name("Square display")
      .onFinishChange(function () {
        setCanvasShape();
        resize();
        configureCameraAndClicks();
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
        setPostFunFragShader();
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
    root.add(options, "numTimestepsPerFrame", 1, 400, 1).name("Steps/frame");
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
  if (inGUI("timeDisplay")) {
    root
      .add(options, "timeDisplay")
      .name("Show time")
      .onChange(configureTimeDisplay);
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
      .add(options, "numSpecies", { 1: 1, 2: 2, 3: 3, 4: 4 })
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
      .name("Algebraic v")
      .onChange(updateProblem);
  }
  if (inGUI("algebraicW")) {
    algebraicWController = root
      .add(options, "algebraicW")
      .name("Algebraic w")
      .onChange(updateProblem);
  }
  if (inGUI("algebraicQ")) {
    algebraicQController = root
      .add(options, "algebraicQ")
      .name("Algebraic q")
      .onChange(updateProblem);
  }

  // Let's put these in the left GUI.
  // Definitions folder.
  if (inGUI("definitionsFolder")) {
    root = leftGUI.addFolder("Definitions");
  } else {
    root = genericOptionsFolder;
  }
  if (inGUI("typesetCustomEqs")) {
    root
      .add(options, "typesetCustomEqs")
      .name("Typeset")
      .onChange(setEquationDisplayType);
  }
  if (inGUI("diffusionStrUU")) {
    DuuController = root
      .add(options, "diffusionStrUU")
      .name("$D_{uu}$")
      .title("function of u, v, w, q, t")
      .onFinishChange(function () {
        setRDEquations();
        setEquationDisplayType();
      });
  }
  if (inGUI("diffusionStrUV")) {
    DuvController = root
      .add(options, "diffusionStrUV")
      .name("$D_{uv}$")
      .title("function of u, v, w, q, t")
      .onFinishChange(function () {
        setRDEquations();
        setEquationDisplayType();
      });
  }
  if (inGUI("diffusionStrUW")) {
    DuwController = root
      .add(options, "diffusionStrUW")
      .name("$D_{uw}$")
      .title("function of u, v, w, q, t")
      .onFinishChange(function () {
        setRDEquations();
        setEquationDisplayType();
      });
  }
  if (inGUI("diffusionStrUQ")) {
    DuqController = root
      .add(options, "diffusionStrUQ")
      .name("$D_{uq}$")
      .title("function of u, v, w, q, t")
      .onFinishChange(function () {
        setRDEquations();
        setEquationDisplayType();
      });
  }
  if (inGUI("diffusionStrVU")) {
    DvuController = root
      .add(options, "diffusionStrVU")
      .name("$D_{vu}$")
      .title("function of u, v, w, q, t")
      .onFinishChange(function () {
        setRDEquations();
        setEquationDisplayType();
      });
  }
  if (inGUI("diffusionStrVV")) {
    DvvController = root
      .add(options, "diffusionStrVV")
      .name("$D_{vv}$")
      .title("function of u, v, w, q, t")
      .onFinishChange(function () {
        setRDEquations();
        setEquationDisplayType();
      });
  }
  if (inGUI("diffusionStrVW")) {
    DvwController = root
      .add(options, "diffusionStrVW")
      .name("$D_{vw}$")
      .title("function of u, v, w, q, t")
      .onFinishChange(function () {
        setRDEquations();
        setEquationDisplayType();
      });
  }
  if (inGUI("diffusionStrVQ")) {
    DvqController = root
      .add(options, "diffusionStrVQ")
      .name("$D_{vq}$")
      .title("function of u, v, w, q, t")
      .onFinishChange(function () {
        setRDEquations();
        setEquationDisplayType();
      });
  }
  if (inGUI("diffusionStrWU")) {
    DwuController = root
      .add(options, "diffusionStrWU")
      .name("$D_{wu}$")
      .onFinishChange(function () {
        setRDEquations();
        setEquationDisplayType();
      });
  }
  if (inGUI("diffusionStrWV")) {
    DwvController = root
      .add(options, "diffusionStrWV")
      .name("$D_{wv}$")
      .title("function of u, v, w, q, t")
      .onFinishChange(function () {
        setRDEquations();
        setEquationDisplayType();
      });
  }
  if (inGUI("diffusionStrWW")) {
    DwwController = root
      .add(options, "diffusionStrWW")
      .name("$D_{ww}$")
      .title("function of u, v, w, q, t")
      .onFinishChange(function () {
        setRDEquations();
        setEquationDisplayType();
      });
  }
  if (inGUI("diffusionStrWQ")) {
    DwqController = root
      .add(options, "diffusionStrWQ")
      .name("$D_{wq}$")
      .title("function of u, v, w, q, t")
      .onFinishChange(function () {
        setRDEquations();
        setEquationDisplayType();
      });
  }
  if (inGUI("diffusionStrQU")) {
    DquController = root
      .add(options, "diffusionStrQU")
      .name("$D_{qu}$")
      .onFinishChange(function () {
        setRDEquations();
        setEquationDisplayType();
      });
  }
  if (inGUI("diffusionStrQV")) {
    DqvController = root
      .add(options, "diffusionStrQV")
      .name("$D_{qv}$")
      .title("function of u, v, w, q, t")
      .onFinishChange(function () {
        setRDEquations();
        setEquationDisplayType();
      });
  }
  if (inGUI("diffusionStrQW")) {
    DqwController = root
      .add(options, "diffusionStrQW")
      .name("$D_{qw}$")
      .title("function of u, v, w, q, t")
      .onFinishChange(function () {
        setRDEquations();
        setEquationDisplayType();
      });
  }
  if (inGUI("diffusionStrQQ")) {
    DqqController = root
      .add(options, "diffusionStrQQ")
      .name("$D_{qq}$")
      .title("function of u, v, w, q, t")
      .onFinishChange(function () {
        setRDEquations();
        setEquationDisplayType();
      });
  }
  if (inGUI("reactionStrU")) {
    // Custom f(u,v) and g(u,v).
    fController = root
      .add(options, "reactionStrU")
      .name("$f$")
      .title("function of u, v, w, q, t")
      .onFinishChange(function () {
        setRDEquations();
        setEquationDisplayType();
      });
  }
  if (inGUI("reactionStrV")) {
    gController = root
      .add(options, "reactionStrV")
      .name("$g$")
      .title("function of u, v, w, q, t")
      .onFinishChange(function () {
        setRDEquations();
        setEquationDisplayType();
      });
  }
  if (inGUI("reactionStrW")) {
    hController = root
      .add(options, "reactionStrW")
      .name("$h$")
      .title("function of u, v, w, q, t")
      .onFinishChange(function () {
        setRDEquations();
        setEquationDisplayType();
      });
  }
  if (inGUI("reactionStrQ")) {
    jController = root
      .add(options, "reactionStrQ")
      .name("$j$")
      .title("function of u, v, w, q, t")
      .onFinishChange(function () {
        setRDEquations();
        setEquationDisplayType();
      });
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
  if (inGUI("boundaryConditionsQ")) {
    qBCsController = root
      .add(options, "boundaryConditionsQ", {
        Periodic: "periodic",
        Dirichlet: "dirichlet",
        Neumann: "neumann",
        Robin: "robin",
      })
      .name("$q$")
      .onChange(function () {
        setRDEquations();
        setBCsGUI();
      });
  }
  if (inGUI("dirichletQ")) {
    dirichletQController = root
      .add(options, "dirichletStrQ")
      .name("$\\left.q\\right\\rvert_{\\boundary}$")
      .onFinishChange(setRDEquations);
  }
  if (inGUI("neumannStrQ")) {
    neumannQController = root
      .add(options, "neumannStrQ")
      .name("$\\left.\\pd{q}{n}\\right\\rvert_{\\boundary}$")
      .onFinishChange(setRDEquations);
  }
  if (inGUI("robinStrQ")) {
    robinQController = root
      .add(options, "robinStrQ")
      .name("$\\left.\\pd{q}{n}\\right\\rvert_{\\boundary}$")
      .onFinishChange(setRDEquations);
  }

  // Initial conditions folder.
  if (inGUI("initFolder")) {
    root = leftGUI.addFolder("Initial conditions");
  } else {
    root = genericOptionsFolder;
  }
  if (inGUI("clearValueU")) {
    clearValueUController = root
      .add(options, "clearValueU")
      .name("$\\left.u\\right\\rvert_{t=0}$")
      .onFinishChange(setClearShader);
  }
  if (inGUI("clearValueV")) {
    clearValueVController = root
      .add(options, "clearValueV")
      .name("$\\left.v\\right\\rvert_{t=0}$")
      .onFinishChange(setClearShader);
  }
  if (inGUI("clearValueW")) {
    clearValueWController = root
      .add(options, "clearValueW")
      .name("$\\left.w\\right\\rvert_{t=0}$")
      .onFinishChange(setClearShader);
  }
  if (inGUI("clearValueQ")) {
    clearValueQController = root
      .add(options, "clearValueQ")
      .name("$\\left.q\\right\\rvert_{t=0}$")
      .onFinishChange(setClearShader);
  }

  // Rendering folder.
  if (inGUI("renderingFolder")) {
    root = rightGUI.addFolder("Rendering");
  } else {
    root = genericOptionsFolder;
  }
  if (inGUI("whatToPlot")) {
    whatToPlotController = root
      .add(options, "whatToPlot")
      .name("Expression: ")
      .onFinishChange(function () {
        updateWhatToPlot();
        render();
      });
  }
  if (inGUI("renderSize")) {
    root
      .add(options, "renderSize", 1, 2048, 1)
      .name("Resolution")
      .onChange(function () {
        domain.geometry.dispose();
        scene.remove(domain);
        createDisplayDomains();
        setSizes();
      });
  }
  if (inGUI("plotType")) {
    root
      .add(options, "plotType", {
        Line: "line",
        Plane: "plane",
        Surface: "surface",
      })
      .name("Plot type")
      .onChange(function () {
        configurePlotType();
        document.activeElement.blur();
        render();
      });
  }
  if (inGUI("threeDHeightScale")) {
    threeDHeightScaleController = root
      .add(options, "threeDHeightScale")
      .name("Max height")
      .onChange(updateUniforms);
  }
  if (inGUI("cameraTheta")) {
    cameraThetaController = root
      .add(options, "cameraTheta")
      .name("View $\\theta$")
      .onChange(configureCameraAndClicks);
  }
  if (inGUI("cameraPhi")) {
    cameraPhiController = root
      .add(options, "cameraPhi")
      .name("View $\\phi$")
      .onChange(configureCameraAndClicks);
  }
  if (inGUI("cameraZoom")) {
    cameraZoomController = root
      .add(options, "cameraZoom")
      .name("Zoom")
      .onChange(configureCameraAndClicks);
  }
  if (inGUI("forceManualInterpolation")) {
    forceManualInterpolationController = root
      .add(options, "forceManualInterpolation")
      .name("Man. smooth")
      .onChange(configureManualInterpolation);
  }
  if (inGUI("Smoothing scale")) {
    smoothingScaleController = root
      .add(options, "smoothingScale", 0, 16, 1)
      .name("Smoothing")
      .onChange(function () {
        resizeTextures();
        render();
      });
  }

  // Colour folder.
  if (inGUI("colourFolder")) {
    root = rightGUI.addFolder("Colour");
  } else {
    root = genericOptionsFolder;
  }
  if (inGUI("colourmap")) {
    root
      .add(options, "colourmap", {
        Greyscale: "greyscale",
        Viridis: "viridis",
        Turbo: "turbo",
        BlckGrnYllwRdWht: "BlackGreenYellowRedWhite",
      })
      .onChange(function () {
        setDisplayColourAndType();
        configureColourbar();
      })
      .name("Colour map");
  }
  if (inGUI("minColourValue")) {
    minColourValueController = root
      .add(options, "minColourValue")
      .name("Min value")
      .onChange(function () {
        updateUniforms();
        updateColourbarLims();
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
        updateColourbarLims();
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
  if (inGUI("colourbar")) {
    root
      .add(options, "colourbar")
      .name("Colour bar")
      .onChange(configureColourbar);
  }
  if (inGUI("backgroundColour")) {
    root
      .addColor(options, "backgroundColour")
      .name("Background")
      .onChange(function () {
        scene.background = new THREE.Color(options.backgroundColour);
        render();
      });
  }

  // Images folder.
  if (inGUI("imagesFolder")) {
    fIm = rightGUI.addFolder("Images");
    root = fIm;
  } else {
    root = genericOptionsFolder;
  }
  // Always make images controller, but hide them if they're not wanted.
  createImageControllers();

  // Miscellaneous folder.
  if (inGUI("miscFolder")) {
    fMisc = rightGUI.addFolder("Misc.");
    root = fMisc;
  } else {
    root = genericOptionsFolder;
  }
  if (inGUI("integrate")) {
    root
      .add(options, "integrate")
      .name("Integrate")
      .onChange(function () {
        configureIntegralDisplay();
        render();
      });
  }
  if (inGUI("fixRandSeed")) {
    root.add(options, "fixRandSeed").name("Fix random seed");
  }
  if (inGUI("copyConfigAsJSON")) {
    // Copy configuration as raw JSON.
    root.add(funsObj, "copyConfigAsJSON").name("Copy code");
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
  let debugFolder = root.addFolder("Debug");
  root = debugFolder;
  if (inGUI("debug")) {
    // Debug.
    root.add(funsObj, "debug").name("Copy debug info");
  }

  if (inGUI("copyConfigAsURL")) {
    // Copy configuration as URL.
    rightGUI.add(funsObj, "copyConfigAsURL").name("Copy URL");
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
  if (isDrawing & (options.drawIn3D | (options.plotType != "surface"))) {
    draw();
  }

  // Only timestep if the simulation is running.
  if (isRunning) {
    // Ensure that any Dirichlet BCs are satisfied before timestepping (required due to brushes/init condition).
    anyDirichletBCs ? enforceDirichlet() : {};
    // Perform a number of timesteps per frame.
    for (let i = 0; i < options.numTimestepsPerFrame; i++) {
      timestep();
      uniforms.t.value += options.dt;
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

  // Configure the colourbar.
  configureColourbar();

  // Configure the postprocessing material.
  updateWhatToPlot();

  // Configure the drawing material.
  setBrushType();
}

function setBrushType() {
  // Construct a drawing shader based on the selected type and the value string.
  // Insert any user-defined kinetic parameters, given as a string that needs parsing.
  // Extract variable definitions, separated by semicolons or commas, ignoring whitespace.
  let regex = /[;,\s]*(.+?)(?:$|[;,])+/g;
  let kineticStr = parseShaderString(
    sanitisedKineticParams().replace(regex, "float $1;\n")
  );
  let shaderStr = drawShaderTop() + kineticStr;
  let radiusStr =
    "float brushRadius = " +
    parseShaderString(options.brushRadius.toString()) +
    ";\n";

  // If the radius string contains any references to u,v,w,q, replace them with references to the species at the
  // brush centre, not the current pixel.
  radiusStr = radiusStr.replace(/\buvwq\./g, "uvwqBrush.");
  // If the radius string contains any references to S or T, replace them with references to the value at the
  // brush centre, not the current pixel.
  radiusStr = radiusStr.replace(/\b([ST])([RGBA]?)\b/g, "$1Brush$2");

  shaderStr += radiusStr;
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

function enforceDirichlet() {
  // Enforce any Dirichlet boundary conditions.
  if (readFromTextureB) {
    inTex = simTextureB;
    outTex = simTextureA;
  } else {
    inTex = simTextureA;
    outTex = simTextureB;
  }
  readFromTextureB = !readFromTextureB;

  simDomain.material = dirichletMaterial;
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

  if (options.drawIn3D & (options.plotType == "surface")) {
    let val =
      (getMeanVal() - options.minColourValue) /
        (options.maxColourValue - options.minColourValue) -
      0.5;
    clickDomain.position.y =
      options.threeDHeightScale * Math.min(Math.max(val, -0.5), 0.5);
    clickDomain.updateWorldMatrix();
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
  bufferFilled = false;

  // If selected, update the time display.
  if (options.timeDisplay) {
    updateTimeDisplay();
  }

  // If selected, update the integral display.
  if (options.integrate) {
    updateIntegralDisplay();
  }

  // If we want to smooth manually, apply a bilinear filter.
  if (isManuallyInterpolating()) {
    simDomain.material = interpolationMaterial;
    renderer.setRenderTarget(interpolationTexture);
    renderer.render(simScene, simCamera);
    uniforms.textureSource.value = interpolationTexture.texture;
  }

  // Render the output to the screen.
  renderer.setRenderTarget(null);
  renderer.render(scene, camera);
  if (takeAScreenshot) {
    takeAScreenshot = false;
    var link = document.createElement("a");
    link.download = "VisualPDEScreenshot";
    renderer.setSize(
      options.renderSize,
      Math.round(options.renderSize * aspectRatio),
      false
    );
    renderer.render(scene, camera);
    link.href = renderer.domElement.toDataURL();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSizes();
  }
}

function onDocumentPointerDown(event) {
  isDrawing = setBrushCoords(event, canvas);
  if (isDrawing & options.drawIn3D & (options.plotType == "surface")) {
    controls.enabled = false;
  }
}

function onDocumentPointerUp(event) {
  isDrawing = false;
  if (options.plotType == "surface") {
    controls.enabled = true;
  }
}

function onDocumentPointerMove(event) {
  setBrushCoords(event, canvas);
}

function setBrushCoords(event, container) {
  var cRect = container.getBoundingClientRect();
  let x = (event.clientX - cRect.x) / cRect.width;
  let y = 1 - (event.clientY - cRect.y) / cRect.height;
  if (options.drawIn3D & (options.plotType == "surface")) {
    // If we're in 3D, we have to project onto the simulation domain.
    // We need x,y between -1 and 1.
    clampedCoords.x = 2 * x - 1;
    clampedCoords.y = 2 * y - 1;
    raycaster.setFromCamera(clampedCoords, camera);
    var intersects = raycaster.intersectObject(clickDomain, false);
    if (intersects.length > 0) {
      x = intersects[0].uv.x;
      y = intersects[0].uv.y;
    } else {
      x = -1;
      y = -1;
    }
  } else if (options.plotType == "line") {
    x = (x - 0.5) / camera.zoom + 0.5;
    y = 0.5;
  }
  // Round to near-pixel coordinates.
  x = Math.round(x * nXDisc) / nXDisc;
  y = Math.round(y * nYDisc) / nYDisc;
  uniforms.brushCoords.value = new THREE.Vector2(x, y);
  return (0 <= x) & (x <= 1) & (0 <= y) & (y <= 1);
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
  uniforms.t.value = 0.0;
  updateTimeDisplay();
  // Start a timer that checks for NaNs every second.
  checkForNaN();
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
  // Prepare the q string.
  out += "float j = " + parseShaderString(options.reactionStrQ) + ";\n";

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

  // Prepare Dqq, evaluating it at five points.
  out += nonConstantDiffusionEvaluateInSpaceStr(
    parseShaderString(options.diffusionStrQQ) + ";\n",
    "qq"
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

  // Prepare Duq, evaluating it at five points.
  out += nonConstantDiffusionEvaluateInSpaceStr(
    parseShaderString(options.diffusionStrUQ) + ";\n",
    "uq"
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

  // Prepare Dvq, evaluating it at five points.
  out += nonConstantDiffusionEvaluateInSpaceStr(
    parseShaderString(options.diffusionStrVQ) + ";\n",
    "vq"
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

  // Prepare Dwq, evaluating it at five points.
  out += nonConstantDiffusionEvaluateInSpaceStr(
    parseShaderString(options.diffusionStrWQ) + ";\n",
    "wq"
  );

  // Prepare Dqu, evaluating it at five points.
  out += nonConstantDiffusionEvaluateInSpaceStr(
    parseShaderString(options.diffusionStrQU) + ";\n",
    "qu"
  );

  // Prepare Dqv, evaluating it at five points.
  out += nonConstantDiffusionEvaluateInSpaceStr(
    parseShaderString(options.diffusionStrQV) + ";\n",
    "qv"
  );

  // Prepare Dqw, evaluating it at five points.
  out += nonConstantDiffusionEvaluateInSpaceStr(
    parseShaderString(options.diffusionStrQW) + ";\n",
    "qw"
  );

  return out;
}

function nonConstantDiffusionEvaluateInSpaceStr(str, label) {
  let out = "";
  let xRegex = /\bx\b/g;
  let yRegex = /\by\b/g;
  let uvwqRegex = /\buvwq\.\b/g;

  out += "float D" + label + " = " + str;
  out +=
    "float D" +
    label +
    "L = " +
    str.replaceAll(xRegex, "(x-dx)").replaceAll(uvwqRegex, "uvwqL.");
  out +=
    "float D" +
    label +
    "R = " +
    str.replaceAll(xRegex, "(x+dx)").replaceAll(uvwqRegex, "uvwqR.");
  out +=
    "float D" +
    label +
    "T = " +
    str.replaceAll(yRegex, "(y+dy)").replaceAll(uvwqRegex, "uvwqT.");
  out +=
    "float D" +
    label +
    "B = " +
    str.replaceAll(yRegex, "(y-dy)").replaceAll(uvwqRegex, "uvwqB.");
  return out;
}

function parseShaderString(str) {
  // Parse a string into valid GLSL by replacing u,v,^, and integers.
  // Pad the string.
  str = " " + str + " ";

  // Replace powers with safepow, including nested powers.
  str = replaceBinOperator(str, "^", function (m, p1, p2) {
    switch (p2) {
      case "0":
        return "1";
      case "1":
        return "(" + p1 + ")";
      case "2":
        return "((" + p1 + ")*(" + p1 + "))";
      case "3":
        return "((" + p1 + ")*(" + p1 + ")*(" + p1 + "))";
      case "4":
        return "((" + p1 + ")*(" + p1 + ")*(" + p1 + ")*(" + p1 + "))";
      case "5":
        return (
          "((" + p1 + ")*(" + p1 + ")*(" + p1 + ")*(" + p1 + ")*(" + p1 + "))"
        );
      default:
        return "safepow(" + p1 + "," + p2 + ")";
    }
  });

  // Replace u, v, w, and q with uvwq.r, uvwq.g, uvwq.b, and uwvq.a via placeholders.
  str = str.replace(/\bu\b/g, "uvwq." + speciesToChannelChar("u"));
  str = str.replace(/\bv\b/g, "uvwq." + speciesToChannelChar("v"));
  str = str.replace(/\bw\b/g, "uvwq." + speciesToChannelChar("w"));
  str = str.replace(/\bq\b/g, "uvwq." + speciesToChannelChar("q"));

  // If there are any numbers preceded by letters (eg r0), replace the number with the corresponding string.
  let regex;
  for (let num = 0; num < 10; num++) {
    regex = new RegExp("([a-zA-Z]+[0-9]*)(" + num.toString() + ")", "g");
    while (str != (str = str.replace(regex, "$1" + numsAsWords[num])));
  }

  // Replace integers with floats.
  while (str != (str = str.replace(/([^.0-9])(\d+)([^.0-9])/g, "$1$2.$3")));

  return str;
}

function replaceBinOperator(str, op, form) {
  // Take a string and replace all instances of op with form,
  // matching balanced brackets.
  const needsEscaping = "^*".includes(op);
  if (str.indexOf(op) > -1) {
    let tab = [];
    let joker = "___joker___";
    while (str.indexOf("(") > -1) {
      str = str.replace(/(\([^\(\)]*\))/g, function (m, t) {
        tab.push(t);
        return joker + (tab.length - 1);
      });
    }

    tab.push(str);
    str = joker + (tab.length - 1);
    let regex;
    if (needsEscaping) {
      regex = new RegExp("([\\w.]*)\\" + op + "([\\w.]*)", "g");
    } else {
      regex = new RegExp("([\\w.]*)" + op + "([\\w.]*)", "g");
    }
    while (str.indexOf(joker) > -1) {
      str = str.replace(new RegExp(joker + "(\\w+)", "g"), function (m, d) {
        return tab[d].replace(regex, form);
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
    if (options.dimension > 1) {
      neumannShader += selectSpeciesInShaderStr(RDShaderRobinY(), "u");
    }
  }
  if (options.boundaryConditionsV == "neumann") {
    neumannShader += parseRobinRHS(options.neumannStrV, "v");
    neumannShader += selectSpeciesInShaderStr(RDShaderRobinX(), "v");
    if (options.dimension > 1) {
      neumannShader += selectSpeciesInShaderStr(RDShaderRobinY(), "v");
    }
  }
  if (options.boundaryConditionsW == "neumann") {
    neumannShader += parseRobinRHS(options.neumannStrW, "w");
    neumannShader += selectSpeciesInShaderStr(RDShaderRobinX(), "w");
    if (options.dimension > 1) {
      neumannShader += selectSpeciesInShaderStr(RDShaderRobinY(), "w");
    }
  }
  if (options.boundaryConditionsQ == "neumann") {
    neumannShader += parseRobinRHS(options.neumannStrQ, "q");
    neumannShader += selectSpeciesInShaderStr(RDShaderRobinX(), "q");
    if (options.dimension > 1) {
      neumannShader += selectSpeciesInShaderStr(RDShaderRobinY(), "q");
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
    dirichletShader +=
      selectSpeciesInShaderStr(str, "q") +
      parseShaderString(options.dirichletStrQ) +
      ";\n}\n";
  } else {
    if (options.boundaryConditionsU == "dirichlet") {
      dirichletShader +=
        selectSpeciesInShaderStr(RDShaderDirichletX(), "u") +
        parseShaderString(options.dirichletStrU) +
        ";\n}\n";
      if (options.dimension > 1) {
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
      if (options.dimension > 1) {
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
      if (options.dimension > 1) {
        dirichletShader +=
          selectSpeciesInShaderStr(RDShaderDirichletY(), "w") +
          parseShaderString(options.dirichletStrW) +
          ";\n}\n";
      }
    }
    if (options.boundaryConditionsQ == "dirichlet") {
      dirichletShader +=
        selectSpeciesInShaderStr(RDShaderDirichletX(), "q") +
        parseShaderString(options.dirichletStrQ) +
        ";\n}\n";
      if (options.dimension > 1) {
        dirichletShader +=
          selectSpeciesInShaderStr(RDShaderDirichletY(), "q") +
          parseShaderString(options.dirichletStrQ) +
          ";\n}\n";
      }
    }
  }

  // Create a Robin shader block for each species separately.
  if (options.boundaryConditionsU == "robin") {
    robinShader += parseRobinRHS(options.robinStrU, "u");
    robinShader += selectSpeciesInShaderStr(RDShaderRobinX(), "u");
    if (options.dimension > 1) {
      robinShader += selectSpeciesInShaderStr(RDShaderRobinY(), "u");
    }
  }
  if (options.boundaryConditionsV == "robin") {
    robinShader += parseRobinRHS(options.robinStrV, "v");
    robinShader += selectSpeciesInShaderStr(RDShaderRobinX(), "v");
    if (options.dimension > 1) {
      robinShader += selectSpeciesInShaderStr(RDShaderRobinY(), "v");
    }
  }
  if (options.boundaryConditionsW == "robin") {
    robinShader += parseRobinRHS(options.robinStrW, "w");
    robinShader += selectSpeciesInShaderStr(RDShaderRobinX(), "w");
    if (options.dimension > 1) {
      robinShader += selectSpeciesInShaderStr(RDShaderRobinY(), "w");
    }
  }
  if (options.boundaryConditionsQ == "robin") {
    robinShader += parseRobinRHS(options.robinStrQ, "q");
    robinShader += selectSpeciesInShaderStr(RDShaderRobinX(), "q");
    if (options.dimension > 1) {
      robinShader += selectSpeciesInShaderStr(RDShaderRobinY(), "q");
    }
  }

  // Insert any user-defined kinetic parameters, given as a string that needs parsing.
  // Extract variable definitions, separated by semicolons or commas, ignoring whitespace.
  // We'll inject this shader string before any boundary conditions etc, so that these params
  // are also available in BCs.
  let regex = /[;,\s]*(.+?)(?:$|[;,])+/g;
  let kineticStr = parseShaderString(
    sanitisedKineticParams().replace(regex, "float $1;\n")
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

  // If q should be algebraic, append this to the normal update shader.
  if (options.algebraicQ && options.crossDiffusion) {
    updateShader += selectSpeciesInShaderStr(RDShaderAlgebraicQ(), "q");
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

  // We will use a shader to enforce Dirichlet BCs before each timestep, but only if some Dirichlet
  // BCs have been specified.
  checkForAnyDirichletBCs();
  if (anyDirichletBCs) {
    dirichletShader = RDShaderEnforceDirichletTop() + kineticStr;
    if (options.domainViaIndicatorFun) {
      let str = RDShaderDirichletIndicatorFun()
        .replace(/indicatorFun/g, parseShaderString(options.domainIndicatorFun))
        .replace(/updated/g, "gl_FragColor");
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
      dirichletShader +=
        selectSpeciesInShaderStr(str, "q") +
        parseShaderString(options.dirichletStrQ) +
        ";\n}\n";
    } else {
      if (options.boundaryConditionsU == "dirichlet") {
        dirichletShader +=
          selectSpeciesInShaderStr(
            RDShaderDirichletX().replaceAll(/updated/g, "gl_FragColor"),
            "u"
          ) +
          parseShaderString(options.dirichletStrU) +
          ";\n}\n";
        if (options.dimension > 1) {
          dirichletShader +=
            selectSpeciesInShaderStr(
              RDShaderDirichletY().replaceAll(/updated/g, "gl_FragColor"),
              "u"
            ) +
            parseShaderString(options.dirichletStrU) +
            ";\n}\n";
        }
      }
      if (options.boundaryConditionsV == "dirichlet") {
        dirichletShader +=
          selectSpeciesInShaderStr(
            RDShaderDirichletX().replaceAll(/updated/g, "gl_FragColor"),
            "v"
          ) +
          parseShaderString(options.dirichletStrV) +
          ";\n}\n";
        if (options.dimension > 1) {
          dirichletShader +=
            selectSpeciesInShaderStr(
              RDShaderDirichletY().replaceAll(/updated/g, "gl_FragColor"),
              "v"
            ) +
            parseShaderString(options.dirichletStrV) +
            ";\n}\n";
        }
      }
      if (options.boundaryConditionsW == "dirichlet") {
        dirichletShader +=
          selectSpeciesInShaderStr(
            RDShaderDirichletX().replaceAll(/updated/g, "gl_FragColor"),
            "w"
          ) +
          parseShaderString(options.dirichletStrW) +
          ";\n}\n";
        if (options.dimension > 1) {
          dirichletShader +=
            selectSpeciesInShaderStr(
              RDShaderDirichletY().replaceAll(/updated/g, "gl_FragColor"),
              "w"
            ) +
            parseShaderString(options.dirichletStrW) +
            ";\n}\n";
        }
      }
      if (options.boundaryConditionsQ == "dirichlet") {
        dirichletShader +=
          selectSpeciesInShaderStr(
            RDShaderDirichletX().replaceAll(/updated/g, "gl_FragColor"),
            "q"
          ) +
          parseShaderString(options.dirichletStrQ) +
          ";\n}\n";
        if (options.dimension > 1) {
          dirichletShader +=
            selectSpeciesInShaderStr(
              RDShaderDirichletY().replaceAll(/updated/g, "gl_FragColor"),
              "q"
            ) +
            parseShaderString(options.dirichletStrQ) +
            ";\n}\n";
        }
      }
    }
    dirichletShader += "}";
    dirichletMaterial.fragmentShader = dirichletShader;
    dirichletMaterial.needsUpdate = true;
  }
}

function checkForAnyDirichletBCs() {
  anyDirichletBCs =
    options.domainViaIndicatorFun ||
    options.boundaryConditionsU == "dirichlet" ||
    options.boundaryConditionsV == "dirichlet" ||
    options.boundaryConditionsW == "dirichlet" ||
    options.boundaryConditionsQ == "dirichlet";
}

function parseRobinRHS(string, species) {
  return "float robinRHS" + species + " = " + parseShaderString(string) + ";\n";
}

function loadPreset(preset) {
  // First, reload the default preset.
  loadOptions("default");

  // Updates the values stored in options.
  loadOptions(preset);

  // Maintain compatibility with links/presets that set the deprecated threeD or oneDimensional options.
  if (options.threeD != undefined) {
    if (options.threeD) {
      options.dimension = 2;
      options.plotType = "surface";
    }
    delete options.threeD;
  }
  if (options.oneDimensional != undefined) {
    if (options.oneDimensional) {
      options.dimension = 1;
      options.plotType = "line";
    }
    delete options.oneDimensional;
  }

  // Replace the GUI.
  deleteGUIs();
  initGUI();

  // Update the equations, setup and GUI in line with new options.
  updateProblem();

  // Trigger a resize, which will refresh all uniforms and set sizes.
  setCanvasShape();
  resize();

  // Set the draw, display, and clear shaders.
  setDrawAndDisplayShaders();
  setClearShader();

  // Update any uniforms.
  updateUniforms();

  // Set the background color.
  scene.background = new THREE.Color(options.backgroundColour);

  // Reset the state of the simulation.
  resetSim();

  // Set the camera.
  configureCameraAndClicks();

  // To get around an annoying bug in dat.GUI.image, in which the
  // controller doesn't update the value of the underlying property,
  // we'll destroy and create a new image controller everytime we load
  // a preset.
  imControllerOne.remove();
  imControllerTwo.remove();
  createImageControllers();

  // Configure interpolation.
  configureManualInterpolation();
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

  // Enable backwards compatibility.
  options.brushRadius = options.brushRadius.toString();
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
  if (MathJax.typesetPromise != undefined) {
    MathJax.typesetPromise();
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
      leftGUI.domElement.remove();
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

function setGUIControllerName(cont, str, title) {
  if (cont != undefined) {
    cont.name(str);
    if (title != undefined) {
      cont.title(title);
    }
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
  if (speciesStr.includes("q")) {
    channel = 3;
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
  if (options.boundaryConditionsQ == "dirichlet") {
    showGUIController(dirichletQController);
  } else {
    hideGUIController(dirichletQController);
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
  if (options.boundaryConditionsQ == "neumann") {
    showGUIController(neumannQController);
  } else {
    hideGUIController(neumannQController);
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
  if (options.boundaryConditionsQ == "robin") {
    showGUIController(robinQController);
  } else {
    hideGUIController(robinQController);
  }

  if (options.domainViaIndicatorFun) {
    hideGUIController(uBCsController);
    hideGUIController(vBCsController);
    hideGUIController(wBCsController);
    hideGUIController(qBCsController);
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
    sanitisedKineticParams().replace(regex, "float $1;\n")
  );
  shaderStr += kineticStr;
  shaderStr += "float u = " + parseShaderString(options.clearValueU) + ";\n";
  shaderStr += "float v = " + parseShaderString(options.clearValueV) + ";\n";
  shaderStr += "float w = " + parseShaderString(options.clearValueW) + ";\n";
  shaderStr += "float q = " + parseShaderString(options.clearValueQ) + ";\n";
  shaderStr += clearShaderBot();
  clearMaterial.fragmentShader = shaderStr;
  clearMaterial.needsUpdate = true;
}

function loadImageSourceOne() {
  let image = new Image();
  image.src = imControllerOne.__image.src;
  let texture = new THREE.Texture();
  texture.image = image;
  image.onload = function () {
    texture.needsUpdate = true;
    uniforms.imageSourceOne.value = texture;
    if (options.resetOnImageLoad) {
      resetSim();
    }
  };
  texture.dispose();
}

function loadImageSourceTwo() {
  let image = new Image();
  image.src = imControllerTwo.__image.src;
  let texture = new THREE.Texture();
  texture.image = image;
  image.onload = function () {
    texture.needsUpdate = true;
    uniforms.imageSourceTwo.value = texture;
    if (options.resetOnImageLoad) {
      resetSim();
    }
  };
  texture.dispose();
}

function createImageControllers() {
  // This is a bad solution to a problem that shouldn't exist.
  // The image controller does not modify the value that you assign to it, and doesn't respond to it being changed.
  // Hence, we create a function used solely to create the controller, which we'll do everytime a preset is loaded.
  if (inGUI("imagesFolder")) {
    root = fIm;
  } else {
    root = genericOptionsFolder;
  }
  imControllerOne = root
    .addImage(options, "imagePathOne")
    .name("$S(x,y)$")
    .onChange(loadImageSourceOne);
  imControllerTwo = root
    .addImage(options, "imagePathTwo")
    .name("$T(x,y)$")
    .onChange(loadImageSourceTwo);
  if (MathJax.typesetPromise != undefined) {
    MathJax.typesetPromise();
  }
  if (inGUI("imageOne")) {
    showGUIController(imControllerOne);
  } else {
    hideGUIController(imControllerOne);
  }
  if (inGUI("imageTwo")) {
    showGUIController(imControllerTwo);
  } else {
    hideGUIController(imControllerTwo);
  }
}

function updateWhatToPlot() {
  if (options.whatToPlot == "MAX") {
    setPostFunMaxFragShader();
    hideGUIController(minColourValueController);
    hideGUIController(maxColourValueController);
    hideGUIController(setColourRangeController);
    hideGUIController(autoSetColourRangeController);
    options.autoSetColourRange = false;
    refreshGUI(rightGUI);
  } else {
    setPostFunFragShader();
    showGUIController(minColourValueController);
    showGUIController(maxColourValueController);
    showGUIController(setColourRangeController);
    showGUIController(autoSetColourRangeController);
  }
  configureColourbar();
  configureIntegralDisplay();
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

function showQGUIPanels() {
  if (options.crossDiffusion) {
    showGUIController(DuqController);
    showGUIController(DvqController);
    showGUIController(DwqController);
    showGUIController(DquController);
    showGUIController(DqvController);
    showGUIController(DqwController);
  } else {
    hideGUIController(DwqController);
    hideGUIController(DquController);
    hideGUIController(DvqController);
    hideGUIController(DuqController);
    hideGUIController(DqvController);
    hideGUIController(DqwController);
  }
  showGUIController(DqqController);
  showGUIController(jController);
  showGUIController(clearValueQController);
  showGUIController(qBCsController);
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

function hideQGUIPanels() {
  hideGUIController(DuqController);
  hideGUIController(DvqController);
  hideGUIController(DwqController);
  hideGUIController(DquController);
  hideGUIController(DqvController);
  hideGUIController(DqwController);
  hideGUIController(DqqController);
  hideGUIController(jController);
  hideGUIController(clearValueQController);
  hideGUIController(qBCsController);
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
  fillBuffer();
  let minVal = Infinity;
  let maxVal = -Infinity;
  for (let i = 0; i < buffer.length; i += 4) {
    minVal = Math.min(minVal, buffer[i]);
    maxVal = Math.max(maxVal, buffer[i]);
  }
  return [minVal, maxVal];
}

function getMeanVal() {
  // Return the mean values in the simulation textures in channel channelInd.
  fillBuffer();
  let total = 0;
  for (let i = 0; i < buffer.length; i += 4) {
    total += buffer[i];
  }
  return total / (nXDisc * nYDisc);
}

function setPostFunFragShader() {
  let shaderStr = computeDisplayFunShaderTop();
  let regex = /[;,\s]*(.+?)(?:$|[;,])+/g;
  let kineticStr = parseShaderString(
    sanitisedKineticParams().replace(regex, "float $1;\n")
  );
  shaderStr += kineticStr;
  shaderStr += computeDisplayFunShaderMid();
  shaderStr = setDisplayFunInShader(shaderStr);
  if (options.domainViaIndicatorFun) {
    shaderStr += postShaderDomainIndicator().replace(
      /indicatorFun/g,
      parseShaderString(options.domainIndicatorFun)
    );
  }
  postMaterial.fragmentShader = shaderStr + postGenericShaderBot();
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
    case 4:
      if (options.crossDiffusion) {
        if (options.algebraicW) {
          if (options.algebraicQ) {
            // 4SpeciesCrossDiffusionAlgebraicWQ
            equationType = 11;
          } else {
            // 4SpeciesCrossDiffusionAlgebraicW
            equationType = 9;
          }
        } else {
          if (options.algebraicQ) {
            // 4SpeciesCrossDiffusionAlgebraicQ
            equationType = 10;
          } else {
            // 4SpeciesCrossDiffusion
            equationType = 8;
          }
        }
      } else {
        // 4Species
        equationType = 7;
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
      // Hide everything to do with v, w, and q.
      hideVGUIPanels();
      hideWGUIPanels();
      hideQGUIPanels();

      // Hide the cross diffusion, algebraicV, algebraicW, and algebraicQ controllers.
      hideGUIController(crossDiffusionController);
      hideGUIController(algebraicVController);
      hideGUIController(algebraicWController);
      hideGUIController(algebraicQController);

      // Configure the controller names.
      setGUIControllerName(DuuController, "$D$", "function of u, t");
      setGUIControllerName(fController, "$f$", "function of u, t");

      break;

    case 1:
      // 2Species
      // Show v panels.
      showVGUIPanels();
      // Hide w and q panels.
      hideWGUIPanels();
      hideQGUIPanels();

      // Show the cross diffusion controller.
      showGUIController(crossDiffusionController);
      // Hide the algebraicV and algebraicW controllers.
      hideGUIController(algebraicVController);
      hideGUIController(algebraicWController);
      hideGUIController(algebraicQController);

      // Configure the controller names.
      setGUIControllerName(DuuController, "$D_u$", "function of u, v, t");
      setGUIControllerName(DvvController, "$D_v$", "function of u, v, t");
      setGUIControllerName(fController, "$f$", "function of u, v, t");
      setGUIControllerName(gController, "$g$", "function of u, v, t");

      break;

    case 2:
      // 2SpeciesCrossDiffusion
      // Show v panels.
      showVGUIPanels();
      // Hide w and q panels.
      hideWGUIPanels();
      hideQGUIPanels();

      // Show the cross diffusion controller.
      showGUIController(crossDiffusionController);
      // Hide the algebraicV, algebraicW, and algebraicQ controllers.
      showGUIController(algebraicVController);
      hideGUIController(algebraicWController);
      hideGUIController(algebraicQController);

      // Configure the controller names.
      setGUIControllerName(
        DuuController,
        "$D_{uu}$",
        "function of u, v, x, y, t"
      );
      setGUIControllerName(
        DvvController,
        "$D_{vv}$",
        "function of u, v, x, y, t"
      );
      setGUIControllerName(fController, "$f$", "function of u, v, x, y, t");
      setGUIControllerName(gController, "$g$", "function of u, v, x, y, t");
      break;

    case 3:
      // 2SpeciesCrossDiffusionAlgebraicV
      // Show v panels.
      showVGUIPanels();
      hideGUIController(DvvController);
      // Hide w and q panels.
      hideWGUIPanels();
      hideQGUIPanels();

      // Show the cross diffusion controller.
      showGUIController(crossDiffusionController);
      // Show the algebraicV controller.
      showGUIController(algebraicVController);
      // Hide the algebraicW and algebraicQ controllers.
      hideGUIController(algebraicWController);
      hideGUIController(algebraicQController);

      // Configure the controller names.
      setGUIControllerName(
        DuuController,
        "$D_{uu}$",
        "function of u, v, x, y, t"
      );
      setGUIControllerName(fController, "$f$", "function of u, v, x, y, t");
      setGUIControllerName(gController, "$g$", "function of u, x, y, t");
      break;

    case 4:
      // 3Species
      // Show v panels.
      showVGUIPanels();
      // Show w panels.
      showWGUIPanels();
      // Hide q panels.
      hideQGUIPanels();

      // Show the cross diffusion controller.
      showGUIController(crossDiffusionController);
      // Hide the algebraicV, algebraicW, and algebraicQ controllers.
      hideGUIController(algebraicVController);
      hideGUIController(algebraicWController);
      hideGUIController(algebraicQController);

      // Configure the controller names.
      setGUIControllerName(
        DuuController,
        "$D_u$",
        "function of u, v, w, x, y, t"
      );
      setGUIControllerName(
        DvvController,
        "$D_v$",
        "function of u, v, w, x, y, t"
      );
      setGUIControllerName(
        DwwController,
        "$D_w$",
        "function of u, v, w, x, y, t"
      );
      setGUIControllerName(fController, "$f$", "function of u, v, w, x, y, t");
      setGUIControllerName(gController, "$g$", "function of u, v, w, x, y, t");
      setGUIControllerName(hController, "$h$", "function of u, v, w, x, y, t");
      break;

    case 5:
      // 3SpeciesCrossDiffusion
      // Show v panels.
      showVGUIPanels();
      // Show w panels.
      showWGUIPanels();
      // Hide q panels.
      hideQGUIPanels();

      // Show the cross diffusion controller.
      showGUIController(crossDiffusionController);
      // Hide the algebraicV and algebraic Q controller.
      hideGUIController(algebraicVController);
      hideGUIController(algebraicQController);
      // Show the algebraicW controller.
      showGUIController(algebraicWController);

      // Configure the controller names.
      setGUIControllerName(
        DuuController,
        "$D_{uu}$",
        "function of u, v, w, x, y, t"
      );
      setGUIControllerName(
        DvvController,
        "$D_{vv}$",
        "function of u, v, w, x, y, t"
      );
      setGUIControllerName(
        DwwController,
        "$D_{ww}$",
        "function of u, v, w, x, y, t"
      );
      setGUIControllerName(fController, "$f$", "function of u, v, w, x, y, t");
      setGUIControllerName(gController, "$g$", "function of u, v, w, x, y, t");
      setGUIControllerName(hController, "$h$", "function of u, v, w, x, y, t");
      break;

    case 6:
      // 3SpeciesCrossDiffusionAlgebraicW
      // Show v panels.
      showVGUIPanels();
      // Show w panels.
      showWGUIPanels();
      hideGUIController(DwwController);
      // Hide q panels.
      hideQGUIPanels();

      // Show the cross diffusion controller.
      showGUIController(crossDiffusionController);
      // Hide the algebraicV and algebraicQ controller.
      hideGUIController(algebraicVController);
      hideGUIController(algebraicQController);
      // Show the algebraicW controller.
      showGUIController(algebraicWController);

      // Configure the controller names.
      setGUIControllerName(
        DuuController,
        "$D_{uu}$",
        "function of u, v, w, x, y, t"
      );
      setGUIControllerName(
        DvvController,
        "$D_{vv}$",
        "function of u, v, w, x, y, t"
      );
      setGUIControllerName(fController, "$f$", "function of u, v, w, x, y, t");
      setGUIControllerName(gController, "$g$", "function of u, v, w, x, y, t");
      setGUIControllerName(hController, "$h$", "function of u, v, x, y, t");
      break;
    case 7:
      // 4Species
      // Show v,w,q panels.
      showVGUIPanels();
      showWGUIPanels();
      showQGUIPanels();

      // Show the cross diffusion controller.
      showGUIController(crossDiffusionController);
      // Hide the algebraicV, algebraicQ, and algebraicW controllers.
      hideGUIController(algebraicVController);
      hideGUIController(algebraicWController);
      hideGUIController(algebraicQController);

      // Configure the controller names.
      setGUIControllerName(
        DuuController,
        "$D_{uu}$",
        "function of u, v, w, q, x, y, t"
      );
      setGUIControllerName(
        DvvController,
        "$D_{vv}$",
        "function of u, v, w, q, x, y, t"
      );
      setGUIControllerName(
        DwwController,
        "$D_{ww}$",
        "function of u, v, w, q, x, y, t"
      );
      setGUIControllerName(
        DqqController,
        "$D_{qq}$",
        "function of u, v, w, q, x, y, t"
      );
      setGUIControllerName(
        fController,
        "$f$",
        "function of u, v, w, q, x, y, t"
      );
      setGUIControllerName(
        gController,
        "$g$",
        "function of u, v, w, q, x, y, t"
      );
      setGUIControllerName(
        hController,
        "$h$",
        "function of u, v, w, q, x, y, t"
      );
      setGUIControllerName(
        jController,
        "$j$",
        "function of u, v, w, q, x, y, t"
      );
      break;
    case 8:
      // 4SpeciesCrossDiffusion.
      // Show v,w,q panels.
      showVGUIPanels();
      showWGUIPanels();
      showQGUIPanels();

      // Show the cross diffusion controller.
      showGUIController(crossDiffusionController);
      // Hide the algebraicV controller.
      hideGUIController(algebraicVController);
      // Show the algebraicW and algebriacQ controllers.
      showGUIController(algebraicWController);
      showGUIController(algebraicQController);

      // Configure the controller names.
      setGUIControllerName(
        DuuController,
        "$D_{uu}$",
        "function of u, v, w, q, x, y, t"
      );
      setGUIControllerName(
        DvvController,
        "$D_{vv}$",
        "function of u, v, w, q, x, y, t"
      );
      setGUIControllerName(
        DwwController,
        "$D_{ww}$",
        "function of u, v, w, q, x, y, t"
      );
      setGUIControllerName(
        DqqController,
        "$D_{qq}$",
        "function of u, v, w, q, x, y, t"
      );
      setGUIControllerName(
        fController,
        "$f$",
        "function of u, v, w, q, x, y, t"
      );
      setGUIControllerName(
        gController,
        "$g$",
        "function of u, v, w, q, x, y, t"
      );
      setGUIControllerName(
        hController,
        "$h$",
        "function of u, v, w, q, x, y, t"
      );
      setGUIControllerName(
        jController,
        "$j$",
        "function of u, v, w, q, x, y, t"
      );
      break;
    case 9:
      // 4SpeciesCrossDiffusionAlgebraicW.
      // Show v,w,q panels.
      showVGUIPanels();
      showWGUIPanels();
      showQGUIPanels();

      // Show the cross diffusion controller.
      showGUIController(crossDiffusionController);
      // Hide the algebraicV controller.
      hideGUIController(algebraicVController);
      // Show the algebraicW and algebriacQ controllers.
      showGUIController(algebraicWController);
      showGUIController(algebraicQController);

      // Configure the controller names.
      setGUIControllerName(
        DuuController,
        "$D_{uu}$",
        "function of u, v, w, q, x, y, t"
      );
      setGUIControllerName(
        DvvController,
        "$D_{vv}$",
        "function of u, v, w, q, x, y, t"
      );
      setGUIControllerName(
        DwwController,
        "$D_{ww}$",
        "function of u, v, q, x, y, t"
      );
      setGUIControllerName(
        DqqController,
        "$D_{qq}$",
        "function of u, v, w, q, x, y, t"
      );
      setGUIControllerName(
        fController,
        "$f$",
        "function of u, v, w, q, x, y, t"
      );
      setGUIControllerName(
        gController,
        "$g$",
        "function of u, v, w, q, x, y, t"
      );
      setGUIControllerName(hController, "$h$", "function of u, v, q, x, y, t");
      setGUIControllerName(
        jController,
        "$j$",
        "function of u, v, w, q, x, y, t"
      );
      break;
    case 10:
      // 4SpeciesCrossDiffusionAlgebraicQ.
      // Show v,w,q panels.
      showVGUIPanels();
      showWGUIPanels();
      showQGUIPanels();

      // Show the cross diffusion controller.
      showGUIController(crossDiffusionController);
      // Hide the algebraicV controller.
      hideGUIController(algebraicVController);
      // Show the algebraicW and algebriacQ controllers.
      showGUIController(algebraicWController);
      showGUIController(algebraicQController);

      // Configure the controller names.
      setGUIControllerName(
        DuuController,
        "$D_{uu}$",
        "function of u, v, w, q, x, y, t"
      );
      setGUIControllerName(
        DvvController,
        "$D_{vv}$",
        "function of u, v, w, q, x, y, t"
      );
      setGUIControllerName(
        DwwController,
        "$D_{ww}$",
        "function of u, v, w, q, x, y, t"
      );
      setGUIControllerName(
        DqqController,
        "$D_{qq}$",
        "function of u, v, w, x, y, t"
      );
      setGUIControllerName(
        fController,
        "$f$",
        "function of u, v, w, q, x, y, t"
      );
      setGUIControllerName(
        gController,
        "$g$",
        "function of u, v, w, q, x, y, t"
      );
      setGUIControllerName(
        hController,
        "$h$",
        "function of u, v, w, q, x, y, t"
      );
      setGUIControllerName(jController, "$j$", "function of u, v, w, x, y, t");
      break;
    case 11:
      // 4SpeciesCrossDiffusionAlgebraicWQ.
      // Show v,w,q panels.
      showVGUIPanels();
      showWGUIPanels();
      showQGUIPanels();

      // Show the cross diffusion controller.
      showGUIController(crossDiffusionController);
      // Hide the algebraicV controller.
      hideGUIController(algebraicVController);
      // Show the algebraicW and algebriacQ controllers.
      showGUIController(algebraicWController);
      showGUIController(algebraicQController);

      // Configure the controller names.
      setGUIControllerName(
        DuuController,
        "$D_{uu}$",
        "function of u, v, w, q, x, y, t"
      );
      setGUIControllerName(
        DvvController,
        "$D_{vv}$",
        "function of u, v, w, q, x, y, t"
      );
      setGUIControllerName(
        DwwController,
        "$D_{ww}$",
        "function of u, v, q, x, y, t"
      );
      setGUIControllerName(
        DqqController,
        "$D_{qq}$",
        "function of u, v, w, x, y, t"
      );
      setGUIControllerName(
        fController,
        "$f$",
        "function of u, v, w, q, x, y, t"
      );
      setGUIControllerName(
        gController,
        "$g$",
        "function of u, v, w, q, x, y, t"
      );
      setGUIControllerName(hController, "$h$", "function of u, v, q, x, y, t");
      setGUIControllerName(jController, "$j$", "function of u, v, w, x, y, t");
      break;
  }
  if (options.domainViaIndicatorFun) {
    showGUIController(domainIndicatorFunController);
  } else {
    hideGUIController(domainIndicatorFunController);
  }
  // Hide or show GUI elements that depend on the BCs.
  setBCsGUI();
  // Hide or show GUI elements to do with surface plotting.
  if (options.plotType == "surface") {
    showGUIController(threeDHeightScaleController);
    showGUIController(cameraThetaController);
    showGUIController(cameraPhiController);
    showGUIController(cameraZoomController);
    showGUIController(drawIn3DController);
  } else {
    hideGUIController(threeDHeightScaleController);
    hideGUIController(cameraThetaController);
    hideGUIController(cameraPhiController);
    hideGUIController(cameraZoomController);
    hideGUIController(drawIn3DController);
  }
  configureColourbar();
  configureTimeDisplay();
  configureIntegralDisplay();
  configureDataContainer();
  // Show/hide/modify GUI elements that depend on dimension.
  options.plotType == "line"
    ? hideGUIController(typeOfBrushController)
    : showGUIController(typeOfBrushController);
  // Refresh the GUI displays.
  refreshGUI(leftGUI);
  refreshGUI(rightGUI);
  if (isRunning) {
    $("#play").hide();
    $("#pause").show();
  } else {
    $("#play").show();
    $("#pause").hide();
  }
  manualInterpolationNeeded
    ? hideGUIController(forceManualInterpolationController)
    : showGUIController(forceManualInterpolationController);
  isManuallyInterpolating()
    ? showGUIController(smoothingScaleController)
    : hideGUIController(smoothingScaleController);
}

function configureOptions() {
  // Configure any options that depend on the equation type.

  if (options.domainViaIndicatorFun) {
    // Only allow Dirichlet conditions.
    options.boundaryConditionsU = "dirichlet";
    options.boundaryConditionsV = "dirichlet";
    options.boundaryConditionsW = "dirichlet";
    options.boundaryConditionsQ = "dirichlet";
  }

  // Set options that only depend on the number of species.
  switch (parseInt(options.numSpecies)) {
    case 1:
      options.crossDiffusion = false;
      options.algebraicV = false;
      options.algebraicW = false;
      options.algebraicQ = false;

      // Ensure that u is being displayed on the screen (and the brush target).
      options.whatToDraw = "u";
      options.whatToPlot = "u";

      // Set the diffusion of v and w to zero to prevent them from causing numerical instability.
      options.diffusionStrUV = "0";
      options.diffusionStrUW = "0";
      options.diffusionStrUQ = "0";
      options.diffusionStrVU = "0";
      options.diffusionStrVV = "0";
      options.diffusionStrVW = "0";
      options.diffusionStrVQ = "0";
      options.diffusionStrWU = "0";
      options.diffusionStrWV = "0";
      options.diffusionStrWW = "0";
      options.diffusionStrWQ = "0";
      options.diffusionStrQU = "0";
      options.diffusionStrQV = "0";
      options.diffusionStrQW = "0";
      options.diffusionStrQQ = "0";

      // Set v,w, and q to be periodic to reduce computational overhead.
      options.boundaryConditionsV = "periodic";
      options.clearValueV = "0";
      options.reactionStrV = "0";
      options.boundaryConditionsW = "periodic";
      options.clearValueW = "0";
      options.reactionStrW = "0";
      options.boundaryConditionsQ = "periodic";
      options.clearValueQ = "0";
      options.reactionStrQ = "0";

      // If the f string contains any v,w, or q references, clear it.
      if (/\b[vwq]\b/.test(options.reactionStrU)) {
        options.reactionStrU = "0";
      }
      break;
    case 2:
      // Ensure that u or v is being displayed on the screen (and the brush target).
      if ((options.whatToDraw == "w") | (options.whatToDraw == "q")) {
        options.whatToDraw = "u";
      }
      if ((options.whatToPlot == "w") | (options.whatToPlot == "q")) {
        options.whatToPlot = "u";
      }
      options.algebraicW = false;
      options.algebraicQ = false;

      // Set the diffusion of w and q to zero to prevent them from causing numerical instability.
      options.diffusionStrUW = "0";
      options.diffusionStrUQ = "0";
      options.diffusionStrVW = "0";
      options.diffusionStrVQ = "0";
      options.diffusionStrWU = "0";
      options.diffusionStrWV = "0";
      options.diffusionStrWW = "0";
      options.diffusionStrWQ = "0";
      options.diffusionStrQU = "0";
      options.diffusionStrQV = "0";
      options.diffusionStrQW = "0";
      options.diffusionStrQQ = "0";

      // Set w and q to be periodic to reduce computational overhead.
      options.boundaryConditionsW = "periodic";
      options.clearValueW = "0";
      options.reactionStrW = "0";

      options.boundaryConditionsQ = "periodic";
      options.clearValueQ = "0";
      options.reactionStrQ = "0";

      // If the f or g strings contains any w or q references, clear them.
      if (/\b[wq]\b/.test(options.reactionStrU)) {
        options.reactionStrU = "0";
      }
      if (/\b[wq]\b/.test(options.reactionStrV)) {
        options.reactionStrV = "0";
      }
      break;
    case 3:
      // Ensure that u, v, or w is being displayed on the screen (and the brush target).
      if (options.whatToDraw == "q") {
        options.whatToDraw = "u";
      }
      if (options.whatToPlot == "q") {
        options.whatToPlot = "u";
      }
      options.algebraicV = false;

      // Set the diffusion of q to zero to prevent it from causing numerical instability.
      options.diffusionStrUQ = "0";
      options.diffusionStrVQ = "0";
      options.diffusionStrWQ = "0";
      options.diffusionStrQU = "0";
      options.diffusionStrQV = "0";
      options.diffusionStrQW = "0";
      options.diffusionStrQQ = "0";

      // Set q to be periodic to reduce computational overhead.
      options.boundaryConditionsQ = "periodic";
      options.clearValueQ = "0";
      options.reactionStrQ = "0";

      // If the f, g, or h strings contains any q references, clear them.
      if (/\bq\b/.test(options.reactionStrU)) {
        options.reactionStrU = "0";
      }
      if (/\bq\b/.test(options.reactionStrV)) {
        options.reactionStrV = "0";
      }
      if (/\bq\b/.test(options.reactionStrW)) {
        options.reactionStrW = "0";
      }
      break;
    case 4:
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
    case 9:
      // 4SpeciesCrossDiffusionAlgebraicW
      options.diffusionStrWW = "0";
    case 10:
      // 4SpeciesCrossDiffusionAlgebraicQ
      options.diffusionStrQQ = "0";
    case 11:
      // 4SpeciesCrossDiffusionAlgebraicWQ
      options.diffusionStrWW = "0";
      options.diffusionStrQQ = "0";
  }

  // Refresh the GUI displays.
  refreshGUI(leftGUI);
  refreshGUI(rightGUI);
}

function updateProblem() {
  // Update the problem based on the current options.
  problemTypeFromOptions();
  configurePlotType();
  configureDimension();
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
  let str = equationTEX[equationType];
  if (options.typesetCustomEqs) {
    // Replace any customisable parts of the TEX with the user input.
    str = replaceUserDefReac(str, /\bf\b/g, options.reactionStrU);
    str = replaceUserDefReac(str, /\bg\b/g, options.reactionStrV);
    str = replaceUserDefReac(str, /\bh\b/g, options.reactionStrW);
    str = replaceUserDefReac(str, /\bj\b/g, options.reactionStrQ);

    str = replaceUserDefDiff(
      str,
      /\b(D) (\\vnabla u)/g,
      options.diffusionStrUU,
      "[]"
    );
    str = replaceUserDefDiff(
      str,
      /\b(D_u) (\\vnabla u)/g,
      options.diffusionStrUU,
      "[]"
    );
    str = replaceUserDefDiff(
      str,
      /\b(D_{uu}) (\\vnabla u)/g,
      options.diffusionStrUU,
      "[]"
    );

    str = replaceUserDefDiff(
      str,
      /\b(D_v) (\\vnabla v)/g,
      options.diffusionStrVV,
      "[]"
    );
    str = replaceUserDefDiff(
      str,
      /\b(D_{vv}) (\\vnabla v)/g,
      options.diffusionStrVV,
      "[]"
    );

    str = replaceUserDefDiff(
      str,
      /\b(D_w) (\\vnabla w)/g,
      options.diffusionStrWW,
      "[]"
    );
    str = replaceUserDefDiff(
      str,
      /\b(D_{ww}) (\\vnabla w)/g,
      options.diffusionStrWW,
      "[]"
    );

    str = replaceUserDefDiff(
      str,
      /\b(D_q) (\\vnabla q)/g,
      options.diffusionStrQQ,
      "[]"
    );
    str = replaceUserDefDiff(
      str,
      /\b(D_{qq}) (\\vnabla q)/g,
      options.diffusionStrQQ,
      "[]"
    );

    str = replaceUserDefDiff(
      str,
      /\b(D_{uv}) (\\vnabla v)/g,
      options.diffusionStrUV,
      "[]"
    );
    str = replaceUserDefDiff(
      str,
      /\b(D_{uw}) (\\vnabla w)/g,
      options.diffusionStrUW,
      "[]"
    );
    str = replaceUserDefDiff(
      str,
      /\b(D_{uq}) (\\vnabla q)/g,
      options.diffusionStrUQ,
      "[]"
    );
    str = replaceUserDefDiff(
      str,
      /\b(D_{vu}) (\\vnabla u)/g,
      options.diffusionStrVU,
      "[]"
    );
    str = replaceUserDefDiff(
      str,
      /\b(D_{vw}) (\\vnabla w)/g,
      options.diffusionStrVW,
      "[]"
    );
    str = replaceUserDefDiff(
      str,
      /\b(D_{vq}) (\\vnabla q)/g,
      options.diffusionStrVQ,
      "[]"
    );
    str = replaceUserDefDiff(
      str,
      /\b(D_{wu}) (\\vnabla u)/g,
      options.diffusionStrWU,
      "[]"
    );
    str = replaceUserDefDiff(
      str,
      /\b(D_{wv}) (\\vnabla v)/g,
      options.diffusionStrWV,
      "[]"
    );
    str = replaceUserDefDiff(
      str,
      /\b(D_{wq}) (\\vnabla q)/g,
      options.diffusionStrWQ,
      "[]"
    );
    str = replaceUserDefDiff(
      str,
      /\b(D_{qu}) (\\vnabla u)/g,
      options.diffusionStrQU,
      "[]"
    );
    str = replaceUserDefDiff(
      str,
      /\b(D_{qv}) (\\vnabla v)/g,
      options.diffusionStrQV,
      "[]"
    );
    str = replaceUserDefDiff(
      str,
      /\b(D_{qw}) (\\vnabla w)/g,
      options.diffusionStrQW,
      "[]"
    );

    // Look through the string for any open brackets ( or [ followed by a + or -.
    let regex = /\(\s*\+/g;
    while (str != (str = str.replace(regex, "(")));
    regex = /\[\s*\+/g;
    while (str != (str = str.replace(regex, "[")));
    // Look through the string for any + followed by a ).
    regex = /\+\s*\)/g;
    while (str != (str = str.replace(regex, ")")));

    // Look through the string for any empty divergence operators, and remove them if so.
    regex = /\\vnabla\s*\\cdot\s*\(\s*\)/g;
    str = str.replaceAll(regex, "");

    // Look through the string for any = +, and remove the +.
    regex = /=\s*\+/g;
    str = str.replaceAll(regex, "=");

    // Look through the string for any + \\\\, and remove the +.
    regex = /\+\s*(\\\\|\n)/g;
    str = str.replaceAll(regex, "$1");

    // Look for = followed by a newline, and insert 0.
    regex = /=\s*(\\\\|\n)/g;
    str = str.replaceAll(regex, "=0$1");

    // If we have [-blah] inside a divergence operator, move the minus sign outside.
    regex =
      /(\\vnabla\s*\\cdot\s*\()\[-([\w\{\}]*)\]\s*(\\vnabla\s*([uvwq])\s*\))/g;
    str = str.replaceAll(regex, "-$1$2$3");

    // Look for div(const * grad(blah)), and move the constant outside the bracket.
    // By this point, a single word (with no square brackets) in the divergence must be a single expression.
    // If it's not x,y,u,v,w,q move it outside the brackets.
    regex = /\\vnabla\s*\\cdot\s*\(([\w\{\}\*\^]*)\s*\\vnabla\s*([uvwq])\s*\)/g;
    str = str.replaceAll(regex, function (match, g1, g2) {
      if (!/\b[xyuvwq]\b/g.test(g1)) {
        return g1 + " \\lap " + g2;
      } else {
        return match;
      }
    });

    str = parseStringToTEX(str);
  }
  $("#typeset_equation").html(str);
  if (MathJax.typesetPromise != undefined) {
    MathJax.typesetPromise();
  }
}

function parseStringToTEX(str) {
  // Parse a string into valid TEX by replacing * and ^.
  // Look through the string for any [+-blah] and replace it with +- blah.
  str = str.replaceAll(/\[([\+-]?[\w\{\}]*)\]/g, "$1");

  // Look through the string and replace any + + with +.
  while (str != (str = str.replace(/\+\s*\+/g, "+")));

  // Replace +- and -+ with simply -
  str = str.replaceAll(/\+\s*-/g, "-");
  str = str.replaceAll(/-\s*\+/g, "-");

  // Replace common functions with commands.
  str = replaceFunctionInTeX(str, "sin", true);
  str = replaceFunctionInTeX(str, "cos", true);
  str = replaceFunctionInTeX(str, "tan", true);
  str = replaceFunctionInTeX(str, "exp", true);
  str = replaceFunctionInTeX(str, "log", true);
  str = replaceFunctionInTeX(str, "sqrt", false);

  // Remove *.
  str = str.replaceAll(/\*/g, " ");

  // Replace powers with well-formatted ^, including nested powers.
  str = replaceBinOperator(str, "^", "{$1}^{$2}");

  // Replace / with well-formatted \frac, including nested fractions.
  // str = replaceBinOperator(str, "/", "\\frac{$1}{$2}");

  // Prepend \\ to any Greek character.
  str = substituteGreek(str);

  // Alternate nested brackets between () and [].
  str = alternateBrackets(str);

  // Add \left and \right to brackets.
  str = str.replaceAll(/[\(\[]/g, "\\left$&");
  str = str.replaceAll(/[\)\]]/g, "\\right$&");

  return str;
}

function replaceFunctionInTeX(str, func, withBrackets) {
  // Replace a function, like sqrt(expression), with \sqrt{expression} in str.
  // withBrackets specifies whether or not we should include brackets in between {}.
  var newStr = str;
  var addedChars = 0;
  const matches = str.matchAll(new RegExp("\\b" + func + "\\b", "g"));
  let funcInd,
    startInd,
    endInd,
    subStr,
    depth,
    foundBracket,
    ind,
    offset = 0;
  for (const match of matches) {
    funcInd = match.index;
    startInd = funcInd + func.length;
    subStr = str.slice(startInd);
    ind = 0;
    depth = 0;
    foundBracket = false;
    // Try to find paired brackets.
    while (
      (ind <= subStr.length) &
      (!foundBracket | !(foundBracket & (depth == 0)))
    ) {
      depth += ["(", "["].includes(subStr[ind]);
      depth -= [")", "]"].includes(subStr[ind]);
      foundBracket |= depth;
      ind += 1;
    }
    // If we found correctly paired brackets, replace them. Otherwise, do nothing.
    if (foundBracket && depth == 0) {
      endInd = ind - 1 + startInd;
      // Insert a backslash and record that we've added a character, which will shift all indices in newStr.
      newStr = insertStrAtIndex(newStr, "\\", funcInd + offset);
      offset += 1;
      if (withBrackets) {
        // Insert braces before and after brackets.
        newStr = insertStrAtIndex(newStr, "{", startInd + offset);
        offset += 1;
        newStr = insertStrAtIndex(newStr, "}", endInd + 1 + offset);
        offset += 1;
      } else {
        newStr = replaceStrAtIndex(newStr, "{", startInd + offset);
        console.log(endInd);
        newStr = replaceStrAtIndex(newStr, "}", endInd + offset);
      }
    }
  }
  return newStr;
}

function alternateBrackets(str) {
  // Given a string with balanced bracketing, loop nested brackets through (, [, {.
  const openBrackets = ["(", "["];
  const closeBrackets = [")", "]"];
  let bracketInd = 0;
  for (var ind = 0; ind < str.length; ind++) {
    if (openBrackets.includes(str[ind])) {
      str = replaceStrAtIndex(str, openBrackets[bracketInd], ind);
      bracketInd += 1;
      // Ensure that bracketInd is a valid index that loops through listToSub.
      bracketInd = modulo(bracketInd, openBrackets.length);
    } else if (closeBrackets.includes(str[ind])) {
      bracketInd -= 1;
      // Ensure that bracketInd is a valid index that loops through listToSub.
      bracketInd = modulo(bracketInd, openBrackets.length);
      str = replaceStrAtIndex(str, closeBrackets[bracketInd], ind);
    }
  }
  return str;
}

function modulo(num, quot) {
  return ((num % quot) + quot) % quot;
}

function replaceStrAtIndex(str, toSub, ind) {
  return str.slice(0, ind) + toSub + str.slice(ind + 1, str.length);
}

function insertStrAtIndex(str, toAdd, ind) {
  return str.slice(0, ind) + toAdd + str.slice(ind, str.length);
}

function removeWhitespace(str) {
  str = str.replace(/\s+/g, "  ").trim();
  return str;
}

function createParameterController(label, isNextParam) {
  let controller;
  // Define a function that we can use to concisely add in a slider depending on the string.
  function createSlider() {
    if (controller.hasOwnProperty("associatedControllers")) {
      // Remove any existing associated controllers.
      for (const child of controller.associatedControllers) {
        child.remove();
      }
    }
    controller.associatedControllers = [];
    // If the string is of the form "name = val in [a,b]", create a slider underneath this one with
    // label "name" and limits a,b with initial value val.
    let regex =
      /\s*(\w+)\s*=\s*(.*)\s*in\s*[\[\(]([0-9\.\-]+)\s*,\s*([0-9\.\-]+)[\]\)]/;
    let match = kineticParamsStrs[label].match(regex);
    if (match) {
      // Initialise an object for the slider to reference, initially taking the value val.
      controller.valueObj = {};
      controller.valueObj[match[1]] = parseFloat(match[2]);
      controller.associatedControllers.push(
        parametersFolder
          .add(
            controller.valueObj,
            match[1],
            parseFloat(match[3]),
            parseFloat(match[4])
          )
          .name("$" + match[1] + "$")
          .onFinishChange(function () {
            // Use the value stored in valueObj to update the string in the original controller.
            kineticParamsStrs[label] = kineticParamsStrs[label].replace(
              regex,
              match[1] +
                " = " +
                formatLabelNum(controller.valueObj[match[1]], 5) +
                " in [" +
                match[3] +
                ", " +
                match[4] +
                "]"
            );
            refreshGUI(parametersFolder);
            setKineticStringFromParams();
          })
      );
      // Move any child elements to be after the original controller in the list, in the order
      // given in associatedControllers.
      for (const child of controller.associatedControllers.slice().reverse()) {
        controller.domElement.parentElement.parentElement.after(
          child.domElement.parentElement.parentElement
        );
      }
      if (MathJax.typesetPromise != undefined) {
        MathJax.typesetPromise();
      }
    }
  }
  if (isNextParam) {
    kineticParamsLabels.push(label);
    kineticParamsStrs[label] = "";
    controller = parametersFolder.add(kineticParamsStrs, label).name("");
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
    controller = parametersFolder.add(kineticParamsStrs, label).name("");
    controller.onFinishChange(function () {
      // Remove excess whitespace.
      let str = removeWhitespace(kineticParamsStrs[label]);
      if (str == "") {
        // If the string is empty, delete this controller and any associated controllers.
        for (const child of this.associatedControllers) {
          child.remove();
        }
        this.associatedControllers = [];
        this.remove();
        // Remove the associated label and the (empty) kinetic parameters string.
        const index = kineticParamsLabels.indexOf(label);
        kineticParamsLabels.splice(index, 1);
        delete kineticParamsStrs[label];
      } else {
        // Otherwise, check if we need to create/modify a slider.
        createSlider();
      }
      // Set the kinetic parameters.
      setKineticStringFromParams();
    });
  }
  // Now that we've made the required controller, check the current string to see if
  // the user has requested that we make other types of controller (e.g. a slider).
  createSlider();
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
  // Check if any reserved names are being used.
  if (checkForReservedNames()) {
    options.kineticParams = "";
    setRDEquations();
    setClearShader();
    setBrushType();
    updateWhatToPlot();
  }
}

function setKineticStringFromParams() {
  // Combine the custom parameters into a single string for storage, so long as no reserved names are used.
  options.kineticParams = Object.values(kineticParamsStrs).join(";");
  if (!checkForReservedNames()) {
    setRDEquations();
    setClearShader();
    setBrushType();
    updateWhatToPlot();
  }
}

function fromExternalLink() {
  const link = document.createElement("a");
  link.href = document.referrer; // This resolves the URL.
  return (
    link.href == window.location || !link.href.includes(window.location.origin)
  );
}

function fadein(id) {
  $(id).removeClass("fading_out");
  $(id).show();
  $(id).addClass("fading_in");
}

function fadeout(id) {
  $(id).removeClass("fading_in");
  $(id).addClass("fading_out");
  $(id).bind(
    "webkitTransitionEnd oTransitionEnd transitionend msTransitionEnd",
    function () {
      $(this).removeClass("fading_out");
      $(this).hide();
    }
  );
}

function configureColourbar() {
  if (options.colourbar) {
    $("#colourbar").show();
    let cString = "linear-gradient(90deg, ";
    cString +=
      "rgb(" +
      uniforms.colour1.value
        .toArray()
        .slice(0, -1)
        .map((x) => x * 255)
        .toString() +
      ") 0%,";
    cString +=
      "rgb(" +
      uniforms.colour2.value
        .toArray()
        .slice(0, -1)
        .map((x) => x * 255)
        .toString() +
      ") 25%,";
    cString +=
      "rgb(" +
      uniforms.colour3.value
        .toArray()
        .slice(0, -1)
        .map((x) => x * 255)
        .toString() +
      ") 50%,";
    cString +=
      "rgb(" +
      uniforms.colour4.value
        .toArray()
        .slice(0, -1)
        .map((x) => x * 255)
        .toString() +
      ") 75%,";
    cString +=
      "rgb(" +
      uniforms.colour5.value
        .toArray()
        .slice(0, -1)
        .map((x) => x * 255)
        .toString() +
      ") 100%";
    cString += ")";
    $("#colourbar").css("background", cString);
    if (options.whatToPlot == "MAX") {
      $("#minLabel").html("$u$");
      $("#midLabel").html("$v$");
      $("#maxLabel").html("$w$");
    } else {
      $("#midLabel").html("$" + parseStringToTEX(options.whatToPlot) + "$");
    }
    if (MathJax.typesetPromise != undefined) {
      MathJax.typesetPromise($("#midLabel"));
    }
    checkColourbarLogoCollision();
    updateColourbarLims();
  } else {
    $("#colourbar").hide();
  }
}

function updateColourbarLims() {
  if (options.whatToPlot != "MAX") {
    $("#minLabel").html(formatLabelNum(options.minColourValue, 2));
    $("#maxLabel").html(formatLabelNum(options.maxColourValue, 2));
  }
  if (
    uniforms.colour1.value
      .toArray()
      .slice(0, -1)
      .reduce((a, b) => a + b, 0) < 0.7
  ) {
    // If the background colour is closer to black than white, set
    // the label to be white.
    $("#minLabel").css("color", "#fff");
  } else {
    $("#minLabel").css("color", "#000");
  }
  if (
    uniforms.colour3.value
      .toArray()
      .slice(0, -1)
      .reduce((a, b) => a + b, 0) < 0.7
  ) {
    // If the background colour is closer to black than white, set
    // the label to be white.
    $("#midLabel").css("color", "#fff");
  } else {
    $("#midLabel").css("color", "#000");
  }
  if (
    uniforms.colour5.value
      .toArray()
      .slice(0, -1)
      .reduce((a, b) => a + b, 0) < 0.7
  ) {
    // If the background colour is closer to black than white, set
    // the label to be white.
    $("#maxLabel").css("color", "#fff");
  } else {
    $("#maxLabel").css("color", "#000");
  }
}

function formatLabelNum(num, depth) {
  return num.toPrecision(depth);
}

function configureTimeDisplay() {
  if (options.timeDisplay) {
    $("#timeDisplay").show();
    updateTimeDisplay();
  } else {
    $("#timeDisplay").hide();
  }
  orderTimeIntegralDisplays();
}

function updateTimeDisplay() {
  if (options.timeDisplay) {
    let str = formatLabelNum(uniforms.t.value, 3);
    str = str.replace(/e(\+)*(\-)*([0-9]*)/, " x 10<sup>$2$3<sup>");
    $("#timeValue").html(str);
    checkColorbarPosition();
  }
}

function configureIntegralDisplay() {
  if (options.integrate) {
    $("#integralDisplay").show();
    let str = "";
    options.dimension == 1 ? (str += "$\\int") : (str += "$\\iint");
    str += "_{\\domain}" + parseStringToTEX(options.whatToPlot) + "\\,\\d x";
    options.dimension == 1 ? {} : (str += "\\d y");
    $("#integralLabel").html(str + " = $");
    if (MathJax.typesetPromise != undefined) {
      MathJax.typesetPromise($("#integralLabel"));
    }
  } else {
    $("#integralDisplay").hide();
  }
  orderTimeIntegralDisplays();
}

function configureDataContainer() {
  // Show the dataContainer element, ready for showing any data. Doing it this way prevents
  // it flashing on load.
  $("#dataContainer").show();
}

function nudgeUIUp(id, num) {
  $(id).css("bottom", "");
  $(id).css("bottom", "+=" + num.toString());
}

function orderTimeIntegralDisplays() {
  options.integrate & options.timeDisplay
    ? nudgeUIUp("#timeDisplay", 10)
    : nudgeUIUp("#timeDisplay", 0);
}

function updateIntegralDisplay() {
  if (options.integrate) {
    fillBuffer();
    let dA;
    if (options.dimension == 1) {
      dA = uniforms.dx.value;
    } else if (options.dimension == 2) {
      dA = uniforms.dx.value * uniforms.dy.value;
    }
    let total = 0;
    for (let i = 0; i < buffer.length; i += 4) {
      total += buffer[i];
    }
    total *= dA;
    $("#integralValue").html(formatLabelNum(total, 4));
    checkColorbarPosition();
  }
}

function checkForNaN() {
  // Check to see if a NaN value is in the first entry of the simulation array, which would mean that we've hit overflow or instability.
  let vals = getMinMaxVal();
  if (!isFinite(vals[0]) || !isFinite(vals[1])) {
    fadein("#oops_hit_nan");
    $("#erase").one("click", () => fadeout("#oops_hit_nan"));
  } else {
    setTimeout(checkForNaN, 1000);
  }
}

function fillBuffer() {
  if (!bufferFilled) {
    renderer.readRenderTargetPixels(postTexture, 0, 0, nXDisc, nYDisc, buffer);
    bufferFilled = true;
  }
}

function checkColorbarPosition() {
  // If there's a potential overlap of the data display and the colourbar, move the former up.
  if (options.colourbar & (options.integrate | options.time)) {
    let colourbarDims = $("#colourbar")[0].getBoundingClientRect();
    let bottomElm;
    options.integrate
      ? (bottomElm = $("#integralDisplay")[0])
      : (bottomElm = $("#timeDisplay")[0]);
    let bottomDims = bottomElm.getBoundingClientRect();
    // If the colour overlaps the bottom element (or is above it and would otherwise overlap).
    if (colourbarDims.right >= bottomDims.left) {
      if (colourbarDims.top <= bottomDims.bottom) {
        nudgeUIUp("#dataContainer", 40);
        nudgedUp = true;
      }
    } else {
      if (nudgedUp) {
        nudgeUIUp("#dataContainer", 0);
        nudgedUp = false;
      }
    }
  }
}

function configureManualInterpolation() {
  if (isManuallyInterpolating()) {
    simTextureA.texture.magFilter = THREE.NearestFilter;
    simTextureB.texture.magFilter = THREE.NearestFilter;
    postTexture.texture.magFilter = THREE.NearestFilter;
    interpolationTexture.texture.magFilter = THREE.NearestFilter;
  } else {
    simTextureA.texture.magFilter = THREE.LinearFilter;
    simTextureB.texture.magFilter = THREE.LinearFilter;
    postTexture.texture.magFilter = THREE.LinearFilter;
    interpolationTexture.texture.magFilter = THREE.LinearFilter;
  }
  configureGUI();
}

function isManuallyInterpolating() {
  return manualInterpolationNeeded || options.forceManualInterpolation;
}

function warningCookieExists() {
  var cookieArr = document.cookie.split(";");
  for (var i = 0; i < cookieArr.length; i++) {
    var cookiePair = cookieArr[i].split("=");
    if ("warning" == cookiePair[0].trim()) {
      return true;
    }
  }
  return false;
}

function setWarningCookie() {
  const d = new Date();
  d.setTime(d.getTime() + 365 * 24 * 60 * 60 * 1000);
  let expires = "expires=" + d.toUTCString();
  document.cookie = "warning" + "=" + "true" + ";" + expires + ";path=/";
}

function waitListener(element, listenerName, val) {
  return new Promise(function (resolve, reject) {
    var listener = (event) => {
      element.removeEventListener(listenerName, listener);
      resolve(val);
    };
    element.addEventListener(listenerName, listener);
  });
}

function getReservedStrs() {
  // Load an RD shader and find floats, vecs, and ivecs.
  let regex = /(?:float|vec\d|ivec\d)\b\s+(\w+)\b/g;
  let str = RDShaderTop() + RDShaderUpdateCross();
  return [...str.matchAll(regex)].map((x) => x[1]).concat(["u", "v", "w", "q"]);
}

function usingReservedNames() {
  // Check if the user is trying to use any reserved names as kinetic parameters.
  // If so, return the name of a reserved parameter. Otherwise, return false.
  let regex = /(\w+)\s*=/g;
  let names = [...sanitisedKineticParams().matchAll(regex)]
    .map((x) => x[1])
    .join(" ");
  let lastTest = false;
  // Check all of the names, saving at least one reserved name if any are found.
  const flag = getReservedStrs().some(function (name) {
    let regex = new RegExp("\\b" + name + "\\b", "g");
    lastTest = name;
    return regex.test(names);
  });
  return flag ? lastTest : false;
}

function checkForReservedNames() {
  let badName = usingReservedNames();
  // If there's a bad parameter name, and we've not just alerted the user to it, show an alert.
  if (badName && badName != lastBadParam) {
    lastBadParam = badName;
    alert(
      'The name "' +
        badName +
        "\" is used under the hood, so can't be used as a parameter. Please use a different name for " +
        badName +
        "."
    );
  }
  return badName;
}

function replaceUserDefReac(str, regex, input) {
  // Insert user-defined input into str in place of original.
  // E.g. str = some TeX, regex = /\bf\b/g; input = "2*a".
  // If the input is 0, just remove the original from str.
  if (input.replace(/\s+/g, "  ").trim() == "0")
    return str.replaceAll(regex, "");
  // If the input contains letters (like parameters), insert it with delimiters.
  if (input.match(/[a-zA-Z]/)) return str.replaceAll(regex, input);
  // If it's just a scalar, keep the original.
  return str;
}

function replaceUserDefDiff(str, regex, input, delimiters) {
  // Insert user-defined input into str in place of original, surrounded by delimiters.
  // E.g. str = some TeX, regex = /(D_{uu}) (\\vnabla u)/g; input = "2*a"; delimiters = " ";
  // If the input is 0, just remove the original from str.
  let trimmed = input.replace(/\s+/g, "  ").trim();
  if (trimmed == "0" || trimmed == "0.0") return str.replaceAll(regex, "");
  if (trimmed == "1" || trimmed == "1.0") return str.replaceAll(regex, "$2");
  // If the input contains letters (like parameters), insert it with delimiters.
  if (input.match(/[a-zA-Z]/)) {
    if (input.match(/[\+-]/) && delimiters != undefined) {
      // If it needs delimiting.
      return str.replaceAll(
        regex,
        delimiters[0] + input + delimiters[1] + "$2"
      );
    } else {
      // If it doesn't need delimiting.
      return str.replaceAll(regex, input + "$2");
    }
  }
  // If it's just a scalar, keep the original.
  return str;
}

function configurePlotType() {
  // Configure the simulation to plot the solution as requested.
  if (options.plotType == "line") {
    options.typeOfBrush = "vline";
    setBrushType();
    refreshGUI(rightGUI);
  }
  options.plotType == "surface"
    ? $("#simCanvas").css("outline", "2px #000 solid")
    : $("#simCanvas").css("outline", "");
  configureCameraAndClicks();
  configureGUI();
}

function configureDimension() {
  // Configure the dimension of the equations.
  if ((options.dimension != 1) & (options.plotType == "line")) {
    options.plotType = "plane";
    configurePlotType();
  }
  if ((options.dimension == 1) & (options.plotType != "line")) {
    options.plotType = "line";
    configurePlotType();
  }
  resize();
  setRDEquations();
  configureGUI();
  configureIntegralDisplay();
}

function setCameraPos() {
  const pos = new THREE.Vector3().setFromSphericalCoords(
    1,
    Math.PI / 2 - (options.cameraTheta * Math.PI) / 180,
    (options.cameraPhi * Math.PI) / 180
  );
  camera.position.set(pos.x, pos.y, pos.z);
  camera.lookAt(0, 0, 0);
}

function checkColourbarLogoCollision() {
  // If the logo and the colourbar overlap, remove the logo.
  if ($("#logo").is(":visible") & $("#colourbar").is(":visible")) {
    if (
      $("#logo")[0].getBoundingClientRect().right >=
      $("#colourbar")[0].getBoundingClientRect().left
    ) {
      $("#logo").hide();
    }
  }
}

function sanitisedKineticParams() {
  // options.kineticParams could contain additional directives, like "in [0,1]", used
  // to create additional controllers. We want to save these in options.kineticParams, but
  // can't pass them to the shader like this. Here, we strip these directives from the string.
  // If a kineticParam is of the form "name = val in [a,b]", remove the in [a,b] part.
  return options.kineticParams.replaceAll(/\bin[^;]*;/g, ";");
}
