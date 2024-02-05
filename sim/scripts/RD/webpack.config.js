const path = require("path");

module.exports = {
  mode: "production",
  entry: "./main.js",
  output: {
    filename: "main.js",
    path: path.resolve(__dirname),
    library: {
      type: "module",
    },
  },
  experiments: {
    outputModule: true,
  },
  devtool: false,
};
