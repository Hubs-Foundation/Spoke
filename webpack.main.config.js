const path = require("path");

module.exports = {
  target: "electron-main",

  devtool: "source-map",

  entry: "./src/main/index.js",

  output: {
    path: path.join(__dirname, "build"),
    filename: "main.bundle.js"
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        include: path.join(__dirname, "src"),
        use: "babel-loader"
      }
    ]
  }
};
