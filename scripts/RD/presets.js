// presets.js

export function getPreset(id) {
  let options;
  switch (id) {
    case "subcritical GS":
      options = {
        brushValue: 1,
        brushRadius: 1 / 10,
        colourmap: "fiveColourDisplay",
        domainScale: 1,
        dt: 0.1,
        Du: 0.000004,
        Dv: 0.000002,
        maxColourValue: 1,
        minColourValue: 0,
        numTimestepsPerFrame: 100,
        preset: "subcritical GS",
        renderSize: 2000,
        shaderStr: {
          F: "-u*v^2 + 0.037*(1.0 - u)",
          G: "u*v^2 - (0.037+0.06)*v",
        },
        spatialStep: 1 / 200,
        squareCanvas: false,
        typeOfBrush: "circle",
        whatToPlot: "v",
      };
      break;
    default:
      options = {
        brushValue: 1,
        brushRadius: 1 / 20,
        colourmap: "viridis",
        domainScale: 1,
        dt: 0.1,
        Du: 0.000004,
        Dv: 0.000002,
        maxColourValue: 0.5,
        minColourValue: 0,
        numTimestepsPerFrame: 100,
        preset: "default",
        renderSize: 2000,
        shaderStr: {
          F: "-u*v^2 + 0.037*(1.0 - u)",
          G: "u*v^2 - (0.037+0.06)*v",
        },
        spatialStep: 1 / 200,
        squareCanvas: false,
        typeOfBrush: "circle",
        whatToPlot: "v",
      };
  }
  return options;
}
