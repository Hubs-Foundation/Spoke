require("babel-register");

const app = require("express")();
const webpack = require("webpack");
const middleware = require("webpack-dev-middleware");
const options = require("../../webpack.renderer.config");
options.mode = "development";
const compiler = webpack(options);

app.use(
  middleware(compiler, {
    publicPath: "/"
  })
);

app.listen(8080, () => {
  require("./index");
});
