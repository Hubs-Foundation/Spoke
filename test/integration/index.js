const path = require("path");
const puppeteer = require("puppeteer-core");
const webpack = require("webpack");
const getChrome = require("get-chrome");
const { startServer } = require("../../src/server/index");
const webpackConfig = require("../../webpack.config");

async function main() {
  const https = false;
  const host = "localhost";
  const port = 9091;
  const serverFilePath = path.join(__dirname, ".spoke-server");

  webpackConfig.target = "web";

  webpackConfig.entry = path.join(__dirname, "entry.js");

  webpackConfig.devtool = "source-map";

  // source-map-support attempts to resolve these, which results in a Webpack
  // warning, but it doesn't actually need them to work in browser, so let's
  // use stubs.
  webpackConfig.node = {
    fs: "empty",
    module: "empty"
  };

  const webpackOutputPath = path.join(__dirname, "public");
  webpackConfig.output.path = webpackOutputPath;

  // Run server in development mode.
  process.env.NODE_ENV = "development";

  async function createServerPromise() {
    await new Promise((resolve, reject) => {
      webpack(webpackConfig).run((err, stats) => {
        if (err) return reject(err);
        resolve(stats);
      });
    });

    return await startServer({
      https,
      host,
      port,
      serverFilePath,
      projectPath: path.join(__dirname, "project"),
      publicPath: webpackOutputPath
    });
  }

  const serverPromise = createServerPromise();

  const chromePath = getChrome();
  const browserPromise = puppeteer.launch({ executablePath: chromePath });

  console.log("Compiling webpack bundle and launching Puppeteer...\n");
  console.log(`CHROME_PATH=${chromePath}`);

  const [server, browser] = await Promise.all([serverPromise, browserPromise]);

  console.log("Loading page...\n");

  const page = await browser.newPage();

  const uncaughtErrors = [];

  page.on("error", err => {
    uncaughtErrors.push(err);
    return true;
  });
  page.on("pageerror", err => {
    uncaughtErrors.push(err);
    return true;
  });

  page.on("console", msg => {
    const type = msg.type();
    if (type === "log" || type === "error" || type === "warn" || type === "info" || type === "debug") {
      Promise.all(msg.args().map(a => a.jsonValue())).then(args => {
        console[type](...args);
      });
    }
  });

  const url = `http${https ? "s" : ""}://${host}:${port}`;

  await page.goto(url);
  await page.waitForSelector("#mocha");

  console.log("Page loaded. Running tests...");

  const failures = await page.evaluate(() => new Promise(resolve => window.mocha.run(resolve)));

  if (uncaughtErrors.length > 0) {
    console.log("\nUncaught errors:\n");

    for (const uncaughtError of uncaughtErrors) {
      console.log("\u001b[31m" + uncaughtError.message + "\u001b[0m");
    }
  }

  await browser.close();
  server.close();

  if (failures > 0) {
    process.exit(1);
  }
}

main()
  .then(() => process.exit())
  .catch(e => {
    console.error("Uncaught exception:");
    console.error(e);
    process.exit(1);
  });
