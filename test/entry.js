import browserEnv from "browser-env";
// import webpack from "webpack";
// import WebpackDevServer from "webpack-dev-server/lib/Server";
// import webpackConfigFn from "../webpack.config";

// Initialize browser-env for unit tests
browserEnv();

// Compile webpack bundle and start static server for integration tests

// const webpackConfigEnv = {};
// const webpackConfig = webpackConfigFn(webpackConfigEnv);
// const compiler = webpack(webpackConfig);

// const devServerOptions = Object.assign({}, webpackConfig.devServer, {
//   logLevel: "error",
//   clientLogLevel: "none"
// });

// const server = new WebpackDevServer(compiler, devServerOptions);

// const { https, host, port } = devServerOptions;
// export const SERVER_URL = `${https ? "https" : "http"}://${host}:${port}`;

// server.listen(devServerOptions.port, devServerOptions.host, () => {
//   console.log(`Starting server on ${SERVER_URL}`);
// });
