import Koa from "koa";
import serve from "koa-static";
import mount from "koa-mount";
import koaBody from "koa-body";
import path from "path";
import Router from "koa-router";
import WebSocket from "ws";
import http from "http";
import fs from "fs-extra";
import chokidar from "chokidar";
import debounce from "lodash.debounce";
import opn from "opn";

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
  const opts = Object.assign(
    {
      port: 8080
    },
    options
  );

  const projectPath = path.resolve(opts.projectPath);
  const projectDirName = path.basename(projectPath);

  const app = new Koa();
  const server = http.createServer(app.callback());
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
        hotClient: { host: { server: "0.0.0.0", client: "*" } }
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

  app.use(mount("/api/files/", serve(projectPath)));

  router.post("/api/files/:filePath*", koaBody({ multipart: true }), async ctx => {
    const filePath = path.resolve(projectPath, ctx.params.filePath);

    if (ctx.request.query.open) {
      opn(filePath);
    } else if (ctx.request.files && ctx.request.files.file) {
      const file = ctx.request.files.file;

      await fs.rename(file.path, filePath);

      ctx.body = {
        success: true
      };
    } else if (ctx.request.type === "application/json") {
      await fs.writeJSON(filePath, ctx.request.body, { spaces: 2 });
      ctx.body = {
        success: true
      };
    } else if (ctx.request.type === "application/octet-stream") {
      await fs.writeFile(filePath, ctx.req.read());
      ctx.body = { success: true };
    } else if (ctx.request.query.mkdir) {
      await fs.ensureDir(filePath);

      ctx.body = {
        success: true
      };
    } else {
      ctx.throw(400, "Invalid request");
    }
  });

  router.post("/api/optimize", koaBody(), async ctx => {
    if (!ctx.request.body || !ctx.request.body.sceneURI || !ctx.request.body.outputURI) {
      return ctx.throw(400, "Invalid request");
    }

    const { sceneURI, outputURI } = ctx.request.body;

    const scenePath = path.resolve(projectPath, sceneURI.replace("/api/files/", ""));
    const outputPath = path.resolve(projectPath, outputURI.replace("/api/files/", ""));

    console.log(`Optimize ${scenePath} and output to: ${outputPath}`);

    ctx.body = {
      success: true
    };
  });

  app.use(router.routes());
  app.use(router.allowedMethods());

  server.listen(opts.port);
}
