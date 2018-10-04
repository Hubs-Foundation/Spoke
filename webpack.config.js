// Variables in .env and .env.defaults will be added to process.env
const dotenv = require("dotenv");
if (process.env.NODE_ENV === "production") {
  dotenv.config({ path: ".env.prod" });
} else {
  dotenv.config({ path: ".env" });
  dotenv.config({ path: ".env.defaults" });
}

const HTMLWebpackPlugin = require("html-webpack-plugin");
const path = require("path");
const packageJSON = require("./package.json");
const webpack = require("webpack");

module.exports = {
  mode: process.env.NODE_ENV ? "development" : "production",

  entry: {
    app: ["./src/client/index.js"]
  },

  devtool: process.env.NODE_ENV === "production" ? "source-map" : "inline-source-map",

  output: {
    path: path.join(__dirname, "public"),
    filename: `[name].js`,
    publicPath: "/"
  },

  module: {
    rules: [
      {
        test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|glb)(\?.*$|$)/,
        use: "file-loader"
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      },
      {
        test: /\.scss$/,
        include: path.join(__dirname, "src", "client"),
        use: [
          "style-loader",
          { loader: "css-loader", options: { localIdentName: "[name]__[local]__[hash:base64:5]" } },
          "sass-loader"
        ]
      },
      {
        test: /\.js$/,
        include: path.join(__dirname, "src", "client"),
        use: "babel-loader"
      }
    ]
  },

  plugins: [
    new HTMLWebpackPlugin({
      title: packageJSON.productName
    }),
    new webpack.DefinePlugin({
      SPOKE_VERSION: JSON.stringify(packageJSON.version)
    }),
    new webpack.EnvironmentPlugin(["NODE_ENV", "RETICULUM_SERVER"])
  ]
};
