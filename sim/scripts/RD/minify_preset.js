class TwoWayMap {
  constructor(map) {
    this.map = map;
    this.reverseMap = {};
    for (const key in map) {
      const value = map[key];
      this.reverseMap[value] = key;
    }
  }
  get(key) {
    return this.map[key];
  }
  revGet(key) {
    return this.reverseMap[key];
  }
}

export function minifyPreset(preset) {
  var miniPreset = {};
  const pm = presetMap();
  for (var key of Object.keys(preset)) {
    if (pm.map.hasOwnProperty(key)) {
      // Use a minified name if one is defined.
      miniPreset[pm.get(key)] = preset[key];
    } else {
      // Fallback to inserting the non-minified version.
      miniPreset[key] = preset[key];
    }
  }
  return miniPreset;
}

export function maxifyPreset(mp) {
  var preset = {};
  const pm = presetMap();
  for (var key of Object.keys(mp)) {
    if (pm.reverseMap.hasOwnProperty(key)) {
      // Use a minified name if one is defined.
      preset[pm.revGet(key)] = mp[key];
    } else {
      // Fallback to inserting the non-minified version.
      preset[key] = mp[key];
    }
  }
  return preset;
}

function presetMap() {
  return new TwoWayMap({
    activeViewInd: "aVi",
    algebraicV: "aV",
    algebraicW: "aW",
    autoSetColourRange: "a",
    backgroundColour: "b",
    boundaryConditionsU: "bU",
    boundaryConditionsV: "bV",
    boundaryConditionsW: "bW",
    boundaryConditionsQ: "bQ",
    brushAction: "ba",
    brushEnabled: "be",
    brushRadius: "br",
    brushValue: "bv",
    cameraTheta: "ct",
    cameraPhi: "cp",
    cameraZoom: "cz",
    clearValueU: "cU",
    clearValueV: "cV",
    clearValueW: "cW",
    clearValueQ: "cQ",
    colourbar: "cb",
    colourmap: "c",
    comboStrU: "csU",
    comboStrV: "csV",
    comboStrW: "csW",
    comboStrQ: "csQ",
    contours: "co",
    contourColour: "cC",
    contourEpsilon: "cE",
    contourNum: "cN",
    crossDiffusion: "cD",
    customSurface: "cu",
    diffusionStrUU: "dUU",
    diffusionStrUV: "dUV",
    diffusionStrUW: "dUW",
    diffusionStrUQ: "dUQ",
    diffusionStrVU: "dVU",
    diffusionStrVV: "dVV",
    diffusionStrVW: "dVW",
    diffusionStrVQ: "dVQ",
    diffusionStrWU: "dWU",
    diffusionStrWV: "dWV",
    diffusionStrWW: "dWW",
    diffusionStrWQ: "dWQ",
    diffusionStrQU: "dQU",
    diffusionStrQV: "dQV",
    diffusionStrQW: "dQW",
    diffusionStrQQ: "dQQ",
    dirichletStrU: "dU",
    dirichletStrV: "dV",
    dirichletStrW: "dW",
    dirichletStrQ: "dQ",
    dimension: "di",
    domainIndicatorFun: "d",
    domainScale: "ds",
    domainViaIndicatorFun: "dv",
    drawIn3D: "dr",
    dt: "dt",
    emboss: "e",
    embossAmbient: "eA",
    embossDiffuse: "eD",
    embossPhi: "eP",
    embossShiny: "eSh",
    embossSmoothness: "eSm",
    embossSpecular: "eSp",
    embossTheta: "eT",
    fixRandSeed: "f",
    flippedColourmap: "fc",
    forceManualInterpolation: "fI",
    forceTryClickingPopup: "fT",
    imagePathOne: "io",
    imagePathTwo: "it",
    initialState: "iS",
    integrate: "i",
    kineticParams: "k",
    lineWidthMul: "lm",
    maxColourValue: "ma",
    maxSurfaceValue: "mas",
    minColourValue: "mi",
    minSurfaceValue: "mis",
    neumannStrU: "nU",
    neumannStrV: "nV",
    neumannStrW: "nW",
    neumannStrQ: "nQ",
    numAlgebraicSpecies: "na",
    numSpecies: "n",
    numTimestepsPerFrame: "nT",
    oneDimensional: "o",
    onlyExposeOptions: "oE",
    overlay: "ov",
    overlayColour: "oC",
    overlayEpsilon: "ovE",
    overlayExpr: "oF",
    parent: "pa",
    plotType: "pT",
    preset: "p",
    reactionNames: "rn",
    resetOnImageLoad: "ri",
    renderSize: "r",
    reactionStrU: "rU",
    reactionStrV: "rV",
    reactionStrW: "rW",
    reactionStrQ: "rQ",
    resetFromCheckpoints: "rF",
    resizeCheckpoints: "rC",
    robinStrU: "roU",
    robinStrV: "roV",
    robinStrW: "roW",
    robinStrQ: "roQ",
    runningOnLoad: "rL",
    showAllOptionsOverride: "s",
    smoothingScale: "sm",
    spatialStep: "sp",
    speciesNames: "sn",
    squareCanvas: "sq",
    surfaceFun: "sF",
    suppressTryClickingPopup: "su",
    threeD: "t",
    threeDHeightScale: "th",
    timeDisplay: "td",
    timesteppingScheme: "ts",
    tryClickingText: "tc",
    typesetCustomEqs: "te",
    typeOfBrush: "tb",
    views: "v",
    whatToDraw: "wd",
    whatToPlot: "wp",
  });
}
