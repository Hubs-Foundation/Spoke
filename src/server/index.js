const childProcess = require("child_process");
const envPaths = require("env-paths");
const fs = require("fs-extra");
const http = require("http");
const https = require("https");
const isWsl = require("is-wsl");
const Koa = require("koa");
const koaBody = require("koa-body");
const mount = require("koa-mount");
const path = require("path");
const Router = require("koa-router");
const selfsigned = require("selfsigned");
const serve = require("koa-static");
const rewrite = require("koa-rewrite");
const glob = require("glob-promise");

const packageJSON = require("../../package.json");

function openFile(target) {
  let cmd;
  const args = [];

  if (process.platform === "darwin") {
    cmd = "open";
    args.push("-W");
  } else if (process.platform === "win32" || isWsl) {
    cmd = "cmd" + (isWsl ? ".exe" : "");
    args.push("/c", "start", '""', "/b", "/wait");
    target = target.replace(/&/g, "^&");
  } else {
    cmd = "xdg-open";
  }

  args.push(target);
  childProcess.spawn(cmd, args).unref();
}

async function pipeToFile(stream, filePath) {
  // If uploading as text body, write it to filePath using the stream API.
  const writeStream = fs.createWriteStream(filePath, { flags: "w" });

  stream.pipe(writeStream);

  await new Promise((resolve, reject) => {
    function cleanUp() {
      writeStream.removeListener("finish", onFinish);
      writeStream.removeListener("error", onError);
    }

    function onFinish() {
      cleanUp();
      resolve();
    }

    function onError(err) {
      cleanUp();
      reject(err);
    }

    writeStream.on("finish", onFinish);
    writeStream.on("error", onError);
  });
}

async function startServer(options) {
  console.log(`${packageJSON.productName} configs stored at: "${envPaths("Spoke", { suffix: "" }).config}"\n`);

  const opts = options;
  let port = opts.port;

  const projectPath = path.resolve(opts.projectPath);

  await fs.ensureDir(projectPath);

  const projectFilePath = path.join(projectPath, "spoke-project.json");

  if (!fs.existsSync(projectFilePath)) {
    await fs.writeJSON(projectFilePath, {});
  }

  const app = new Koa();

  let server;

  const requestHandler = app.callback();

  if (opts.https) {
    if (!fs.existsSync(".certs/key.pem")) {
      console.log("Creating selfsigned certs");
      const cert = selfsigned.generate();
      await fs.ensureDir(".certs");
      fs.writeFileSync(path.join(".certs", "key.pem"), cert.private);
      fs.writeFileSync(path.join(".certs", "cert.pem"), cert.cert);
    }
    server = https.createServer(
      {
        key: fs.readFileSync(path.join(".certs", "key.pem")),
        cert: fs.readFileSync(path.join(".certs", "cert.pem"))
      },
      requestHandler
    );
  } else {
    server = http.createServer(requestHandler);
  }

  app.use(rewrite(/^\/projects/, "/"));

  if (opts.publicPath || process.env.NODE_ENV !== "development") {
    app.use(serve(opts.publicPath || path.join(__dirname, "..", "..", "public")));
  } else {
    console.log("Running in development environment");

    const logger = require("koa-logger");
    app.use(logger());

    app.use(async (ctx, next) => {
      try {
        await next();
      } catch (err) {
        ctx.status = err.status || 500;
        ctx.body = err.message;
        ctx.app.emit("error", err, ctx);
      }
    });

    const koaWebpack = require("koa-webpack");
    const webpack = require("webpack");
    const config = require("../../webpack.config.js");
    const compiler = webpack(config);

    try {
      const devMiddleware = await koaWebpack({
        compiler,
        hotClient: false
      });
      app.use(devMiddleware);
    } catch (e) {
      throw e;
    }
  }

  const router = new Router();

  app.use(
    mount(
      "/api/files/",
      serve(projectPath, {
        hidden: true,
        setHeaders: res => {
          res.setHeader("Access-Control-Allow-Origin", "*");
        }
      })
    )
  );

  router.post("/api/files/:filePath*", koaBody({ multipart: true, text: false }), async ctx => {
    const filePath = ctx.params.filePath ? path.resolve(projectPath, ctx.params.filePath) : projectPath;

    if (ctx.request.query.open) {
      // Attempt to open file at filePath with the default application for that file type.
      openFile(filePath);
      ctx.body = { success: true };
      return;
    } else if (ctx.request.query.mkdir) {
      // Make the directory at filePath if it doesn't already exist.
      await fs.ensureDir(filePath);
    } else if (ctx.request.query.remove) {
      await fs.remove(filePath);
    } else if (ctx.request.files) {
      for (const file of Object.values(ctx.request.files)) {
        const destPath = path.join(filePath, file.name);
        await fs.move(file.path, destPath, { overwrite: true });
      }
    } else {
      await pipeToFile(ctx.req, filePath);
    }

    ctx.body = {
      success: true
    };
  });

  router.get("/api/projects", async ctx => {
    const paths = await glob(path.join(projectPath, "**/*.spoke"));

    ctx.body = paths.map(absolutePath => {
      const url = absolutePath
        .replace(projectPath, "/projects")
        .replace(/\\/g, "/")
        .replace(".spoke", "");

      const name = url.split("/").pop();

      return {
        name,
        thumbnail: null,
        url
      };
    });
  });

  app.use(router.routes());
  app.use(router.allowedMethods());

  const maxPortTries = 20;
  let portTryCount = 0;
  server.on("error", e => {
    console.log("Server Error", e.toString());
    if (e.code === "EADDRINUSE") {
      server.close();
      if (portTryCount > maxPortTries) {
        console.log("Could not find a free port. Exiting.");
        process.exit(1);
      }
      port++;
      portTryCount++;
      server.listen(port, opts.host);
    }
  });

  server.on("close", e => {
    console.log("Server Closed", e ? e : "");
  });

  server.on("listening", () => {
    const protocol = opts.https ? "https" : "http";
    const url = `${protocol}://localhost:${port}`;
    console.log(`Server running at ${url}\n`);

    fs.writeFileSync(opts.serverFilePath, url);

    if (opts.open) {
      console.log("Spoke will now open in your web browser...\n\n");
      openFile(url);
    }
  });

  server.listen(port, opts.host);

  return server;
}

module.exports = {
  startServer,
  openFile
};
