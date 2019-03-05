const fs = require("fs-extra");
const http = require("http");
const https = require("https");
const Koa = require("koa");
const koaBody = require("koa-body");
const mount = require("koa-mount");
const path = require("path");
const Router = require("koa-router");
const selfsigned = require("selfsigned");
const serve = require("koa-static");
const rewrite = require("koa-rewrite");
const glob = require("glob-promise");
const os = require("os");

function getProjectFile(projectPath) {
  return path.join(projectPath, "spoke-project.json");
}

function isExistingProjectPath(path) {
  return fs.existsSync(getProjectFile(path));
}

async function startServer(projectPath, options = {}) {
  if (!projectPath) {
    for (const potentialProjectPathName of ["Spoke", "Spoke Scenes"]) {
      const potentialProjectPath = path.join(os.homedir(), potentialProjectPathName);
      if (!fs.existsSync(potentialProjectPath) || isExistingProjectPath(potentialProjectPath)) {
        projectPath = potentialProjectPath;
        break;
      }
    }
    if (projectPath === null) {
      throw new Error("Default directory is unavailable. Please specify a directory.");
    }
  }

  const opts = Object.assign(
    {
      host: "localhost",
      port: 9090,
      https: false
    },
    options
  );

  let port = opts.port;

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

    // If uploading as text body, write it to filePath using the stream API.
    const writeStream = fs.createWriteStream(filePath, { flags: "w" });

    ctx.req.pipe(writeStream);

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
  });

  server.listen(opts.port, opts.host);

  return server;
}

module.exports = {
  startServer
};
