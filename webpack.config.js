// Variables in .env and .env.defaults will be added to process.env
const dotenv = require("dotenv");
if (process.env.NODE_ENV === "production") {
  dotenv.config({ path: ".env.prod" });
} else {
  dotenv.config({ path: ".env" });
  dotenv.config({ path: ".env.defaults" });
}

const fs = require("fs");
const selfsigned = require("selfsigned");
const cors = require("cors");
const HTMLWebpackPlugin = require("html-webpack-plugin");
const path = require("path");
const packageJSON = require("./package.json");
const webpack = require("webpack");

function createHTTPSConfig() {
  // Generate certs for the local webpack-dev-server.
  if (fs.existsSync(path.join(__dirname, "certs"))) {
    const key = fs.readFileSync(path.join(__dirname, "certs", "key.pem"));
    const cert = fs.readFileSync(path.join(__dirname, "certs", "cert.pem"));

    return { key, cert };
  } else {
    const pems = selfsigned.generate(
      [
        {
          name: "commonName",
          value: "localhost"
        }
      ],
      {
        days: 365,
        algorithm: "sha256",
        extensions: [
          {
            name: "subjectAltName",
            altNames: [
              {
                type: 2,
                value: "localhost"
              },
              {
                type: 2,
                value: "hubs.local"
              }
            ]
          }
        ]
      }
    );

    fs.mkdirSync(path.join(__dirname, "certs"));
    fs.writeFileSync(path.join(__dirname, "certs", "cert.pem"), pems.cert);
    fs.writeFileSync(path.join(__dirname, "certs", "key.pem"), pems.private);

    return {
      key: pems.private,
      cert: pems.cert
    };
  }
}

const defaultHostName = "hubs.local";
const host = process.env.HOST_IP || defaultHostName;

module.exports = {
  mode: process.env.NODE_ENV ? "development" : "production",

  entry: {
    app: ["./src/index.js"]
  },

  devtool: process.env.NODE_ENV === "production" ? "source-map" : "inline-source-map",

  devServer: {
    https: createHTTPSConfig(),
    historyApiFallback: true,
    port: 9090,
    host: process.env.HOST_IP || "0.0.0.0",
    public: `${host}:9090`,
    useLocalIp: true,
    allowedHosts: [host],
    headers: {
      "Access-Control-Allow-Origin": "*"
    },
    before: function(app) {
      // be flexible with people accessing via a local reticulum on another port
      app.use(cors({ origin: /hubs\.local(:\d*)?$/ }));
    }
  },

  output: {
    path: path.join(__dirname, "public"),
    filename: `[name].js`,
    publicPath: "/"
  },

  module: {
    rules: [
      {
        test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|glb|mp4|webm)(\?.*$|$)/,
        use: "file-loader"
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      },
      {
        test: /\.scss$/,
        include: path.join(__dirname, "src"),
        use: [
          "style-loader",
          { loader: "css-loader", options: { localIdentName: "[name]__[local]__[hash:base64:5]" } },
          "sass-loader"
        ]
      },
      {
        test: /\.js$/,
        include: path.join(__dirname, "src"),
        use: "babel-loader"
      },
      {
        test: /\.worker\.js$/,
        include: path.join(__dirname, "src"),
        loader: "worker-loader"
      },
      {
        test: /\.wasm$/,
        type: "javascript/auto",
        include: path.join(__dirname, "src"),
        loader: "file-loader"
      }
    ]
  },

  resolve: {
    alias: {
      three$: path.join(__dirname, "node_modules/three/build/three.module.js")
    }
  },

  plugins: [
    new HTMLWebpackPlugin({
      template: path.join(__dirname, "src", "index.html"),
      favicon: "src/assets/favicon.ico"
    }),
    new webpack.DefinePlugin({
      SPOKE_VERSION: JSON.stringify(packageJSON.version)
    }),
    new webpack.EnvironmentPlugin({
      NODE_ENV: "development",
      RETICULUM_SERVER: undefined,
      FARSPARK_SERVER: undefined,
      HUBS_SERVER: undefined,
      CORS_PROXY_SERVER: null,
      NON_CORS_PROXY_DOMAINS: ""
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /^@blueprintjs\//
    })
  ]
};
