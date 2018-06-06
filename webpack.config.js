const path = require("path");
const HTMLWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: process.env.WEBPACK_SERVE ? "development" : "production",

  devtool: "source-map",

  entry: "./src/index.js",

  output: {
    path: path.join(__dirname, "desktop", "app"),
    filename: "bundle.js"
  },

  module: {
    rules: [
      {
        test: /\.(png|jpg|gif|svg)$/,
        use: [
          {
            loader: "file-loader",
            options: {}
          }
        ]
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      },
      {
        test: /\.scss$/,
        include: path.join(__dirname, "src"),
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
