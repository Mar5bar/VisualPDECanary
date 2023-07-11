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
let simTextures = [],
  postTexture,
  interpolationTexture,
  simTextureOpts,
  checkpointTexture;
let basicMaterial,
  displayMaterial,
  drawMaterial,
  simMaterials = {},
  dirichletMaterial,
  clearMaterial,
  copyMaterial,
  postMaterial,
  lineMaterial,
  arrowMaterial,
  interpolationMaterial,
  checkpointMaterial,
  tailGeometry,
  headGeometry;
let domain, simDomain, clickDomain, line;
let xDisplayDomainCoords, yDisplayDomainCoords, numPointsInLine, arrowGroup;
let colourmap, colourmapEndpoints;
let options, uniforms, funsObj, savedOptions;
let leftGUI,
  rightGUI,
  viewsGUI,
  root,
  typeOfBrushController,
  fController,
  gController,
  hController,
  jController,
  algebraicSpeciesController,
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
  lineWidthMulController,
  threeDHeightScaleController,
  surfaceFunController,
  cameraThetaController,
  cameraPhiController,
  cameraZoomController,
  contoursControllers = [],
  minColourValueController,
  maxColourValueController,
  setColourRangeController,
  autoSetColourRangeController,
  embossControllers = [],
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
  comboUController,
  comboVController,
  comboWController,
  comboQController,
  neumannUController,
  neumannVController,
  neumannWController,
  neumannQController,
  numTimestepsPerFrameController,
  robinUController,
  robinVController,
  robinWController,
  robinQController,
  fIm,
  imControllerOne,
  imControllerTwo,
  arrowDensityController,
  arrowLengthMaxController,
  editViewFolder,
  linesAnd3DFolder,
  vectorFieldFolder,
  whatToPlotController,
  deleteViewController,
  selectedEntries = new Set();
let isRunning,
  isDrawing,
  hasDrawn,
  isStory = false,
  shaderContainsRAND = false,
  anyDirichletBCs,
  dataNudgedUp = false,
  compileErrorOccurred = false,
  NaNTimer,
  topMessageTimer,
  uiHidden = false,
  checkpointExists = false,
  savedViews,
  nextViewNumber = 0,
  updatingAlgebraicSpecies = false,
  viewUIOffsetInit;
let inTex, outTex;
let nXDisc,
  nYDisc,
  domainWidth,
  domainHeight,
  maxDim,
  canvasWidth,
  canvasHeight,
  usingLowResDomain = true,
  domainScaleValue = 1,
  domainScaleFactor = 1,
  baseArrowScale = 0.15;
let parametersFolder,
  kineticParamsStrs = {},
  kineticParamsLabels = [],
  kineticNameToCont = {},
  kineticParamsCounter = 0;
const defaultSpecies = ["u", "v", "w", "q"];
const defaultReactions = ["UFUN", "VFUN", "WFUN", "QFUN"];
const placeholderSp = ["SPECIES1", "SPECIES2", "SPECIES3", "SPECIES4"];
const placeholderRe = ["REACT1", "REACT2", "REACT3", "REACT4"];
const listOfTypes = [
  "1Species", // 0
  "2Species", // 1
  "2SpeciesCrossDiffusion", // 2
  "2SpeciesCrossDiffusionAlgebraicV", // 3
  "3Species", // 4
  "3SpeciesCrossDiffusion", // 5
  "3SpeciesCrossDiffusionAlgebraicW", // 6
  "3SpeciesCrossDiffusionAlgebraicVW", // 7
  "4Species", // 8
  "4SpeciesCrossDiffusion", // 9
  "4SpeciesCrossDiffusionAlgebraicQ", // 10
  "4SpeciesCrossDiffusionAlgebraicWQ", // 11
  "4SpeciesCrossDiffusionAlgebraicVWQ", // 12
];
let equationType, savedHTML, algebraicV, algebraicW, algebraicQ;
let takeAScreenshot = false;
let buffer,
  stateBuffer,
  postBuffer,
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
  drawShaderTop,
  drawShaderBotReplace,
  drawShaderBotAdd,
  drawShaderShapeDisc,
  drawShaderShapeVLine,
  drawShaderShapeHLine,
  drawShaderFactorSharp,
  drawShaderFactorSmooth,
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
  RDShaderAlgebraicSpecies,
  RDShaderEnforceDirichletTop,
  RDShaderAdvectionPreBC,
  RDShaderAdvectionPostBC,
  RDShaderDiffusionPreBC,
  RDShaderDiffusionPostBC,
  RDShaderGhostX,
  RDShaderGhostY,
  RDShaderMain,
} from "./simulation_shaders.js";
import { randShader, randNShader } from "../rand_shader.js";
import {
  fiveColourDisplayTop,
  fiveColourDisplayBot,
  embossShader,
  contourShader,
  surfaceVertexShaderColour,
  surfaceVertexShaderCustom,
  overlayShader,
} from "./display_shaders.js";
import { getColours } from "../colourmaps.js";
import { genericVertexShader } from "../generic_shaders.js";
import { getPreset, getUserTextFields, getFieldsInView } from "./presets.js";
import { clearShaderBot, clearShaderTop } from "./clear_shader.js";
import * as THREE from "../three.module.min.js";
import { OrbitControls } from "../OrbitControls.js";
import { Line2 } from "../lines/Line2.js";
import { LineMaterial } from "../lines/LineMaterial.js";
import { LineGeometry } from "../lines/LineGeometry.js";
import { minifyPreset, maxifyPreset } from "./minify_preset.js";
import { LZString } from "../lz-string.min.js";
import {
  equationTEXFun,
  getDefaultTeXLabelsDiffusion,
  getDefaultTeXLabelsReaction,
  getDefaultTeXLabelsBCsICs,
  substituteGreek,
} from "./TEX.js";
let equationTEX = equationTEXFun();
let TeXStrings = {
  ...getDefaultTeXLabelsDiffusion(),
  ...getDefaultTeXLabelsReaction(),
  ...getDefaultTeXLabelsBCsICs(),
};
let listOfSpecies, listOfReactions, anySpeciesRegexStrs;
const fieldsInView = getFieldsInView();

let parser = new exprEval.Parser();
parser.consts.pi = Math.PI;
parser.consts.Pi = Math.PI;
parser.consts.e = Math.exp(1.0);

// Setup some configurable options.
options = {};

// List of fields that the user can type into.
const userTextFields = getUserTextFields();

// An object with functions as fields that the GUI controllers can call.
funsObj = {
  reset: function () {
    resetSim();
  },
  toggleRunning: function () {
    isRunning ? pauseSim() : playSim();
  },
  copyConfigAsURL: function () {
    let str = getSimURL();
    copyLinkToClipboard(str);
  },
  saveSimState: function () {
    saveSimState();
  },
  exportSimState: function () {
    exportSimState();
  },
  clearCheckpoints: function () {
    if (checkpointExists) {
      checkpointTexture.dispose();
      checkpointTexture = null;
      checkpointExists = false;
    }
  },
  restoreCurrentView: function () {
    restoreCurrentView();
  },
};

// Define a handy countDecimals function.
Number.prototype.countDecimals = function () {
  if (Math.floor(this.valueOf()) === this.valueOf()) return 0;

  var str = this.toString();
  if (str.indexOf(".") !== -1 && str.indexOf("-") !== -1) {
    return str.split("-")[1] || 0;
  } else if (str.indexOf(".") !== -1) {
    return str.split(".")[1].length || 0;
  }
  return str.split("-")[1] || 0;
};

// Define a handy clamp function.
Number.prototype.clamp = function (min, max) {
  return Math.min(Math.max(this, min), max);
};

// Define a handy rotate function.
Array.prototype.rotate = (function () {
  // Save references to array functions to make lookup faster
  var push = Array.prototype.push,
    splice = Array.prototype.splice;

  return function (count) {
    var len = this.length >>> 0, // convert to uint
      count = count >> 0; // convert to int

    // convert count to value in range [0, len)
    count = ((count % len) + len) % len;

    // use splice.call() instead of this.splice() to make function generic
    push.apply(this, splice.call(this, 0, count));
    return this;
  };
})();

// Define a handy 'last' function to return the last element.
Array.prototype.last = function () {
  return this[this.length - 1];
};

// Get the canvas to draw on, as specified by the html.
canvas = document.getElementById("simCanvas");

// Warn the user if any errors occur.
console.error = function (error) {
  // Record the fact that an error has occurred and we need to recompile shaders.
  compileErrorOccurred = true;
  let errorStr = error.toString();
  console.log(errorStr);
  let regex = /ERROR.*/;
  regex.test(errorStr) ? (errorStr = errorStr.match(regex)) : {};
  throwError(errorStr);
};

// Remove the logo if we're from an internal link.
if (!fromExternalLink()) {
  $("#logo").hide();
}

// Check URL for any specified options.
const params = new URLSearchParams(window.location.search);

if (params.has("no_ui")) {
  // Hide all the ui, including buttons.
  $(".ui").addClass("hidden");
  uiHidden = true;
} else {
  $(".ui").removeClass("hidden");
}

if (params.has("logo_only")) {
  // Hide all ui except the logo.
  $(".ui").addClass("hidden");
  $("#logo").removeClass("hidden");
  uiHidden = true;
}

if (params.has("sf")) {
  // Set the domain scale factor from the search string.
  domainScaleFactor = parseFloat(params.get("sf"));
  if (isNaN(domainScaleFactor) || domainScaleFactor <= 0) {
    domainScaleFactor = 1;
  }
}

// Warn the user about flashing images and ask for cookie permission to store this.
if (!warningCookieExists() && !uiHidden) {
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

// Load things from the search string, if anything is there
// Unless this value is set to false later, we will load a default preset.
let shouldLoadDefault = true;
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

// If this is a Visual Story, hide all buttons apart from play/pause, erase and views.
isStory = params.has("story");
if (isStory) {
  $("#settings").addClass("hidden");
  $("#equations").addClass("hidden");
  $("#help").addClass("hidden");
  $("#share").addClass("hidden");
  editViewFolder.domElement.classList.add("hidden");
  $("#add_view").addClass("hidden");
  configureColourbar();

  $("#play").css("top", "-=50");
  $("#pause").css("top", "-=50");
  $("#erase").css("top", "-=50");
  $("#views").css("top", "-=50");
  $("#views_ui").css("top", "-=50");
  viewUIOffsetInit = $(":root").css("--views-ui-offset");
  $(":root").css("--views-ui-offset", "-=50");
}

// If the "Try clicking!" popup is allowed, show it iff we're from an external link
// or have loaded the default simulation.
if (
  (fromExternalLink() || shouldLoadDefault || options.forceTryClickingPopup) &&
  !options.suppressTryClickingPopup &&
  options.brushEnabled
) {
  $("#top_message").html("<p>" + options.tryClickingText + "</p>");
  fadein("#top_message");
  // Fadeout either after the user clicks on the canvas or 5s passes.
  setTimeout(() => fadeout("#top_message"), 5000);
  $("#simCanvas").one("pointerdown touchstart", () => fadeout("#top_message"));
}

/* GUI settings and equations buttons */
$("#settings").click(function () {
  toggleRightUI();
  if ($("#right_ui").is(":visible") && $("#help_panel").is(":visible")) {
    toggleHelpPanel();
  }
  if ($("#right_ui").is(":visible") && $("#share_panel").is(":visible")) {
    toggleSharePanel();
  }
  if (window.innerWidth < 629 && $("#right_ui").is(":visible")) {
    if ($("#left_ui").is(":visible")) toggleLeftUI();
    if ($("#views_ui").is(":visible")) toggleViewsUI();
  }
  if ($("#left_ui").is(":visible")) resizeEquationDisplay();
});
$("#equations").click(function () {
  toggleLeftUI();
  resizeEquationDisplay();
  if (
    window.innerWidth < 629 &&
    $("#right_ui").is(":visible") &&
    $("#left_ui").is(":visible")
  ) {
    toggleRightUI();
  }
  if ($("#views_ui").is(":visible") && $("#left_ui").is(":visible")) {
    toggleViewsUI();
  }
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
$("#share").click(function () {
  toggleSharePanel();
  if ($("#help_panel").is(":visible")) {
    toggleHelpPanel();
  }
});
$("#help").click(function () {
  toggleHelpPanel();
  if ($("#share_panel").is(":visible")) {
    toggleSharePanel();
  }
});
$("#screenshot").click(function () {
  takeAScreenshot = true;
  render();
  toggleSharePanel();
});
$("#link").click(function () {
  funsObj.copyConfigAsURL();
  toggleSharePanel();
});
$("#embed").click(function () {
  copyIframe();
  toggleSharePanel();
});
$("#embed_ui_type").change(function () {
  $("#embed_ui_type").blur();
});
$("#help_panel .container .button").click(function () {
  toggleHelpPanel();
});
$("#views").click(function () {
  toggleViewsUI();
  if (
    window.innerWidth < 629 &&
    $("#right_ui").is(":visible") &&
    $("#views_ui").is(":visible")
  ) {
    toggleRightUI();
  }
  if ($("#views_ui").is(":visible") && $("#left_ui").is(":visible")) {
    toggleLeftUI();
  }
  // fitty(".view_label", { maxSize: 32, minSize: 12, multiline: true });
});

// New, rename, delete
// (Dynamically created buttons, like the +, can't use .click())
$(document).on("click", "#add_view", function () {
  addView();
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
    alpha: true,
    premultipliedAlpha: false,
    stencilBuffer: false,
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
  simTextures.push(
    new THREE.WebGLRenderTarget(
      options.maxDisc,
      options.maxDisc,
      simTextureOpts
    )
  );
  // Store all the simulation textures in an array. They'll be in history order, so that the first element is the most
  // recent. We'll write to the first texture, with later elements being further back in time.
  simTextures.push(simTextures[0].clone());
  simTextures.push(simTextures[0].clone());
  simTextures.push(simTextures[0].clone());
  simTextures.push(simTextures[0].clone());
  postTexture = simTextures[0].clone();
  interpolationTexture = simTextures[0].clone();

  // Periodic boundary conditions (for now).
  simTextures.forEach((simTex) => {
    simTex.texture.wrapS = THREE.RepeatWrapping;
    simTex.texture.wrapT = THREE.RepeatWrapping;
  });

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
    if (options.plotType == "surface") {
      options.cameraTheta = 90 - (180 * Math.acos(camera.position.y)) / Math.PI;
      options.cameraPhi =
        -(180 * Math.atan2(camera.position.x, camera.position.z)) / Math.PI;
      options.cameraZoom = camera.zoom;
      updateView("cameraTheta");
      updateView("cameraPhi");
      updateView("cameraZoom");
      refreshGUI(viewsGUI);
      renderIfNotRunning();
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

  // We'll use a host of materials for timestepping, each with different fragment shaders.
  simMaterials.FE = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: genericVertexShader(),
  });
  simMaterials.AB2 = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: genericVertexShader(),
  });
  for (let ind = 1; ind < 3; ind++) {
    simMaterials["Mid" + ind.toString()] = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: genericVertexShader(),
    });
  }
  for (let ind = 1; ind < 5; ind++) {
    simMaterials["RK4" + ind.toString()] = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: genericVertexShader(),
    });
  }

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
  lineMaterial = new LineMaterial({
    vertexColors: true,
    linewidth: 0.01,
  });
  arrowMaterial = new THREE.MeshBasicMaterial({
    color: options.arrowColour,
    side: THREE.DoubleSide,
  });
  checkpointMaterial = new THREE.MeshBasicMaterial();

  // Geometry for arrows.
  tailGeometry = new THREE.CylinderGeometry(0.008, 0.008, 0.1);
  headGeometry = new THREE.ConeGeometry(0.04, 0.04, 4);

  const simPlane = new THREE.PlaneGeometry(1.0, 1.0);
  simDomain = new THREE.Mesh(simPlane, simMaterials[0]);
  simDomain.position.z = 0;
  simScene.add(simDomain);

  // Set sizes and create the display domains.
  setSizes();
  createDisplayDomains();

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
        event.preventDefault();
      }
      if (event.key === "h") {
        if (uiHidden) {
          uiHidden = false;
          $(".ui").removeClass("hidden");
          editViewFolder.domElement.classList.remove("hidden");
          $("#add_view").removeClass("hidden");
          // Reset any custom positioning for the Story ui.
          $(".ui").css("top", "");
          $(":root").css("--views-ui-offset", viewUIOffsetInit);
          // Ensure that the correct play/pause button is showing.
          isRunning ? playSim() : pauseSim();
          // Check for any positioning that relies on elements being visible.
          checkColourbarPosition();
          checkColourbarLogoCollision();
          resizeEquationDisplay();
        } else {
          uiHidden = true;
          $(".ui").addClass("hidden");
        }
      }
      if (event.key == "s") {
        saveSimState();
      }
      if (event.key == "c") {
        options.resetFromCheckpoints = !options.resetFromCheckpoints;
        updateToggle($("#checkpointButton")[0]);
      }
    }
  });

  // Listen for resize events.
  window.addEventListener("resize", resize, false);

  window.addEventListener("message", updateParamFromMessage);

  // Bind the onchange event for the checkpoint loader.
  $("#checkpointInput").change(function () {
    loadSimState(this.files[0]);
    this.value = null;
  });
}

function resize() {
  // Set the resolution of the simulation domain and the renderer.
  setSizes();
  // Assign sizes to textures.
  resizeTextures();
  // Update cropping of checkpoint textures.
  setStretchOrCropTexture(checkpointTexture);
  // Update any uniforms.
  updateUniforms();
  // Create new display domains with the correct sizes.
  replaceDisplayDomains();
  // Create arrows for vector fields.
  configureVectorField();
  // Configure the camera.
  configureCameraAndClicks();
  // Check if the colourbar lies on top of the logo. If so, remove the logo.
  checkColourbarLogoCollision();
  resizeEquationDisplay();
  render();
}

function replaceDisplayDomains() {
  domain.geometry.dispose();
  scene.remove(domain);
  clickDomain.geometry.dispose();
  scene.remove(clickDomain);
  line.geometry.dispose();
  scene.remove(line);
  createDisplayDomains();
}

