export function getColours(sel) {
  let colours = [];
  switch (sel) {
    case "greyscale":
      colours.push([0.0, 0.0, 0.0, 0.0]);
      colours.push([0.25, 0.25, 0.25, 0.25]);
      colours.push([0.5, 0.5, 0.5, 0.5]);
      colours.push([0.75, 0.75, 0.75, 0.75]);
      colours.push([1, 1, 1, 1]);
      break;
    case "BlackGreenYellowRedWhite":
      colours.push([0, 0, 0.0, 0]);
      colours.push([0, 1, 0, 0.25]);
      colours.push([1, 1, 0, 0.5]);
      colours.push([1, 0, 0, 0.75]);
      colours.push([1, 1, 1, 1.0]);
      break;
    case "viridis":
      colours.push([0.267, 0.0049, 0.3294, 0.0]);
      colours.push([0.2302, 0.3213, 0.5455, 0.25]);
      colours.push([0.1282, 0.5651, 0.5509, 0.5]);
      colours.push([0.3629, 0.7867, 0.3866, 0.75]);
      colours.push([0.9932, 0.9062, 0.1439, 1.0]);
      break;
    case "turbo":
      colours.push([0.19, 0.0718, 0.2322, 0.0]);
      colours.push([0.1602, 0.7332, 0.9252, 0.25]);
      colours.push([0.6384, 0.991, 0.2365, 0.5]);
      colours.push([0.9853, 0.5018, 0.1324, 0.75]);
      colours.push([0.4796, 0.01583, 0.01055, 1.0]);
      break;
    case "blue-magenta":
      colours.push([0.002, 0.058, 0.364, 0.0]);
      colours.push([0.4878, 0.0665, 0.5682, 0.25]);
      colours.push([0.908, 0.1975, 0.443, 0.5]);
      colours.push([0.9822, 0.6322, 0.2395, 0.75]);
      colours.push([0.962, 0.976, 0.305, 1.0]);
      break;
    case "diverging":
      colours.push([0.078, 0.193, 0.758, 0.0]);
      colours.push([0.4262, 0.3772, 0.6683, 0.25]);
      colours.push([0.5675, 0.5665, 0.567, 0.5]);
      colours.push([0.7948, 0.7255, 0.3982, 0.75]);
      colours.push([0.991, 0.894, 0.036, 1.0]);
      break;
    case "thermal":
      colours.push([0.909, 0.9822, 0.3555, 0.0]);
      colours.push([0.9782, 0.5782, 0.2558, 0.25]);
      colours.push([0.6923, 0.3736, 0.5085, 0.5]);
      colours.push([0.3381, 0.2324, 0.6119, 0.75]);
      colours.push([0.0156, 0.1382, 0.2018, 1.0]);
      break;
    case "snowghost":
      colours.push([0.99, 0.99, 0.99, 0.0]);
      colours.push([0.9925, 0.9925, 0.9925, 0.25]);
      colours.push([0.995, 0.995, 0.995, 0.5]);
      colours.push([0.9975, 0.9975, 0.9975, 0.75]);
      colours.push([1.0, 1.0, 1.0, 1.0]);
      break;
    case "midnight":
      colours.push([1.5, 1.5, 1.5, 0.0]);
      colours.push([-1.2, -0.7, -0.2, 1.0]);
      colours.push([-1.2, -0.7, -0.2, 1.0]);
      colours.push([-1.2, -0.7, -0.2, 1.0]);
      colours.push([-1.2, -0.7, -0.2, 1.0]);
      break;
    case "lavaflow":
      colours.push([0, 0.1, 0.088, 0.0]);
      colours.push([0, 0.5044, 0.6114, 0.3737]);
      colours.push([0.0, 0.0, 0.0, 0.4545]);
      colours.push([1.0, 0.0005, 0.1724, 0.5252]);
      colours.push([0.924, 1.0, 0.05, 1.0]);
      break;
    case "ice":
      colours.push([-0.1706, -0.1706, -0.1706, 0]);
      colours.push([0.6899, 0.8709, 0.9782, 0.2535]);
      colours.push([0.6667, 0.3765, 0.2235, 0.3]);
      colours.push([0.1137, 0.2863, 0.8549, 0.55]);
      colours.push([0.4667, 0.9059, 0.8275, 0.8]);
      break;
    case "pastels":
      colours.push([0.9647, 0.949, 0.9294, 0]);
      colours.push([0.6899, 0.8709, 0.9782, 0.2535]);
      colours.push([0.6667, 0.3765, 0.2235, 0.3]);
      colours.push([0.6431, 0.9882, 0.5882, 0.59]);
      colours.push([0.1843, 0.4275, 0.9608, 0.86]);
      break;
    case "foliage":
      colours.push([0.95, 0.7388, 0.3207, 0.0]);
      colours.push([0.98039, 0.8353, 0.6471, 0.49]);
      colours.push([0.2, 0.2, 0.2, 0.5]);
      colours.push([0.3549, 0.698, 0.3588, 0.55]);
      colours.push([0.4118, 0.9333, 0.3333, 1.0]);
      break;
    case "water":
      colours.push([1.0, 1.0, 1.0, 0.0]);
      colours.push([0.2588, 0.6294, 0.7529, 0.4]);
      colours.push([0.0, 0.2529, 0.5019, 0.5]);
      colours.push([0.0, 0.1235, 0.2509, 0.75]);
      colours.push([0.0, 0.2529, 0.5019, 1.0]);
      break;
    case "blue":
      colours.push([0.0, 0.1235, 0.2509, 0.75]);
      colours.push([0.0, 0.1235, 0.2509, 0.75]);
      colours.push([0.0, 0.1235, 0.2509, 0.75]);
      colours.push([0.0, 0.1235, 0.2509, 0.75]);
      colours.push([0.0, 0.1235, 0.2509, 0.75]);
      break;
  }
  return colours;
}
