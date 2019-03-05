import EventEmitter from "eventemitter3";
import AuthenticationError from "./AuthenticationError";
import { Socket } from "phoenix";
import uuid from "uuid/v4";
import SketchfabZipWorker from "./sketchfab-zip.worker.js";

// Media related functions should be kept up to date with Hubs media-utils:
// https://github.com/mozilla/hubs/blob/master/src/utils/media-utils.js

const resolveUrlCache = new Map();

async function resolveUrl(url, index) {
  const cacheKey = `${url}|${index}`;
  if (resolveUrlCache.has(cacheKey)) return resolveUrlCache.get(cacheKey);

  const response = await fetch("/api/media", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ media: { url, index } })
  });

  if (!response.ok) {
    const message = `Error resolving url "${url}":`;
    try {
      const body = await response.text();
      throw new Error(message + " " + body);
    } catch (e) {
      throw new Error(message + " " + response.statusText);
    }
  }

  const resolved = await response.json();
  resolveUrlCache.set(cacheKey, resolved);
  return resolved;
}

function proxiedUrlFor(url) {
  return new URL(`/api/cors-proxy/${url}`, window.location).href;
}

function getFilesFromSketchfabZip(src) {
  return new Promise((resolve, reject) => {
    const worker = new SketchfabZipWorker();
    worker.onmessage = e => {
      const [success, fileMapOrError] = e.data;
      (success ? resolve : reject)(fileMapOrError);
    };
    worker.postMessage(src);
  });
}

function fetchContentType(accessibleUrl) {
  return fetch(accessibleUrl, { method: "HEAD" }).then(r => r.headers.get("content-type"));
}

const CommonKnownContentTypes = {
  gltf: "model/gltf",
  glb: "model/gltf-binary",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  pdf: "application/pdf",
  mp4: "video/mp4",
  mp3: "audio/mpeg"
};

function guessContentType(url) {
  const extension = new URL(url).pathname.split(".").pop();
  return CommonKnownContentTypes[extension];
}

export default class Project extends EventEmitter {
  constructor() {
    super();

    const { protocol, host } = new URL(window.location.href);

    this.serverURL = protocol + "//" + host;

    this.projectDirectoryPath = "/api/files/";

    this.updateInfo = null;

    // Max size in MB
    this.maxUploadSize = 128;
  }

  getAbsoluteURI(relativeUri) {
    return this.projectDirectoryPath + relativeUri;
  }

  async getContentType(url) {
    const result = await resolveUrl(url);
    const canonicalUrl = result.origin;
    const accessibleUrl = proxiedUrlFor(canonicalUrl);

    return (
      (result.meta && result.meta.expected_content_type) ||
      guessContentType(canonicalUrl) ||
      (await fetchContentType(accessibleUrl))
    );
  }

  async resolveMedia(url, index) {
    const absoluteUrl = new URL(url, window.location).href;

    if (absoluteUrl.startsWith(this.serverURL)) {
      return { accessibleUrl: absoluteUrl };
    }

    const result = await resolveUrl(absoluteUrl);
    const canonicalUrl = result.origin;
    const accessibleUrl = proxiedUrlFor(canonicalUrl, index);

    const contentType =
      (result.meta && result.meta.expected_content_type) ||
      guessContentType(canonicalUrl) ||
      (await fetchContentType(accessibleUrl));

    if (contentType === "model/gltf+zip") {
      // TODO: Sketchfab object urls should be revoked after they are loaded by the glTF loader.
      const files = await getFilesFromSketchfabZip(accessibleUrl);
      return { canonicalUrl, accessibleUrl: files["scene.gtlf"], contentType, files };
    }

    return { canonicalUrl, accessibleUrl, contentType };
  }

  fetch(relativePath, options) {
    const url = new URL(relativePath, this.serverURL).href;
    return fetch(url, options);
  }

  async writeBlob(relativePath, blob) {
    const res = await this.fetch(relativePath, {
      method: "POST",
      body: blob
    });

    const json = await res.json();

    return json;
  }

  async readJSON(relativePath) {
    const res = await this.fetch(relativePath);

    const json = await res.json();

    return json;
  }

  async writeJSON(relativePath, data) {
    const res = await this.fetch(relativePath, {
      method: "POST",
      body: JSON.stringify(data)
    });

    const json = await res.json();

    return json;
  }

  async mkdir(relativePath) {
    const res = await this.fetch(relativePath + "?mkdir=true", { method: "POST" });

    const json = await res.json();

    return json;
  }

  async openFile(relativePath) {
    const res = await this.fetch(relativePath + "?open=true", {
      method: "POST"
    });

    const json = await res.json();

    return json;
  }

  async openProjectDirectory() {
    return this.openFile(this.projectDirectoryPath);
  }

  getProjects() {
    return this.readJSON("/api/projects");
  }

  upload(formData, onUploadProgress) {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();

      request.open("post", `/api/media`, true);

      request.upload.addEventListener("progress", e => {
        if (onUploadProgress) {
          onUploadProgress(e.loaded / e.total);
        }
      });

      request.addEventListener("error", e => {
        reject(new Error(`Upload failed ${e}`));
      });

      request.addEventListener("load", () => {
        if (request.status < 300) {
          const response = JSON.parse(request.responseText);
          resolve(response);
        } else {
          reject(new Error(`Upload failed ${request.statusText}`));
        }
      });

      request.send(formData);
    });
  }

  async createOrUpdateScene(params) {
    if (!params.sceneId) {
      delete params.sceneId;
    }

    const resp = await fetch("/api/scene", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(params)
    });

    if (resp.status === 401) {
      throw new AuthenticationError();
    }

    if (resp.status !== 200) {
      throw new Error(`Scene creation failed. ${await resp.text()}`);
    }

    return resp.json();
  }

  async startAuthentication(email) {
    const reticulumServer = process.env.RETICULUM_SERVER;
    const socketUrl = `wss://${reticulumServer}/socket`;
    const socket = new Socket(socketUrl, { params: { session_id: uuid() } });
    socket.connect();
    const channel = socket.channel(`auth:${uuid()}`);
    await new Promise((resolve, reject) =>
      channel
        .join()
        .receive("ok", resolve)
        .receive("error", reject)
    );

    const authComplete = new Promise(resolve =>
      channel.on("auth_credentials", async ({ credentials }) => {
        await fetch("/api/credentials", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ credentials })
        });
        resolve();
      })
    );

    channel.push("auth_request", { email, origin: "spoke" });

    return { authComplete };
  }

  async authenticated() {
    return await fetch("/api/authenticated").then(r => r.ok);
  }

  /*
   * Stores user info on disk.
   * userInfo can be a partial object.
   */
  async setUserInfo(userInfo) {
    return await fetch("/api/user_info", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(userInfo)
    });
  }

  async getUserInfo() {
    return fetch("/api/user_info").then(r => r.json());
  }

  async retrieveUpdateInfo() {
    this.updateInfo = await fetch("/api/update_info").then(r => r.json());
  }

  getUrlFilename(url) {
    let pathname = new URL(url, window.location).pathname;

    if (pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }

    let lastSlashIndex = pathname.lastIndexOf("/");

    if (lastSlashIndex === -1) {
      lastSlashIndex = 0;
    }

    const basename = pathname.substring(lastSlashIndex + 1);

    const lastPeriodIndex = basename.lastIndexOf(".");

    if (lastPeriodIndex === -1) {
      return basename;
    }

    return basename.substring(0, lastPeriodIndex);
  }
}
