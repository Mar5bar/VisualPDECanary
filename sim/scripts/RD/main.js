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
  lineMaterial,
  interpolationMaterial;
let domain, simDomain, clickDomain, line;
let xDisplayDomainCoords, yDisplayDomainCoords, numPointsInLine;
let colourmap, colourmapEndpoints;
let options, uniforms, funsObj;
let leftGUI,
  rightGUI,
  root,
  typeOfBrushController,
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
  lineWidthMulController,
  threeDHeightScaleController,
  cameraThetaController,
  cameraPhiController,
  cameraZoomController,
  forceManualInterpolationController,
  smoothingScaleController,
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
  imControllerOne,
  imControllerTwo,
  selectedEntries = new Set();
let isRunning,
  isDrawing,
  hasDrawn,
  anyDirichletBCs,
  nudgedUp = false,
  errorOccurred = false,
  NaNTimer,
  uiHidden = false;
let inTex, outTex;
let nXDisc,
  nYDisc,
  domainWidth,
  domainHeight,
  maxDim,
  canvasWidth,
  canvasHeight,
  usingLowResDomain = true;
let parametersFolder,
  kineticParamsStrs = {},
  kineticParamsLabels = [],
  kineticParamsCounter = 0;
const defaultSpecies = ["u", "v", "w", "q"];
const defaultReactions = ["f", "g", "h", "j"];
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
  RDShaderAlgebraicV,
  RDShaderAlgebraicW,
  RDShaderAlgebraicQ,
  RDShaderEnforceDirichletTop,
  RDShaderAdvectionPreBC,
  RDShaderAdvectionPostBC,
} from "./simulation_shaders.js";
import { randShader } from "../rand_shader.js";
import { fiveColourDisplay, surfaceVertexShader } from "./display_shaders.js";
import { getColours } from "../colourmaps.js";
import { genericVertexShader } from "../generic_shaders.js";
import { getPreset, getUserTextFields } from "./presets.js";
import { clearShaderBot, clearShaderTop } from "./clear_shader.js";
import * as THREE from "../three.module.js";
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
  },
  copyConfigAsJSON: function () {
    // Encode the current simulation configuration as raw JSON and put it on the clipboard.
    let objDiff = diffObjects(options, getPreset("default"));
    objDiff.preset = "PRESETNAME";
    let str = JSON.stringify(objDiff)
      .replaceAll(/\s*,\s*([^0-9-\.\s])/g, ",\n\t$1")
      .replaceAll(":", ": ")
      .replace("{", "{\n\t")
      .replace("}", ",\n}");
    str = 'case "PRESETNAME":\n\toptions = ' + str + ";\nbreak;";
    navigator.clipboard.writeText(str);
  },
  flipColourmap: function () {
    options.flippedColourmap = !options.flippedColourmap;
    setDisplayColourAndType();
    configureColourbar();
  },
  setColourRangeButton: function () {
    setColourRange();
    render();
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

// Get the canvas to draw on, as specified by the html.
canvas = document.getElementById("simCanvas");

// Warn the user if any errors occur.
console.error = function (error) {
  // Record the fact that an error has occurred and we need to recompile shaders.
  errorOccurred = true;
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

// Check URL for any specified options.
const params = new URLSearchParams(window.location.search);

if (params.has("no_ui")) {
  // Hide all the ui, including buttons.
  $(".ui").addClass("hidden");
  uiHidden = true;
} else {
  $(".ui").removeClass("hidden");
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

// If the "Try clicking!" popup is allowed, show it iff we're from an external link
// or have loaded the default simulation.
if (
  (fromExternalLink() || shouldLoadDefault || options.forceTryClickingPopup) &&
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
  $("#right_ui_arrow").toggle();
});
$("#equations").click(function () {
  $("#left_ui").toggle();
  resizeEquationDisplay();
  $("#left_ui_arrow").toggle();
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
  $("#share_panel").toggle();
});
$("#help").click(function () {
  $("#help_panel").toggle();
});
$("#screenshot").click(function () {
  takeAScreenshot = true;
  render();
  $("#share_panel").toggle();
});
$("#link").click(function () {
  funsObj.copyConfigAsURL();
  $("#share_panel").toggle();
});
$("#help_panel .container .button").click(function () {
  $("#help_panel").toggle();
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
  lineMaterial = new LineMaterial({
    vertexColors: true,
    linewidth: 0.01,
  });

  const simPlane = new THREE.PlaneGeometry(1.0, 1.0);
  simDomain = new THREE.Mesh(simPlane, simMaterial);
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
      }
      if (event.key === "h") {
        if (uiHidden) {
          uiHidden = false;
          $(".ui").removeClass("hidden");
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
      options.cameraTheta = 0.5;
      options.cameraPhi = 0;
      controls.enabled = false;
      camera.zoom = 1;
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
  canvasWidth = Math.round(canvas.getBoundingClientRect().width);
  canvasHeight = Math.round(canvas.getBoundingClientRect().height);
  aspectRatio = canvasHeight / canvasWidth;
  // Set the domain size, setting the largest side to be of size options.domainScale.
  if (aspectRatio >= 1) {
    domainHeight = options.domainScale;
    domainWidth = domainHeight / aspectRatio;
  } else {
    domainWidth = options.domainScale;
    domainHeight = domainWidth * aspectRatio;
  }
  if (options.dimension == 1) {
    domainWidth = options.domainScale;
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
  // Set the size of the renderer, which will interpolate from the textures.
  renderer.setSize(
    devicePixelRatio * canvasWidth,
    devicePixelRatio * canvasHeight,
    false
  );
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

  // Create a line object whose coordinates we can set when plotting lines.
  const lineGeom = new LineGeometry();
  numPointsInLine = devicePixelRatio * canvasWidth;
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
  rightGUI.domElement.classList.add("ui");

  leftGUI.open();
  rightGUI.open();
  if (startOpen != undefined && startOpen) {
    $("#rightGUI").show();
    $("#left_ui").show();
  } else {
    $("#left_ui").hide();
    $("#rightGUI").hide();
  }

  // Brush folder.
  root = rightGUI.addFolder("Brush");

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

  root.add(options, "brushRadius").name("Radius").onChange(setBrushType);

  whatToDrawController = root
    .add(options, "whatToDraw", listOfSpecies)
    .name("Species")
    .onChange(setBrushType);

  drawIn3DController = root.add(options, "drawIn3D").name("3D enabled");

  // Domain folder.
  root = rightGUI.addFolder("Domain");

  root
    .add(options, "dimension", { 1: 1, 2: 2 })
    .name("Dimension")
    .onChange(function () {
      configureDimension();
      render();
    });

  root.add(options, "domainScale").name("Largest side").onChange(resize);

  const dxController = root
    .add(options, "spatialStep")
    .name("Space step")
    .onChange(function () {
      resize();
    });
  dxController.__precision = 12;
  dxController.min(0);
  dxController.updateDisplay();

  root
    .add(options, "squareCanvas")
    .name("Square display")
    .onFinishChange(function () {
      setCanvasShape();
      resize();
      configureCameraAndClicks();
    });

  root
    .add(options, "domainViaIndicatorFun")
    .name("Implicit")
    .onFinishChange(function () {
      configureOptions();
      configureGUI();
      setRDEquations();
      setPostFunFragShader();
    });

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

  root.add(options, "numTimestepsPerFrame", 1, 400, 1).name("Steps/frame");

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
    .add(options, "timeDisplay")
    .name("Show time")
    .onChange(configureTimeDisplay);

  // Equations folder.
  root = rightGUI.addFolder("Equations");

  // Number of species.
  root
    .add(options, "numSpecies", { 1: 1, 2: 2, 3: 3, 4: 4 })
    .name("No. species")
    .onChange(updateProblem);

  // Cross diffusion.
  crossDiffusionController = root
    .add(options, "crossDiffusion")
    .name("Cross diffusion")
    .onChange(updateProblem);

  algebraicVController = root
    .add(options, "algebraicV")
    .name("Algebraic v")
    .onChange(updateProblem);

  algebraicWController = root
    .add(options, "algebraicW")
    .name("Algebraic w")
    .onChange(updateProblem);

  algebraicQController = root
    .add(options, "algebraicQ")
    .name("Algebraic q")
    .onChange(updateProblem);

  root
    .add(options, "speciesNames")
    .name("Species names")
    .onFinishChange(function () {
      setSpeciesNames();
    });

  root
    .add(options, "reactionNames")
    .name("Reactions")
    .onFinishChange(function () {
      setReactionNames();
    });

  // Let's put these in the left GUI.
  // Definitions folder.
  root = leftGUI.addFolder("Definitions");

  root
    .add(options, "typesetCustomEqs")
    .name("Typeset")
    .onChange(setEquationDisplayType);

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
  setOnfocus(fController, selectTeX, ["f"]);
  setOnblur(fController, deselectTeX, ["f"]);

  gController = root.add(options, "reactionStrV").onFinishChange(function () {
    setRDEquations();
    setEquationDisplayType();
  });
  setOnfocus(gController, selectTeX, ["g"]);
  setOnblur(gController, deselectTeX, ["g"]);

  hController = root.add(options, "reactionStrW").onFinishChange(function () {
    setRDEquations();
    setEquationDisplayType();
  });
  setOnfocus(hController, selectTeX, ["h"]);
  setOnblur(hController, deselectTeX, ["h"]);

  jController = root.add(options, "reactionStrQ").onFinishChange(function () {
    setRDEquations();
    setEquationDisplayType();
  });
  setOnfocus(jController, selectTeX, ["j"]);
  setOnblur(jController, deselectTeX, ["j"]);

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

  vBCsController = root
    .add(options, "boundaryConditionsV", {
      Periodic: "periodic",
      Dirichlet: "dirichlet",
      Neumann: "neumann",
      Robin: "robin",
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

  wBCsController = root
    .add(options, "boundaryConditionsW", {
      Periodic: "periodic",
      Dirichlet: "dirichlet",
      Neumann: "neumann",
      Robin: "robin",
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

  dirichletQController = root
    .add(options, "dirichletStrQ")
    .onFinishChange(setRDEquations);

  neumannQController = root
    .add(options, "neumannStrQ")
    .onFinishChange(setRDEquations);

  robinQController = root
    .add(options, "robinStrQ")
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

  // Plotting folder.

  root = rightGUI.addFolder("Plotting");

  root
    .add(options, "whatToPlot")
    .name("Expression: ")
    .onFinishChange(function () {
      updateWhatToPlot();
      render();
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
      render();
    });

  lineWidthMulController = root
    .add(options, "lineWidthMul", 0.1, 2)
    .name("Thickness")
    .onChange(function () {
      setLineWidth();
      render();
    });

  threeDHeightScaleController = root
    .add(options, "threeDHeightScale")
    .name("Max height")
    .onChange(updateUniforms);

  cameraThetaController = root
    .add(options, "cameraTheta")
    .name("View $\\theta$")
    .onChange(configureCameraAndClicks);

  cameraPhiController = root
    .add(options, "cameraPhi")
    .name("View $\\phi$")
    .onChange(configureCameraAndClicks);

  cameraZoomController = root
    .add(options, "cameraZoom")
    .name("Zoom")
    .onChange(configureCameraAndClicks);

  forceManualInterpolationController = root
    .add(options, "forceManualInterpolation")
    .name("Man. smooth")
    .onChange(configureManualInterpolation);

  smoothingScaleController = root
    .add(options, "smoothingScale", 0, 16, 1)
    .name("Smoothing")
    .onChange(function () {
      resizeTextures();
      render();
    });

  // Colour folder.
  root = rightGUI.addFolder("Colour");

  root
    .add(options, "colourmap", {
      BlckGrnYllwRdWht: "BlackGreenYellowRedWhite",
      "Blue-Magenta": "blue-magenta",
      Diverging: "diverging",
      Greyscale: "greyscale",
      Turbo: "turbo",
      Viridis: "viridis",
    })
    .onChange(function () {
      setDisplayColourAndType();
      configureColourbar();
    })
    .name("Colour map");

  root.add(funsObj, "flipColourmap").name("Reverse map");

  minColourValueController = root
    .add(options, "minColourValue")
    .name("Min value")
    .onChange(function () {
      updateUniforms();
      updateColourbarLims();
      render();
    });
  minColourValueController.__precision = 2;

  maxColourValueController = root
    .add(options, "maxColourValue")
    .name("Max value")
    .onChange(function () {
      updateUniforms();
      updateColourbarLims();
      render();
    });
  maxColourValueController.__precision = 2;

  setColourRangeController = root
    .add(funsObj, "setColourRangeButton")
    .name("Snap range");

  autoSetColourRangeController = root
    .add(options, "autoSetColourRange")
    .name("Auto snap")
    .onChange(function () {
      if (options.autoSetColourRange) {
        setColourRange();
        render();
      }
    });

  root
    .add(options, "colourbar")
    .name("Colour bar")
    .onChange(configureColourbar);

  root
    .addColor(options, "backgroundColour")
    .name("Background")
    .onChange(function () {
      scene.background = new THREE.Color(options.backgroundColour);
      render();
    });

  // Images folder.
  fIm = rightGUI.addFolder("Images");
  root = fIm;
  // Always make images controller, but hide them if they're not wanted.
  createImageControllers();

  // Miscellaneous folder.
  root = rightGUI.addFolder("Misc.");

  root
    .add(options, "integrate")
    .name("Integrate")
    .onChange(function () {
      configureIntegralDisplay();
      render();
    });

  root.add(options, "fixRandSeed").name("Fix random seed");

  // Copy configuration as raw JSON.
  root.add(funsObj, "copyConfigAsJSON").name("Copy code");

  root = root.addFolder("Debug");
  // Debug.
  root.add(funsObj, "debug").name("Copy debug info");
}

function animate() {
  requestAnimationFrame(animate);

  hasDrawn = isDrawing;
  // Draw on any input from the user, which can happen even if timestepping is not running.
  if (isDrawing && options.drawIn3D | (options.plotType != "surface")) {
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
  if (options.brushValue.includes("RAND")) {
    shaderStr += randShader();
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
  displayMaterial.fragmentShader = fiveColourDisplay();
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
    setColourRange();
  }

  // Update the position of the click domain for easy clicking.
  if (options.drawIn3D && options.plotType == "surface") {
    let val =
      (getMeanVal() - options.minColourValue) /
        (options.maxColourValue - options.minColourValue) -
      0.5;
    clickDomain.position.y = options.threeDHeightScale * val.clamp(-0.5, 0.5);
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

  // If this is a line plot, modify the line positions and colours before rendering.
  if (options.plotType == "line") {
    // Get the output from the buffer, in the form of (value,0,0,1).
    fillBuffer();
    let scaledValue,
      ind = 0;
    for (let i = 0; i < buffer.length; i += 4) {
      scaledValue =
        (buffer[i] - options.minColourValue) /
          (options.maxColourValue - options.minColourValue) -
        0.5;
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
    renderer.render(scene, camera);
    link.href = renderer.domElement.toDataURL();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSizes();
    render();
  }
}

function onDocumentPointerDown(event) {
  isDrawing = setBrushCoords(event, canvas);
  if (isDrawing && options.drawIn3D && options.plotType == "surface") {
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
  if (options.drawIn3D && options.plotType == "surface") {
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

  // If there are any numbers preceded by letters (eg r0), replace the number with the corresponding string.
  str = replaceDigitsWithWords(str);

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
  let dirichletShader = "";
  let robinShader = "";
  let updateShader = "";

  // Create a Neumann shader block for each species separately, which is just a special case of Robin.
  if (options.boundaryConditionsU == "neumann") {
    neumannShader += parseRobinRHS(options.neumannStrU, listOfSpecies[0]);
    neumannShader += selectSpeciesInShaderStr(
      RDShaderRobinX(),
      listOfSpecies[0]
    );
    if (options.dimension > 1) {
      neumannShader += selectSpeciesInShaderStr(
        RDShaderRobinY(),
        listOfSpecies[0]
      );
    }
  }
  if (options.boundaryConditionsV == "neumann") {
    neumannShader += parseRobinRHS(options.neumannStrV, listOfSpecies[1]);
    neumannShader += selectSpeciesInShaderStr(
      RDShaderRobinX(),
      listOfSpecies[1]
    );
    if (options.dimension > 1) {
      neumannShader += selectSpeciesInShaderStr(
        RDShaderRobinY(),
        listOfSpecies[1]
      );
    }
  }
  if (options.boundaryConditionsW == "neumann") {
    neumannShader += parseRobinRHS(options.neumannStrW, listOfSpecies[2]);
    neumannShader += selectSpeciesInShaderStr(
      RDShaderRobinX(),
      listOfSpecies[2]
    );
    if (options.dimension > 1) {
      neumannShader += selectSpeciesInShaderStr(
        RDShaderRobinY(),
        listOfSpecies[2]
      );
    }
  }
  if (options.boundaryConditionsQ == "neumann") {
    neumannShader += parseRobinRHS(options.neumannStrQ, listOfSpecies[3]);
    neumannShader += selectSpeciesInShaderStr(
      RDShaderRobinX(),
      listOfSpecies[3]
    );
    if (options.dimension > 1) {
      neumannShader += selectSpeciesInShaderStr(
        RDShaderRobinY(),
        listOfSpecies[3]
      );
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
      selectSpeciesInShaderStr(str, listOfSpecies[0]) +
      parseShaderString(options.dirichletStrU) +
      ";\n}\n";
    dirichletShader +=
      selectSpeciesInShaderStr(str, listOfSpecies[1]) +
      parseShaderString(options.dirichletStrV) +
      ";\n}\n";
    dirichletShader +=
      selectSpeciesInShaderStr(str, listOfSpecies[2]) +
      parseShaderString(options.dirichletStrW) +
      ";\n}\n";
    dirichletShader +=
      selectSpeciesInShaderStr(str, listOfSpecies[3]) +
      parseShaderString(options.dirichletStrQ) +
      ";\n}\n";
  } else {
    if (options.boundaryConditionsU == "dirichlet") {
      dirichletShader +=
        selectSpeciesInShaderStr(RDShaderDirichletX(), listOfSpecies[0]) +
        parseShaderString(options.dirichletStrU) +
        ";\n}\n";
      if (options.dimension > 1) {
        dirichletShader +=
          selectSpeciesInShaderStr(RDShaderDirichletY(), listOfSpecies[0]) +
          parseShaderString(options.dirichletStrU) +
          ";\n}\n";
      }
    }
    if (options.boundaryConditionsV == "dirichlet") {
      dirichletShader +=
        selectSpeciesInShaderStr(RDShaderDirichletX(), listOfSpecies[1]) +
        parseShaderString(options.dirichletStrV) +
        ";\n}\n";
      if (options.dimension > 1) {
        dirichletShader +=
          selectSpeciesInShaderStr(RDShaderDirichletY(), listOfSpecies[1]) +
          parseShaderString(options.dirichletStrV) +
          ";\n}\n";
      }
    }
    if (options.boundaryConditionsW == "dirichlet") {
      dirichletShader +=
        selectSpeciesInShaderStr(RDShaderDirichletX(), listOfSpecies[2]) +
        parseShaderString(options.dirichletStrW) +
        ";\n}\n";
      if (options.dimension > 1) {
        dirichletShader +=
          selectSpeciesInShaderStr(RDShaderDirichletY(), listOfSpecies[2]) +
          parseShaderString(options.dirichletStrW) +
          ";\n}\n";
      }
    }
    if (options.boundaryConditionsQ == "dirichlet") {
      dirichletShader +=
        selectSpeciesInShaderStr(RDShaderDirichletX(), listOfSpecies[3]) +
        parseShaderString(options.dirichletStrQ) +
        ";\n}\n";
      if (options.dimension > 1) {
        dirichletShader +=
          selectSpeciesInShaderStr(RDShaderDirichletY(), listOfSpecies[3]) +
          parseShaderString(options.dirichletStrQ) +
          ";\n}\n";
      }
    }
  }

  // Create a Robin shader block for each species separately.
  if (options.boundaryConditionsU == "robin") {
    robinShader += parseRobinRHS(options.robinStrU, listOfSpecies[0]);
    robinShader += selectSpeciesInShaderStr(RDShaderRobinX(), listOfSpecies[0]);
    if (options.dimension > 1) {
      robinShader += selectSpeciesInShaderStr(
        RDShaderRobinY(),
        listOfSpecies[0]
      );
    }
  }
  if (options.boundaryConditionsV == "robin") {
    robinShader += parseRobinRHS(options.robinStrV, listOfSpecies[1]);
    robinShader += selectSpeciesInShaderStr(RDShaderRobinX(), listOfSpecies[1]);
    if (options.dimension > 1) {
      robinShader += selectSpeciesInShaderStr(
        RDShaderRobinY(),
        listOfSpecies[1]
      );
    }
  }
  if (options.boundaryConditionsW == "robin") {
    robinShader += parseRobinRHS(options.robinStrW, listOfSpecies[2]);
    robinShader += selectSpeciesInShaderStr(RDShaderRobinX(), listOfSpecies[2]);
    if (options.dimension > 1) {
      robinShader += selectSpeciesInShaderStr(
        RDShaderRobinY(),
        listOfSpecies[2]
      );
    }
  }
  if (options.boundaryConditionsQ == "robin") {
    robinShader += parseRobinRHS(options.robinStrQ, listOfSpecies[3]);
    robinShader += selectSpeciesInShaderStr(RDShaderRobinX(), listOfSpecies[3]);
    if (options.dimension > 1) {
      robinShader += selectSpeciesInShaderStr(
        RDShaderRobinY(),
        listOfSpecies[3]
      );
    }
  }

  // Insert any user-defined kinetic parameters, given as a string that needs parsing.
  // Extract variable definitions, separated by semicolons or commas, ignoring whitespace.
  // We'll inject this shader string before any boundary conditions etc, so that these params
  // are also available in BCs.
  let kineticStr = kineticUniformsForShader();

  // Choose what sort of update we are doing: normal, or cross-diffusion enabled?
  updateShader = parseNormalDiffusionStrings() + "\n";
  if (options.crossDiffusion) {
    updateShader += parseCrossDiffusionStrings() + "\n" + RDShaderUpdateCross();
  } else {
    updateShader += RDShaderUpdateNormal();
  }

  // If v should be algebraic, append this to the normal update shader.
  if (options.algebraicV && options.crossDiffusion) {
    updateShader += selectSpeciesInShaderStr(
      RDShaderAlgebraicV(),
      listOfSpecies[1]
    );
  }

  // If w should be algebraic, append this to the normal update shader.
  if (options.algebraicW && options.crossDiffusion) {
    updateShader += selectSpeciesInShaderStr(
      RDShaderAlgebraicW(),
      listOfSpecies[2]
    );
  }

  // If q should be algebraic, append this to the normal update shader.
  if (options.algebraicQ && options.crossDiffusion) {
    updateShader += selectSpeciesInShaderStr(
      RDShaderAlgebraicQ(),
      listOfSpecies[3]
    );
  }

  // Iff the user has entered u_x, u_y etc in a diffusion coefficient, it will be present in
  // the update shader as uvwxy[XY].[rgba]. If they've done this, warn them and don't update the shader.
  let match = updateShader.match(/\buvwq[XY]\.[rgba]\b/);
  if (match) {
    alert(
      "Including derivatives in the diffusion coefficients is not supported. Try casting your PDE in another form."
    );
    return;
  }

  simMaterial.fragmentShader = [
    kineticStr,
    RDShaderTop(),
    RDShaderAdvectionPreBC(),
    neumannShader,
    robinShader,
    RDShaderAdvectionPostBC(),
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
    dirichletShader = kineticStr + RDShaderEnforceDirichletTop();
    if (options.domainViaIndicatorFun) {
      let str = RDShaderDirichletIndicatorFun()
        .replace(/indicatorFun/g, parseShaderString(options.domainIndicatorFun))
        .replace(/updated/g, "gl_FragColor");
      dirichletShader +=
        selectSpeciesInShaderStr(str, listOfSpecies[0]) +
        parseShaderString(options.dirichletStrU) +
        ";\n}\n";
      dirichletShader +=
        selectSpeciesInShaderStr(str, listOfSpecies[1]) +
        parseShaderString(options.dirichletStrV) +
        ";\n}\n";
      dirichletShader +=
        selectSpeciesInShaderStr(str, listOfSpecies[2]) +
        parseShaderString(options.dirichletStrW) +
        ";\n}\n";
      dirichletShader +=
        selectSpeciesInShaderStr(str, listOfSpecies[3]) +
        parseShaderString(options.dirichletStrQ) +
        ";\n}\n";
    } else {
      if (options.boundaryConditionsU == "dirichlet") {
        dirichletShader +=
          selectSpeciesInShaderStr(
            RDShaderDirichletX().replaceAll(/updated/g, "gl_FragColor"),
            listOfSpecies[0]
          ) +
          parseShaderString(options.dirichletStrU) +
          ";\n}\n";
        if (options.dimension > 1) {
          dirichletShader +=
            selectSpeciesInShaderStr(
              RDShaderDirichletY().replaceAll(/updated/g, "gl_FragColor"),
              listOfSpecies[0]
            ) +
            parseShaderString(options.dirichletStrU) +
            ";\n}\n";
        }
      }
      if (options.boundaryConditionsV == "dirichlet") {
        dirichletShader +=
          selectSpeciesInShaderStr(
            RDShaderDirichletX().replaceAll(/updated/g, "gl_FragColor"),
            listOfSpecies[1]
          ) +
          parseShaderString(options.dirichletStrV) +
          ";\n}\n";
        if (options.dimension > 1) {
          dirichletShader +=
            selectSpeciesInShaderStr(
              RDShaderDirichletY().replaceAll(/updated/g, "gl_FragColor"),
              listOfSpecies[1]
            ) +
            parseShaderString(options.dirichletStrV) +
            ";\n}\n";
        }
      }
      if (options.boundaryConditionsW == "dirichlet") {
        dirichletShader +=
          selectSpeciesInShaderStr(
            RDShaderDirichletX().replaceAll(/updated/g, "gl_FragColor"),
            listOfSpecies[2]
          ) +
          parseShaderString(options.dirichletStrW) +
          ";\n}\n";
        if (options.dimension > 1) {
          dirichletShader +=
            selectSpeciesInShaderStr(
              RDShaderDirichletY().replaceAll(/updated/g, "gl_FragColor"),
              listOfSpecies[2]
            ) +
            parseShaderString(options.dirichletStrW) +
            ";\n}\n";
        }
      }
      if (options.boundaryConditionsQ == "dirichlet") {
        dirichletShader +=
          selectSpeciesInShaderStr(
            RDShaderDirichletX().replaceAll(/updated/g, "gl_FragColor"),
            listOfSpecies[3]
          ) +
          parseShaderString(options.dirichletStrQ) +
          ";\n}\n";
        if (options.dimension > 1) {
          dirichletShader +=
            selectSpeciesInShaderStr(
              RDShaderDirichletY().replaceAll(/updated/g, "gl_FragColor"),
              listOfSpecies[3]
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

  // Set custom species names and reaction names.
  setSpeciesNames(true);
  setReactionNames(true);

  // Check if the simulation should be running on load.
  isRunning = options.runningOnLoad;

  // Enable backwards compatibility.
  options.brushRadius = options.brushRadius.toString();
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
  // Insert any user-defined kinetic parameters, as uniforms.
  let shaderStr = kineticUniformsForShader() + clearShaderTop();
  if (
    options.clearValueU.includes("RAND") ||
    options.clearValueV.includes("RAND")
  ) {
    shaderStr += randShader();
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
  let tooltip =
    "function of " +
    listOfSpecies.slice(0, options.numSpecies).join(", ") +
    ", x, y, t";
  let Vtooltip = tooltip.replace(" " + listOfSpecies[1] + ",", "");
  let Qtooltip = tooltip.replace(" " + listOfSpecies[2] + ",", "");
  let Wtooltip = tooltip.replace(" " + listOfSpecies[3] + ",", "");

  if (options.dimension == 1) tooltip = tooltip.replace(" y,", "");
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
      setGUIControllerName(DuuController, TeXStrings["D"], tooltip);
      setGUIControllerName(fController, TeXStrings["f"], tooltip);

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
      setGUIControllerName(DuuController, TeXStrings["Du"], tooltip);
      setGUIControllerName(DvvController, TeXStrings["Dv"], tooltip);
      setGUIControllerName(fController, TeXStrings["f"], tooltip);
      setGUIControllerName(gController, TeXStrings["g"], tooltip);

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
      setGUIControllerName(DuuController, TeXStrings["Duu"], tooltip);
      setGUIControllerName(DuvController, TeXStrings["Duv"], tooltip);
      setGUIControllerName(DvuController, TeXStrings["Dvu"], tooltip);
      setGUIControllerName(DvvController, TeXStrings["Dvv"], tooltip);
      setGUIControllerName(fController, TeXStrings["f"], tooltip);
      setGUIControllerName(gController, TeXStrings["g"], tooltip);
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
      setGUIControllerName(DuuController, TeXStrings["Duu"], tooltip);
      setGUIControllerName(DuvController, TeXStrings["Duv"], tooltip);
      setGUIControllerName(fController, TeXStrings["f"], tooltip);
      // Controllers for algebraic species have a different tooltip.
      setGUIControllerName(DvuController, TeXStrings["Dvu"], Vtooltip);
      setGUIControllerName(gController, TeXStrings["g"], Vtooltip);
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
      setGUIControllerName(DuuController, TeXStrings["Du"], tooltip);
      setGUIControllerName(DvvController, TeXStrings["Dv"], tooltip);
      setGUIControllerName(DwwController, TeXStrings["Dw"], tooltip);
      setGUIControllerName(fController, TeXStrings["f"], tooltip);
      setGUIControllerName(gController, TeXStrings["g"], tooltip);
      setGUIControllerName(hController, TeXStrings["h"], tooltip);
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
      setGUIControllerName(DuuController, TeXStrings["Duu"], tooltip);
      setGUIControllerName(DuvController, TeXStrings["Duv"], tooltip);
      setGUIControllerName(DuwController, TeXStrings["Duw"], tooltip);
      setGUIControllerName(DvuController, TeXStrings["Dvu"], tooltip);
      setGUIControllerName(DvvController, TeXStrings["Dvv"], tooltip);
      setGUIControllerName(DvwController, TeXStrings["Dvw"], tooltip);
      setGUIControllerName(DwuController, TeXStrings["Dwu"], tooltip);
      setGUIControllerName(DwvController, TeXStrings["Dwv"], tooltip);
      setGUIControllerName(DwwController, TeXStrings["Dww"], tooltip);
      setGUIControllerName(fController, TeXStrings["f"], tooltip);
      setGUIControllerName(gController, TeXStrings["g"], tooltip);
      setGUIControllerName(hController, TeXStrings["h"], tooltip);
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
      setGUIControllerName(DuuController, TeXStrings["Duu"], tooltip);
      setGUIControllerName(DuvController, TeXStrings["Duv"], tooltip);
      setGUIControllerName(DuwController, TeXStrings["Duw"], tooltip);
      setGUIControllerName(DvuController, TeXStrings["Dvu"], tooltip);
      setGUIControllerName(DvvController, TeXStrings["Dvv"], tooltip);
      setGUIControllerName(DvwController, TeXStrings["Dvw"], tooltip);
      setGUIControllerName(fController, TeXStrings["f"], tooltip);
      setGUIControllerName(gController, TeXStrings["g"], tooltip);
      // Controllers for algebraic species have a different tooltip.
      setGUIControllerName(DwuController, TeXStrings["Dwu"], Wtooltip);
      setGUIControllerName(DwvController, TeXStrings["Dwv"], Wtooltip);
      setGUIControllerName(hController, TeXStrings["h"], Wtooltip);
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
      setGUIControllerName(DuuController, TeXStrings["Du"], tooltip);
      setGUIControllerName(DvvController, TeXStrings["Dv"], tooltip);
      setGUIControllerName(DwwController, TeXStrings["Dw"], tooltip);
      setGUIControllerName(DqqController, TeXStrings["Dq"], tooltip);
      setGUIControllerName(fController, TeXStrings["f"], tooltip);
      setGUIControllerName(gController, TeXStrings["g"], tooltip);
      setGUIControllerName(hController, TeXStrings["h"], tooltip);
      setGUIControllerName(jController, TeXStrings["j"], tooltip);
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
      setGUIControllerName(fController, TeXStrings["f"], tooltip);
      setGUIControllerName(gController, TeXStrings["g"], tooltip);
      setGUIControllerName(hController, TeXStrings["h"], tooltip);
      setGUIControllerName(jController, TeXStrings["j"], tooltip);
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
      setGUIControllerName(DuuController, TeXStrings["Duu"], tooltip);
      setGUIControllerName(DuvController, TeXStrings["Duv"], tooltip);
      setGUIControllerName(DuwController, TeXStrings["Duw"], tooltip);
      setGUIControllerName(DuqController, TeXStrings["Duq"], tooltip);
      setGUIControllerName(DvuController, TeXStrings["Dvu"], tooltip);
      setGUIControllerName(DvvController, TeXStrings["Dvv"], tooltip);
      setGUIControllerName(DvwController, TeXStrings["Dvw"], tooltip);
      setGUIControllerName(DvqController, TeXStrings["Dvq"], tooltip);
      setGUIControllerName(DquController, TeXStrings["Dqu"], tooltip);
      setGUIControllerName(DqvController, TeXStrings["Dqv"], tooltip);
      setGUIControllerName(DqwController, TeXStrings["Dqw"], tooltip);
      setGUIControllerName(DqqController, TeXStrings["Dqq"], tooltip);
      setGUIControllerName(fController, TeXStrings["f"], tooltip);
      setGUIControllerName(gController, TeXStrings["g"], tooltip);
      setGUIControllerName(jController, TeXStrings["j"], tooltip);
      // Controllers for algebraic species have a different tooltip.
      setGUIControllerName(DwuController, TeXStrings["Dwu"], Wtooltip);
      setGUIControllerName(DwvController, TeXStrings["Dwv"], Wtooltip);
      setGUIControllerName(DwqController, TeXStrings["Dwq"], Wtooltip);
      setGUIControllerName(hController, TeXStrings["h"], Wtooltip);
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
      setGUIControllerName(fController, TeXStrings["f"], tooltip);
      setGUIControllerName(gController, TeXStrings["g"], tooltip);
      setGUIControllerName(hController, TeXStrings["h"], tooltip);
      // Controllers for algebraic species have a different tooltip.
      setGUIControllerName(DquController, TeXStrings["Dqu"], Qtooltip);
      setGUIControllerName(DqvController, TeXStrings["Dqv"], Qtooltip);
      setGUIControllerName(DqwController, TeXStrings["Dqw"], Qtooltip);
      setGUIControllerName(jController, TeXStrings["j"], Qtooltip);
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
      setGUIControllerName(DuuController, TeXStrings["Duu"], tooltip);
      setGUIControllerName(DuvController, TeXStrings["Duv"], tooltip);
      setGUIControllerName(DuwController, TeXStrings["Duw"], tooltip);
      setGUIControllerName(DuqController, TeXStrings["Duq"], tooltip);
      setGUIControllerName(DvuController, TeXStrings["Dvu"], tooltip);
      setGUIControllerName(DvvController, TeXStrings["Dvv"], tooltip);
      setGUIControllerName(DvwController, TeXStrings["Dvw"], tooltip);
      setGUIControllerName(DvqController, TeXStrings["Dvq"], tooltip);
      setGUIControllerName(fController, TeXStrings["f"], tooltip);
      setGUIControllerName(gController, TeXStrings["g"], tooltip);
      // Controllers for algebraic species have a different tooltip.
      setGUIControllerName(DwuController, TeXStrings["Dwu"], Wtooltip);
      setGUIControllerName(DwvController, TeXStrings["Dwv"], Wtooltip);
      setGUIControllerName(DwqController, TeXStrings["Dwq"], Wtooltip);
      setGUIControllerName(hController, TeXStrings["h"], Wtooltip);
      setGUIControllerName(DquController, TeXStrings["Dqu"], Qtooltip);
      setGUIControllerName(DqvController, TeXStrings["Dqv"], Qtooltip);
      setGUIControllerName(DqwController, TeXStrings["Dqw"], Qtooltip);
      setGUIControllerName(jController, TeXStrings["j"], Qtooltip);
      break;
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
  // Set the names of the algebraic controllers.
  setGUIControllerName(algebraicVController, "Algebraic " + TeXStrings["v"]);
  setGUIControllerName(algebraicWController, "Algebraic " + TeXStrings["w"]);
  setGUIControllerName(algebraicQController, "Algebraic " + TeXStrings["q"]);

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
    hideGUIController(lineWidthMulController);
    showGUIController(threeDHeightScaleController);
    showGUIController(cameraThetaController);
    showGUIController(cameraPhiController);
    showGUIController(cameraZoomController);
    showGUIController(drawIn3DController);
  } else if (options.plotType == "line") {
    showGUIController(lineWidthMulController);
    showGUIController(threeDHeightScaleController);
    hideGUIController(cameraThetaController);
    hideGUIController(cameraPhiController);
    hideGUIController(cameraZoomController);
    hideGUIController(drawIn3DController);
  } else {
    hideGUIController(lineWidthMulController);
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
  manualInterpolationNeeded
    ? hideGUIController(forceManualInterpolationController)
    : showGUIController(forceManualInterpolationController);
  isManuallyInterpolating()
    ? showGUIController(smoothingScaleController)
    : hideGUIController(smoothingScaleController);
  // Update the options available in whatToDraw based on the number of species.
  updateGUIDropdown(
    whatToDrawController,
    listOfSpecies.slice(0, options.numSpecies)
  );
}

function configureOptions() {
  // Configure any options that depend on the equation type.
  let regex;

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
  regexes["f"] = /\b(f)/g;
  regexes["g"] = /\b(g)/g;
  regexes["h"] = /\b(h)/g;
  regexes["j"] = /\b(j)/g;

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
    associatedStrs["f"] = options.reactionStrU;
    associatedStrs["g"] = options.reactionStrV;
    associatedStrs["h"] = options.reactionStrW;
    associatedStrs["j"] = options.reactionStrQ;

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
    str = replaceUserDefReac(str, regexes["f"], associatedStrs["f"]);
    str = replaceUserDefReac(str, regexes["g"], associatedStrs["g"]);
    str = replaceUserDefReac(str, regexes["h"], associatedStrs["h"]);
    str = replaceUserDefReac(str, regexes["j"], associatedStrs["j"]);

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

    // Replace u_x, u_y etc with \pd{u}{x} etc.
    regex = /\b([uvwq])_([xy])\b/g;
    str = str.replaceAll(regex, "\\textstyle \\pd{$1}{$2}");
  } else {
    // Even if we're not customising the typesetting, add in \selected{} to any selected entry.
    selectedEntries.forEach(function (x) {
      str = str.replaceAll(regexes[x], function (match, g1, g2) {
        let val = "\\selected{ " + g1 + " ";
        if (typeof g2 == "string") val += g2;
        return val + " }";
      });
    });
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
        // If all the quantities are integers, set the default step to be integers.
        if (
          !kineticParamsStrs[label].includes(".") &
          (parseFloat(match[5]) - parseFloat(match[3]) > 1)
        ) {
          step = 1;
        } else {
          // Otherwise, choose a step that either matches the max precision of the inputs, or
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
        }
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
        if (
          setKineticUniformFromString(kineticParamsStrs[label]) ||
          errorOccurred
        ) {
          // Reset the error flag.
          errorOccurred = false;
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
        }
        kineticParamsCounter += 1;
        let newLabel = "params" + kineticParamsCounter;
        this.remove();
        createParameterController(newLabel, true);
        // Update the uniforms, the kinetic string for saving and, if we've added something that we've not seen before, update the shaders.
        setKineticStringFromParams();
        if (setKineticUniformFromString(str) || errorOccurred) {
          // Reset the error flag.
          errorOccurred = false;
          updateShaders();
        }
      }
    });
  } else {
    controller = parametersFolder.add(kineticParamsStrs, label).name("");
    controller.domElement.classList.add("params");
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
        if (controller.hasOwnProperty("lastName")) {
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
          controller.lastName != match[1]
        ) {
          delete uniforms[controller.lastName];
          controller.lastName = match[1];
        }
      }
      // Update the uniforms, the kinetic string for saving and, if we've added something that we've not seen before, update the shaders.
      setKineticStringFromParams();
      if (setKineticUniformFromString(str)) {
        updateShaders();
      }
    });
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
  let label, str;
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
  // Combine the custom parameters into a single string for storage, so long as no reserved names are used.
  options.kineticParams = Object.values(kineticParamsStrs).join(";");
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
    let colours = colourmap.map((x) => x.map((y) => 255 * y).toString());
    let cString = "linear-gradient(90deg, ";
    cString += "rgb(" + colours[0] + ") 0%,";
    cString += "rgb(" + colours[1] + ") 25%,";
    cString += "rgb(" + colours[2] + ") 50%,";
    cString += "rgb(" + colours[3] + ") 75%,";
    cString += "rgb(" + colours[4] + ") 100%";
    cString += ")";
    $("#colourbar").css("background", cString);
    if (options.whatToPlot == "MAX") {
      $("#minLabel").html("$" + listOfSpecies[0] + "$");
      $("#midLabel").html("$" + listOfSpecies[1] + "$");
      $("#maxLabel").html("$" + listOfSpecies[2] + "$");
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
  let leftColour = computeColourBrightness(colourmap[0]);
  let midColour = computeColourBrightness(colourmap[2]);
  let rightColour = computeColourBrightness(colourmap[4]);

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

function getReservedStrs(allowSpecies, exclusions) {
  // Load an RD shader and find floats, vecs, and ivecs.
  let regex = /(?:float|vec\d|ivec\d|function|void)\b\s+(\w+)\b/g;
  let str = RDShaderTop() + RDShaderUpdateCross();
  let reserved = [...str.matchAll(regex)].map((x) => x[1]).concat(exclusions);
  if (!allowSpecies) reserved = reserved.concat(listOfSpecies);
  return reserved;
}

function isReservedName(name, allowSpecies, exclusions) {
  if (allowSpecies == undefined) allowSpecies = false;
  if (exclusions == undefined) exclusions = [];
  return getReservedStrs(allowSpecies, exclusions).some(function (badName) {
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
  } else {
    domain.visible = true;
    line.visible = false;
    if (options.plotType == "surface") {
      $("#simCanvas").css("outline", "2px #000 solid");
      if (usingLowResDomain) {
        usingLowResDomain = false;
        replaceDisplayDomains();
      }
    } else {
      $("#simCanvas").css("outline", "");
    }
  }
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
    (options.cameraPhi * Math.PI) / 180
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

function sanitisedKineticParams() {
  // options.kineticParams could contain additional directives, like "in [0,1]", used
  // to create additional controllers. We want to save these in options.kineticParams, but
  // can't pass them to the shader like this. Here, we strip these directives from the string.
  // If a kineticParam is of the form "name = val in [a,b]", remove the in [a,b] part.
  let out = options.kineticParams.replaceAll(/\bin[^;]*;?/g, ";");

  // A user may have used numbers when defining variable names. Replace them with the word form.
  out = replaceDigitsWithWords(out);

  return out;
}

function getKineticParamNames() {
  // Return a list of parsed kinetic parameter names.
  const regex = /(\w+)\s*=\s*([\+\-]?)\s*([0-9\.]+)/;
  return sanitisedKineticParams()
    .split(";")
    .filter((x) => x.length > 0)
    .map((x) => x.replace(regex, "$1").trim());
}

function setKineticUniforms() {
  // Set uniforms based on the parameters defined in kineticParams.
  // Return true if we're adding a new uniform, which signifies that all shaders must be
  // updated to reference this new uniform.
  const paramStrs = sanitisedKineticParams().split(";");
  let addingNewUniform = false;
  for (const paramStr of paramStrs) {
    addingNewUniform |= setKineticUniformFromString(paramStr);
  }
  return addingNewUniform;
}

function setKineticUniformFromString(str) {
  // Set a uniform based on the parameter defined in str/
  // Return true if we're adding a new uniform, which signifies that all shaders must be
  // updated to reference this new uniform.
  const regex = /(\w+)\s*=\s*([\+\-]?)\s*([0-9\.]+)/;
  // Parse the name from the string.
  const match = str.match(regex);
  let addingNewUniform = false;
  if (match) {
    // Replace any numbers in the name with the word equivalents.
    match[1] = replaceDigitsWithWords(match[1]);
    if (isReservedName(match[1])) {
      alert(
        "The name '" +
          match[1] +
          "' is used under the hood, so can't be used as a species name. Please , so can't be used as a parameter. Please use a different name for " +
          match[1] +
          "."
      );
    } else {
      // If no such uniform exists, make a note of this.
      addingNewUniform = !uniforms.hasOwnProperty(match[1]);
      // Define the required uniform.
      uniforms[match[1]] = {
        type: "float",
        value: parseFloat(match[2] + match[3]),
      };
    }
  }
  return addingNewUniform;
}

function kineticUniformsForShader() {
  // Given the kinetic parameters in options.kineticParams, return GLSL defining uniforms with
  // these names.
  const regex = /;?\s*(\w+)\s*=\s*[\+\-]?\s*([0-9\.]+)\s*;?/g;
  return replaceDigitsWithWords(
    sanitisedKineticParams().replaceAll(regex, "uniform float $1;\n")
  );
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
    regex = new RegExp("([a-zA-Z_]+)(" + num.toString() + ")", "g");
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
  while (
    (count < 20) &
    ($("#equation_display")[0].getBoundingClientRect().right >=
      window.innerWidth - 65) &
    ($("#equation_display")[0].getBoundingClientRect().width >
      $("#leftGUI")[0].getBoundingClientRect().width)
  ) {
    fz = (parseFloat(el.css("font-size")) * 0.9).toString() + "px";
    el.css("font-size", fz);
    count += 1;
  }

  // Set the left gui max height based on the height of the equation container.
  $("#leftGUI").css(
    "max-height",
    "calc(90dvh - " +
      $("#equation_display")[0].getBoundingClientRect().bottom +
      "px)"
  );
}

function computeColourBrightness(col) {
  return col.reduce((a, b) => a + b, 0) / 3;
}

function setColourRange() {
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
}

function updateGUIDropdown(controller, labels, values) {
  // Update the dropdown of a dat.GUI controller.
  if (values == undefined) {
    values = labels;
  }
  let innerHTMLStr = "";
  for (var i = 0; i < labels.length; i++) {
    var str = "<option value='" + values[i] + "'>" + labels[i] + "</option>";
    innerHTMLStr += str;
  }
  controller.domElement.children[0].innerHTML = innerHTMLStr;
}

function setSpeciesNames(onLoading) {
  let oldListOfSpecies;
  if (listOfSpecies != undefined) {
    oldListOfSpecies = listOfSpecies;
  }
  const newSpecies = options.speciesNames
    .replaceAll(/\W+/g, " ")
    .trim()
    .split(" ")
    .slice(0, defaultSpecies.length);

  // Check if any reserved names have been used, and stop if so.
  const kinParamNames = getKineticParamNames();
  let message;
  for (var ind = 0; ind < newSpecies.length; ind++) {
    if (
      isReservedName(
        newSpecies[ind],
        true,
        kinParamNames.concat(listOfReactions)
      )
    ) {
      if (kinParamNames.includes(newSpecies[ind])) {
        message = "as a parameter";
      } else {
        message = "under the hood";
      }
      alert(
        "The name '" +
          newSpecies[ind] +
          "' is used " +
          message +
          ", so can't be used as a species name. Please use a different name for " +
          newSpecies[ind] +
          "."
      );
      return;
    }
  }

  // If not enough species have been provided, add placeholders for those remaining.
  // The length of listOfSpecies is unchanged, preserving the total number of species.
  listOfSpecies = newSpecies.concat(placeholderSp.slice(newSpecies.length));

  // Configuring the GUI requires strings for D_{u u} etc, so we'll modify the strings here for later use.
  const defaultStrings = {
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

  // Define a non-capturing strings that are equivalent to the old [uvwq], [vwq] etc in regexes.
  genAnySpeciesRegexStrs();

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
  configureOptions();
  configureGUI();
  updateShaders();
  setEquationDisplayType();
}

function setReactionNames(onLoading) {
  const newReactions = options.reactionNames
    .replaceAll(/\W+/g, " ")
    .trim()
    .split(" ")
    .slice(0, defaultReactions.length);
  // Check if any reserved names have been used, and stop if so.
  const kinParamNames = getKineticParamNames();
  let message;
  for (var ind = 0; ind < newReactions.length; ind++) {
    if (isReservedName(newReactions[ind], false)) {
      if (kinParamNames.includes(newReactions[ind])) {
        message = "as a parameter";
      } else if (listOfSpecies.includes(newReactions[ind])) {
        message = "as a species name";
      } else {
        message = "under the hood";
      }
      alert(
        "The name '" +
          newReactions[ind] +
          "' is used " +
          message +
          ", so can't be used as a function name. Please use a different name for " +
          newReactions[ind] +
          "."
      );
      return;
    }
  }

  // If not enough reactions have been provided, add placeholders for those remaining.
  // The length of listOfReactions is unchanged, preserving the total number of species.
  listOfReactions = newReactions.concat(
    placeholderRe.slice(newReactions.length)
  );

  // Configuring the GUI requires strings for f, g etc, so we'll modify the default strings for use here
  // via placeholders.
  let regex;
  const defaultStrings = getDefaultTeXLabelsReaction();
  Object.keys(defaultStrings).forEach(function (key) {
    TeXStrings[key] = parseStringToTEX(
      replaceSymbolsInStr(
        defaultStrings[key],
        defaultReactions,
        listOfReactions
      )
    );
  });

  // Don't update the GUI if we're just loading in, as this will be done as part of loading.
  if (onLoading) return;
  configureGUI();
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
  if (val <= 0) return colourmap[0];
  if (val >= 1) return colourmap[colourmap.length - 1];
  let ind = 0;
  while (val > colourmapEndpoints[ind] && ind < colourmap.length - 1) {
    ind += 1;
  }
  ind -= 1;

  // Interpolate between the colours on the required segment. Note ind 0 <= ind < 4.
  return lerpArrays(
    colourmap[ind],
    colourmap[ind + 1],
    (val - colourmapEndpoints[ind]) /
      (colourmapEndpoints[ind + 1] - colourmapEndpoints[ind])
  );
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
