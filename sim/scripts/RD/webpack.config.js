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
  // The bundle includes three.js (~1.1 MiB minified, ~280 KB gzipped), well over webpack's
  // default 244 KiB limit. Warn only if it grows noticeably beyond its current size.
  performance: {
    maxAssetSize: 1.5 * 1024 * 1024,
    maxEntrypointSize: 1.5 * 1024 * 1024,
  },
};
