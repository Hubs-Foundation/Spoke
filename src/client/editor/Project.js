import EventEmitter from "eventemitter3";
import AuthenticationError from "./AuthenticationError";

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
      this.ws.addEventListener("error", this._onWebsocketMessage);
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
      const { name, author } = await this.readJSON(`${baseUri}/meta.json`);
      return `${name} by ${author}`;
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

  close() {
    this.ws.close();
    return Promise.resolve(this);
  }
}
