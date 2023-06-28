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
    algebraicV: "aV",
    algebraicW: "aW",
    autoSetColourRange: "a",
    backgroundColour: "b",
    boundaryConditionsU: "bU",
    boundaryConditionsV: "bV",
    boundaryConditionsW: "bW",
    boundaryConditionsQ: "bQ",
    brushAction: "ba",
    brushRadius: "br",
    brushValue: "bv",
    cameraTheta: "ct",
    cameraPhi: "cp",
    cameraZoom: "cz",
    clearValueU: "cU",
    clearValueV: "cV",
    clearValueW: "cW",
    colourbar: "cb",
    colourmap: "c",
    crossDiffusion: "cD",
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
    fixRandSeed: "f",
    flippedColourmap: "fc",
    forceManualInterpolation: "fI",
    imagePathOne: "io",
    imagePathTwo: "it",
    integrate: "i",
    kineticParams: "k",
    lineWidthMul: "lm",
    maxColourValue: "ma",
    minColourValue: "mi",
    neumannStrU: "nU",
    neumannStrV: "nV",
    neumannStrW: "nW",
    neumannStrQ: "nQ",
    numSpecies: "n",
    numTimestepsPerFrame: "nT",
    oneDimensional: "o",
    onlyExposeOptions: "oE",
    preset: "p",
    reactionNames: "rn",
    resetOnImageLoad: "ri",
    renderSize: "r",
    reactionStrU: "rU",
    reactionStrV: "rV",
    reactionStrW: "rW",
    reactionStrQ: "rQ",
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
    suppressTryClickingPopup: "su",
    threeD: "t",
    threeDHeightScale: "th",
    timeDisplay: "td",
    tryClickingText: "tc",
    typesetCustomEqs: "te",
    typeOfBrush: "tb",
    whatToDraw: "wd",
    whatToPlot: "wp",
  });
}
