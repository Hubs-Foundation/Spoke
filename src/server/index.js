import Koa from "koa";
import serve from "koa-static";
import mount from "koa-mount";
import koaBody from "koa-body";
import path from "path";
import Router from "koa-router";
import WebSocket from "ws";
import https from "https";
import http from "http";
import selfsigned from "selfsigned";
import fs from "fs-extra";
import chokidar from "chokidar";
import debounce from "lodash.debounce";
import opn from "opn";
import { contentHashAndCopy } from "./gltf";
import generateUnlitTextures from "gltf-unlit-generator";

async function getProjectHierarchy(projectPath) {
  async function buildProjectNode(filePath, name, ext, isDirectory, uri) {
    if (!isDirectory) {
      return {
        name,
        ext,
        uri,
        isDirectory
      };
    }

    const children = [];
    const files = [];

    const directoryEntries = await fs.readdir(filePath);

    for (const childEntry of directoryEntries) {
      // eslint-disable-next-line no-useless-escape
      if (/(^|\/)\.[^\/\.]/g.test(childEntry)) {
        continue;
      }

      const childPath = path.resolve(filePath, childEntry);
      const { base, ext } = path.parse(childPath);
      const stats = await fs.stat(childPath);

      const childNode = await buildProjectNode(
        childPath,
        base,
        ext,
        stats.isDirectory(),
        childPath.replace(projectPath, "/api/files").replace(/\\/g, "/")
      );

      if (childNode.isDirectory) {
        children.push(childNode);
      }

      files.push(childNode);
    }

    return {
      name,
      uri,
      children,
      files,
      isDirectory: true
    };
  }

  const projectName = path.parse(projectPath).name;

  const projectHierarchy = await buildProjectNode(projectPath, projectName, undefined, true, "/api/files");

  return projectHierarchy;
}

export default async function startServer(options) {
  const opts = options;

  const projectPath = path.resolve(opts.projectPath);
  const projectDirName = path.basename(projectPath);

  const app = new Koa();

  let server;
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
      app.callback()
    );
  } else {
    server = http.createServer(app.callback());
  }
  const wss = new WebSocket.Server({ server });

  function broadcast(json) {
    const message = JSON.stringify(json);

    for (const client of wss.clients) {
      client.send(message);
    }
  }

  let projectHierarchy = await getProjectHierarchy(projectPath);

  const debouncedBroadcastHierarchy = debounce(async () => {
    projectHierarchy = await getProjectHierarchy(projectPath);
    broadcast({
      type: "projectHierarchyChanged",
      hierarchy: projectHierarchy
    });
  }, 1000);

  chokidar
    .watch(opts.projectPath, {
      alwaysWriteFinish: true
    })
    .on("all", (type, filePath) => {
      broadcast({
        type,
        path: filePath.replace(projectDirName, "/api/files").replace(/\\/g, "/")
      });
      debouncedBroadcastHierarchy();
    });

  wss.on("connection", ws => {
    const message = JSON.stringify({
      type: "projectHierarchyChanged",
      hierarchy: projectHierarchy
    });

    ws.send(message);
  });

  if (process.env.NODE_ENV === "development") {
    console.log("Running in development environment");

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
        hotClient: opts.https ? false : { host: { server: "0.0.0.0", client: "*" } }
      });
      app.use(devMiddleware);
    } catch (e) {
      throw e;
    }
  } else {
    app.use(serve(path.join(__dirname, "..", "..", "public")));
  }

  const router = new Router();

  router.get("/api/files", async ctx => {
    ctx.body = projectHierarchy;
  });

  app.use(
    mount(
      "/api/files/",
      serve(projectPath, {
        setHeaders: res => {
          res.setHeader("Access-Control-Allow-Origin", "*");
        }
      })
    )
  );

  router.post("/api/files/:filePath*", async ctx => {
    const filePath = ctx.params.filePath ? path.resolve(projectPath, ctx.params.filePath) : projectPath;

    if (ctx.request.query.open) {
      // Attempt to open file at filePath with the default application for that file type.
      opn(filePath);
    } else if (ctx.request.query.mkdir) {
      // Make the directory at filePath if it doesn't already exist.
      await fs.ensureDir(filePath);
    } else {
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
    }

    ctx.body = { success: true };
  });

  router.post("/api/optimize", koaBody(), async ctx => {
    if (!ctx.request.body || !ctx.request.body.sceneURI || !ctx.request.body.outputURI) {
      return ctx.throw(400, "Invalid request");
    }

    const { sceneURI, outputURI } = ctx.request.body;

    const scenePath = path.resolve(projectPath, sceneURI.replace("/api/files/", ""));
    const sceneDirPath = path.dirname(scenePath);
    const outputPath = path.resolve(projectPath, outputURI.replace("/api/files/", ""));
    const outputDirPath = path.dirname(outputPath);

    await generateUnlitTextures(scenePath, outputDirPath);

    const json = await fs.readJSON(outputPath);

    json.images = await contentHashAndCopy(json.images, sceneDirPath, outputDirPath, true);
    json.buffers = await contentHashAndCopy(json.buffers, sceneDirPath, outputDirPath, true);

    await fs.writeJSON(outputPath, json);

    ctx.body = {
      success: true
    };
  });

  app.use(router.routes());
  app.use(router.allowedMethods());

  server.listen(opts.port);
}
