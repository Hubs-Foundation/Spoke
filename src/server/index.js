const childProcess = require("child_process");
const envPaths = require("env-paths");
const fetch = require("node-fetch");
const fs = require("fs-extra");
const http = require("http");
const https = require("https");
const isWsl = require("is-wsl");
const Koa = require("koa");
const koaBody = require("koa-body");
const mount = require("koa-mount");
const path = require("path");
const request = require("request");
const Router = require("koa-router");
const selfsigned = require("selfsigned");
const semver = require("semver");
const serve = require("koa-static");
const WebSocket = require("ws");
const corsAnywhere = require("cors-anywhere");
const { parse: parseUrl } = require("url");
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

function uriToPath(projectPath, path) {
  return path.replace("/api/files", projectPath);
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

  const callback = app.callback();

  const proxy = corsAnywhere.createServer({
    originWhitelist: [], // Allow all origins
    requireHeaders: [], // Do not require any headers.
    removeHeaders: [] // Do not remove any headers.
  });

  function handleCorsProxy(req, res) {
    req.url = req.url.replace("/api/cors-proxy/", "/");
    res.setHeader("Cache-Control", "max-age=31536000");
    proxy.emit("request", req, res);
  }

  function requestHandler(req, res) {
    const { pathname } = parseUrl(req.url);

    if (/^\/api\/cors-proxy\/.*/.test(pathname)) {
      handleCorsProxy(req, res);
      return;
    }

    callback(req, res);
  }

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

  const wss = new WebSocket.Server({ server });

  // wss error needs to be handled or else it will crash the process if the server errors.
  wss.on("error", e => {
    console.log("WebSocket Server Error", e.toString());
  });

  wss.on("close", e => {
    console.log("WebSocket Server Closed", e);
  });

  function broadcast(json) {
    const message = JSON.stringify(json);

    for (const client of wss.clients) {
      client.send(message);
    }
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

  const reticulumServer = process.env.RETICULUM_SERVER || "hubs.mozilla.com";
  const mediaEndpoint = `https://${reticulumServer}/api/v1/media`;
  const agent = process.env.NODE_ENV === "development" ? https.Agent({ rejectUnauthorized: false }) : null;

  if (process.env.RETICULUM_SERVER) {
    console.log(`Using RETICULUM_SERVER: ${reticulumServer}\n`);
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

  router.post("/api/media", koaBody(), async ctx => {
    try {
      const url = new URL(ctx.request.body.media.url);
      const resp = await fetch(mediaEndpoint, {
        agent,
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(ctx.request.body)
      });
      ctx.status = resp.status;
      if (resp.status !== 200) {
        ctx.body = await resp.text();
        ctx.status = resp.status;
        return;
      }

      if (url.host === "sketchfab.com") {
        ctx.res.setHeader("Cache-Control", "max-age=31536000");
      } else {
        ctx.res.setHeader("Cache-Control", "no-cache");
      }

      ctx.body = await resp.json();
    } catch (err) {
      console.error(err);
      throw new Error("Error resolving media.");
    }
  });

  function getConfigPath(filename) {
    return path.join(envPaths("Spoke", { suffix: "" }).config, filename);
  }

  function getUserInfoPath() {
    return getConfigPath("spoke-user-info.json");
  }

  async function getUserInfo() {
    const userInfoPath = getUserInfoPath();
    if (fs.existsSync(userInfoPath)) {
      return await fs.readJSON(userInfoPath);
    } else {
      return {};
    }
  }

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

  router.get("/api/user_info", koaBody(), async ctx => {
    ctx.body = await getUserInfo();
  });

  router.post("/api/user_info", koaBody(), async ctx => {
    const userInfoPath = getUserInfoPath();
    await fs.ensureDir(path.dirname(userInfoPath));
    const currentUserInfo = await getUserInfo();
    await fs.writeJSON(userInfoPath, { ...currentUserInfo, ...ctx.request.body });
    ctx.status = 200;
  });

  function getCredentialsPath() {
    return getConfigPath("spoke-credentials.json");
  }

  router.post("/api/credentials", koaBody(), async ctx => {
    const credentialsPath = getCredentialsPath();
    await fs.ensureDir(path.dirname(credentialsPath));
    await fs.writeJSON(credentialsPath, { credentials: ctx.request.body.credentials });
    ctx.status = 200;
  });

  async function getCredentials() {
    const credentialsPath = getCredentialsPath();
    if (fs.existsSync(credentialsPath)) {
      const json = await fs.readJSON(credentialsPath);
      return (json && json.credentials) || null;
    }
    return null;
  }

  router.get("/api/authenticated", koaBody(), async ctx => {
    const authenticated = !!(await getCredentials());
    ctx.status = authenticated ? 200 : 401;
  });

  router.post("/api/upload", koaBody(), async ctx => {
    (async () => {
      try {
        const { uri } = ctx.request.body;
        const path = uriToPath(projectPath, uri);

        const fileSize = fs.statSync(path).size;
        const fileStream = fs.createReadStream(path);

        const req = request
          .post(mediaEndpoint, { formData: { media: fileStream } }, async (err, resp, body) => {
            await fs.remove(path);

            if (err) {
              broadcast({ type: "uploadComplete", uploadInfo: { err: err.toString() } });
              return;
            }

            if (resp.statusCode !== 200) {
              broadcast({ type: "uploadComplete", uploadInfo: { err: body } });
              return;
            }

            const { file_id, meta } = JSON.parse(body);
            broadcast({ type: "uploadComplete", uploadInfo: { id: file_id, token: meta.access_token } });
          })
          .on("drain", () => {
            const { bytesWritten } = req.req.connection;
            const percent = bytesWritten / fileSize;
            broadcast({ type: "uploadProgress", uploadProgress: percent });
          });
      } catch (e) {
        await fs.remove(path);
        broadcast({ type: "uploadComplete", uploadInfo: { err: e.toString() } });
      }
    })();

    ctx.status = 200;
  });

  router.post("/api/scene", koaBody(), async ctx => {
    const params = ctx.request.body;
    const sceneParams = {
      screenshot_file_id: params.screenshotId,
      screenshot_file_token: params.screenshotToken,
      model_file_id: params.glbId,
      model_file_token: params.glbToken,
      scene_file_id: params.sceneFileId,
      scene_file_token: params.sceneFileToken,
      allow_remixing: params.allowRemixing,
      allow_promotion: params.allowPromotion,
      name: params.name,
      description: params.description,
      attributions: params.attributions
    };

    const sceneId = params.sceneId;

    const credentials = await getCredentials();
    if (!credentials) {
      ctx.status = 401;
      return;
    }

    const headers = {
      "content-type": "application/json",
      authorization: `Bearer ${credentials}`
    };
    const body = JSON.stringify({ scene: sceneParams });

    let sceneEndpoint = `https://${reticulumServer}/api/v1/scenes`;
    let method = "POST";
    if (sceneId) {
      sceneEndpoint = `${sceneEndpoint}/${sceneId}`;
      method = "PATCH";
    }

    const resp = await fetch(sceneEndpoint, { agent, method, headers, body });

    if (resp.status === 401) {
      ctx.status = 401;
      return;
    }

    if (resp.status !== 200) {
      ctx.status = resp.status;
      ctx.body = await resp.text();
      return;
    }

    const json = await resp.json();
    const scene_id = json.scenes[0].scene_id;
    let url = json.scenes[0].url;

    if (process.env.HUBS_SERVER) {
      url = `https://${process.env.HUBS_SERVER}/scene.html?scene_id=${scene_id}`;
    }

    ctx.body = { url, sceneId: scene_id };
  });

  const nodePlatformToAssetPlatform = {
    win32: "win",
    darwin: "macos",
    linux: "linux"
  };
  function getDownloadUrlForCurrentPlatform(assets) {
    const assetPlatform = nodePlatformToAssetPlatform[process.platform];
    return assets.find(asset => asset.name.includes(assetPlatform)).downloadUrl;
  }

  const updateInfoTimeout = 2000;

  async function fetchReleases(after) {
    // Read-only, public access token.
    const token = "de8cbfb4cc0281c7b731c891df431016c29b0ace";

    const resp = await fetch("https://api.github.com/graphql", {
      timeout: updateInfoTimeout,
      method: "POST",
      headers: { authorization: `bearer ${token}` },
      body: JSON.stringify({
        query: `
          {
            repository(owner: "mozillareality", name: "spoke") {
              releases(
                orderBy: { field: CREATED_AT, direction: DESC },
                first: 5,
                ${after ? `after: "${after}"` : ""}
              ) {
                nodes {
                  isPrerelease,
                  isDraft,
                  tag { name },
                  releaseAssets(last: 3) {
                    nodes { name, downloadUrl }
                  }
                },
                pageInfo { endCursor, hasNextPage }
              }
            }
          }
        `
      })
    });

    if (resp.status !== 200) return;

    const result = await resp.json();
    if (!result || !result.data) return;

    return result.data.repository.releases;
  }

  async function getLatestRelease() {
    let release, hasNextPage, after;
    do {
      const releases = await fetchReleases(after);
      if (!releases) return;
      release = releases.nodes.find(release => !release.isDraft);
      hasNextPage = releases.pageInfo.hasNextPage;
      after = releases.pageInfo.endCursor;
    } while (!release && hasNextPage);

    if (!release) return;

    return {
      version: release.tag.name,
      downloadUrl: getDownloadUrlForCurrentPlatform(release.releaseAssets.nodes)
    };
  }

  router.get("/api/update_info", koaBody(), async ctx => {
    try {
      // This endpoint doesn't exist yet but we query it for future use.
      const configEndpoint = `https://${reticulumServer}/api/v1/configs/spoke`;
      const { min_spoke_version } = await fetch(configEndpoint, { timeout: updateInfoTimeout })
        .then(r => r.json())
        .catch(() => ({}));

      const latestRelease = (await getLatestRelease()) || {};

      ctx.body = {
        updateAvailable: latestRelease.version && semver.gt(latestRelease.version, packageJSON.version),
        updateRequired: min_spoke_version && semver.gt(min_spoke_version, packageJSON.version),
        latestVersion: latestRelease.version,
        downloadUrl: latestRelease.downloadUrl
      };
    } catch (e) {
      console.log("Update info check failed", e);
      ctx.body = {};
      return;
    }
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
