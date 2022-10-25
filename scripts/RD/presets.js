// presets.js

export function getPreset(id) {
  let options;
  switch (id) {
    case "subcriticalGS":
      options = {
        boundaryConditions: {
          u: "periodic",
          v: "periodic",
        },
        brushValue: 1,
        brushRadius: 1 / 20,
        clearUValue: 0.0,
        clearVValue: 0.0,
        colourmap: "viridis",
        dirichlet: {
          u: 0,
          v: 0,
        },
        domainScale: 1,
        dt: 0.1,
        diffusion: {
          u: 0.000004,
          v: 0.000002,
        },
        maxColourValue: {
          u: 1.0,
          v: 1.0,
        },
        minColourValue: {
          u: 0,
          v: 0,
        },
        numSpecies: 2,
        numTimestepsPerFrame: 100,
        preset: "default",
        renderSize: 256,
        reactionStr: {
          u: "-u*v^2 + 0.037*(1.0 - u)",
          v: "u*v^2 - (0.037+0.06)*v",
        },
        robinStr: {
          u: "0",
          v: "0",
        },
        spatialStep: 1 / 200,
        squareCanvas: false,
        typeOfBrush: "circle",
        whatToPlot: "v",
      };
      break;
    default:
      options = {
        boundaryConditions: {
          u: "periodic",
          v: "periodic",
        },
        brushValue: 1,
        brushRadius: 1 / 20,
        clearUValue: 0.0,
        clearVValue: 0.0,
        colourmap: "viridis",
        dirichlet: {
          u: 0,
          v: 0,
        },
        domainScale: 1,
        dt: 0.1,
        diffusion: {
          u: 0.000004,
          v: 0.000002,
        },
        maxColourValue: {
          u: 1.0,
          v: 1.0,
        },
        minColourValue: {
          u: 0,
          v: 0,
        },
        numSpecies: 2,
        numTimestepsPerFrame: 100,
        preset: "default",
        renderSize: 256,
        reactionStr: {
          u: "-u*v^2 + 0.037*(1.0 - u)",
          v: "u*v^2 - (0.037+0.06)*v",
        },
        robinStr: {
          u: "0",
          v: "0",
        },
        spatialStep: 1 / 200,
        squareCanvas: false,
        typeOfBrush: "circle",
        whatToPlot: "v",
      };
  }
  return options;
}
