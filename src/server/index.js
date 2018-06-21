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
      const childPath = path.join(filePath, childEntry);
      const { name, ext } = path.parse(childPath);
      const stats = await fs.stat(childPath);

      const childNode = await buildProjectNode(
        childPath,
        name,
        ext,
        stats.isDirectory(),
        path.relative(childPath, projectPath)
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

  const projectHierarchy = await buildProjectNode(projectPath, projectName, undefined, true, "");

  return projectHierarchy;
}

export default async function startServer(options) {
  const opts = Object.assign(
    {
      port: 8080
    },
    options
  );

  const app = new Koa();
  const server = http.createServer(app.callback());
  const wss = new WebSocket.Server({ server });

  function broadcast(json) {
    const message = JSON.stringify(json);

    for (const client of wss.clients) {
      client.send(message);
    }
  }

  let projectHierarchy = await getProjectHierarchy(opts.projectPath);

  const debouncedBroadcastHierarchy = debounce(async () => {
    projectHierarchy = await getProjectHierarchy(opts.projectPath);
    broadcast({
      type: "change",
      hierarchy: projectHierarchy
    });
  }, 1000);

  chokidar
    .watch(opts.projectPath, {
      alwaysWriteFinish: true
    })
    .on("all", () => {
      debouncedBroadcastHierarchy();
    });

  wss.on("connection", ws => {
    ws.send(JSON.stringify(projectHierarchy));
  });

  if (process.env.NODE_ENV === "development") {
    console.log("Running in development environment");

    app.on("error", err => {
      console.error("server error", err);
    });

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
      const devMiddleware = await koaWebpack({ compiler });
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

  app.use(mount("/api/files/", serve(opts.projectPath)));

  router.post("/api/files", koaBody({ multipart: true }), async ctx => {
    if (ctx.request.files && ctx.request.files.file && ctx.request.body && ctx.request.body.filePath) {
      const file = ctx.request.files.file;
      const filePath = path.resolve(opts.projectPath, ctx.request.body.filePath);

      await fs.rename(file.path, filePath);

      ctx.body = {
        filePath,
        success: true
      };
    } else {
      ctx.throw(400, "Invalid request");
    }
  });

  router.post("/api/open/:filePath", async ctx => {
    const filePath = path.resolve(opts.projectPath, ctx.params.filePath);

    opn(filePath);

    ctx.body = {
      success: true
    };
  });

  app.use(router.routes());
  app.use(router.allowedMethods());

  server.listen(opts.port);
}