function configureCameraAndClicks() {
  // Setup the camera position, orientation, and the invisible surface used for click detection.
  computeCanvasSizesAndAspect();
  switch (options.plotType) {
    case "line":
      options.cameraTheta = 0;
      options.cameraPhi = 0;
      controls.enabled = false;
      camera.zoom = 1;
      setCameraPos();
      displayMaterial.vertexShader = surfaceVertexShaderColour();
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
      setSurfaceShader();
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
  uniforms.L.value = domainScaleValue;
  uniforms.L_y.value = domainHeight;
  uniforms.L_x.value = domainWidth;
  uniforms.L_min.value = Math.min(domainHeight, domainWidth);
  uniforms.dt.value = options.dt;
  uniforms.dx.value = domainWidth / nXDisc;
  uniforms.dy.value = domainHeight / nYDisc;
  uniforms.heightScale.value = options.threeDHeightScale;
  uniforms.maxColourValue.value = options.maxColourValue;
  uniforms.minColourValue.value = options.minColourValue;
  uniforms.customSurface.value = options.customSurface;
  setEmbossUniforms();
  if (!options.fixRandSeed) {
    updateRandomSeed();
  }
}

function computeCanvasSizesAndAspect() {
  // Parse the domain scale.
  try {
    domainScaleValue = parser.evaluate(options.domainScale);
  } catch (error) {
    throwError(
      "Unable to evaluate the domain length. Please check the definition."
    );
    domainScaleValue = 100;
  }
  canvasWidth = Math.round(canvas.getBoundingClientRect().width);
  canvasHeight = Math.round(canvas.getBoundingClientRect().height);
  aspectRatio = canvasHeight / canvasWidth;
  if (aspectRatio <= 0) aspectRatio = 0.1;
  // Set the domain size, setting the largest side to be of size domainScaleValue.
  if (aspectRatio >= 1) {
    domainHeight = domainScaleValue;
    domainWidth = domainHeight / aspectRatio;
  } else {
    domainWidth = domainScaleValue;
    domainHeight = domainWidth * aspectRatio;
  }
  if (options.dimension == 1) {
    domainWidth = domainScaleValue;
  }
  uniforms.L_x.value = domainWidth;
  uniforms.L_y.value = domainHeight;
  maxDim = Math.max(domainWidth, domainHeight);
}

function setSizes() {
  computeCanvasSizesAndAspect();
  // Using the user-specified spatial step size, compute as close a discretisation as possible that
  // doesn't reduce the step size below the user's choice.
  let spatialStepValue = domainScaleValue / 100;
  try {
    spatialStepValue = parser.evaluate(options.spatialStep);
  } catch (error) {
    throwError(
      "Unable to evaluate the spatial step. Please check the definition."
    );
  }
  if (spatialStepValue <= 0) {
    // Prevent a crash if a <=0 spatial step is specified.
    throwError(
      "Oops! A spatial step less than or equal to 0 would almost certainly crash your device. Please check the definition."
    );
    spatialStepValue = domainScaleValue / 100;
  }
  nXDisc = Math.floor(domainWidth / spatialStepValue);
  nYDisc = Math.floor(domainHeight / spatialStepValue);
  if (nXDisc == 0) nXDisc = 1;
  if (nYDisc == 0) nYDisc = 1;
  // If the user has specified that this is a 1D problem, set nYDisc = 1.
  if (options.dimension == 1) {
    nYDisc = 1;
  }
  // Update these values in the uniforms.
  uniforms.nXDisc.value = nXDisc;
  uniforms.nYDisc.value = nYDisc;
  // Set an array of XDisplayDomainCoords for plotting lines. Note that these simply go between -0.5 and 0.5,
  // and do not correspond to x in the simulation.
  xDisplayDomainCoords = new Array(nXDisc);
  yDisplayDomainCoords = new Array(nXDisc);
  let val = -0.5,
    step = 1 / nXDisc;
  for (let i = 0; i < xDisplayDomainCoords.length; i++) {
    xDisplayDomainCoords[i] = val;
    val += step;
  }
  // Set the size of the renderer, which will interpolate precisely from the textures.
  setDefaultRenderSize();
  buffer = new Float32Array(nXDisc * nYDisc * 4);
  bufferFilled = false;
}

function createDisplayDomains() {
  computeCanvasSizesAndAspect();
  let displayDomainSize = [1, 1];
  // If we're not using a low res domain (eg because of surface plotting),
  // create a domain with as much resolution of the finite difference mesh.
  if (!usingLowResDomain) displayDomainSize = [nXDisc, nYDisc];
  const plane = new THREE.PlaneGeometry(
    domainWidth / maxDim,
    domainHeight / maxDim,
    displayDomainSize[0],
    displayDomainSize[1]
  );
  domain = new THREE.Mesh(plane, displayMaterial);
  domain.position.z = 0;
  domain.visible = options.plotType != "line";
  domain.matrixAutoUpdate = false;
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
  clickDomain.matrixAutoUpdate = false;
  scene.add(clickDomain);
  setDomainOrientation();

  // Create a line object whose coordinates we can set when plotting lines.
  const lineGeom = new LineGeometry();
  numPointsInLine = Math.round(devicePixelRatio * canvasWidth);
  const positions = new Array(3 * numPointsInLine).fill(0);
  const lineColours = new Array(positions.length).fill(0);
  lineGeom.setPositions(positions);
  lineGeom.setColors(lineColours);
  line = new Line2(lineGeom, lineMaterial);
  line.scale.set(1, 1, 1);
  line.visible = options.plotType == "line";
  scene.add(line);
}

function setDomainOrientation() {
  // Configure the orientation of the simulation domain and the click domain, which we modify for 3D to make
  // convenient use of Euler angles for the camera controls.
  switch (options.plotType) {
    case "plane":
      domain.rotation.x = 0;
      clickDomain.rotation.x = 0;
      break;
    case "surface":
      domain.rotation.x = -Math.PI / 2;
      clickDomain.rotation.x = -Math.PI / 2;
      break;
  }
  domain.updateMatrix();
  clickDomain.updateMatrix();
}

function setCanvasShape() {
  options.squareCanvas
    ? $("#simCanvas").addClass("squareCanvas")
    : $("#simCanvas").removeClass("squareCanvas");
}

function resizeTextures() {
  // Resize the computational domain by interpolating the existing domain onto the new discretisation.
  simDomain.material = copyMaterial;

  // Resize all history terms. We'll do 1->0 then 2->1 etc, then cycle.
  for (let ind = 1; ind < simTextures.length; ind++) {
    uniforms.textureSource.value = simTextures[ind].texture;
    simTextures[ind - 1].setSize(nXDisc, nYDisc);
    renderer.setRenderTarget(simTextures[ind - 1]);
    renderer.render(simScene, simCamera);
  }
  simTextures.rotate(-1);
  simTextures[0].dispose();
  simTextures[0] = simTextures[1].clone();

  postTexture.setSize(nXDisc, nYDisc);
  postprocess();
  // The interpolationTexture will match the number of pixels in the display.
  interpolationTexture.setSize(
    Math.round(devicePixelRatio * canvasWidth),
    Math.round(devicePixelRatio * canvasHeight)
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
      value: new THREE.Vector4(0, 0, 0, 0),
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
    contourColour: {
      type: "v4",
    },
    contourEpsilon: {
      type: "f",
    },
    contourStep: {
      type: "f",
    },
    customSurface: {
      type: "bool",
    },
    embossAmbient: {
      type: "f",
    },
    embossDiffuse: {
      type: "f",
    },
    embossShiny: {
      type: "f",
    },
    embossSmoothness: {
      type: "f",
    },
    embossSpecular: {
      type: "f",
    },
    embossLightDir: {
      type: "vec3",
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
    L_min: {
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
    dxUpscaledScale: {
      type: "f",
    },
    dy: {
      type: "f",
    },
    dyUpscaledScale: {
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
    overlayColour: {
      type: "v4",
    },
    overlayEpsilon: {
      type: "f",
    },
    seed: {
      type: "f",
      value: 0.0,
    },
    textureSource: {
      type: "t",
    },
    textureSource1: {
      type: "t",
    },
    textureSource2: {
      type: "t",
    },
    textureSource3: {
      type: "t",
    },
    t: {
      type: "f",
      value: 0.0,
    },
    vectorField: {
      type: "bool",
      value: true,
    },
  };
}

function initGUI(startOpen) {
  // Initialise the left GUI.
  leftGUI = new dat.GUI({ closeOnTop: true, autoPlace: false });
  leftGUI.domElement.id = "leftGUI";
  document.getElementById("leftGUIContainer").appendChild(leftGUI.domElement);

  // Initialise the right GUI.
  rightGUI = new dat.GUI({ closeOnTop: true, autoPlace: false });
  rightGUI.domElement.id = "rightGUI";
  document.getElementById("rightGUIContainer").appendChild(rightGUI.domElement);

  // Initialise the viewsGUI.
  viewsGUI = new dat.GUI({ closeOnTop: true, autoPlace: false });
  viewsGUI.domElement.id = "viewsGUI";
  document.getElementById("viewsGUIContainer").appendChild(viewsGUI.domElement);

  leftGUI.open();
  rightGUI.open();
  viewsGUI.open();
  if (startOpen != undefined && startOpen) {
    $("#right_ui").show();
    $("#left_ui").show();
  } else {
    $("#left_ui").hide();
    $("#right_ui").hide();
  }

  // Brush folder.
  root = rightGUI.addFolder("Brush");

  const brushButtonList = addButtonList(root);

  addToggle(
    brushButtonList,
    "brushEnabled",
    '<i class="fa-regular fa-brush"></i> Enable brush',
    null,
    null,
    "Toggle the brush on or off"
  );

  root
    .add(options, "brushAction", {
      Replace: "replace",
      Add: "add",
      "Replace (smooth)": "smoothreplace",
      "Add (smooth)": "smoothadd",
    })
    .name("Action")
    .onChange(setBrushType);

  typeOfBrushController = root
    .add(options, "typeOfBrush", {
      Disk: "circle",
      "Horizontal line": "hline",
      "Vertical line": "vline",
    })
    .name("Shape")
    .onChange(setBrushType);

  root.add(options, "brushValue").name("Value").onFinishChange(setBrushType);

  root.add(options, "brushRadius").name("Radius").onFinishChange(setBrushType);

  whatToDrawController = root
    .add(options, "whatToDraw", listOfSpecies)
    .name("Species")
    .onChange(setBrushType);

  // Domain folder.
  root = rightGUI.addFolder("Domain");

  root
    .add(options, "dimension", { 1: 1, 2: 2 })
    .name("Dimension")
    .onChange(function () {
      configureDimension();
      renderIfNotRunning();
    });

  root.add(options, "domainScale").name("Largest side").onFinishChange(resize);

  root.add(options, "spatialStep").name("Space step").onFinishChange(resize);

  const domainButtonList = addButtonList(root);

  addToggle(
    domainButtonList,
    "squareCanvas",
    '<i class="fa-regular fa-square"></i> Square',
    function () {
      setCanvasShape();
      resize();
      configureCameraAndClicks();
    },
    null,
    "Use a square domain"
  );

  addToggle(
    domainButtonList,
    "domainViaIndicatorFun",
    '<i class="fa-regular fa-circle"></i> Implicit',
    function () {
      configureOptions();
      configureGUI();
      setRDEquations();
      setPostFunFragShader();
    },
    null,
    "Determine the domain implicitly"
  );

  domainIndicatorFunController = root
    .add(options, "domainIndicatorFun")
    .name("Ind. fun")
    .onFinishChange(function () {
      configureOptions();
      configureGUI();
      setRDEquations();
      updateWhatToPlot();
    });

  // Timestepping folder.
  root = rightGUI.addFolder("Timestepping");

  numTimestepsPerFrameController = root
    .add(options, "numTimestepsPerFrame", 1, 1000, 1)
    .name("Steps/frame");
  createOptionSlider(numTimestepsPerFrameController, 1, 400, 1);

  dtController = root
    .add(options, "dt")
    .name("Timestep")
    .onChange(function () {
      updateUniforms();
    });
  dtController.__precision = 12;
  dtController.min(0);
  dtController.updateDisplay();

  root
    .add(options, "timesteppingScheme", {
      "Forward Euler": "Euler",
      "Adams-Bashforth 2": "AB2",
      "Midpoint Method": "Mid",
      "Runge-Kutta 4": "RK4",
    })
    .name("Scheme");

  const timeButtonList = addButtonList(root);
  addToggle(
    timeButtonList,
    "timeDisplay",
    '<i class="fa-regular fa-stopwatch"></i> Elapsed time',
    configureTimeDisplay,
    null,
    "Show/hide time display"
  );

  // Equations folder.
  root = rightGUI.addFolder("Equations");

  // Number of species.
  root
    .add(options, "numSpecies", { 1: 1, 2: 2, 3: 3, 4: 4 })
    .name("No. species")
    .onChange(updateProblem);

  // Number of algebraic species.
  algebraicSpeciesController = root
    .add(options, "numAlgebraicSpecies", { 0: 0, 1: 1, 2: 2, 3: 3 })
    .name("No. algebraic")
    .onChange(function () {
      updatingAlgebraicSpecies = true;
      updateProblem();
      updatingAlgebraicSpecies = false;
    });

  root
    .add(options, "speciesNames")
    .name("Species names")
    .onFinishChange(function () {
      setCustomNames();
    });

  root
    .add(options, "reactionNames")
    .name("Reactions")
    .onFinishChange(function () {
      setCustomNames();
    });

  // Cross diffusion.
  const crossDiffusionButtonList = addButtonList(root);
  addToggle(
    crossDiffusionButtonList,
    "crossDiffusion",
    '<i class="fa-regular fa-arrow-down-up-across-line"></i> Cross diffusion',
    updateProblem,
    "cross_diffusion_controller",
    "Toggle cross diffusion"
  );

  // Let's put these in the left GUI.
  // Definitions folder.
  root = leftGUI.addFolder("Definitions");

  const defButtonList = addButtonList(root);
  addToggle(
    defButtonList,
    "typesetCustomEqs",
    '<i class="fa-regular fa-square-root-variable"></i> Typeset',
    setEquationDisplayType,
    null,
    "Typeset the specified equations"
  );

  DuuController = root
    .add(options, "diffusionStrUU")
    .onFinishChange(function () {
      setRDEquations();
      setEquationDisplayType();
    });
  setOnfocus(DuuController, selectTeX, ["D", "U", "UU"]);
  setOnblur(DuuController, deselectTeX, ["D", "U", "UU"]);

  DuvController = root
    .add(options, "diffusionStrUV")
    .onFinishChange(function () {
      setRDEquations();
      setEquationDisplayType();
    });
  setOnfocus(DuvController, selectTeX, ["UV"]);
  setOnblur(DuvController, deselectTeX, ["UV"]);

  DuwController = root
    .add(options, "diffusionStrUW")
    .onFinishChange(function () {
      setRDEquations();
      setEquationDisplayType();
    });
  setOnfocus(DuwController, selectTeX, ["UW"]);
  setOnblur(DuwController, deselectTeX, ["UW"]);

  DuqController = root
    .add(options, "diffusionStrUQ")
    .onFinishChange(function () {
      setRDEquations();
      setEquationDisplayType();
    });
  setOnfocus(DuqController, selectTeX, ["UQ"]);
  setOnblur(DuqController, deselectTeX, ["UQ"]);

  DvuController = root
    .add(options, "diffusionStrVU")
    .onFinishChange(function () {
      setRDEquations();
      setEquationDisplayType();
    });
  setOnfocus(DvuController, selectTeX, ["VU"]);
  setOnblur(DvuController, deselectTeX, ["VU"]);

  DvvController = root
    .add(options, "diffusionStrVV")
    .onFinishChange(function () {
      setRDEquations();
      setEquationDisplayType();
    });
  setOnfocus(DvvController, selectTeX, ["V", "VV"]);
  setOnblur(DvvController, deselectTeX, ["V", "VV"]);

  DvwController = root
    .add(options, "diffusionStrVW")
    .onFinishChange(function () {
      setRDEquations();
      setEquationDisplayType();
    });
  setOnfocus(DvwController, selectTeX, ["VW"]);
  setOnblur(DvwController, deselectTeX, ["VW"]);

  DvqController = root
    .add(options, "diffusionStrVQ")
    .onFinishChange(function () {
      setRDEquations();
      setEquationDisplayType();
    });
  setOnfocus(DvqController, selectTeX, ["VQ"]);
  setOnblur(DvqController, deselectTeX, ["VQ"]);

  DwuController = root
    .add(options, "diffusionStrWU")
    .onFinishChange(function () {
      setRDEquations();
      setEquationDisplayType();
    });
  setOnfocus(DwuController, selectTeX, ["WU"]);
  setOnblur(DwuController, deselectTeX, ["WU"]);

  DwvController = root
    .add(options, "diffusionStrWV")
    .onFinishChange(function () {
      setRDEquations();
      setEquationDisplayType();
    });
  setOnfocus(DwvController, selectTeX, ["WV"]);
  setOnblur(DwvController, deselectTeX, ["WV"]);

  DwwController = root
    .add(options, "diffusionStrWW")
    .onFinishChange(function () {
      setRDEquations();
      setEquationDisplayType();
    });
  setOnfocus(DwwController, selectTeX, ["W", "WW"]);
  setOnblur(DwwController, deselectTeX, ["W", "WW"]);

  DwqController = root
    .add(options, "diffusionStrWQ")
    .onFinishChange(function () {
      setRDEquations();
      setEquationDisplayType();
    });
  setOnfocus(DwqController, selectTeX, ["WQ"]);
  setOnblur(DwqController, deselectTeX, ["WQ"]);

  DquController = root
    .add(options, "diffusionStrQU")
    .onFinishChange(function () {
      setRDEquations();
      setEquationDisplayType();
    });
  setOnfocus(DquController, selectTeX, ["QU"]);
  setOnblur(DquController, deselectTeX, ["QU"]);

  DqvController = root
    .add(options, "diffusionStrQV")
    .onFinishChange(function () {
      setRDEquations();
      setEquationDisplayType();
    });
  setOnfocus(DqvController, selectTeX, ["QV"]);
  setOnblur(DqvController, deselectTeX, ["QV"]);

  DqwController = root
    .add(options, "diffusionStrQW")
    .onFinishChange(function () {
      setRDEquations();
      setEquationDisplayType();
    });
  setOnfocus(DqwController, selectTeX, ["QW"]);
  setOnblur(DqwController, deselectTeX, ["QW"]);

  DqqController = root
    .add(options, "diffusionStrQQ")
    .onFinishChange(function () {
      setRDEquations();
      setEquationDisplayType();
    });
  setOnfocus(DqqController, selectTeX, ["Q", "QQ"]);
  setOnblur(DqqController, deselectTeX, ["Q", "QQ"]);

  // Custom f(u,v) and g(u,v).
  fController = root.add(options, "reactionStrU").onFinishChange(function () {
    setRDEquations();
    setEquationDisplayType();
  });
  setOnfocus(fController, selectTeX, ["UFUN"]);
  setOnblur(fController, deselectTeX, ["UFUN"]);

  gController = root.add(options, "reactionStrV").onFinishChange(function () {
    setRDEquations();
    setEquationDisplayType();
  });
  setOnfocus(gController, selectTeX, ["VFUN"]);
  setOnblur(gController, deselectTeX, ["VFUN"]);

  hController = root.add(options, "reactionStrW").onFinishChange(function () {
    setRDEquations();
    setEquationDisplayType();
  });
  setOnfocus(hController, selectTeX, ["WFUN"]);
  setOnblur(hController, deselectTeX, ["WFUN"]);

  jController = root.add(options, "reactionStrQ").onFinishChange(function () {
    setRDEquations();
    setEquationDisplayType();
  });
  setOnfocus(jController, selectTeX, ["QFUN"]);
  setOnblur(jController, deselectTeX, ["QFUN"]);

  parametersFolder = leftGUI.addFolder("Parameters");
  setParamsFromKineticString();

  // Boundary conditions folder.
  root = leftGUI.addFolder("Boundary conditions");

  uBCsController = root
    .add(options, "boundaryConditionsU", {
      Periodic: "periodic",
      Dirichlet: "dirichlet",
      Neumann: "neumann",
      Robin: "robin",
      Combination: "combo",
    })
    .onChange(function () {
      setRDEquations();
      setBCsGUI();
    });

  dirichletUController = root
    .add(options, "dirichletStrU")
    .onFinishChange(setRDEquations);

  neumannUController = root
    .add(options, "neumannStrU")
    .onFinishChange(setRDEquations);

  robinUController = root
    .add(options, "robinStrU")
    .onFinishChange(setRDEquations);

  comboUController = root
    .add(options, "comboStrU")
    .name("Details")
    .onFinishChange(setRDEquations);

  vBCsController = root
    .add(options, "boundaryConditionsV", {
      Periodic: "periodic",
      Dirichlet: "dirichlet",
      Neumann: "neumann",
      Robin: "robin",
      Combination: "combo",
    })
    .onChange(function () {
      setRDEquations();
      setBCsGUI();
    });

  dirichletVController = root
    .add(options, "dirichletStrV")
    .onFinishChange(setRDEquations);

  neumannVController = root
    .add(options, "neumannStrV")
    .onFinishChange(setRDEquations);

  robinVController = root
    .add(options, "robinStrV")
    .onFinishChange(setRDEquations);

  comboVController = root
    .add(options, "comboStrV")
    .name("Details")
    .onFinishChange(setRDEquations);

  wBCsController = root
    .add(options, "boundaryConditionsW", {
      Periodic: "periodic",
      Dirichlet: "dirichlet",
      Neumann: "neumann",
      Robin: "robin",
      Combination: "combo",
    })
    .onChange(function () {
      setRDEquations();
      setBCsGUI();
    });

  dirichletWController = root
    .add(options, "dirichletStrW")
    .onFinishChange(setRDEquations);

  neumannWController = root
    .add(options, "neumannStrW")
    .onFinishChange(setRDEquations);

  robinWController = root
    .add(options, "robinStrW")
    .onFinishChange(setRDEquations);

  comboWController = root
    .add(options, "comboStrW")
    .name("Details")
    .onFinishChange(setRDEquations);

  qBCsController = root
    .add(options, "boundaryConditionsQ", {
      Periodic: "periodic",
      Dirichlet: "dirichlet",
      Neumann: "neumann",
      Robin: "robin",
      Combination: "combo",
    })
    .name("$q$")
    .onChange(function () {
      setRDEquations();
      setBCsGUI();
    });

  dirichletQController = root
    .add(options, "dirichletStrQ")
    .onFinishChange(setRDEquations);

  neumannQController = root
    .add(options, "neumannStrQ")
    .onFinishChange(setRDEquations);

  robinQController = root
    .add(options, "robinStrQ")
    .onFinishChange(setRDEquations);

  comboQController = root
    .add(options, "comboStrQ")
    .name("Details")
    .onFinishChange(setRDEquations);

  // Initial conditions folder.
  root = leftGUI.addFolder("Initial conditions");

  clearValueUController = root
    .add(options, "clearValueU")
    .onFinishChange(setClearShader);

  clearValueVController = root
    .add(options, "clearValueV")
    .onFinishChange(setClearShader);

  clearValueWController = root
    .add(options, "clearValueW")
    .onFinishChange(setClearShader);

  clearValueQController = root
    .add(options, "clearValueQ")
    .onFinishChange(setClearShader);

  // Images folder.
  fIm = rightGUI.addFolder("Images");
  root = fIm;
  // Always make images controller, but hide them if they're not wanted.
  createImageControllers();

  // Saving/loading folder.
  root = rightGUI.addFolder("Checkpoints");

  // Checkpoints override initial condition.
  const checkpointButtons = addButtonList(root);

  addToggle(
    checkpointButtons,
    "resetFromCheckpoints",
    "Enable checkpoints",
    null,
    "checkpointButton"
  );

  // Force a newline.
  addNewline(checkpointButtons);
  addButton(
    checkpointButtons,
    '<i class="fa-regular fa-flag"></i> Set',
    saveSimState,
    null,
    "Set a checkpoint at the current state",
    ["narrow"]
  );
  addButton(
    checkpointButtons,
    '<i class="fa-regular fa-file-arrow-down"></i> Export',
    exportSimState,
    null,
    "Download the last checkpoint as a file",
    ["narrow"]
  );
  addButton(
    checkpointButtons,
    '<i class="fa-regular fa-file-arrow-up"></i> Import',
    function () {
      $("#checkpointInput").click();
    },
    null,
    "Upload a checkpoint file",
    ["narrow"]
  );

  root
    .add(options, "resizeCheckpoints", { Stretch: "stretch", Crop: "crop" })
    .name("Resize");

  // Miscellaneous folder.
  root = rightGUI.addFolder("Misc.");

  root
    .addColor(options, "backgroundColour")
    .name("Background")
    .onChange(function () {
      scene.background = new THREE.Color(options.backgroundColour);
      renderIfNotRunning();
    });

  const miscButtons = addButtonList(root);

  addToggle(
    miscButtons,
    "integrate",
    '<i class="fa-regular fa-chart-area"></i> Integrate',
    function () {
      configureIntegralDisplay();
      renderIfNotRunning();
    },
    null,
    "Compute the integral of the plotted expression over the domain"
  );

  addToggle(
    miscButtons,
    "forceManualInterpolation",
    '<i class="fa-regular fa-bezier-curve"></i> Interpolate',
    configureManualInterpolation,
    "interpController",
    "Override your device's default smoothing and perform bilinear interpolation of the display"
  );

  addToggle(
    miscButtons,
    "fixRandSeed",
    '<i class="fa-regular fa-shuffle"></i> Fix seed',
    null,
    null,
    "Fix the random seed"
  );

  // Copy configuration as raw JSON.
  addButton(
    miscButtons,
    '<i class="fa-regular fa-copy"></i> Copy code',
    copyConfigAsJSON,
    null,
    "Copy the simulation configuration as JSON"
  );

  root = root.addFolder("Debug");
  // Debug.
  // Copy configuration as raw JSON.
  const debugButtonList = addButtonList(root);
  addButton(debugButtonList, "Copy debug information", copyDebug);

  // Add a title to the rightGUI.
  const settingsTitle = document.createElement("div");
  settingsTitle.innerHTML = "Settings";
  settingsTitle.classList.add("ui_title");
  rightGUI.domElement.prepend(settingsTitle);

  // Add a title to the leftGUI.
  const equationsTitle = document.createElement("div");
  equationsTitle.innerHTML = "Equations";
  equationsTitle.classList.add("ui_title");
  leftGUI.domElement.prepend(equationsTitle);

  // Populate the viewsGUI.
  // Create a custom element for containing the view options.
  const viewsList = document.createElement("div");
  viewsList.id = "views_list";
  viewsGUI.domElement.prepend(viewsList);
  const viewsTitle = document.createElement("div");
  viewsTitle.innerHTML =
    "Views<a id='add_view' title='New view'><i class='fa-solid fa-plus'></i></a>";
  viewsTitle.classList.add("ui_title");
  viewsGUI.domElement.prepend(viewsTitle);

  editViewFolder = viewsGUI.addFolder("Edit view");
  root = editViewFolder;

  const editViewButtons = addButtonList(root, "edit_view_buttons");

  addButton(
    editViewButtons,
    '<i class="fa-solid fa-pen-nib"></i> Rename',
    editCurrentViewName,
    null,
    "Rename the current view"
  ); // Rename
  addButton(
    editViewButtons,
    '<i class="fa-solid fa-xmark"></i> Delete',
    deleteView,
    "deleteViewButton",
    "Delete view"
  ); // Delete

  whatToPlotController = root
    .add(options, "whatToPlot")
    .name("Expression: ")
    .onFinishChange(function () {
      updateWhatToPlot();
      renderIfNotRunning();
      updateView(this.property);
    });

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
      renderIfNotRunning();
      updateView(this.property);
    });

  root
    .add(options, "colourmap", {
      BlckGrnYllwRdWht: "BlackGreenYellowRedWhite",
      "Blue-Magenta": "blue-magenta",
      Diverging: "diverging",
      Greyscale: "greyscale",
      Foliage: "foliage",
      Ice: "ice",
      "Lava flow": "lavaflow",
      Midnight: "midnight",
      Pastels: "pastels",
      "Simply blue": "blue",
      "Snow Ghost": "snowghost",
      Thermal: "thermal",
      Turbo: "turbo",
      Viridis: "viridis",
      Water: "water",
    })
    .onChange(function () {
      setDisplayColourAndType();
      configureColourbar();
      updateView(this.property);
    })
    .name("Colour map");

  minColourValueController = root
    .add(options, "minColourValue")
    .name("Min value")
    .onChange(function () {
      updateUniforms();
      updateColourbarLims();
      renderIfNotRunning();
      updateView(this.property);
    });
  minColourValueController.__precision = 2;

  maxColourValueController = root
    .add(options, "maxColourValue")
    .name("Max value")
    .onChange(function () {
      updateUniforms();
      updateColourbarLims();
      renderIfNotRunning();
      updateView(this.property);
    });
  maxColourValueController.__precision = 2;

  const effectsButtons = addButtonList(root, "colour_map_buttons");

  addButton(
    effectsButtons,
    '<i class="fa-regular fa-arrows-rotate"></i> Flip',
    function () {
      options.flippedColourmap = !options.flippedColourmap;
      setDisplayColourAndType();
      configureColourbar();
      updateView("flippedColourmap");
    },
    null,
    "Reverse colour map",
    ["narrow"]
  );

  addButton(
    effectsButtons,
    '<i class="fa-solid fa-arrows-left-right-to-line"></i> Snap',
    function () {
      setColourRange();
      render();
      updateView("minColourValue");
      updateView("maxColourValue");
    },
    null,
    "Snap min/max to visible",
    ["narrow"]
  );

  addToggle(
    effectsButtons,
    "colourbar",
    '<i class="fa-solid fa-bars-progress"></i> Bar',
    function () {
      configureColourbar();
      updateView("colourbar");
    },
    null,
    "Display the colourbar",
    null,
    ["narrow"]
  );

  addNewline(effectsButtons);

  addToggle(
    effectsButtons,
    "autoSetColourRange",
    '<i class="fa-solid fa-wand-magic-sparkles"></i> Auto snap',
    function () {
      if (options.autoSetColourRange) {
        setColourRange();
        render();
      }
      updateView("autoSetColourRange");
    },
    null,
    "Automatically snap range",
    null,
    ["wide"]
  );

  addToggle(
    effectsButtons,
    "contours",
    '<i class="fa-solid fa-bullseye"></i> Contours',
    function () {
      setDisplayColourAndType();
      updateView("contours");
    },
    "contourButton",
    "Toggle contours",
    "contoursFolder",
    ["wide"]
  );

  addToggle(
    effectsButtons,
    "emboss",
    '<i class="fa-solid fa-lightbulb"></i> Lighting',
    function () {
      setDisplayColourAndType();
      updateView("emboss");
    },
    "embossButton",
    "Toggle lighting",
    "embossFolder",
    ["wide"]
  );

  addToggle(
    effectsButtons,
    "overlay",
    '<i class="fa-solid fa-chart-line"></i> Overlay',
    function () {
      setDisplayColourAndType();
      updateView("overlay");
    },
    null,
    "Toggle overlay",
    "overlayFolder",
    ["wide"]
  );

  addToggle(
    effectsButtons,
    "vectorField",
    '<i class="fa-solid fa-arrow-right-arrow-left"></i> Vector field',
    function () {
      configureVectorField();
      renderIfNotRunning();
      updateView("vectorField");
    },
    "vectorFieldButton",
    "Toggle vector field",
    "vectorFieldFolder",
    ["wide"]
  );

  root = editViewFolder.addFolder("Contours");
  root.domElement.id = "contoursFolder";

  root
    .addColor(options, "contourColour")
    .name("Colour")
    .onChange(function () {
      setContourUniforms();
      renderIfNotRunning();
      updateView(this.property);
    });

  contoursControllers.push(
    root
      .add(options, "contourNum")
      .name("Number")
      .onChange(function () {
        setContourUniforms();
        renderIfNotRunning();
        updateView(this.property);
      })
  );
  createOptionSlider(contoursControllers.last(), 1, 20, 1);

  contoursControllers.push(
    root
      .add(options, "contourEpsilon")
      .name("Threshold")
      .onChange(function () {
        setContourUniforms();
        renderIfNotRunning();
        updateView(this.property);
      })
  );
  createOptionSlider(contoursControllers.last(), 0.001, 0.05, 0.001);

  root = editViewFolder.addFolder("Lighting");
  root.domElement.id = "embossFolder";

  embossControllers.push(
    root
      .add(options, "embossSmoothness")
      .name("Smoothness")
      .onChange(function () {
        setEmbossUniforms();
        renderIfNotRunning();
        updateView(this.property);
      })
  );
  createOptionSlider(embossControllers.last(), 0, 2, 0.001);

  embossControllers.push(
    root
      .add(options, "embossAmbient")
      .name("Ambient")
      .onChange(function () {
        setEmbossUniforms();
        renderIfNotRunning();
        updateView(this.property);
      })
  );
  createOptionSlider(embossControllers.last(), 0, 1, 0.001);

  embossControllers.push(
    root
      .add(options, "embossDiffuse")
      .name("Diffuse")
      .onChange(function () {
        setEmbossUniforms();
        renderIfNotRunning();
        updateView(this.property);
      })
  );
  createOptionSlider(embossControllers.last(), 0, 1, 0.001);

  embossControllers.push(
    root
      .add(options, "embossSpecular")
      .name("Specular")
      .onChange(function () {
        setEmbossUniforms();
        renderIfNotRunning();
        updateView(this.property);
      })
  );
  createOptionSlider(embossControllers.last(), 0, 1, 0.001);

  embossControllers.push(
    root
      .add(options, "embossShiny")
      .name("Precision")
      .onChange(function () {
        setEmbossUniforms();
        renderIfNotRunning();
        updateView(this.property);
      })
  );
  createOptionSlider(embossControllers.last(), 0, 100, 1);

  embossControllers.push(
    root
      .add(options, "embossTheta")
      .name("Inclination")
      .onChange(function () {
        setEmbossUniforms();
        renderIfNotRunning();
        updateView(this.property);
      })
  );
  createOptionSlider(embossControllers.last(), 0, 1.5708, 0.001);

  embossControllers.push(
    root
      .add(options, "embossPhi")
      .name("Direction")
      .onChange(function () {
        setEmbossUniforms();
        renderIfNotRunning();
        updateView(this.property);
      })
  );
  createOptionSlider(embossControllers.last(), 0, 3.1456, 0.001);

  root = editViewFolder.addFolder("Overlay");
  root.domElement.id = "overlayFolder";

  root
    .addColor(options, "overlayColour")
    .name("Colour")
    .onChange(function () {
      setOverlayUniforms();
      renderIfNotRunning();
      updateView(this.property);
    });

  root
    .add(options, "overlayExpr")
    .name("Expression")
    .onFinishChange(function () {
      setDisplayColourAndType();
      updateView(this.property);
    });

  root
    .add(options, "overlayEpsilon")
    .name("Threshold")
    .onChange(function () {
      setOverlayUniforms();
      renderIfNotRunning();
      updateView(this.property);
    });

  linesAnd3DFolder = editViewFolder.addFolder("3D");
  root = linesAnd3DFolder;

  const surfaceButtons = addButtonList(root);

  addToggle(
    surfaceButtons,
    "customSurface",
    '<i class="fa-regular fa-wave-square"></i> Custom surface',
    function () {
      uniforms.customSurface.value = options.customSurface;
      setSurfaceShader();
      configureCustomSurfaceControllers();
      renderIfNotRunning();
      updateView("customSurface");
    },
    "customSurfaceToggle",
    "Plot the solution on a custom surface"
  );

  surfaceFunController = root
    .add(options, "surfaceFun")
    .name("Surface $z=$ ")
    .onFinishChange(function () {
      updateWhatToPlot();
      renderIfNotRunning();
      updateView(this.property);
    });

  threeDHeightScaleController = root
    .add(options, "threeDHeightScale")
    .name("Max height")
    .onChange(function () {
      updateUniforms();
      updateView(this.property);
    });

  cameraThetaController = root
    .add(options, "cameraTheta")
    .name("View $\\theta$")
    .onChange(function () {
      configureCameraAndClicks();
      updateView(this.property);
    });

  cameraPhiController = root
    .add(options, "cameraPhi")
    .name("View $\\phi$")
    .onChange(function () {
      configureCameraAndClicks();
      updateView(this.property);
    });

  cameraZoomController = root
    .add(options, "cameraZoom")
    .name("Zoom")
    .onChange(function () {
      configureCameraAndClicks();
      updateView(this.property);
    });

  lineWidthMulController = root
    .add(options, "lineWidthMul", 0.1, 2)
    .name("Thickness")
    .onChange(function () {
      setLineWidth();
      render();
      updateView(this.property);
    });

  vectorFieldFolder = editViewFolder.addFolder("Vector field");
  root = vectorFieldFolder;
  root.domElement.id = "vectorFieldFolder";

  root
    .addColor(options, "arrowColour")
    .name("Colour")
    .onChange(function () {
      updateArrowColour();
      renderIfNotRunning();
      updateView(this.property);
    });

  root
    .add(options, "arrowX")
    .onFinishChange(function () {
      setPostFunFragShader();
      renderIfNotRunning();
      updateView(this.property);
    })
    .name("$x$ component");

  root
    .add(options, "arrowY")
    .onFinishChange(function () {
      setPostFunFragShader();
      renderIfNotRunning();
      updateView(this.property);
    })
    .name("$y$ component");

  arrowDensityController = root
    .add(options, "arrowDensity")
    .onChange(function () {
      configureVectorField();
      renderIfNotRunning();
      updateView(this.property);
    })
    .name("Density");
  arrowDensityController.__precision = 2;
  createOptionSlider(arrowDensityController, 0, 1, 0.001);

  root
    .add(options, "arrowScale", {
      None: "none",
      Relative: "relative",
      Auto: "auto",
    })
    .onFinishChange(function () {
      configureGUI();
      renderIfNotRunning();
      updateView(this.property);
    })
    .name("Scaling");

  arrowLengthMaxController = root
    .add(options, "arrowLengthMax")
    .onFinishChange(function () {
      configureVectorField();
      renderIfNotRunning();
      updateView(this.property);
    })
    .name("Max length");

  const inputs = document.querySelectorAll("input");
  inputs.forEach((input) => disableAutocorrect(input));
}

function animate() {
  requestAnimationFrame(animate);

  hasDrawn = isDrawing;
  // Draw on any input from the user, which can happen even if timestepping is not running.
  if (isDrawing && options.brushEnabled) {
    draw();
  }

  // Only timestep if the simulation is running.
  if (isRunning) {
    // Ensure that any Dirichlet BCs are satisfied before timestepping (required due to brushes/init condition).
    anyDirichletBCs ? enforceDirichlet() : {};
    // Perform a number of timesteps per frame.
    for (let i = 0; i < options.numTimestepsPerFrame; i++) {
      if (shaderContainsRAND && !options.fixRandSeed) updateRandomSeed();
      timestep();
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
  let shaderStr = kineticUniformsForShader() + drawShaderTop();
  let radiusStr =
    "float brushRadius = " +
    parseShaderString(options.brushRadius.toString()) +
    ";\n";

  // If the radius string contains any references to u,v,w,q, replace them with references to the species at the
  // brush centre, not the current pixel.
  radiusStr = radiusStr.replace(/\buvwq\./g, "uvwqBrush.");
  // If the radius string contains any references to I_S or I_T, replace them with references to the value at the
  // brush centre, not the current pixel.
  radiusStr = radiusStr.replace(/\b(I_[ST])([RGBA]?)\b/g, "$1Brush$2");

  // If a random number has been requested, insert calculation of a random number.
  if (/\bRAND\b/.test(options.brushValue)) {
    shaderStr += randShader();
  }
  if (/\bRANDN\b/.test(options.brushValue)) {
    shaderStr += randNShader();
  }
  shaderStr +=
    "float brushValue = " + parseShaderString(options.brushValue) + ";\n";

  // Configure the shape of the brush.
  shaderStr += radiusStr;
  switch (options.typeOfBrush) {
    case "circle":
      shaderStr += drawShaderShapeDisc();
      break;
    case "hline":
      shaderStr += drawShaderShapeHLine();
      break;
    case "vline":
      shaderStr += drawShaderShapeVLine();
      break;
  }
  // Configure the action of the brush.
  switch (options.brushAction) {
    case "replace":
      shaderStr += drawShaderFactorSharp();
      shaderStr += drawShaderBotReplace();
      break;
    case "add":
      shaderStr += drawShaderFactorSharp();
      shaderStr += drawShaderBotAdd();
      break;
    case "smoothreplace":
      shaderStr += drawShaderFactorSmooth();
      shaderStr += drawShaderBotReplace();
      break;
    case "smoothadd":
      shaderStr += drawShaderFactorSmooth();
      shaderStr += drawShaderBotAdd();
      break;
  }
  // Substitute in the correct colour code.
  shaderStr = selectColourspecInShaderStr(shaderStr);
  drawMaterial.fragmentShader = shaderStr;
  drawMaterial.needsUpdate = true;
}

function setDisplayColourAndType() {
  colourmap = getColours(options.colourmap);
  if (options.flippedColourmap) {
    colourmap.reverse();
    colourmap = colourmap.map((x) => x.slice(0, -1).concat([1 - x.slice(-1)]));
  }

  uniforms.colour1.value = new THREE.Vector4(...colourmap[0]);
  uniforms.colour2.value = new THREE.Vector4(...colourmap[1]);
  uniforms.colour3.value = new THREE.Vector4(...colourmap[2]);
  uniforms.colour4.value = new THREE.Vector4(...colourmap[3]);
  uniforms.colour5.value = new THREE.Vector4(...colourmap[4]);
  let shader = kineticUniformsForShader() + fiveColourDisplayTop();
  if (options.emboss) {
    shader += embossShader();
    setEmbossUniforms();
  }
  if (options.contours) {
    shader += contourShader();
    setContourUniforms();
  }
  if (options.overlay) {
    shader += overlayShader().replaceAll(
      "OVERLAYEXPR",
      parseShaderString(options.overlayExpr)
    );
    setOverlayUniforms();
  }
  shader += fiveColourDisplayBot();
  displayMaterial.fragmentShader = shader;
  displayMaterial.needsUpdate = true;
  postMaterial.needsUpdate = true;
  colourmapEndpoints = colourmap.map((x) => x[3]);
  colourmap = colourmap.map((x) => x.slice(0, -1));
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
  let regex = /\bFUN\b/g;
  shaderStr = shaderStr.replace(regex, parseShaderString(options.whatToPlot));
  regex = /\bHEIGHT\b/g;
  shaderStr = shaderStr.replace(regex, parseShaderString(options.surfaceFun));
  return shaderStr;
}

function draw() {
  // Update the random seed if we're drawing using random.
  if (!options.fixRandSeed && options.brushValue.includes("RAND")) {
    updateRandomSeed();
  }

  simDomain.material = drawMaterial;
  // We'll draw onto all history terms. We'll do 1->0 then 2->1 etc, then cycle.
  for (let ind = 1; ind < simTextures.length; ind++) {
    uniforms.textureSource.value = simTextures[ind].texture;
    renderer.setRenderTarget(simTextures[ind - 1]);
    renderer.render(simScene, simCamera);
  }
  simTextures.rotate(-1);
}

function timestep() {
  // We timestep by updating a texture that stores the solutions. We can't overwrite
  // the texture in the loop, so we'll cycle between textures. These
  // textures are already defined above, and their resolution defines the resolution
  // of solution.

  // Use the scheme specified in options.timesteppingScheme.
  switch (options.timesteppingScheme) {
    case "Euler":
      simDomain.material = simMaterials["FE"];
      uniforms.textureSource.value = simTextures[1].texture;
      uniforms.textureSource1.value = simTextures[2].texture;
      uniforms.dt.value = options.dt;
      renderer.setRenderTarget(simTextures[0]);
      renderer.render(simScene, simCamera);
      simTextures.rotate(-1);
      uniforms.t.value += options.dt;
      break;
    case "AB2":
      simDomain.material = simMaterials["AB2"];
      uniforms.textureSource.value = simTextures[1].texture;
      uniforms.textureSource1.value = simTextures[2].texture;
      uniforms.dt.value = options.dt;
      renderer.setRenderTarget(simTextures[0]);
      renderer.render(simScene, simCamera);
      simTextures.rotate(-1);
      uniforms.t.value += options.dt;
      break;
    case "Mid":
      // We'll use simTextures as [result, previous, k1].
      // Compute k1 in [2]. Mid1
      simDomain.material = simMaterials["Mid1"];
      uniforms.textureSource.value = simTextures[1].texture;
      renderer.setRenderTarget(simTextures[2]);
      renderer.render(simScene, simCamera);

      // Compute the new value in [0] by computing k2 using k1. Mid2
      simDomain.material = simMaterials["Mid2"];
      uniforms.textureSource1.value = simTextures[2].texture;
      uniforms.t.value += 0.5 * options.dt;
      renderer.setRenderTarget(simTextures[0]);
      renderer.render(simScene, simCamera);
      simTextures.rotate(-1);
      uniforms.t.value += 0.5 * options.dt;
      break;
    case "RK4":
      // We'll use simTextures as [result, previous, k1, k2, k3].

      // Compute k1 in [2]. RK41
      simDomain.material = simMaterials["RK41"];
      uniforms.textureSource.value = simTextures[1].texture;
      renderer.setRenderTarget(simTextures[2]);
      renderer.render(simScene, simCamera);

      // Compute k2 in [3] using previous [1] and k1 [2]. RK42
      simDomain.material = simMaterials["RK42"];
      uniforms.textureSource1.value = simTextures[2].texture;
      uniforms.t.value += 0.5 * options.dt;
      renderer.setRenderTarget(simTextures[3]);
      renderer.render(simScene, simCamera);

      // Compute k3 in [4] using previous [1] and k2 [3]. RK43
      simDomain.material = simMaterials["RK43"];
      uniforms.textureSource2.value = simTextures[3].texture;
      renderer.setRenderTarget(simTextures[4]);
      renderer.render(simScene, simCamera);

      // Compute the new value in [0] by computing k4 using k1, k2, k3. RK44
      simDomain.material = simMaterials["RK44"];
      uniforms.textureSource3.value = simTextures[4].texture;
      uniforms.t.value += 0.5 * options.dt;
      renderer.setRenderTarget(simTextures[0]);
      renderer.render(simScene, simCamera);
      simTextures.rotate(-1);
      break;
  }
}

function enforceDirichlet() {
  // Enforce any Dirichlet boundary conditions.
  simDomain.material = dirichletMaterial;
  // We'll do 1->0 then 2->1 etc, then cycle.
  for (let ind = 1; ind < simTextures.length; ind++) {
    uniforms.textureSource.value = simTextures[ind].texture;
    renderer.setRenderTarget(simTextures[ind - 1]);
    renderer.render(simScene, simCamera);
  }
  simTextures.rotate(-1);
}

function render() {
  // If selected, set the colour range.
  if (options.autoSetColourRange) {
    setColourRange();
  }

  // Update the position of the click domain for easy clicking.
  if (options.brushEnabled && options.plotType == "surface") {
    let val = 0;
    if (options.maxColourValue - options.minColourValue > 0) {
      val =
        (getMeanVal() - options.minColourValue) /
          (options.maxColourValue - options.minColourValue) -
        0.5;
      val = val.clamp(-0.5, 0.5);
    }
    clickDomain.position.y = options.threeDHeightScale * val;
    clickDomain.updateWorldMatrix();
  }

  // Perform any postprocessing on the last computed values.
  postprocess();

  // If this is a line plot, modify the line positions and colours before rendering.
  if (options.plotType == "line") {
    // Get the output from the buffer, in the form of (value,0,0,1).
    fillBuffer();
    let scaledValue,
      ind = 0;
    var range = options.maxColourValue - options.minColourValue;
    range = range == 0 ? 0.5 : range;
    for (let i = 0; i < buffer.length; i += 4) {
      scaledValue = (buffer[i] - options.minColourValue) / range - 0.5;
      // Set the height.
      yDisplayDomainCoords[ind++] = scaledValue.clamp(-0.5, 0.5);
    }
    // Use spline-smoothed points to use for plotting.
    const curve = new THREE.SplineCurve(
      xDisplayDomainCoords.map(
        (x, ind) => new THREE.Vector2(x, yDisplayDomainCoords[ind])
      )
    );
    const points = curve.getSpacedPoints(numPointsInLine);
    setLineXY(points);
    setLineColour(points);
  }

  // If a vector field is requested, update arrows. They will already be set as visible.
  if (options.vectorField && arrowGroup) {
    // Update the direction of each arrow using the b and a components of postTexture.
    getPostState();
    let ind,
      xComp,
      yComp,
      sizes = [];
    for (const arrow of arrowGroup.children) {
      ind = 4 * arrow.ind;
      xComp = postBuffer[ind + 2];
      yComp = postBuffer[ind + 3];
      arrow.visible = postBuffer[ind + 1] <= 0.5;
      arrow.lookAt(
        arrow.position.x + xComp,
        arrow.position.y + yComp,
        arrow.position.z
      );
      arrow.size = xComp ** 2 + yComp ** 2;
      sizes.push(arrow.size);
    }
    let maxSize = 1;
    switch (options.arrowScale) {
      case "auto":
        maxSize = Math.sqrt(Math.max(...sizes));
        if (maxSize == 0) maxSize = 1;
        for (const arrow of arrowGroup.children) {
          const scale =
            baseArrowScale * lerp(0.1, 1.5, Math.sqrt(arrow.size) / maxSize);
          arrow.scale.set(scale, scale, scale);
        }
        break;
      case "relative":
        maxSize = arrowGroup.customMax > 0 ? arrowGroup.customMax : 1;
        for (const arrow of arrowGroup.children) {
          const scale =
            baseArrowScale * lerp(0.1, 1.5, Math.sqrt(arrow.size) / maxSize);
          arrow.scale.set(scale, scale, scale);
        }
        break;
      case "none":
        for (const arrow of arrowGroup.children) {
          arrow.scale.set(baseArrowScale, baseArrowScale, baseArrowScale);
        }
        break;
    }
  }

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
    uniforms.dxUpscaledScale.value = (devicePixelRatio * canvasWidth) / nXDisc;
    uniforms.dyUpscaledScale.value = (devicePixelRatio * canvasHeight) / nYDisc;
  } else {
    uniforms.dxUpscaledScale.value = 1;
    uniforms.dyUpscaledScale.value = 1;
  }

  // Render the output to the screen.
  renderer.setRenderTarget(null);
  renderer.render(scene, camera);
  if (takeAScreenshot) {
    takeAScreenshot = false;
    var link = document.createElement("a");
    link.download = "VisualPDEScreenshot";
    renderer.render(scene, camera);
    link.href = renderer.domElement.toDataURL();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSizes();
    render();
  }
}

function postprocess() {
  simDomain.material = postMaterial;
  uniforms.textureSource.value = simTextures[1].texture;
  renderer.setRenderTarget(postTexture);
  renderer.render(simScene, simCamera);
  uniforms.textureSource.value = postTexture.texture;
  bufferFilled = false;
  uniforms.textureSource1.value = simTextures[1].texture;
}

function onDocumentPointerDown(event) {
  isDrawing = setBrushCoords(event, canvas);
  if (isDrawing) {
    if (options.brushEnabled && options.plotType == "surface") {
      controls.enabled = false;
    } else if (!options.brushEnabled) {
      // Display a message saying that the brush is disabled.
      $("#top_message").html("<p>Brush disabled</p>");
      fadein("#top_message");
      // Fadeout after 3s passes.
      window.clearTimeout(topMessageTimer);
      topMessageTimer = setTimeout(function () {
        if (!$("#top_message").hasClass("fading_out")) fadeout("#top_message");
      }, 3000);
    }
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
  if (options.plotType == "surface") {
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
  return 0 <= x && x <= 1 && 0 <= y && y <= 1;
}

function clearTextures() {
  setRenderSizeToDisc();
  if (!options.fixRandSeed) {
    updateRandomSeed();
  }
  if (checkpointExists && options.resetFromCheckpoints) {
    simDomain.material = checkpointMaterial;
  } else {
    simDomain.material = clearMaterial;
  }
  simTextures.forEach((tex) => {
    renderer.setRenderTarget(tex);
    renderer.render(simScene, simCamera);
  });
  setDefaultRenderSize();
  render();
}

function pauseSim() {
  if (!uiHidden) {
    $("#pause").hide();
    $("#play").show();
  }
  isRunning = false;
}

function playSim() {
  if (!uiHidden) {
    $("#play").hide();
    $("#pause").show();
  }
  isRunning = true;
}

function resetSim() {
  clearTextures();
  uniforms.t.value = 0.0;
  updateTimeDisplay();
  render();
  // Start a timer that checks for NaNs every second.
  window.clearTimeout(NaNTimer);
  checkForNaN();
}

function parseReactionStrings() {
  // Parse the user-defined shader strings into valid GLSL and output their concatenation. We won't worry about code injection.
  let out = "";
  // Prepare the UFUN string.
  out += "float UFUN = " + parseShaderString(options.reactionStrU) + ";\n";
  // Prepare the VFUN string.
  out += "float VFUN = " + parseShaderString(options.reactionStrV) + ";\n";
  // Prepare the WFUN string.
  out += "float WFUN = " + parseShaderString(options.reactionStrW) + ";\n";
  // Prepare the QFUN string.
  out += "float QFUN = " + parseShaderString(options.reactionStrQ) + ";\n";

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

  // Perform a syntax check.
  if (!isValidSyntax(str)) {
    return " 0.0 ";
  }

  // Replace tanh with safetanh.
  str = str.replaceAll(/\btanh\b/g, "safetanh");

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
  // Replace species with uvwq.[rgba].
  str = str.replaceAll(
    RegExp("\\b(" + anySpeciesRegexStrs[0] + ")\\b", "g"),
    function (m, d) {
      return "uvwq." + speciesToChannelChar(d);
    }
  );

  // Replace species_x, species_y etc with uvwqX.r and uvwqY.r, etc.
  str = str.replaceAll(
    RegExp("\\b(" + anySpeciesRegexStrs[0] + ")_([xy])\\b", "g"),
    function (m, d1, d2) {
      return "uvwq" + d2.toUpperCase() + "." + speciesToChannelChar(d1);
    }
  );

  // Replace species_xx, species_yy etc with uvwqXX.r and uvwqYY.r, etc.
  str = str.replaceAll(
    RegExp("\\b(" + anySpeciesRegexStrs[0] + ")_(xx|yy)\\b", "g"),
    function (m, d1, d2) {
      return "uvwq" + d2.toUpperCase() + "." + speciesToChannelChar(d1);
    }
  );

  // If there are any numbers preceded by letters (eg r0), replace the number with the corresponding string.
  str = sanitise(str);

  // Replace images evaluated at coordinates with appropriate shader expressions.
  str = enableImageLookupInShader(str, "I_TR");

  // Replace integers with floats.
  while (
    str != (str = str.replace(/([^.0-9a-zA-Z])(\d+)([^.0-9])/g, "$1$2.$3"))
  );

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
      regex = new RegExp("([\\w.]*)\\s*\\" + op + "\\s*([\\w.]*)", "g");
    } else {
      regex = new RegExp("([\\w.]*)\\s*" + op + "\\s*([\\w.]*)", "g");
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
  let ghostShader = "";
  let dirichletShader = "";
  let robinShader = "";
  let diffusionShader = "";
  let algebraicShader = "";

  const BCStrs = [
    options.boundaryConditionsU,
    options.boundaryConditionsV,
    options.boundaryConditionsW,
    options.boundaryConditionsQ,
  ];
  const NStrs = [
    options.neumannStrU,
    options.neumannStrV,
    options.neumannStrW,
    options.neumannStrQ,
  ];
  const MStrs = [
    options.comboStrU,
    options.comboStrV,
    options.comboStrW,
    options.comboStrQ,
  ].map((s) => s + ";");
  const DStrs = [
    options.dirichletStrU,
    options.dirichletStrV,
    options.dirichletStrW,
    options.dirichletStrQ,
  ];
  const RStrs = [
    options.robinStrU,
    options.robinStrV,
    options.robinStrW,
    options.robinStrQ,
  ];

  // Create a Neumann shader block for each species separately, which is just a special case of Robin.
  BCStrs.forEach(function (str, ind) {
    if (str == "neumann") {
      neumannShader += parseRobinRHS(NStrs[ind], listOfSpecies[ind]);
      neumannShader += neumannUpdateShader(ind);
    } else if (str == "combo") {
      [
        ...MStrs[ind].matchAll(
          /(Left|Right|Top|Bottom)\s*:\s*Neumann\s*=([^;]*);/g
        ),
      ].forEach(function (m) {
        const side = m[1][0].toUpperCase();
        neumannShader += parseRobinRHS(m[2], listOfSpecies[ind], side);
        neumannShader += neumannUpdateShader(ind, side);
      });
    }
  });

  // Create a Ghost shader block for each species separately.
  BCStrs.forEach(function (str, ind) {
    if (str == "combo") {
      [
        ...MStrs[ind].matchAll(
          /(Left|Right|Top|Bottom)\s*:\s*Ghost\s*=([^;]*);/g
        ),
      ].forEach(function (m) {
        const side = m[1][0].toUpperCase();
        ghostShader += ghostUpdateShader(ind, side, parseShaderString(m[2]));
      });
    }
  });

  // Create Dirichlet shaders.
  if (options.domainViaIndicatorFun) {
    // If the domain is being set by an indicator function, Dirichlet is the only allowable BC.
    let str = RDShaderDirichletIndicatorFun().replace(
      /indicatorFun/g,
      parseShaderString(options.domainIndicatorFun)
    );
    DStrs.forEach(function (D, ind) {
      dirichletShader +=
        selectSpeciesInShaderStr(str, listOfSpecies[ind]) +
        parseShaderString(D) +
        ";\n}\n";
    });
  } else {
    BCStrs.forEach(function (str, ind) {
      if (str == "dirichlet") {
        dirichletShader += parseDirichletRHS(DStrs[ind], listOfSpecies[ind]);
        dirichletShader += dirichletUpdateShader(ind);
      } else if (str == "combo") {
        [
          ...MStrs[ind].matchAll(
            /(Left|Right|Top|Bottom)\s*:\s*Dirichlet\s*=([^;]*);/g
          ),
        ].forEach(function (m) {
          const side = m[1][0].toUpperCase();
          dirichletShader += parseDirichletRHS(m[2], listOfSpecies[ind], side);
          dirichletShader += dirichletUpdateShader(ind, side);
        });
      }
    });
  }

  // Create a Robin shader block for each species separately.
  BCStrs.forEach(function (str, ind) {
    if (str == "robin") {
      robinShader += parseRobinRHS(RStrs[ind], listOfSpecies[ind]);
      robinShader += robinUpdateShader(ind);
    } else if (str == "combo") {
      [
        ...MStrs[ind].matchAll(
          /(Left|Right|Top|Bottom)\s*:\s*Robin\s*=([^;]*);/g
        ),
      ].forEach(function (m) {
        const side = m[1][0].toUpperCase();
        robinShader += parseRobinRHS(m[2], listOfSpecies[ind], side);
        robinShader += robinUpdateShader(ind, side);
      });
    }
  });

  // Insert any user-defined kinetic parameters, given as a string that needs parsing.
  // Extract variable definitions, separated by semicolons or commas, ignoring whitespace.
  // We'll inject this shader string before any boundary conditions etc, so that these params
  // are also available in BCs.
  let kineticStr = kineticUniformsForShader();

  // Choose what sort of update we are doing: normal, or cross-diffusion enabled?
  diffusionShader = parseNormalDiffusionStrings() + "\n";
  if (options.crossDiffusion) {
    diffusionShader +=
      parseCrossDiffusionStrings() + "\n" + RDShaderUpdateCross();
  } else {
    diffusionShader += RDShaderUpdateNormal();
  }

  // If v should be algebraic, append this to the normal update shader.
  if (algebraicV && options.crossDiffusion) {
    algebraicShader += selectSpeciesInShaderStr(
      RDShaderAlgebraicSpecies(),
      listOfSpecies[1]
    );
  }

  // If w should be algebraic, append this to the normal update shader.
  if (algebraicW && options.crossDiffusion) {
    algebraicShader += selectSpeciesInShaderStr(
      RDShaderAlgebraicSpecies(),
      listOfSpecies[2]
    );
  }

  // If q should be algebraic, append this to the normal update shader.
  if (algebraicQ && options.crossDiffusion) {
    algebraicShader += selectSpeciesInShaderStr(
      RDShaderAlgebraicSpecies(),
      listOfSpecies[3]
    );
  }

  // Iff the user has entered u_x, u_y etc in a diffusion coefficient, it will be present in
  // the update shader as uvwxy[XY].[rgba]. If they've done this, warn them and don't update the shader.
  let match = diffusionShader.match(/\buvwq[XY]\.[rgba]\b/);
  if (match) {
    throwError(
      "Including derivatives in the diffusion coefficients is not supported. Try casting your PDE in another form."
    );
    return;
  }

  // Using the constructed shader parts, we'll form fragment shaders for every possible timestepping scheme.
  let middle = [
    RDShaderAdvectionPreBC(),
    RDShaderDiffusionPreBC(),
    neumannShader,
    ghostShader,
    robinShader,
    RDShaderAdvectionPostBC(),
    RDShaderDiffusionPostBC(),
    parseReactionStrings(),
    diffusionShader,
  ].join(" ");
  let containsRAND = /\bRAND\b/.test(middle);
  let containsRANDN = /\bRANDN\b/.test(middle);
  if (containsRAND) {
    middle = randShader() + middle;
  }
  if (containsRANDN) {
    middle = randNShader() + middle;
  }
  shaderContainsRAND = containsRAND || containsRANDN;
  let bot = [dirichletShader, algebraicShader, RDShaderBot()].join(" ");

  let type = "FE";
  simMaterials[type].fragmentShader = [
    kineticStr,
    RDShaderTop(type),
    middle,
    RDShaderMain(type),
    bot,
  ].join(" ");

  type = "AB2";
  simMaterials[type].fragmentShader = [
    kineticStr,
    RDShaderTop(type),
    middle,
    RDShaderMain(type),
    bot,
  ].join(" ");

  type = "Mid";
  for (let ind = 1; ind < 3; ind++) {
    simMaterials[type + ind.toString()].fragmentShader = [
      kineticStr,
      RDShaderTop(type + ind.toString()),
      middle,
      RDShaderMain(type + ind.toString()),
      bot,
    ].join(" ");
  }

  type = "RK4";
  for (let ind = 1; ind < 5; ind++) {
    simMaterials[type + ind.toString()].fragmentShader = [
      kineticStr,
      RDShaderTop(type + ind.toString()),
      middle,
      RDShaderMain(type + ind.toString()),
      bot,
    ].join(" ");
  }

  Object.keys(simMaterials).forEach(
    (key) => (simMaterials[key].needsUpdate = true)
  );

  // We will use a shader to enforce Dirichlet BCs before each timestep, but only if some Dirichlet
  // BCs have been specified.
  checkForAnyDirichletBCs();
  if (anyDirichletBCs) {
    dirichletShader = kineticStr + RDShaderEnforceDirichletTop();
    if (options.domainViaIndicatorFun) {
      let str = RDShaderDirichletIndicatorFun()
        .replace(/indicatorFun/g, parseShaderString(options.domainIndicatorFun))
        .replace(/updated/g, "gl_FragColor");
      DStrs.forEach(function (D, ind) {
        dirichletShader +=
          selectSpeciesInShaderStr(str, listOfSpecies[ind]) +
          parseShaderString(D) +
          ";\n}\n";
      });
    } else {
      BCStrs.forEach(function (str, ind) {
        if (str == "dirichlet") {
          dirichletShader += parseDirichletRHS(DStrs[ind], listOfSpecies[ind]);
          dirichletShader += dirichletEnforceShader(ind);
        } else if (str == "combo") {
          [
            ...MStrs[ind].matchAll(
              /(Left|Right|Top|Bottom)\s*:\s*Dirichlet\s*=([^;]*);/g
            ),
          ].forEach(function (m) {
            const side = m[1][0].toUpperCase();
            dirichletShader += parseDirichletRHS(
              m[2],
              listOfSpecies[ind],
              side
            );
            dirichletShader += dirichletEnforceShader(ind, side);
          });
        }
      });
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
    options.boundaryConditionsQ == "dirichlet" ||
    /Dirichlet/.test(options.comboStrU) ||
    /Dirichlet/.test(options.comboStrV) ||
    /Dirichlet/.test(options.comboStrW) ||
    /Dirichlet/.test(options.comboStrQ);
}

function parseRobinRHS(string, species, side) {
  if (side == undefined) {
    // Make a copy for each side.
    return ["L", "R", "T", "B"]
      .map((side) => parseRobinRHS(string, species, side))
      .join("");
  }
  return (
    "float robinRHS" +
    species +
    side +
    " = " +
    parseShaderString(string) +
    ";\n"
  );
}

function parseDirichletRHS(string, species, side) {
  if (side == undefined) {
    // Make a copy for each side.
    return ["L", "R", "T", "B"]
      .map((side) => parseDirichletRHS(string, species, side))
      .join("");
  }
  return (
    "float dirichletRHS" +
    species +
    side +
    " = " +
    parseShaderString(string) +
    ";\n"
  );
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

  // Update the domain scale based on URL params.
  domainScaleValue *= domainScaleFactor;

  // Configure views.
  configureViews();

  // Replace the GUI.
  deleteGUIs();
  initGUI();

  // Apply any specified view.
  if (options.activeViewInd < options.views.length) {
    applyView(options.views[options.activeViewInd], false, false);
  } else {
    // No valid view has been specified, so apply an empty view that can be customised.
    applyView({}, true, false);
  }

  // Update the equations, setup and GUI in line with new options.
  updateProblem();

  // Trigger a resize, which will refresh all uniforms and set sizes.
  setCanvasShape();
  resize();

  // Update any uniforms.
  updateUniforms();

  // Set the background color.
  scene.background = new THREE.Color(options.backgroundColour);

  // If an initial state has been specified, load it in, which will also reset the simulation.
  if (options.initialState != "") {
    fetch(options.initialState)
      .then((res) => res.blob())
      .then((blob) => loadSimState(blob));
  } else {
    // Reset the state of the simulation using specified ICs.
    resetSim();
  }

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

  // If newOptions specifies a parent, first load the options of the parent.
  if (newOptions.hasOwnProperty("parent") && newOptions.parent != null) {
    loadOptions(newOptions.parent);
  }

  // Reset the kinetic parameters.
  kineticParamsCounter = 0;
  kineticParamsLabels = [];
  kineticParamsStrs = {};

  // Loop through newOptions and overwrite anything already present.
  Object.assign(options, newOptions);

  // Set custom species names and reaction names.
  setCustomNames(true);

  // Check if the simulation should be running on load.
  isRunning = options.runningOnLoad;

  // Ensure that the correct play/pause button is showing.
  isRunning ? playSim() : pauseSim();

  // If we're on mobile, replace 'clicking' with 'tapping' in tryClickingText if it exists.
  if (onMobile()) {
    options.tryClickingText = options.tryClickingText.replaceAll(
      "clicking",
      "tapping"
    );
  } else {
    options.tryClickingText = options.tryClickingText.replaceAll(
      "tapping",
      "clicking"
    );
  }

  // Enable backwards compatibility.
  options.brushRadius = options.brushRadius.toString();
  if (options.hasOwnProperty("drawIn3D")) {
    options.brushEnabled = options.drawIn3D;
  }
  // Replace T and S with I_T and I_S if T, S are not in the listOfSpecies.
  if (!listOfSpecies.includes("T")) {
    Object.keys(options).forEach(function (key) {
      if (userTextFields.includes(key)) {
        options[key] = replaceSymbolsInStr(
          options[key],
          ["T"],
          ["I_T"],
          "[RGBA]"
        );
      }
    });
  }
  if (!listOfSpecies.includes("S")) {
    Object.keys(options).forEach(function (key) {
      if (userTextFields.includes(key)) {
        options[key] = replaceSymbolsInStr(
          options[key],
          ["S"],
          ["I_S"],
          "[RGBA]"
        );
      }
    });
    // Map algebraicV, algebraicW, and algebraicQ onto numAlgebraicSpecies.
    var count = 0;
    count += options.hasOwnProperty("algebraicV");
    count += options.hasOwnProperty("algebraicW");
    count += options.hasOwnProperty("algebraicQ");
    if (count && !options.numAlgebraicSpecies) {
      // If algebraicV,W,Q contain more information than count, then update it.
      options.numAlgebraicSpecies = count;
    }
    // Remove obsolete fields from options.
    delete options.algebraicV;
    delete options.algebraicW;
    delete options.algebraicQ;

    // If min/max colour value is null (happens if we've blown up to +-inf), set them to 0 and 1.
    if (options.minColourValue == null) options.minColourValue = 0;
    if (options.maxColourValue == null) options.maxColourValue = 1;

    // If options.domainScale is not a string, convert it to one.
    options.domainScale = options.domainScale.toString();
    // If options.spatialStep is not a string, convert it to one.
    options.spatialStep = options.spatialStep.toString();

    // Save these loaded options if we ever need to revert.
    savedOptions = options;
  }

  // If either of the images are used in the simulation, ensure that the simulation resets when the images are
  // actually loaded in.
  let str = [
    options.clearValueU,
    options.clearValueV,
    options.clearValueW,
    options.clearValueQ,
    options.domainIndicatorFun,
    options.reactionStrU,
    options.reactionStrV,
    options.reactionStrW,
    options.reactionStrQ,
    options.diffusionStrUU,
    options.diffusionStrUV,
    options.diffusionStrUW,
    options.diffusionStrUQ,
    options.diffusionStrVU,
    options.diffusionStrVV,
    options.diffusionStrVW,
    options.diffusionStrVQ,
    options.diffusionStrWU,
    options.diffusionStrWV,
    options.diffusionStrWW,
    options.diffusionStrWQ,
    options.diffusionStrQU,
    options.diffusionStrQV,
    options.diffusionStrQW,
    options.diffusionStrQQ,
    options.dirichletStrU,
    options.dirichletStrV,
    options.dirichletStrW,
    options.dirichletStrQ,
    options.robinStrU,
    options.robinStrV,
    options.robinStrW,
    options.robinStrQ,
    options.comboStrU,
    options.comboStrV,
    options.comboStrW,
    options.comboStrQ,
    options.neumannStrU,
    options.neumannStrV,
    options.neumannStrW,
    options.neumannStrQ,
    options.brushValue,
    options.whatToPlot,
  ].join(" ");
  options.resetOnImageLoad = /\bI_[ST][RGBA]?\b/.test(str);
}

function refreshGUI(folder, typeset) {
  if (typeset == undefined) {
    typeset = true;
  }
  if (folder != undefined) {
    // Traverse through all the subfolders and recurse.
    for (let subfolderName in folder.__folders) {
      refreshGUI(folder.__folders[subfolderName], false);
    }
    // Update all the controllers at this level.
    for (let i = 0; i < folder.__controllers.length; i++) {
      folder.__controllers[i].updateDisplay();
    }
  }
  // Run MathJax to texify the parameter names (e.g. D_uu) that appear dynamically.
  // No need to do this on page load (and indeed will throw an error) so check
  // MathJax is defined first.
  if (typeset && MathJax.typesetPromise != undefined) {
    MathJax.typesetPromise();
  }
  // fitty(".view_label", { maxSize: 32, minSize: 12, multiline: true });
}

function deleteGUIs() {
  deleteGUI(leftGUI, true);
  deleteGUI(rightGUI, true);
  deleteGUI(viewsGUI, true);
}

function deleteGUI(folder, topLevel) {
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
    if (topLevel != undefined && topLevel) {
      folder.domElement.remove();
      folder.destroy();
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
  regex = /\brobinRHSSPECIES/g;
  shaderStr = shaderStr.replace(regex, "robinRHS" + species);
  regex = /\bdirichletRHSSPECIES/g;
  shaderStr = shaderStr.replace(regex, "dirichletRHS" + species);
  return shaderStr;
}

function speciesToChannelChar(speciesStr) {
  let listOfChannels = "rgba";
  return listOfChannels[speciesToChannelInd(speciesStr)];
}

function speciesToChannelInd(speciesStr) {
  return listOfSpecies.indexOf(speciesStr);
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

  if (options.boundaryConditionsU == "combo") {
    showGUIController(comboUController);
  } else {
    hideGUIController(comboUController);
  }
  if (options.boundaryConditionsV == "combo") {
    showGUIController(comboVController);
  } else {
    hideGUIController(comboVController);
  }
  if (options.boundaryConditionsW == "combo") {
    showGUIController(comboWController);
  } else {
    hideGUIController(comboWController);
  }
  if (options.boundaryConditionsQ == "combo") {
    showGUIController(comboQController);
  } else {
    hideGUIController(comboQController);
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
  uniforms.seed.value = (performance.now() % 1000000) / 1000000;
}

function setClearShader() {
  // Insert any user-defined kinetic parameters, as uniforms.
  let shaderStr = kineticUniformsForShader() + clearShaderTop();
  let allClearShaders = [
    options.clearValueU,
    options.clearValueV,
    options.clearValueW,
    options.clearValueQ,
  ].join(" ");
  if (/\bRAND\b/.test(allClearShaders)) {
    shaderStr += randShader();
  }
  if (/\bRANDN\b/.test(allClearShaders)) {
    shaderStr += randNShader();
  }
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
  root = fIm;
  imControllerOne = root
    .addImage(options, "imagePathOne")
    .name("$I_S(x,y)$")
    .onChange(loadImageSourceOne);
  imControllerTwo = root
    .addImage(options, "imagePathTwo")
    .name("$I_T(x,y)$")
    .onChange(loadImageSourceTwo);
  if (MathJax.typesetPromise != undefined) {
    MathJax.typesetPromise();
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
  let shaderStr = kineticUniformsForShader() + computeDisplayFunShaderTop();
  shaderStr += computeDisplayFunShaderMid()
    .replace(/\bXVECFUN\b/, parseShaderString(options.arrowX))
    .replace(/\bYVECFUN\b/, parseShaderString(options.arrowY));
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

function setAlgebraicVarsFromOptions() {
  // Set the variables algebraicV etc and constrain numAlgebraicSpecies.
  // Limit the number of algebraic species to at most one less than the number of species.
  options.numAlgebraicSpecies = Math.min(
    parseInt(options.numAlgebraicSpecies),
    parseInt(options.numSpecies) - 1
  );
  algebraicV = options.numAlgebraicSpecies >= options.numSpecies - 1;
  algebraicW =
    options.numAlgebraicSpecies >= options.numSpecies - 2 &&
    options.numSpecies >= 3;
  algebraicQ =
    options.numAlgebraicSpecies >= options.numSpecies - 3 &&
    options.numSpecies >= 4;
}

function problemTypeFromOptions() {
  // Use the currently selected options to specify an equation type as an index into listOfTypes.
  setAlgebraicVarsFromOptions();
  switch (parseInt(options.numSpecies)) {
    case 1:
      // 1Species
      equationType = 0;
      break;
    case 2:
      if (options.crossDiffusion) {
        if (options.numAlgebraicSpecies == 1) {
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
        switch (options.numAlgebraicSpecies) {
          case 0:
            // 3SpeciesCrossDiffusion
            equationType = 5;
            break;
          case 1:
            // 3SpeciesCrossDiffusionAlgebraicW
            equationType = 6;
            break;
          case 2:
            // 3SpeciesCrossDiffusionVW
            equationType = 7;
            break;
        }
      } else {
        // 3Species
        equationType = 4;
      }
      break;
    case 4:
      if (options.crossDiffusion) {
        switch (options.numAlgebraicSpecies) {
          case 0:
            // 4SpeciesCrossDiffusion
            equationType = 9;
            break;
          case 1:
            // 4SpeciesCrossDiffusionAlgebraicQ
            equationType = 10;
            break;
          case 2:
            // 4SpeciesCrossDiffusionAlgebraicWQ
            equationType = 11;
            break;
          case 3:
            // 4SpeciesCrossDiffusionAlgebraicVWQ
            equationType = 12;
            break;
        }
      } else {
        // 4Species
        equationType = 8;
      }
      break;
  }
}

function configureGUI() {
  // Set up the GUI based on the the current options: numSpecies, crossDiffusion, and numAlgebraicSpecies.
  let tooltip =
    "function of " +
    listOfSpecies.slice(0, options.numSpecies).join(", ") +
    ", x, y, t";
  let Vtooltip = tooltip.replace(" " + listOfSpecies[1] + ",", "");
  let Qtooltip = tooltip.replace(" " + listOfSpecies[2] + ",", "");
  let Wtooltip = tooltip.replace(" " + listOfSpecies[3] + ",", "");

  if (options.dimension == 1) tooltip = tooltip.replace(" y,", "");
  if (options.crossDiffusion && parseInt(options.numSpecies) > 1) {
    if (!updatingAlgebraicSpecies) {
      updateGUIDropdown(
        algebraicSpeciesController,
        Array.from(Array(parseInt(options.numSpecies)).keys())
      );
    }
    showGUIController(algebraicSpeciesController);
  } else {
    hideGUIController(algebraicSpeciesController);
  }

  if (options.numSpecies > 1) {
    $("#cross_diffusion_controller").show();
  } else {
    $("#cross_diffusion_controller").hide();
  }

  // Hide/Show VWQGUI panels.
  hideVGUIPanels();
  hideWGUIPanels();
  hideQGUIPanels();
  switch (parseInt(options.numSpecies)) {
    case 4:
      showQGUIPanels();
    case 3:
      showWGUIPanels();
    case 2:
      showVGUIPanels();
  }

  // Configure the controller names.
  // We'll set the generic names then alter any algebraic ones.
  if (options.numSpecies == 1) {
    setGUIControllerName(DuuController, TeXStrings["D"], tooltip);
  } else if (options.crossDiffusion) {
    setGUIControllerName(DuuController, TeXStrings["Duu"], tooltip);
    setGUIControllerName(DuvController, TeXStrings["Duv"], tooltip);
    setGUIControllerName(DuwController, TeXStrings["Duw"], tooltip);
    setGUIControllerName(DuqController, TeXStrings["Duq"], tooltip);
    setGUIControllerName(DvuController, TeXStrings["Dvu"], tooltip);
    setGUIControllerName(DvvController, TeXStrings["Dvv"], tooltip);
    setGUIControllerName(DvwController, TeXStrings["Dvw"], tooltip);
    setGUIControllerName(DvqController, TeXStrings["Dvq"], tooltip);
    setGUIControllerName(DwuController, TeXStrings["Dwu"], tooltip);
    setGUIControllerName(DwvController, TeXStrings["Dwv"], tooltip);
    setGUIControllerName(DwwController, TeXStrings["Dww"], tooltip);
    setGUIControllerName(DwqController, TeXStrings["Dwq"], tooltip);
    setGUIControllerName(DquController, TeXStrings["Dqu"], tooltip);
    setGUIControllerName(DqvController, TeXStrings["Dqv"], tooltip);
    setGUIControllerName(DqwController, TeXStrings["Dqw"], tooltip);
    setGUIControllerName(DqqController, TeXStrings["Dqq"], tooltip);
  } else {
    setGUIControllerName(DuuController, TeXStrings["Du"], tooltip);
    setGUIControllerName(DvvController, TeXStrings["Dv"], tooltip);
    setGUIControllerName(DwwController, TeXStrings["Dw"], tooltip);
    setGUIControllerName(DqqController, TeXStrings["Dq"], tooltip);
  }
  setGUIControllerName(fController, TeXStrings["UFUN"], tooltip);
  setGUIControllerName(gController, TeXStrings["VFUN"], tooltip);
  setGUIControllerName(hController, TeXStrings["WFUN"], tooltip);
  setGUIControllerName(jController, TeXStrings["QFUN"], tooltip);

  // Configure the names of algebraic controllers.
  if (algebraicV) {
    setGUIControllerName(DvuController, TeXStrings["Dvu"], Vtooltip);
    setGUIControllerName(DvwController, TeXStrings["Dvw"], Vtooltip);
    setGUIControllerName(DvqController, TeXStrings["Dvq"], Vtooltip);
    setGUIControllerName(gController, TeXStrings["VFUN"], Vtooltip);
    hideGUIController(DvvController);
  }
  if (algebraicW) {
    setGUIControllerName(DwuController, TeXStrings["Dwu"], Wtooltip);
    setGUIControllerName(DwvController, TeXStrings["Dwv"], Wtooltip);
    setGUIControllerName(DwqController, TeXStrings["Dwq"], Wtooltip);
    setGUIControllerName(hController, TeXStrings["WFUN"], Wtooltip);
    hideGUIController(DwwController);
  }
  if (algebraicQ) {
    setGUIControllerName(DquController, TeXStrings["Dqu"], Qtooltip);
    setGUIControllerName(DqvController, TeXStrings["Dqv"], Qtooltip);
    setGUIControllerName(DqwController, TeXStrings["Dqw"], Qtooltip);
    setGUIControllerName(jController, TeXStrings["QFUN"], Qtooltip);
    hideGUIController(DqqController);
  }

  // Set the names of the BCs and ICs controllers.
  setGUIControllerName(uBCsController, TeXStrings["u"]);
  setGUIControllerName(vBCsController, TeXStrings["v"]);
  setGUIControllerName(wBCsController, TeXStrings["w"]);
  setGUIControllerName(qBCsController, TeXStrings["q"]);
  setGUIControllerName(dirichletUController, TeXStrings["uD"]);
  setGUIControllerName(dirichletVController, TeXStrings["vD"]);
  setGUIControllerName(dirichletWController, TeXStrings["wD"]);
  setGUIControllerName(dirichletQController, TeXStrings["qD"]);
  setGUIControllerName(neumannUController, TeXStrings["uN"]);
  setGUIControllerName(neumannVController, TeXStrings["vN"]);
  setGUIControllerName(neumannWController, TeXStrings["wN"]);
  setGUIControllerName(neumannQController, TeXStrings["qN"]);
  setGUIControllerName(robinUController, TeXStrings["uN"]);
  setGUIControllerName(robinVController, TeXStrings["vN"]);
  setGUIControllerName(robinWController, TeXStrings["wN"]);
  setGUIControllerName(robinQController, TeXStrings["qN"]);
  setGUIControllerName(clearValueUController, TeXStrings["uInit"]);
  setGUIControllerName(clearValueVController, TeXStrings["vInit"]);
  setGUIControllerName(clearValueWController, TeXStrings["wInit"]);
  setGUIControllerName(clearValueQController, TeXStrings["qInit"]);

  // Show/hide the indicator function controller.
  if (options.domainViaIndicatorFun) {
    showGUIController(domainIndicatorFunController);
  } else {
    hideGUIController(domainIndicatorFunController);
  }
  // Hide or show GUI elements that depend on the BCs.
  setBCsGUI();
  // Hide or show GUI elements to do with surface plotting.
  if (options.plotType == "surface") {
    $("#contourButton").show();
    $("#embossButton").show();
    $("#vectorFieldButton").hide();
    linesAnd3DFolder.name = "3D options";
    linesAnd3DFolder.domElement.classList.remove("hidden");
    if (options.customSurface) showGUIController(surfaceFunController);
    hideGUIController(lineWidthMulController);
    showGUIController(threeDHeightScaleController);
    showGUIController(cameraThetaController);
    showGUIController(cameraPhiController);
    showGUIController(cameraZoomController);
  } else if (options.plotType == "line") {
    $("#contourButton").hide();
    $("#embossButton").hide();
    $("#vectorFieldButton").hide();
    linesAnd3DFolder.name = "Line options";
    linesAnd3DFolder.domElement.classList.remove("hidden");
    showGUIController(lineWidthMulController);
    showGUIController(threeDHeightScaleController);
    hideGUIController(cameraThetaController);
    hideGUIController(cameraPhiController);
    hideGUIController(cameraZoomController);
  } else {
    $("#contourButton").show();
    $("#embossButton").show();
    $("#vectorFieldButton").show();
    linesAnd3DFolder.domElement.classList.add("hidden");
    hideGUIController(lineWidthMulController);
    hideGUIController(threeDHeightScaleController);
    hideGUIController(cameraThetaController);
    hideGUIController(cameraPhiController);
    hideGUIController(cameraZoomController);
  }
  configureColourbar();
  configureTimeDisplay();
  configureIntegralDisplay();
  configureDataContainer();
  configureCustomSurfaceControllers();
  // Show/hide/modify GUI elements that depend on dimension.
  if (options.plotType == "line") {
    hideGUIController(typeOfBrushController);
    $(":root").css("--ui-button-outline", "black");
  } else {
    showGUIController(typeOfBrushController);
    $(":root").css("--ui-button-outline", "white");
  }
  if (manualInterpolationNeeded) {
    $("#interpController").hide();
  } else {
    $("#interpController").show();
  }
  if (options.arrowScale == "relative") {
    showGUIController(arrowLengthMaxController);
  } else {
    hideGUIController(arrowLengthMaxController);
  }
  // Update the options available in whatToDraw based on the number of species.
  updateGUIDropdown(
    whatToDrawController,
    listOfSpecies.slice(0, options.numSpecies)
  );
  // Update emboss sliders.
  updateViewSliders();
  // Update all toggle buttons.
  $(".toggle_button").each(function () {
    updateToggle(this);
  });
  // Configure the Views GUI from options.views.
  configureViewsGUI();
  // Refresh the GUI displays.
  refreshGUI(leftGUI);
  refreshGUI(rightGUI);
  refreshGUI(viewsGUI);
}

function configureOptions() {
  // Configure any options that depend on the equation type.
  let regex;

  setAlgebraicVarsFromOptions();

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

      // Ensure that u is being displayed on the screen (and the brush target).
      options.whatToDraw = listOfSpecies[0];
      options.whatToPlot = listOfSpecies[0];

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
      regex = new RegExp("\\b(" + anySpeciesRegexStrs[1] + ")\\b");
      if (regex.test(options.reactionStrU)) {
        options.reactionStrU = "0";
      }
      break;
    case 2:
      // Ensure that species 1 or 2 is being displayed on the screen (and the brush target).
      if (
        (options.whatToDraw == listOfSpecies[2]) |
        (options.whatToDraw == listOfSpecies[3])
      ) {
        options.whatToDraw = listOfSpecies[0];
      }
      if (
        (options.whatToPlot == listOfSpecies[2]) |
        (options.whatToPlot == listOfSpecies[3])
      ) {
        options.whatToPlot = listOfSpecies[0];
      }

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
      regex = new RegExp("\\b(" + anySpeciesRegexStrs[2] + ")\\b");
      if (regex.test(options.reactionStrU)) {
        options.reactionStrU = "0";
      }
      if (regex.test(options.reactionStrV)) {
        options.reactionStrV = "0";
      }
      break;
    case 3:
      // Ensure that species 1-3 is being displayed on the screen (and the brush target).
      if (options.whatToDraw == listOfSpecies[3]) {
        options.whatToDraw = listOfSpecies[0];
      }
      if (options.whatToPlot == listOfSpecies[3]) {
        options.whatToPlot = listOfSpecies[0];
      }

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
      regex = new RegExp("\\b(" + anySpeciesRegexStrs[3] + ")\\b");
      if (regex.test(options.reactionStrU)) {
        options.reactionStrU = "0";
      }
      if (regex.test(options.reactionStrV)) {
        options.reactionStrV = "0";
      }
      if (regex.test(options.reactionStrW)) {
        options.reactionStrW = "0";
      }
      break;
    case 4:
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
      break;
    case 7:
      // 3SpeciesCrossDiffusionAlgebraicVW
      options.diffusionStrVV = "0";
      options.diffusionStrWW = "0";
      break;
    case 10:
      // 4SpeciesCrossDiffusionAlgebraicQ
      options.diffusionStrQQ = "0";
      break;
    case 11:
      // 4SpeciesCrossDiffusionAlgebraicWQ
      options.diffusionStrWW = "0";
      options.diffusionStrQQ = "0";
      break;
    case 12:
      // 4SpeciesCrossDiffusionAlgebraicVWQ
      options.diffusionStrVV = "0";
      options.diffusionStrWW = "0";
      options.diffusionStrQQ = "0";
      break;
  }

  // Refresh the GUI displays.
  refreshGUI(leftGUI);
  refreshGUI(rightGUI);
}

function updateProblem() {
  // Update the problem and any dependencies based on the current options.
  problemTypeFromOptions();
  configurePlotType();
  configureDimension();
  configureOptions();
  configureGUI();
  setKineticUniforms();
  updateShaders();
  setEquationDisplayType();
  resetSim();
}

function setEquationDisplayType() {
  // Given an equation type (specified as an integer selector), set the type of
  // equation in the UI element that displays the equations.
  let str = equationTEX[equationType];

  let regex;
  // Define a list of strings that will be used to make regexes.
  const regexes = {};
  regexes["D"] = /\b(D) (\\vnabla u)/g;
  regexes["U"] = /\b(D_{u}) (\\vnabla u)/g;
  regexes["UU"] = /\b(D_{u u}) (\\vnabla u)/g;
  regexes["V"] = /\b(D_{v}) (\\vnabla v)/g;
  regexes["VV"] = /\b(D_{v v}) (\\vnabla v)/g;
  regexes["W"] = /\b(D_{w}) (\\vnabla w)/g;
  regexes["WW"] = /\b(D_{w w}) (\\vnabla w)/g;
  regexes["Q"] = /\b(D_{q}) (\\vnabla q)/g;
  regexes["QQ"] = /\b(D_{q q}) (\\vnabla q)/g;
  regexes["UV"] = /\b(D_{u v}) (\\vnabla v)/g;
  regexes["UW"] = /\b(D_{u w}) (\\vnabla w)/g;
  regexes["UQ"] = /\b(D_{u q}) (\\vnabla q)/g;
  regexes["VU"] = /\b(D_{v u}) (\\vnabla u)/g;
  regexes["VW"] = /\b(D_{v w}) (\\vnabla w)/g;
  regexes["VQ"] = /\b(D_{v q}) (\\vnabla q)/g;
  regexes["WU"] = /\b(D_{w u}) (\\vnabla u)/g;
  regexes["WV"] = /\b(D_{w v}) (\\vnabla v)/g;
  regexes["WQ"] = /\b(D_{w q}) (\\vnabla q)/g;
  regexes["QU"] = /\b(D_{q u}) (\\vnabla u)/g;
  regexes["QV"] = /\b(D_{q v}) (\\vnabla v)/g;
  regexes["QW"] = /\b(D_{q w}) (\\vnabla w)/g;
  regexes["UFUN"] = /\b(UFUN)/g;
  regexes["VFUN"] = /\b(VFUN)/g;
  regexes["WFUN"] = /\b(WFUN)/g;
  regexes["QFUN"] = /\b(QFUN)/g;

  if (options.typesetCustomEqs) {
    // We'll work using the default notation, then convert at the end.
    let associatedStrs = {};
    associatedStrs["D"] = options.diffusionStrUU;
    associatedStrs["U"] = options.diffusionStrUU;
    associatedStrs["UU"] = options.diffusionStrUU;
    associatedStrs["V"] = options.diffusionStrVV;
    associatedStrs["VV"] = options.diffusionStrVV;
    associatedStrs["W"] = options.diffusionStrWW;
    associatedStrs["WW"] = options.diffusionStrWW;
    associatedStrs["Q"] = options.diffusionStrQQ;
    associatedStrs["QQ"] = options.diffusionStrQQ;
    associatedStrs["UV"] = options.diffusionStrUV;
    associatedStrs["UW"] = options.diffusionStrUW;
    associatedStrs["UQ"] = options.diffusionStrUQ;
    associatedStrs["VU"] = options.diffusionStrVU;
    associatedStrs["VW"] = options.diffusionStrVW;
    associatedStrs["VQ"] = options.diffusionStrVQ;
    associatedStrs["WU"] = options.diffusionStrWU;
    associatedStrs["WV"] = options.diffusionStrWV;
    associatedStrs["WQ"] = options.diffusionStrWQ;
    associatedStrs["QU"] = options.diffusionStrQU;
    associatedStrs["QV"] = options.diffusionStrQV;
    associatedStrs["QW"] = options.diffusionStrQW;
    associatedStrs["UFUN"] = options.reactionStrU;
    associatedStrs["VFUN"] = options.reactionStrV;
    associatedStrs["WFUN"] = options.reactionStrW;
    associatedStrs["QFUN"] = options.reactionStrQ;

    // Check associatedStrs for basic syntax validity, and return without updating the TeX if there are issues.
    var badSyntax = false;
    Object.keys(associatedStrs).forEach(function (key) {
      if (!badSyntax) badSyntax |= !isValidSyntax(associatedStrs[key]);
    });
    if (badSyntax) return;

    // Convert all the associated strings back to default notation.
    function toDefault(s) {
      return replaceSymbolsInStr(s, listOfSpecies, defaultSpecies, "_[xy]");
    }

    Object.keys(associatedStrs).forEach(function (key) {
      associatedStrs[key] = toDefault(associatedStrs[key]);
    });

    // Add in \selected{} to any selected entry.
    selectedEntries.forEach(function (x) {
      associatedStrs[x] = "\\selected{ " + associatedStrs[x] + " }";
    });

    // For each diffusion string, replace it with the value in associatedStrs.
    Object.keys(associatedStrs).forEach(function (key) {
      if (!defaultReactions.includes(key))
        str = replaceUserDefDiff(str, regexes[key], associatedStrs[key], "[]");
    });

    // Replace the reaction strings, converting everything back to default notation.
    str = replaceUserDefReac(str, regexes["UFUN"], associatedStrs["UFUN"]);
    str = replaceUserDefReac(str, regexes["VFUN"], associatedStrs["VFUN"]);
    str = replaceUserDefReac(str, regexes["WFUN"], associatedStrs["WFUN"]);
    str = replaceUserDefReac(str, regexes["QFUN"], associatedStrs["QFUN"]);

    // Look through the string for any open brackets ( or [ followed by a + or -.
    regex = /\(\s*\+/g;
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
    // First, if it's just a diffusion coefficient, move it outside, as they have already been checked for
    // constancy.
    regex =
      /\\vnabla\s*\\cdot\s*\((D_\{\w+(?: \w+)?\})\s*\\vnabla\s*([uvwq])\s*\)/g;
    str = str.replaceAll(regex, "$1 \\lap $2");
    regex = /\\vnabla\s*\\cdot\s*\(([\w\{\}\*\^]*)\s*\\vnabla\s*([uvwq])\s*\)/g;
    str = str.replaceAll(regex, function (match, g1, g2) {
      const innerRegex = /\b[xy]|[uvwq]\b/g;
      if (!innerRegex.test(g1)) {
        return g1 + " \\lap " + g2;
      } else {
        return match;
      }
    });

    // Replace u_x, u_y etc with \pd{u}{x} etc. Add parentheses if followed by ^.
    regex = /(\(?)\b([uvwq])_([xy])\s*(\)?)\s*(\^?)\b/g;
    str = str.replaceAll(regex, function (match, g1, g2, g3, g4, g5) {
      let base =
        g1 + "\\textstyle \\pd{" + g2 + "}{" + g3 + "\\vphantom{y}}" + g4;
      if (g5 != "" && (g1 == "" || g4 == "")) {
        base = "(" + base + ")" + g5;
      } else {
        base += g5;
      }
      return base;
    });

    // Replace u_xx, u_yy etc with \pdd{u}{x} etc.
    regex = /(\(?)\b([uvwq])_(xx|yy)\s*(\)?)\s*(\^?)\b/g;
    str = str.replaceAll(regex, function (match, g1, g2, g3, g4, g5) {
      let base =
        g1 + "\\textstyle \\pdd{" + g2 + "}{" + g3[0] + "\\vphantom{y}}" + g4;
      if (g5 != "" && (g1 == "" || g4 == "")) {
        base = "(" + base + ")" + g5;
      } else {
        base += g5;
      }
      return base;
    });

    // Replace RAND with \mathcal{U}.
    regex = /\bRAND\b/g;
    str = str.replaceAll(regex, "\\mathcal{U}");

    // Replace RANDN with \mathcal{Z}.
    regex = /\bRANDN\b/g;
    str = str.replaceAll(regex, "\\mathcal{Z}");
  } else {
    // Even if we're not customising the typesetting, add in \selected{} to any selected entry.
    selectedEntries.forEach(function (x) {
      str = str.replaceAll(regexes[x], function (match, g1, g2) {
        let val = "\\selected{ " + g1 + " ";
        if (typeof g2 == "string") val += g2;
        return val + " }";
      });
    });
    // Replace fFUN, gFUN etc with the reaction names.
    str = replaceSymbolsInStr(
      str,
      ["UFUN", "VFUN", "WFUN", "QFUN"],
      listOfReactions,
      "_[xy]"
    );
  }

  // If we're in 1D, convert \nabla to \pd{}{x} and \lap word to \pdd{word}{x}.
  if (options.dimension == 1) {
    str = str.replaceAll(/\\vnabla\s*\\cdot/g, "\\textstyle \\pd{}{x}");
    regex = /\\vnabla\s*([uvwq])/g;
    str = str.replaceAll(regex, "\\textstyle \\pd{$1}{x}");
    regex = /\\lap\s*([uvwq])/g;
    str = str.replaceAll(regex, "\\textstyle \\pdd{$1}{x}");
  }

  // Swap out all default symbols for new species and reactions.
  str = replaceSymbolsInStr(
    str,
    defaultSpecies.concat(defaultReactions),
    listOfSpecies.concat(listOfReactions),
    "_[xy]"
  );

  str = parseStringToTEX(str);

  $("#typeset_equation").html(str);
  if (MathJax.typesetPromise != undefined) {
    MathJax.typesetPromise().then(resizeEquationDisplay);
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
  str = replaceFunctionInTeX(str, "sinh", true);
  str = replaceFunctionInTeX(str, "cosh", true);
  str = replaceFunctionInTeX(str, "tanh", true);
  str = replaceFunctionInTeX(str, "max", true);
  str = replaceFunctionInTeX(str, "min", true);

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

  // If there's an underscore, put {} around the word that follows it.
  str = str.replaceAll(/_(\w+\b)/g, "_{$1}");

  // If letters are followed by only numbers, assume that the numbers are a subscript.
  str = str.replaceAll(/\b([a-zA-Z]+)([0-9]+)\b/g, "$1_{$2}");

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
      (!foundBracket | !(foundBracket && depth == 0))
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
        newStr = replaceStrAtIndex(newStr, "}", endInd + offset);
      }
    }
  }
  return newStr;
}

function enableImageLookupInShader(str) {
  // Enable function evaluation in shaders.
  var newStr = str;
  const matches = str.matchAll(/\bI_([TS])([RGBA])\b/g);
  let funcInd,
    startInd,
    endInd,
    subStr,
    argStr,
    args,
    depth,
    foundBracket,
    ind,
    toAdd,
    imNum,
    component,
    offset = 0;
  const imageLookup = { S: "One", T: "Two" };
  const componentLookup = { R: "x", G: "y", B: "z", A: "w" };
  for (const match of matches) {
    funcInd = match.index;
    imNum = imageLookup[match[1]];
    component = componentLookup[match[2]];
    startInd = funcInd + match[0].length;
    subStr = str.slice(startInd);
    ind = 0;
    depth = 0;
    foundBracket = false;
    // Try to find paired brackets.
    while (
      (ind <= subStr.length) &
      (!foundBracket | !(foundBracket && depth == 0))
    ) {
      depth += ["("].includes(subStr[ind]);
      depth -= [")"].includes(subStr[ind]);
      foundBracket |= depth;
      ind += 1;
    }
    // If we found correctly paired brackets, replace with the function. Otherwise, do nothing.
    if (foundBracket && depth == 0) {
      endInd = ind - 1 + startInd;
      argStr = newStr.slice(startInd + offset + 1, endInd + offset);
      // Replace digits with words in the arguments.
      argStr = replaceDigitsWithWords(argStr);
      // Detect at most two arguments separated by a comma.
      args = argStr.split(",");
      // If the second argument is empty, put a zero in its place.
      if (args.length == 1 || args[1].trim().length == 0) args[1] = "0";
      args[0] = "(" + args[0] + ")/L_x";
      args[1] = "(" + args[1] + ")/L_y";
      toAdd =
        "texture(imageSource" +
        imNum +
        ",vec2(" +
        args.join(",") +
        "))." +
        component;

      newStr = replaceStrAtIndex(
        newStr,
        toAdd,
        funcInd + offset,
        endInd + 1 + offset
      );
      offset += toAdd.length - endInd + funcInd - 1;
    }
  }
  return newStr;
}

function alternateBrackets(str) {
  // Given a string with balanced bracketing, loop nested brackets through (, [.
  const openBrackets = ["(", "["];
  const closeBrackets = [")", "]"];
  let bracketInd = 0;
  let bracketDepth = 0;
  let lastIndex = 0;
  let chunk = "";
  let strOut = "";
  for (var ind = 0; ind < str.length; ind++) {
    if (openBrackets.includes(str[ind])) {
      bracketInd += 1;
      bracketDepth += 1;
    } else if (closeBrackets.includes(str[ind])) {
      bracketInd -= 1;
    }
    if (bracketInd == 0 && bracketDepth > 0) {
      chunk = str.slice(lastIndex, ind + 1);
      strOut = strOut + alternateBracketsGivenDepth(chunk, bracketDepth);
      bracketDepth = 0;
      lastIndex = ind + 1;
    }
  }
  strOut = strOut + str.slice(lastIndex);
  return strOut;
}

function alternateBracketsGivenDepth(str, depth) {
  // Given a string with balanced bracketing, loop nested brackets through (, [.
  // Requires a depth so that it can select brackets from the outside in, i.e. 321123
  const openBrackets = ["(", "["];
  const closeBrackets = [")", "]"];
  let bracketInd = modulo(-depth + 1, openBrackets.length);
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

function replaceStrAtIndex(str, toSub, ind, resumeInd) {
  if (resumeInd == undefined) resumeInd = ind + 1;
  return str.slice(0, ind) + toSub + str.slice(resumeInd, str.length);
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
    // Remove any existing sliders.
    if (controller.hasOwnProperty("slider")) {
      // Remove any existing sliders.
      controller.slider.remove();
      delete controller.slider;
      // Remove the parameterSlider class from the controller.
      controller.domElement.closest("li").classList.remove("parameterSlider");
    }
    // If the string is of the form "name = val in [a,b]", create a slider underneath this controller with
    // limits a,b.
    let regex =
      /\s*(\w+)\s*=\s*(\S*)\s*in\s*[\[\(]([0-9\.\-]+)\s*,\s*(?:([0-9\.]*)\s*,)?\s*([0-9\.\-]+)[\]\)]/;
    let match = kineticParamsStrs[label].match(regex);
    if (match) {
      // Add a CSS class highlighting that this controller now contains a slider too.
      controller.domElement.parentElement.parentElement.classList.add(
        "parameterSlider"
      );
      // Create a range input object and tie it to the controller.
      controller.slider = document.createElement("input");
      controller.slider.classList.add("styled-slider");
      controller.slider.classList.add("slider-progress");
      controller.slider.type = "range";
      controller.slider.min = match[3];
      controller.slider.max = match[5];

      let step;
      // Define the step of the slider, which may or may not have been given.
      if (match[4] == undefined) {
        match[4] = "";
        // Choose a step that either matches the max precision of the inputs, or
        // splits the interval into 20, whichever is more precise.
        controller.slider.precision =
          Math.max(
            parseFloat(match[2]).countDecimals(),
            parseFloat(match[3]).countDecimals(),
            parseFloat(match[5]).countDecimals()
          ) + 1;
        step = Math.min(
          (parseFloat(match[5]) - parseFloat(match[3])) / 20,
          10 ** -controller.slider.precision
        );
      } else {
        controller.slider.precision =
          Math.max(
            parseFloat(match[2]).countDecimals(),
            parseFloat(match[3]).countDecimals(),
            parseFloat(match[4]).countDecimals(),
            parseFloat(match[5]).countDecimals()
          ) + 1;
        step = match[4];
        match[4] += ", ";
      }
      controller.slider.precision = Math.max(
        controller.slider.precision,
        parseFloat(step).countDecimals()
      );
      controller.slider.step = step.toString();

      // Assign the initial value, which should happen after step has been defined.
      controller.slider.value = match[2];

      // Use the input event of the slider to update the controller and the simulation.
      controller.slider.addEventListener("input", function () {
        controller.slider.style.setProperty("--value", controller.slider.value);
        let valueRegex = /\s*(\w+)\s*=\s*(\S*)\s*/g;
        kineticParamsStrs[label] = kineticParamsStrs[label].replace(
          valueRegex,
          match[1] +
            " = " +
            parseFloat(controller.slider.value)
              .toFixed(controller.slider.precision)
              .toString() +
            " "
        );
        refreshGUI(parametersFolder);
        setKineticStringFromParams();
        render();
        // Update the uniforms with this new value.
        if (setKineticUniforms() || compileErrorOccurred) {
          // Reset the error flag.
          compileErrorOccurred = false;
          // If we added a new uniform, we need to remake all the shaders.
          updateShaders();
        }
      });

      // Augment the onChange function of the controller to also update the slider.
      controller.__oldOnFinishChange = controller.onFinishChange;
      controller.onFinishChange = function () {
        controller.__oldOnFinishChange();
        controller.slider.value = match[2];
      };

      // Configure the slider's style so that it can be nicely formatted.
      controller.slider.style.setProperty("--value", controller.slider.value);
      controller.slider.style.setProperty("--min", controller.slider.min);
      controller.slider.style.setProperty("--max", controller.slider.max);

      // Add the slider to the DOM.
      controller.domElement.appendChild(controller.slider);
    }
  }
  if (isNextParam) {
    kineticParamsLabels.push(label);
    kineticParamsStrs[label] = "";
    controller = parametersFolder.add(kineticParamsStrs, label).name("");
    disableAutocorrect(controller.domElement);
    controller.domElement.classList.add("params");
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
        let newController = createParameterController(
          kineticParamsLabels.at(index),
          false
        );
        // We record the name of the parameter in the controller.
        const match = str.match(/\s*(\w+)\s*=/);
        if (match) {
          newController.lastName = match[1];
          kineticNameToCont[newController.lastName] = newController;
        }
        kineticParamsCounter += 1;
        let newLabel = "params" + kineticParamsCounter;
        this.remove();
        createParameterController(newLabel, true);
        // Update the uniforms, the kinetic string for saving and, if we've added something that we've not seen before, update the shaders.
        setKineticStringFromParams();
        if (setKineticUniforms() || compileErrorOccurred) {
          // Reset the error flag.
          compileErrorOccurred = false;
          updateShaders();
        }
      }
    });
  } else {
    controller = parametersFolder.add(kineticParamsStrs, label).name("");
    disableAutocorrect(controller.domElement);
    controller.domElement.classList.add("params");
    const match = kineticParamsStrs[label].match(/\s*(\w+)\s*=/);
    if (match) {
      controller.lastName = match[1];
      kineticNameToCont[controller.lastName] = controller;
    }
    controller.onFinishChange(function () {
      // Remove excess whitespace.
      let str = removeWhitespace(kineticParamsStrs[label]);
      if (str == "") {
        // If the string is empty, delete this controller and any associated slider.
        if (
          controller.domElement.closest("li").hasOwnProperty("parameterSlider")
        ) {
          // Remove any existing sliders.
          controller.slider.remove();
          // Remove the parameterSlider class from the controller.
          controller.domElement
            .closest("li")
            .classList.remove("parameterSlider");
        }
        this.remove();
        // Remove the associated label and the (empty) kinetic parameters string.
        const index = kineticParamsLabels.indexOf(label);
        kineticParamsLabels.splice(index, 1);
        delete kineticParamsStrs[label];
        // Remove any uniform created with this parameter name.
        if (
          controller.hasOwnProperty("lastName") &&
          !isReservedName(controller.lastName)
        ) {
          delete uniforms[controller.lastName];
        }
      } else {
        // Otherwise, check if we need to create/modify a slider.
        createSlider();
        // Check if we need to update the parameter name and remove a redundant uniform.
        const match = replaceDigitsWithWords(str).match(/\s*(\w+)\s*=/);
        if (
          match &&
          controller.hasOwnProperty("lastName") &&
          controller.lastName != match[1] &&
          !isReservedName(controller.lastName)
        ) {
          delete uniforms[controller.lastName];
          controller.lastName = match[1];
          kineticNameToCont[controller.lastName] = controller;
        }
      }
      setKineticStringFromParams();
      if (setKineticUniforms()) {
        updateShaders();
      }
    });
    // Update the uniforms, the kinetic string for saving and, if we've added something that we've not seen before, update the shaders.
    setKineticStringFromParams();
    if (setKineticUniforms()) {
      updateShaders();
    }
  }
  // Now that we've made the required controller, check the current string to see if
  // the user has requested that we make other types of controller (e.g. a slider).
  createSlider();
  // Return the controller in case it is needed.
  return controller;
}

function setParamsFromKineticString() {
  // Take the kineticParams string in the options and
  // use it to populate a GUI containing these parameters
  // as individual options.
  let label,
    str,
    newLabels = [];
  let strs = options.kineticParams.split(";");
  for (var index = 0; index < strs.length; index++) {
    str = removeWhitespace(strs[index]);
    if (str == "") {
      // If the string is empty, do nothing.
    } else {
      // Add whitespace to the string around "=".
      str = str.replace(/(\S)=/, "$1 =");
      str = str.replace(/=(\S)/, "= $1");
      // Add whitespace after commas.
      str = str.replaceAll(/,(\S)/g, ", $1");
      label = "param" + kineticParamsCounter;
      kineticParamsCounter += 1;
      kineticParamsLabels.push(label);
      kineticParamsStrs[label] = str;
      newLabels.push(label);
    }
  }
  // Having defined all the parameters, create the controllers. This separate loops allows dependencies
  // between parameters, as all parameters have been initialised by this point.
  for (const label of newLabels) {
    createParameterController(label, false);
  }
  // Finally, create an empty controller for adding parameters.
  label = "param" + kineticParamsCounter;
  kineticParamsLabels.push(label);
  kineticParamsStrs[label] = str;
  createParameterController(label, true);
}

function setKineticStringFromParams() {
  // Combine the custom parameters into a single string for storage, so long as no reserved names are used.
  options.kineticParams = Object.values(kineticParamsStrs)
    .map(function (str) {
      return str.replaceAll(/"\s+"/g, " ");
    })
    .join(";");
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
  setTimeout(function () {
    if ($(id).hasClass("fading_out")) {
      $(id).removeClass("fading_out");
      $(id).hide();
    }
  }, 1000);
}

function configureColourbar() {
  if (options.colourbar) {
    $("#colourbar").show();
    let cString = "linear-gradient(90deg, ";
    for (var val = 0; val < 1; val += 0.01) {
      cString +=
        "rgb(" +
        colourFromValue(val).map((x) => 255 * x) +
        ") " +
        100 * val +
        "%,";
    }
    cString = cString.slice(0, -1) + ")";
    $("#colourbar").css("background", cString);
    if (options.whatToPlot == "MAX") {
      $("#minLabel").html("$" + listOfSpecies[0] + "$");
      $("#midLabel").html("$" + listOfSpecies[1] + "$");
      $("#maxLabel").html("$" + listOfSpecies[2] + "$");
    } else {
      if (isStory) {
        $("#midLabel").html(
          options.views[options.activeViewInd].name.replaceAll(
            /\s*<br \/>\s*/g,
            " "
          )
        );
      } else {
        $("#midLabel").html("$" + parseStringToTEX(options.whatToPlot) + "$");
      }
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
    // We want to display a string that is the shorter of 3 sig. fig. and 3 dec. places.
    let minStr, maxStr;
    [minStr, maxStr] = formatColourbarLabels(
      options.minColourValue,
      options.maxColourValue
    );
    // If either strings are just zeros, simply write 0.
    const regex = /[1-9]/;
    if (!regex.test(minStr)) minStr = "0";
    if (!regex.test(maxStr)) maxStr = "0";
    $("#minLabel").html(minStr);
    $("#maxLabel").html(maxStr);
  }
  // Get the leftmost and rightmost colour values from the map.
  let leftColour = computeColourBrightness(colourFromValue(0));
  let midColour = computeColourBrightness(colourFromValue(0.5));
  let rightColour = computeColourBrightness(colourFromValue(1.0));

  const threshold = 0.51;
  if (leftColour < threshold) {
    // If the background colour is closer to black than white, set
    // the label to be white.
    $("#minLabel").css("color", "#fff");
  } else {
    $("#minLabel").css("color", "#000");
  }
  if (midColour < threshold) {
    // If the background colour is closer to black than white, set
    // the label to be white.
    $("#midLabel").css("color", "#fff");
  } else {
    $("#midLabel").css("color", "#000");
  }
  if (rightColour < threshold) {
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

function shortestStringNum(num, depth) {
  const dec = num.toFixed(depth);
  const sig = num.toPrecision(depth);
  return dec.length < sig.length ? dec : sig;
}

function formatColourbarLabels(min, max) {
  const depth = 3;
  // Check if both numbers are close to zero, in which case use exponential notation.
  if (Math.abs(min) < 0.001 && Math.abs(max) < 0.001) {
    return [min.toExponential(depth - 1), max.toExponential(depth - 1)];
  }
  // Otherwise, use the shorter of dp or sig fig for each.
  return [shortestStringNum(min, depth), shortestStringNum(max, depth)];
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
    str = str.replace(/e(\+)*(\-)*([0-9]*)/, " × 10<sup>$2$3<sup>");
    $("#timeValue").html(str);
    checkColourbarPosition();
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
  options.integrate && options.timeDisplay
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
    checkColourbarPosition();
  }
}

function checkForNaN() {
  // Check to see if a NaN value is in the first entry of the simulation array, which would mean that we've hit overflow or instability.
  let vals = getMinMaxVal();
  if (!isFinite(vals[0]) || !isFinite(vals[1])) {
    fadein("#oops_hit_nan");
    pauseSim();
    $("#erase").one("click", () => fadeout("#oops_hit_nan"));
  } else {
    NaNTimer = setTimeout(checkForNaN, 1000);
  }
}

function fillBuffer() {
  if (!bufferFilled) {
    try {
      renderer.readRenderTargetPixels(
        postTexture,
        0,
        0,
        nXDisc,
        nYDisc,
        buffer
      );
    } catch {
      alert(
        "Sadly, your configuration is not fully supported by VisualPDE. Some features may not work as expected, but we encourage you to try!"
      );
    }
    bufferFilled = true;
  }
}

function checkColourbarPosition() {
  // If there's a potential overlap of the data display and the colourbar, move the former up.
  if (options.colourbar && options.integrate | options.timeDisplay) {
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
        dataNudgedUp = true;
      }
    } else {
      if (dataNudgedUp) {
        nudgeUIUp("#dataContainer", 0);
        dataNudgedUp = false;
      }
    }
  }
}

function configureManualInterpolation() {
  if (isManuallyInterpolating()) {
    simTextures.forEach((simTex) => {
      simTex.texture.magFilter = THREE.NearestFilter;
    });
    postTexture.texture.magFilter = THREE.NearestFilter;
    interpolationTexture.texture.magFilter = THREE.NearestFilter;
  } else {
    simTextures.forEach((simTex) => {
      simTex.texture.magFilter = THREE.LinearFilter;
    });
    postTexture.texture.magFilter = THREE.LinearFilter;
    interpolationTexture.texture.magFilter = THREE.LinearFilter;
  }
  configureGUI();
  render();
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

function getReservedStrs(exclusions) {
  // Load an RD shader and find floats, vecs, and ivecs.
  let regex = /(?:float|vec\d|ivec\d|function|void)\b\s+(\w+)\b/g;
  let str = RDShaderTop() + RDShaderUpdateCross();
  let reserved = [...str.matchAll(regex)].map((x) => x[1]).concat(exclusions);
  return reserved;
}

function isReservedName(name, exclusions) {
  if (exclusions == undefined) exclusions = [];
  return getReservedStrs(exclusions).some(function (badName) {
    let regex = new RegExp("\\b" + badName + "\\b", "g");
    return regex.test(name);
  });
}

function replaceUserDefReac(str, regex, input) {
  // Insert user-defined input into str in place of original.
  // E.g. str = some TeX, regex = /\bf\b/g; input = "2*a".
  // If the input is 0, just remove the original from str.
  if (input.replace(/\s+/g, "  ").trim() == "0")
    return str.replaceAll(regex, "");
  // If the input contains letters (like parameters), insert it with delimiters.
  if (input.match(/[a-zA-Z]/)) return str.replaceAll(regex, input);
  // If it's just a scalar, keep the original, but replace old species with new.
  return str;
}

function replaceUserDefDiff(str, regex, input, delimiters) {
  // Insert user-defined input into str in place of original, surrounded by delimiters.
  // E.g. str = some TeX, regex = /(D_{uu}) (\\vnabla u)/g; input = "2*a"; delimiters = " ";
  // If the input is 0, just remove the original from str.
  let trimmed = input.replace(/\s+/g, "  ").trim();
  if (trimmed == "0" || trimmed == "0.0") return str.replaceAll(regex, "");
  if (trimmed == "1" || trimmed == "1.0") return str.replaceAll(regex, "$2");
  if (trimmed == "-1" || trimmed == "-1.0") return str.replaceAll(regex, "-$2");
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
    setLineWidth();
    options.typeOfBrush = "vline";
    setBrushType();
    refreshGUI(rightGUI);
    domain.visible = false;
    line.visible = true;
    options.contours = false;
    options.emboss = false;
    options.vectorField = false;
    configureVectorField();
  } else {
    domain.visible = true;
    line.visible = false;
    if (options.plotType == "surface") {
      $("#simCanvas").css("outline", "2px #000 solid");
      if (usingLowResDomain) {
        usingLowResDomain = false;
        replaceDisplayDomains();
      }
      options.vectorField = false;
      configureVectorField();
    } else {
      $("#simCanvas").css("outline", "");
    }
  }
  setDisplayColourAndType();
  configureCameraAndClicks();
  configureGUI();
}

function configureDimension() {
  // Configure the dimension of the equations.
  if (options.dimension != 1 && options.plotType == "line") {
    options.plotType = "plane";
    configurePlotType();
  }
  if (options.dimension == 1 && options.plotType != "line") {
    options.plotType = "line";
    configurePlotType();
  }
  resize();
  setRDEquations();
  setEquationDisplayType();
  configureGUI();
  configureIntegralDisplay();
}

function setCameraPos() {
  const pos = new THREE.Vector3().setFromSphericalCoords(
    1,
    Math.PI / 2 - (options.cameraTheta * Math.PI) / 180,
    -(options.cameraPhi * Math.PI) / 180
  );
  camera.position.set(pos.x, pos.y, pos.z);
  camera.lookAt(0, 0, 0);
}

function checkColourbarLogoCollision() {
  // If the logo and the colourbar overlap, remove the logo.
  if ($("#logo").is(":visible") && $("#colourbar").is(":visible")) {
    if (
      $("#logo")[0].getBoundingClientRect().right >=
      $("#colourbar")[0].getBoundingClientRect().left
    ) {
      $("#logo").hide();
    }
  }
}

function getKineticParamDefs() {
  // options.kineticParams could contain additional directives, like "in [0,1]", used
  // to create additional controllers. We want to save these in options.kineticParams, but
  // can't pass them to the shader like this. Here, we strip these directives from the string.
  // If a kineticParam is of the form "name = val in [a,b]", remove the in [a,b] part.
  let out = options.kineticParams.replaceAll(/\bin[^;]*;?/g, ";");

  return out;
}

function sanitise(str) {
  return replaceDigitsWithWords(str);
}

function getKineticParamNames() {
  // Return a list of parsed kinetic parameter names.
  const regex = /(\w+)\s*=/;
  return getKineticParamDefs()
    .split(";")
    .filter((x) => x.length > 0)
    .map((x) => x.match(regex)[1].trim());
}

function setKineticUniforms() {
  // Set uniforms based on the parameters defined in kineticParams.
  // Return true if we're adding a new uniform, which signifies that all shaders must be
  // updated to reference this new uniform.
  const paramStrs = getKineticParamDefs()
    .split(";")
    .filter((x) => x.length > 0);
  const nameVals = evaluateParamVals(paramStrs);
  // Check for any duplicated parameter names.
  const dups = getDuplicates(getKineticParamNames());
  if (dups.length > 0) {
    throwError(
      "It looks like there are multiple definitions of '" +
        dups.join("', '") +
        "'. Please check your parameters to ensure everything has a unique definition."
    );
    return false;
  }
  let addingNewUniform = false;
  let encounteredError = false;
  for (const nameVal of nameVals) {
    let [uniformFlag, errorFlag] = setKineticUniform(nameVal[0], nameVal[1]);
    addingNewUniform |= addingNewUniform;
    encounteredError |= errorFlag;
  }
  return addingNewUniform && !encounteredError;
}

function setKineticUniform(name, value) {
  // Set a uniform with given name and value.
  // Return true if we're adding a new uniform, which signifies that all shaders must be
  // updated to reference this new uniform.
  let addingNewUniform = false;
  let errorFlag = false;
  // Sanitise the name for the shader.
  const cleanName = sanitise(name);
  if (isReservedName(cleanName)) {
    throwError(
      "The name '" +
        name +
        "' is used under the hood, so can't be used as a parameter name. Please use a different name for " +
        name +
        "."
    );
    errorFlag = true;
  } else {
    // If no such uniform exists, make a note of this.
    addingNewUniform = !uniforms.hasOwnProperty(cleanName);
    // Define the required uniform.
    uniforms[cleanName] = {
      type: "float",
      value: value,
    };
  }
  return [addingNewUniform, errorFlag];
}

function kineticUniformsForShader() {
  // Given the kinetic parameters in options.kineticParams, return GLSL defining uniforms with
  // these names.
  return sanitise(
    getKineticParamNames()
      .map((x) => "uniform float " + x + ";")
      .join("\n")
  );
}

function evaluateParamVals(strs) {
  // Return a list of (name,value) pairs for parameters defined in
  // a list of strings. These can depend on each other, but not cyclically.
  let strDict = {};
  let valDict = {};
  let badNames = [];
  strs.forEach(function (str) {
    const [name, valStr] = str.split("=").map((x) => x.trim());
    strDict[name] = valStr;
  });
  const nameVals = strs.map((x) => x.split("=").map((y) => y.trim()));
  const names = nameVals.map((x) => x[0]);
  for (const nameVal of nameVals) {
    // Evaluate each parameter.
    let [name, val] = nameVal;
    if (!(name in valDict)) {
      // We've not computed the value of this yet.
      [valDict, , badNames] = evaluateParam(
        name,
        strDict,
        valDict,
        [name],
        names,
        []
      );
    }
  }
  // If the parameters were cyclic, throw an error.
  if (badNames.length > 0) {
    throwError(
      "Cyclic parameters detected. Please check the definition(s) of " +
        badNames.join(", ") +
        "."
    );
  }
  return Object.keys(valDict).map((x) => [x, valDict[x]]);
}

function evaluateParam(name, strDict, valDict, stack, names, badNames) {
  // If we know the value already, don't do anything.
  if (name in valDict) return [valDict, stack.slice(0, -1), badNames];
  // Find any names in val and evaluate them.
  let regex;
  for (const otherName of names) {
    // Skip the name if it's not in vals.
    regex = new RegExp("\\b" + otherName + "\\b", "g");
    if (!regex.test(strDict[name])) continue;
    // Otherwise, check if it's a bad name.
    if (stack.includes(otherName)) {
      // We've hit a parameter that we're already trying to evaluate - cyclic!
      // Set the value to 0 and record the name as bad so that we can throw an error.
      valDict[otherName] = 0.0;
      strDict[otherName] = "0";
      strDict[name] = "0";
      badNames.push(otherName);
    } else {
      // Otherwise, try and evaluate the parameter and substitute the value into the expression.
      [valDict, , badNames] = evaluateParam(
        otherName,
        strDict,
        valDict,
        [...stack, otherName],
        names,
        badNames
      );
      strDict[name] = strDict[name].replaceAll(
        regex,
        valDict[otherName].toString()
      );
    }
  }
  // Now that we've assigned all the values that we could need, parse the expression.
  try {
    valDict[name] = parser.evaluate(strDict[name]);
  } catch (error) {
    throwError(
      "Unable to evaluate the definition of " +
        name +
        ". Please check for syntax errors or undefined parameters."
    );
    valDict[name] = 0;
  }
  return [valDict, stack.slice(0, -1), badNames];
}

function updateShaders() {
  // Update all the shaders that are constructed using user input.
  setRDEquations();
  setClearShader();
  setBrushType();
  updateWhatToPlot();
  setDrawAndDisplayShaders();
  setPostFunFragShader();
}

function replaceDigitsWithWords(strIn) {
  // For any digits [0-9] in strIn, replace them with their word equivalents.
  let regex;
  let strOut = strIn;
  for (let num = 0; num < 10; num++) {
    regex = new RegExp("([a-zA-Z_]+[0-9]*)(" + num.toString() + ")", "g");
    while (strOut != (strOut = strOut.replace(regex, "$1" + numsAsWords[num])));
  }
  return strOut;
}

function resizeEquationDisplay() {
  // Iteratively reduce the font size of the equation display until the container
  // doesn't encroach on the RHS of the screen.
  const el = $("#equation_display div mjx-container").children("mjx-math");
  var fz;
  el.css("font-size", "");
  var count = 0;
  if ($("#leftGUI")[0] == undefined) return;
  const rGUI = $("#rightGUI")[0];
  var rGUICorrection = 0;
  if (rGUI != undefined) rGUICorrection = rGUI.getBoundingClientRect().width;
  while (
    (count < 20) &
    ($("#equation_display")[0].getBoundingClientRect().right >=
      window.innerWidth - 65 - rGUICorrection) &
    ($("#equation_display")[0].getBoundingClientRect().width >
      $("#leftGUI")[0].getBoundingClientRect().width)
  ) {
    fz = (parseFloat(el.css("font-size")) * 0.9).toString() + "px";
    el.css("font-size", fz);
    count += 1;
  }

  // Set the left gui max height based on its position.
  $(":root").css(
    "--left-ui-v-offset",
    $("#leftGUI")[0].getBoundingClientRect().top
  );
}

function computeColourBrightness(col) {
  return col.reduce((a, b) => a + b, 0) / 3;
}

function setColourRange() {
  // Set the range of the colour axis based on the extremes of the computed values.
  let valRange = getMinMaxVal();
  options.minColourValue = valRange[0];
  options.maxColourValue = valRange[1];
  uniforms.maxColourValue.value = options.maxColourValue;
  uniforms.minColourValue.value = options.minColourValue;
  maxColourValueController.updateDisplay();
  minColourValueController.updateDisplay();
  updateColourbarLims();
}

function updateGUIDropdown(controller, labels, values) {
  // Update the dropdown of a dat.GUI controller.
  if (values == undefined) {
    values = labels;
  }
  let innerHTMLStr = "";
  for (var i = 0; i < labels.length; i++) {
    var str =
      "<option value='" +
      values[i].toString() +
      "'>" +
      labels[i].toString() +
      "</option>";
    innerHTMLStr += str;
  }
  controller.domElement.children[0].innerHTML = innerHTMLStr;
}

function setCustomNames(onLoading) {
  let oldListOfSpecies;
  if (listOfSpecies != undefined) {
    oldListOfSpecies = listOfSpecies;
  }
  const newSpecies = options.speciesNames
    .replaceAll(/\W+/g, " ")
    .trim()
    .split(" ")
    .slice(0, defaultSpecies.length);

  const newReactions = options.reactionNames
    .replaceAll(/\W+/g, " ")
    .trim()
    .split(" ")
    .slice(0, defaultReactions.length);

  // If not enough species or reactions have been provided, add placeholders for those remaining.
  const tempListOfSpecies = newSpecies.concat(
    placeholderSp.slice(newSpecies.length)
  );
  const tempListOfReactions = newReactions.concat(
    placeholderRe.slice(newReactions.length)
  );

  // Check if any reserved names have been used, and stop if so.
  const kinParamNames = getKineticParamNames();
  let message;
  for (var ind = 0; ind < tempListOfSpecies.length; ind++) {
    if (
      isReservedName(
        tempListOfSpecies[ind],
        kinParamNames.concat(tempListOfReactions)
      )
    ) {
      if (kinParamNames.includes(tempListOfSpecies[ind])) {
        message = "as a parameter";
      } else if (tempListOfReactions.includes(tempListOfSpecies[ind])) {
        message = "as a reaction";
      } else {
        message = "under the hood";
      }
      alert(
        "The name '" +
          tempListOfSpecies[ind] +
          "' is used " +
          message +
          ", so can't be used as a species name. Please use a different name for " +
          tempListOfSpecies[ind] +
          "."
      );
      return;
    }
  }
  for (var ind = 0; ind < tempListOfReactions.length; ind++) {
    if (
      isReservedName(
        tempListOfReactions[ind],
        kinParamNames.concat(tempListOfSpecies[ind])
      )
    ) {
      if (kinParamNames.includes(tempListOfReactions[ind])) {
        message = "as a parameter";
      } else if (tempListOfSpecies.includes(tempListOfReactions[ind])) {
        message = "as a reaction";
      } else {
        message = "under the hood";
      }
      throwError(
        "The name '" +
          tempListOfReactions[ind] +
          "' is used " +
          message +
          ", so can't be used as a function name. Please use a different name for " +
          tempListOfReactions[ind] +
          "."
      );
      return;
    }
  }

  // Now that we know all the names are valid, assign the names to the global variables.
  listOfSpecies = tempListOfSpecies;
  listOfReactions = tempListOfReactions;

  // Define non-capturing strings that are equivalent to the old [uvwq], [vwq] etc in regexes.
  genAnySpeciesRegexStrs();

  // Configuring the GUI requires strings for D_{u u} etc, so we'll modify the strings here for later use.
  let defaultStrings = {
    ...getDefaultTeXLabelsDiffusion(),
    ...getDefaultTeXLabelsBCsICs(),
  };
  Object.keys(defaultStrings).forEach(function (key) {
    TeXStrings[key] = parseStringToTEX(
      replaceSymbolsInStr(
        defaultStrings[key],
        defaultSpecies,
        listOfSpecies,
        "_[xy]"
      )
    );
  });

  // Configuring the GUI requires strings for f, g etc, so we'll modify the default strings for use here
  // via placeholders.
  defaultStrings = getDefaultTeXLabelsReaction();
  Object.keys(defaultStrings).forEach(function (key) {
    TeXStrings[key] = parseStringToTEX(
      replaceSymbolsInStr(
        defaultStrings[key],
        defaultReactions,
        listOfReactions
      )
    );
  });

  // Don't update the problem if we're just loading in, as this will be done as part of loading.
  if (onLoading) return;

  // If we're not loading in, go through options and replace the old species with the new ones.
  Object.keys(options).forEach(function (key) {
    if (userTextFields.includes(key)) {
      options[key] = replaceSymbolsInStr(
        options[key],
        oldListOfSpecies,
        listOfSpecies,
        "_[xy]"
      );
    }
  });
  options.views = options.views.map(function (view) {
    let newView = {};
    newView.name = view.name;
    Object.keys(view).forEach(function (key) {
      if (userTextFields.includes(key)) {
        newView[key] = replaceSymbolsInStr(
          view[key],
          oldListOfSpecies,
          listOfSpecies,
          "_[xy]"
        );
      }
    });
    return newView;
  });
  // Do the same for savedOptions.
  Object.keys(savedOptions).forEach(function (key) {
    if (userTextFields.includes(key)) {
      savedOptions[key] = replaceSymbolsInStr(
        savedOptions[key],
        oldListOfSpecies,
        listOfSpecies,
        "_[xy]"
      );
    }
  });
  savedOptions.views = savedOptions.views.map(function (view) {
    let newView = {};
    newView.name = view.name;
    Object.keys(view).forEach(function (key) {
      if (userTextFields.includes(key)) {
        newView[key] = replaceSymbolsInStr(
          view[key],
          oldListOfSpecies,
          listOfSpecies,
          "_[xy]"
        );
      }
    });
    return newView;
  });
  configureOptions();
  configureGUI();
  updateShaders();
  setEquationDisplayType();
}

function genAnySpeciesRegexStrs() {
  // Generate RegExp that is equivalent to [uvwq], [vwq], [wq], [q] but with
  // the new species inserted. Sort before forming regex to pick up nested species.
  anySpeciesRegexStrs = [];
  for (let i = 0; i < listOfSpecies.length; i++) {
    anySpeciesRegexStrs.push(
      "(?:" +
        listOfSpecies
          .slice(i)
          .sort((a, b) => b.length - a.length)
          .map((x) => "(?:" + x + ")")
          .join("|") +
        ")"
    );
  }
}

function replaceSymbolsInStr(str, originals, replacements, optional) {
  // Replace all the symbols from originals, found as whole words, with those
  // in replacements, allowing for an optional trailing regex.
  if (optional == undefined) optional = "";
  const placeholders = new Array(originals.length)
    .fill(0)
    .map((x, i) => "PLACE" + i.toString());
  let regex;
  // Substitute in placeholders first.
  for (var ind = 0; ind < originals.length; ind++) {
    regex = new RegExp(
      "\\b(" + originals[ind] + ")(" + optional + ")?\\b",
      "g"
    );
    str = str.replaceAll(regex, placeholders[ind] + "$2");
  }
  // Now swap the placeholders for the new reactions.
  for (var ind = 0; ind < placeholders.length; ind++) {
    regex = new RegExp(
      "\\b(" + placeholders[ind] + ")(" + optional + ")?\\b",
      "g"
    );
    str = str.replaceAll(regex, replacements[ind] + "$2");
  }
  return str;
}

function setLineXY(xy) {
  // Set the xy coordinates of the display line, scaling y by options.threeDHeightScale.
  let start = line.geometry.attributes.instanceStart;
  let end = line.geometry.attributes.instanceEnd;
  let coord;
  for (let i = 0; i < xy.length; i++) {
    coord = xy[i].toArray();
    coord[1] *= options.threeDHeightScale;
    if (i < xy.length) start.setXYZ(i, coord[0], coord[1], 0);
    if (i > 0) end.setXYZ(i - 1, coord[0], coord[1], 0);
  }
  start.needsUpdate = true;
  end.needsUpdate = true;
}

function setLineColour(xy) {
  // Set the display line colour from the xy coordinates, noting that y in [-0.5,0.5].
  // The colour is given simply by the y coordinate.
  let start = line.geometry.attributes.instanceColorStart;
  let end = line.geometry.attributes.instanceColorEnd;
  let colour;
  for (let i = 0; i < xy.length; i++) {
    colour = colourFromValue(xy[i].toArray()[1] + 0.5);
    if (i < xy.length) start.setXYZ(i, colour[0], colour[1], colour[2]);
    if (i > 0) end.setXYZ(i - 1, colour[0], colour[1], colour[2]);
  }
  start.needsUpdate = true;
}

function colourFromValue(val) {
  // For val in [0,1] assign a colour using the colourmap.
  val = val.clamp(0, 1);
  let ind = 0;
  while (val >= colourmapEndpoints[ind + 1] && ind < colourmap.length - 2) {
    ind += 1;
  }

  if (colourmapEndpoints[ind + 1] == colourmapEndpoints[ind])
    return colourmap[ind];
  // Interpolate between the colours on the required segment. Note ind 0 <= ind < 4.
  return lerpArrays(
    colourmap[ind],
    colourmap[ind + 1],
    (val - colourmapEndpoints[ind]) /
      (colourmapEndpoints[ind + 1] - colourmapEndpoints[ind])
  ).map((x) => x.clamp(0, 1));
}

function lerpArrays(v1, v2, t) {
  // Linear interpolation of arrays v1 and v2, with t in [0,1].
  let res = new Array(v1.length);
  for (let i = 0; i < res.length; i++) {
    res[i] = lerp(v1[i], v2[i], t);
  }
  return res;
}

function lerp(a, b, t) {
  // Linear interpolation between a and b, with t in [0,1].
  t = t.clamp(0, 1);
  return (1 - t) * a + t * b;
}

function setLineWidth() {
  lineMaterial.linewidth = 0.01 * options.lineWidthMul;
  lineMaterial.needsUpdate = true;
}

function setOnfocus(cont, fun, args) {
  // Set the onfocus handler of a free-text controller.
  cont.domElement.firstChild.onfocus = () => fun(args);
}

function setOnblur(cont, fun, args) {
  // Set the onblur handler of a free-text controller.
  cont.domElement.firstChild.onblur = () => fun(args);
}

function selectTeX(ids) {
  ids.forEach(function (id) {
    selectedEntries.add(id);
  });
  setEquationDisplayType();
}

function deselectTeX(ids) {
  ids.forEach(function (id) {
    selectedEntries.delete(id);
  });
  setEquationDisplayType();
}

function getRawState() {
  stateBuffer = new Float32Array(nXDisc * nYDisc * 4);
  renderer.readRenderTargetPixels(
    simTextures[1],
    0,
    0,
    nXDisc,
    nYDisc,
    stateBuffer
  );
}

function getPostState() {
  postBuffer = new Float32Array(nXDisc * nYDisc * 4);
  renderer.readRenderTargetPixels(
    postTexture,
    0,
    0,
    nXDisc,
    nYDisc,
    postBuffer
  );
}

function saveSimState() {
  // Save the current state in memory as a buffer.
  getRawState();

  // Create a texture from the state buffer.
  createCheckpointTexture(stateBuffer);

  checkpointExists = true;
}

function exportSimState() {
  // Save a checkpoint to file. If no checkpoint exists, create one.
  if (!checkpointExists) {
    saveSimState();
  }

  // Download the buffer as a file, with the dimensions prepended.
  var link = document.createElement("a");
  link.download = "VisualPDEState";
  link.href = URL.createObjectURL(
    new Blob([new Float32Array([nXDisc, nYDisc]), stateBuffer])
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function loadSimState(file) {
  const reader = new FileReader();
  reader.onload = function () {
    const buff = new Float32Array(reader.result);
    // Create the stateBuffer from the data. The first two elements are width and height.
    createCheckpointTexture(buff.slice(2), buff.slice(0, 2));
    setStretchOrCropTexture(checkpointTexture);
    checkpointExists = true;
    resetSim();
  };
  reader.readAsArrayBuffer(file);
}

function setStretchOrCropTexture(texture) {
  if (texture != null) {
    if (options.resizeCheckpoints == "crop") {
      let textureAspectRatio =
        texture.source.data.height / texture.source.data.width;
      let xScale = 1;
      let yScale = aspectRatio / textureAspectRatio;
      if (yScale > 1) {
        xScale = textureAspectRatio / aspectRatio;
        yScale = 1;
      }
      texture.repeat.set(xScale, yScale);
      texture.offset.set((1 - xScale) / 2, (1 - yScale) / 2);
    } else {
      texture.repeat.set(1, 1);
      texture.offset.set(0, 0);
    }
  }
}

function createCheckpointTexture(buff, dims) {
  if (checkpointTexture != null) {
    checkpointTexture.dispose();
  }
  if (dims == undefined) {
    dims = [nXDisc, nYDisc];
  }
  checkpointTexture = new THREE.DataTexture(
    buff,
    dims[0],
    dims[1],
    THREE.RGBAFormat,
    THREE.FloatType
  );
  checkpointTexture.needsUpdate = true;
  manualInterpolationNeeded
    ? (checkpointTexture.magFilter = THREE.NearestFilter)
    : (checkpointTexture.magFilter = THREE.LinearFilter);
  if (checkpointMaterial != null) {
    checkpointMaterial.map = checkpointTexture;
    checkpointMaterial.needsUpdate;
  }
}

function setRenderSizeToDisc() {
  renderer.setSize(nXDisc, nYDisc, false);
}

function setDefaultRenderSize() {
  renderer.setSize(
    Math.round(devicePixelRatio * canvasWidth),
    Math.round(devicePixelRatio * canvasHeight),
    false
  );
}

function throwError(message) {
  pauseSim();
  // If an error is already being displayed, just update the message.
  if ($("#error").is(":visible")) {
    $("#error_description").html(message);
  } else {
    // Otherwise, create a new error message.
    $("#error_description").html(message);
    fadein("#error");
    $("#error").one("click", function () {
      fadeout("#error");
    });
  }
}

function isValidSyntax(str) {
  // Return true if syntax appears correct, and false otherwise.

  // Empty parentheses?
  if (/\(\s*\)/.test(str)) {
    throwError("Empty parentheses in " + str.trim() + ".");
    return false;
  }

  // Balanced parentheses?
  let bracketDepth = 0;
  for (var ind = 0; ind < str.length; ind++) {
    if (str[ind] == "(") {
      bracketDepth += 1;
    } else if (str[ind] == ")") {
      bracketDepth -= 1;
    }
  }
  if (bracketDepth != 0) {
    throwError("Unbalanced parentheses in " + str.trim() + ".");
    return false;
  }

  // Trailing operator?
  if (/[\+\-\*\^\/]\s*$/.test(str)) {
    throwError(
      "A binary operator is missing an operand in " + str.trim() + "."
    );
    return false;
  }

  // If we've not yet returned false, everything looks ok, so return true.
  return true;
}

function configureViews() {
  // If there's no default view in options.views, add one.
  if (options.views.length == 0) {
    let view = buildViewFromOptions();
    view.name = "1";
    options.views.push(view);
  } else {
    // Fill in any unset parts of the views.
    options.views = options.views.map(function (view) {
      let newView = buildViewFromOptions();
      Object.assign(newView, view);
      return newView;
    });
  }

  // Now that all views are built, save them so that we can restore them later.
  savedViews = options.views;
}

function configureViewsGUI() {
  // Remove every existing list item from views_list.
  $("#views_list").empty();

  let item;
  for (let ind = 0; ind < options.views.length; ind++) {
    item = document.createElement("a");
    item.onclick = function () {
      options.activeViewInd = ind;
      // Apply the view, which will update which button is active through configureGUI().
      applyView(options.views[ind]);
    };
    item.innerHTML =
      "<div class='view_label'>" + options.views[ind].name + "</div>";
    if (ind == options.activeViewInd) item.classList.add("active_button");
    $("#views_list").append(item);
  }
  nextViewNumber = Math.max(options.views.length, nextViewNumber);

  // Only show the Delete Views button if there is more than one view.
  if (options.views.length > 1) {
    $("#deleteViewButton").removeClass("hidden");
  } else {
    $("#deleteViewButton").addClass("hidden");
  }
  if (MathJax.typesetPromise != undefined) {
    MathJax.typesetPromise();
  }
  if (options.views.length > 0) {
    // fitty(".view_label", { maxSize: 32, minSize: 12, multiline: true });
  }
}

function applyView(view, update) {
  // Apply the view, which is an object of parameters that resembles options.
  Object.assign(options, view);
  delete options.name;
  refreshGUI(viewsGUI);

  if (update == undefined || update) {
    // Update what is being plotted, and render.
    updateWhatToPlot();
    configurePlotType();
    setDisplayColourAndType();
    updateUniforms();
    updateColourbarLims();
    configureColourbar();
    configureVectorField();
    updateViewSliders();
    render();
  }

  // fitty(".view_label", { maxSize: 32, minSize: 12, multiline: true });
}

function editCurrentViewName() {
  let name = prompt(
    "Enter a name for the current View. You can enclose mathematics in $ $.",
    options.views[options.activeViewInd].name
  );
  if (name != null) {
    options.views[options.activeViewInd].name = name;
    configureViewsGUI();
    if (MathJax.typesetPromise != undefined) {
      MathJax.typesetPromise();
    }
    // fitty(".view_label", { maxSize: 32, minSize: 12, multiline: true });
  }
}

function addView() {
  // Add a new view.
  let view = buildViewFromOptions();
  view.name = ++nextViewNumber;
  options.views.push(view);
  options.activeViewInd = options.views.length - 1;
  configureViewsGUI();
}

function deleteView() {
  // Remove the current view if there is more than one view.
  if (options.views.length > 1) {
    options.views.splice(options.activeViewInd, 1);
    // Activate the previous view in the list, or the first element.
    if (options.activeViewInd < 1) {
      options.activeViewInd = 0;
    } else {
      options.activeViewInd -= 1;
    }
  } else {
    // Otherwise, just rename the view.
    options.views[options.activeViewInd].name = "Custom";
  }
  applyView(options.views[options.activeViewInd]);
}

function buildViewFromOptions() {
  let view = {};
  fieldsInView.forEach(function (key) {
    view[key] = savedOptions[key];
  });
  return view;
}

function restoreView(ind) {
  // Restore the view at index ind to the saved state.
  options.views[ind] = savedViews[ind];
  applyView(options.views[ind]);
}

function restoreCurrentView() {
  if (options.activeViewInd < options.views.length)
    restoreView(options.activeViewInd);
}

function updateView(property) {
  // Update the active view with options.property.
  if (options.activeViewInd < options.views.length)
    options.views[options.activeViewInd][property] = options[property];
}

function neumannUpdateShader(speciesInd, side) {
  let str = "";
  str += selectSpeciesInShaderStr(
    RDShaderRobinX(side),
    listOfSpecies[speciesInd]
  );
  if (options.dimension > 1) {
    str += selectSpeciesInShaderStr(
      RDShaderRobinY(side),
      listOfSpecies[speciesInd]
    );
  }
  return str;
}

function ghostUpdateShader(speciesInd, side, valStr) {
  let str = "";
  str += selectSpeciesInShaderStr(
    RDShaderGhostX(side),
    listOfSpecies[speciesInd]
  );
  if (options.dimension > 1) {
    str += selectSpeciesInShaderStr(
      RDShaderGhostY(side),
      listOfSpecies[speciesInd]
    );
  }
  // Replace the placeholder GHOST with the specified value.
  str = str.replaceAll("GHOSTSPECIES", valStr);
  return str;
}

function dirichletUpdateShader(speciesInd, side) {
  let str = "";
  str += selectSpeciesInShaderStr(
    RDShaderDirichletX(side),
    listOfSpecies[speciesInd]
  );
  if (options.dimension > 1) {
    str += selectSpeciesInShaderStr(
      RDShaderDirichletY(side),
      listOfSpecies[speciesInd]
    );
  }
  return str;
}

function robinUpdateShader(speciesInd, side) {
  let str = "";
  str += selectSpeciesInShaderStr(
    RDShaderRobinX(side),
    listOfSpecies[speciesInd]
  );
  if (options.dimension > 1) {
    str += selectSpeciesInShaderStr(
      RDShaderRobinY(side),
      listOfSpecies[speciesInd]
    );
  }
  return str;
}

function dirichletEnforceShader(speciesInd, side) {
  let str = "";
  str += selectSpeciesInShaderStr(
    RDShaderDirichletX(side).replaceAll(/updated/g, "gl_FragColor"),
    listOfSpecies[speciesInd]
  );
  if (options.dimension > 1) {
    str += selectSpeciesInShaderStr(
      RDShaderDirichletY(side).replaceAll(/updated/g, "gl_FragColor"),
      listOfSpecies[speciesInd]
    );
  }
  return str;
}

function addButtonList(parent, id) {
  const list = document.createElement("li");
  if (id != null) list.id = id;
  list.classList.add("button_list");
  parent.domElement.children[0].appendChild(list);
  return list;
}

function addButton(parent, inner, onclick, id, title, classes) {
  const button = document.createElement("a");
  if (onclick != undefined) button.onclick = onclick;
  if (id != undefined) button.id = id;
  if (title != undefined) button.title = title;
  if (inner != undefined) button.innerHTML = inner;
  if (classes != undefined) {
    for (const c of classes) {
      button.classList.add(c);
    }
  }
  parent.appendChild(button);
}

function addToggle(
  parent,
  property,
  inner,
  onclick,
  id,
  title,
  folderID,
  classes
) {
  const toggle = document.createElement("a");
  toggle.classList.add("toggle_button");
  toggle.setAttribute("property", property);
  if (onclick == undefined) onclick = () => {};
  toggle.onclick = function () {
    options[toggle.getAttribute("property")] =
      !options[toggle.getAttribute("property")];
    updateToggle(toggle);
    onclick();
  };
  if (id != undefined) toggle.id = id;
  if (title != undefined) toggle.title = title;
  if (inner != undefined) toggle.innerHTML = inner;
  if (folderID != undefined) toggle.setAttribute("folderID", folderID);
  if (classes != undefined) {
    for (const c of classes) {
      toggle.classList.add(c);
    }
  }
  parent.appendChild(toggle);
  updateToggle(toggle);
  return toggle;
}

function addNewline(parent) {
  const breaker = document.createElement("div");
  breaker.classList.add("break");
  parent.appendChild(breaker);
}

function copyConfigAsJSON() {
  // Encode the current simulation configuration as raw JSON and put it on the clipboard.
  let objDiff = diffObjects(options, getPreset("default"));
  // If there's only one view and it has the default name, remove the view from the preset.
  if (options.views.length == 1 && options.views[0].name == "1") {
    delete objDiff.views;
  }
  // If every view has the same value as options for a property, remove that property from the views.
  for (const key of Object.keys(options.views[0])) {
    if (options.hasOwnProperty(key)) {
      if (options.views.map((e) => e[key]).every((v) => v == options[key])) {
        options.views.forEach((v) => delete v[key]);
      }
    }
  }

  objDiff.preset = "PRESETNAME";
  let str = JSON.stringify(objDiff)
    .replaceAll(/\s*,\s*([^0-9-\.\s])/g, ",\n\t$1")
    .replaceAll(":", ": ")
    .replaceAll("  ", " ")
    .replace("{", "{\n\t")
    .replace("}", ",\n}");
  str = 'case "PRESETNAME":\n\toptions = ' + str + ";\nbreak;";

  navigator.clipboard.writeText(str);
}

function copyDebug() {
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
}

function toggleRightUI() {
  $("#right_ui").toggle();
  $("#settings").toggleClass("clicked");
}

function toggleLeftUI() {
  $("#left_ui").toggle();
  $("#equations").toggleClass("clicked");
}

function toggleViewsUI() {
  $("#views_ui").toggle();
  $("#views").toggleClass("clicked");
}

function toggleHelpPanel() {
  $("#help_panel").toggle();
  $("#help").toggleClass("clicked");
}

function toggleSharePanel() {
  $("#share_panel").toggle();
  $("#share").toggleClass("clicked");
}

function onMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

function smallScreen() {
  return window.width < 629;
}

function copyIframe() {
  // Get the URL of the current sim.
  let url = getSimURL();
  // Use the UI options specified in embed_ui_type to append ui options.
  switch (document.getElementById("embed_ui_type").value) {
    case "full":
      break;
    case "story":
      url += "&story";
      break;
    case "none":
      url += "&logo_only";
      break;
  }
  // Put the url in an iframe and copy to clipboard.
  let str =
    '<iframe style="border:0;width:100%;height:100%;" src="' +
    url +
    '" frameborder="0"></iframe>';
  copyLinkToClipboard(str);
}

function getSimURL() {
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
  return str;
}

function copyLinkToClipboard(str) {
  navigator.clipboard.writeText(str).then(
    () => {
      // Success.
      $("#link_copied").fadeIn(1000);
      setTimeout(() => $("#link_copied").fadeOut(1000), 2000);
    },
    () => {
      // Failure.
    }
  );
}

function updateParamFromMessage(event) {
  // Upon receiving a message from another window, use the message to update
  // the value in the specified parameter.

  // Update the value of the slider associated with this parameter, if it exists.
  const controller = kineticNameToCont[event.data.name];
  if (controller != undefined) {
    // If there's a slider, update its value and trigger the update via the slider's input event.
    if (controller.slider != undefined) {
      controller.slider.value = event.data.value;
      controller.slider.dispatchEvent(new Event("input"));
    } else {
      const val =
        controller.object[controller.property].split("=")[0] +
        "= " +
        event.data.value.toString();
      controller.setValue(val);
      controller.__onFinishChange(controller, val);
    }
  }
}

function setEmbossUniforms() {
  uniforms.embossAmbient.value = options.embossAmbient;
  uniforms.embossDiffuse.value = options.embossDiffuse;
  uniforms.embossShiny.value = options.embossShiny;
  uniforms.embossSmoothness.value = options.embossSmoothness;
  uniforms.embossSpecular.value = options.embossSpecular;
  uniforms.embossLightDir.value = new THREE.Vector3(
    Math.sin(options.embossTheta) * Math.cos(options.embossPhi),
    Math.sin(options.embossTheta) * Math.sin(options.embossPhi),
    Math.cos(options.embossTheta)
  );
}

function createOptionSlider(controller, min, max, step) {
  controller.slider = document.createElement("input");
  controller.slider.classList.add("styled-slider");
  controller.slider.classList.add("slider-progress");
  controller.slider.type = "range";
  controller.slider.min = min;
  controller.slider.max = max;
  controller.slider.step = step;
  controller.slider.value = controller.getValue();

  // Configure the slider's style so that it can be nicely formatted.
  controller.slider.style.setProperty("--value", controller.slider.value);
  controller.slider.style.setProperty("--min", controller.slider.min);
  controller.slider.style.setProperty("--max", controller.slider.max);

  // Configure the update.
  controller.slider.addEventListener("input", function () {
    controller.slider.style.setProperty("--value", controller.slider.value);
    controller.setValue(parseFloat(controller.slider.value));
  });

  // Augment the controller's onChange and onFinishChange to update the slider.
  let flag = true;
  if (controller.__onChange != undefined) {
    flag = false;
    controller.oldOnChange = controller.__onChange;
    controller.__onChange = function () {
      controller.oldOnChange();
      controller.slider.value = controller.getValue();
      controller.slider.style.setProperty("--value", controller.slider.value);
    };
  }

  if (controller.__onFinishChange != undefined) {
    flag = false;
    controller.oldOnFinishChange = controller.__onFinishChange;
    controller.__onFinishChange = function () {
      controller.oldOnFinishChange();
      controller.slider.value = controller.getValue();
      controller.slider.style.setProperty("--value", controller.slider.value);
    };
  }

  if (flag) {
    // Neither onChange nor onFinishChange were set, so we need to add an onChange to update the slider.
    controller.onChange(function () {
      controller.slider.value = controller.getValue();
      controller.slider.style.setProperty("--value", controller.slider.value);
    });
  }

  // Add the slider to the DOM.
  controller.domElement.appendChild(controller.slider);
  controller.domElement.parentElement.parentElement.classList.add(
    "parameterSlider"
  );
}

function updateViewSliders() {
  for (const controller of [...embossControllers, ...contoursControllers]) {
    let value = controller.getValue();
    controller.slider.style.setProperty("--value", value);
    controller.slider.value = value;
  }
}

function setContourUniforms() {
  uniforms.contourColour.value = new THREE.Color(options.contourColour);
  uniforms.contourEpsilon.value = options.contourEpsilon;
  uniforms.contourStep.value = 1 / (options.contourNum + 1);
}

function setOverlayUniforms() {
  uniforms.overlayColour.value = new THREE.Color(options.overlayColour);
  uniforms.overlayEpsilon.value = options.overlayEpsilon;
}

function renderIfNotRunning() {
  if (!isRunning) render();
}

function updateToggle(toggle) {
  if (options[toggle.getAttribute("property")]) {
    toggle.classList.add("toggled_on");
    if (toggle.getAttribute("folderID")) {
      $("#" + toggle.getAttribute("folderID")).removeClass("hidden");
    }
  } else {
    toggle.classList.remove("toggled_on");
    if (toggle.getAttribute("folderID")) {
      $("#" + toggle.getAttribute("folderID")).addClass("hidden");
    }
  }
}

function disableAutocorrect(input) {
  input.setAttribute("autocomplete", "off");
  input.setAttribute("autocorrect", "off");
  input.setAttribute("autocapitalize", "off");
  input.setAttribute("spellcheck", false);
}

function setSurfaceShader() {
  if (options.customSurface) {
    displayMaterial.vertexShader = surfaceVertexShaderCustom();
  } else {
    displayMaterial.vertexShader = surfaceVertexShaderColour();
  }
  displayMaterial.needsUpdate = true;
}

function configureCustomSurfaceControllers() {
  if (options.plotType == "surface") {
    $("#customSurfaceToggle").show();
    if (options.customSurface) {
      showGUIController(surfaceFunController);
      hideGUIController(threeDHeightScaleController);
    } else {
      hideGUIController(surfaceFunController);
      showGUIController(threeDHeightScaleController);
    }
  } else {
    $("#customSurfaceToggle").hide();
    hideGUIController(surfaceFunController);
  }
}

function getDuplicates(strarr) {
  const seen = {};
  let dups = [];
  strarr.forEach((e) => (seen[e] ? dups.push(e) : (seen[e] = true)));
  return Array.from(new Set(dups));
}

function createArrows() {
  arrowGroup = new THREE.Group();
  scene.add(arrowGroup);
  const maxDisc = Math.max(nXDisc, nYDisc);
  const denom = Math.round(
    lerp(3, smallScreen() ? 20 : 32, options.arrowDensity)
  );
  let stride = Math.max(Math.floor(maxDisc / denom), 1);
  const xNum = Math.floor(nXDisc / stride);
  const yNum = Math.floor(nYDisc / stride);
  const xStartInd = Math.floor((nXDisc - stride * (xNum - 1)) / 2);
  const yStartInd = Math.floor((nYDisc - stride * (yNum - 1)) / 2);
  let ind, yInd, xInd, arrow, x, y;
  // Texture reads go along rows from bottom to top.
  for (let row = 0; row < yNum; row++) {
    yInd = yStartInd + row * stride;
    y = ((yInd + 0.5) / nYDisc - 0.5) * domain.geometry.parameters.height;
    for (let col = 0; col < xNum; col++) {
      xInd = xStartInd + col * stride;
      x = ((xInd + 0.5) / nXDisc - 0.5) * domain.geometry.parameters.width;
      ind = xInd + yInd * nXDisc;
      arrow = createArrow([x, y, 1], [0, 0, 0]);
      arrow.ind = ind;
      arrowGroup.add(arrow);
    }
  }
}

function createArrow(pos, dir) {
  const arrow = new THREE.Group();
  const tail = new THREE.Mesh(tailGeometry, arrowMaterial);
  tail.rotation.x = Math.PI / 2;
  const head = new THREE.Mesh(headGeometry, arrowMaterial);
  head.rotation.x = Math.PI / 2;
  head.rotation.y = Math.PI / 4;
  head.position.z = tailGeometry.parameters.height / 2;
  arrow.add(tail);
  arrow.add(head);
  arrow.scale.multiplyScalar(baseArrowScale);
  arrow.position.set(pos[0], pos[1], pos[2]);
  arrow.lookAt(pos[0] + dir[0], pos[1] + dir[1], pos[2] + dir[2]);
  return arrow;
}

function deleteArrows() {
  if (!arrowGroup) return;
  scene.remove(arrowGroup);
  while (arrowGroup.children.length) {
    arrowGroup.remove(arrowGroup.children[0]);
  }
}

function configureVectorField() {
  if (options.vectorField) {
    deleteArrows();
    createArrows();
    updateArrowColour();
    if (options.arrowScale == "relative") {
      try {
        arrowGroup.customMax = parser.evaluate(options.arrowLengthMax);
      } catch (error) {
        throwError(
          "Unable to evaluate the maximum arrow length. Please check the definition."
        );
        arrowGroup.customMax = 1;
      }
    }
  } else {
    deleteArrows();
  }
}

function updateArrowColour() {
  arrowMaterial.color = new THREE.Color(options.arrowColour);
}
