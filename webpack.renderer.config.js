const path = require("path");
const HTMLWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  target: "electron-renderer",

  devtool: "source-map",

  entry: "./src/renderer/index.js",

  output: {
    path: path.join(__dirname, "build"),
    filename: "renderer.bundle.js"
  },

  module: {
    rules: [
      {
        test: /\.scss$/,
        include: path.join(__dirname, "src", "renderer"),
        use: ["style-loader", "css-loader", "sass-loader"]
      },
      {
        test: /\.js$/,
        include: path.join(__dirname, "src"),
        use: "babel-loader"
      }
    ]
  },

  plugins: [
    new HTMLWebpackPlugin({
      title: "Hubs Editor"
    })
  ]
};
