const pkg = require("./package.json");
const path = require("path");
const HTMLWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: process.env.NODE_ENV ? "development" : "production",

  entry: {
    app: ["./src/client/index.js"]
  },

  output: {
    path: path.join(__dirname, "public"),
    filename: `[name].js`,
    publicPath: "/"
  },

  module: {
    rules: [
      {
        test: /\.(png|jpg|gif|svg)$/,
        include: path.join(__dirname, "src", "client"),
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
      title: pkg.productName
    })
  ]
};
