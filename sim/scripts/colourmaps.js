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
  }
  return colours;
}
