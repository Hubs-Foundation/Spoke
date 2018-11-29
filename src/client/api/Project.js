import EventEmitter from "eventemitter3";
import AuthenticationError from "./AuthenticationError";
import { Socket } from "phoenix";
import uuid from "uuid/v4";

export default class Project extends EventEmitter {
  constructor() {
    super();

    const { protocol, host } = new URL(window.location.href);

    this.serverURL = protocol + "//" + host;

    if (protocol === "http:") {
      this.wsServerURL = "ws://" + host;
    } else {
      this.wsServerURL = "wss://" + host;
    }

    this.projectDirectoryPath = "/api/files/";

    this.ws = null;

    this.updateInfo = null;

    // Max size in MB
    this.maxUploadSize = 150;

    this.hierarchy = {
      name: "New Project",
      files: [],
      uri: this.projectDirectoryPath,
      children: []
    };
  }

  getRelativeURI(uri) {
    return uri.substring(uri.indexOf(this.projectDirectoryPath) + this.projectDirectoryPath.length);
  }

  getAbsoluteURI(relativeUri) {
    return this.projectDirectoryPath + relativeUri;
  }

  getURL(relativePath) {
    return new URL(relativePath, this.serverURL).href;
  }

  fetch(relativePath, options) {
    return fetch(this.getURL(relativePath), options);
  }

  async writeBlob(relativePath, blob) {
    const res = await this.fetch(relativePath, {
      method: "POST",
      body: blob
    });

    const json = await res.json();

    this.updateHierarchy(json.hierarchy);

    return json;
  }

  async readBlob(relativePath) {
    const res = await this.fetch(relativePath);

    const blob = await res.blob();

    return blob;
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

    this.updateHierarchy(json.hierarchy);

    return json;
  }

  async writeFiles(relativePath, files) {
    const formData = new FormData();

    for (const [index, file] of files.entries()) {
      formData.append("file" + index, file);
    }

    const res = await this.fetch(relativePath, {
      method: "POST",
      body: formData
    });

    const json = await res.json();

    this.updateHierarchy(json.hierarchy);

    return json;
  }

  async remove(relativePath) {
    const res = await this.fetch(relativePath + "?remove=true", { method: "POST" });

    const json = await res.json();

    this.updateHierarchy(json.hierarchy);

    return json;
  }

  async mkdir(relativePath) {
    const res = await this.fetch(relativePath + "?mkdir=true", { method: "POST" });

    const json = await res.json();

    this.updateHierarchy(json.hierarchy);

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

  updateHierarchy(hierarchy) {
    this.hierarchy = hierarchy;
    this.emit("projectHierarchyChanged", this.hierarchy);
  }

  _onWebsocketMessage = event => {
    const json = JSON.parse(event.data);

    if (json.type === "projectHierarchyChanged") {
      if (this.watchPromise) {
        this.watchPromise.resolve(json.hierarchy);
        this.watchPromise = undefined;
      }

      this.updateHierarchy(json.hierarchy);
    } else if (json.type === "uploadProgress") {
      this.emit(json.type, json.uploadProgress);
    } else if (json.type === "uploadComplete") {
      this.emit(json.type, json.uploadInfo);
    } else if (json.type !== undefined && json.path !== undefined) {
      this.emit(json.type, json.path);
    }
  };

  _onWebsocketError = error => {
    if (this.watchPromise) {
      this.watchPromise.reject(error);
      this.watchPromise = undefined;
    } else {
      throw error;
    }
  };

  watch() {
    if (this.ws) {
      return Promise.resolve(this.hierarchy);
    }

    return new Promise((resolve, reject) => {
      this.watchPromise = { resolve, reject };
      this.ws = new WebSocket(this.wsServerURL);
      this.ws.addEventListener("message", this._onWebsocketMessage);
      this.ws.addEventListener("error", this._onWebsocketError);
      this.ws.addEventListener("close", e => {
        console.log("WebSocket closed", e);
      });
    });
  }

  unwatch() {
    this.ws.close();
    return Promise.resolve(this);
  }

  async writeGeneratedBlob(fileName, blob) {
    const basePath = this.projectDirectoryPath;
    const path = `${basePath}generated/${fileName}`;
    await this.mkdir(`${basePath}generated`);
    await this.writeBlob(path, blob);
    return path;
  }

  async import(url) {
    const resp = await fetch("/api/import", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url })
    });

    if (resp.status !== 200) {
      throw new Error(`Import failed for "${url}". ${await resp.text()}`);
    }

    return resp.json();
  }

  async getImportAttribution(uri) {
    if (!uri.includes("/imported/")) return null;
    try {
      const baseUri = uri
        .split("/")
        .slice(0, -1)
        .join("/");
      const { name, author, attribution } = await this.readJSON(`${baseUri}/meta.json`);
      if (attribution) {
        return attribution;
      } else {
        // Legacy
        return { name, author };
      }
    } catch (e) {
      return null;
    }
  }

  async uploadAndDelete(uri, onUploadProgress) {
    if (onUploadProgress) {
      this.on("uploadProgress", onUploadProgress);
    }

    const uploadComplete = new Promise((resolve, reject) => {
      this.once("uploadComplete", uploadInfo => {
        if (onUploadProgress) {
          this.off("uploadProgress", onUploadProgress);
        }
        if (uploadInfo.err) {
          reject(new Error(`Upload failed for "${uri}". ${uploadInfo.err}`));
        } else {
          resolve(uploadInfo);
        }
      });
    });

    const resp = await fetch("/api/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ uri })
    });

    if (resp.status !== 200) {
      throw new Error(`Upload failed for "${uri}". ${await resp.text()}`);
    }

    return uploadComplete;
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

  async _debugVerifyAuth(url) {
    const params = new URLSearchParams(url);
    const topic = params.get("auth_topic");
    const token = params.get("auth_token");
    const reticulumServer = process.env.RETICULUM_SERVER;
    const socketUrl = `wss://${reticulumServer}/socket`;
    const socket = new Socket(socketUrl, { params: { session_id: uuid() } });
    socket.connect();
    const channel = socket.channel(topic);
    await new Promise((resolve, reject) =>
      channel
        .join()
        .receive("ok", resolve)
        .receive("error", reject)
    );
    channel.push("auth_verified", { token });
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

  getUrlDirname(url) {
    const { pathname } = new URL(url, window.location);

    let lastSlashIndex = pathname.lastIndexOf("/");

    if (lastSlashIndex === -1) {
      lastSlashIndex = 0;
    }

    if (pathname.indexOf(".", lastSlashIndex) === -1 && lastSlashIndex !== pathname.length - 1) {
      return pathname;
    }

    return pathname.substring(0, lastSlashIndex);
  }

  getUrlBasename(url) {
    let pathname = new URL(url, window.location).pathname;

    if (pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }

    let lastSlashIndex = pathname.lastIndexOf("/");

    if (lastSlashIndex === -1) {
      lastSlashIndex = 0;
    }

    return pathname.substring(lastSlashIndex + 1);
  }

  getUrlFilename(url) {
    const basename = this.getUrlBasename(url);

    const lastPeriodIndex = basename.lastIndexOf(".");

    if (lastPeriodIndex === -1) {
      return basename;
    }

    return basename.substring(0, lastPeriodIndex);
  }

  getUrlExtname(url) {
    const basename = this.getUrlBasename(url);

    const lastPeriodIndex = basename.lastIndexOf(".");

    if (lastPeriodIndex === -1) {
      return null;
    }

    return basename.substring(lastPeriodIndex);
  }

  close() {
    this.ws.close();
    return Promise.resolve(this);
  }
}
