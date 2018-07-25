import EventEmitter from "eventemitter3";

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

    this.hierarchy = null;
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

  _onWebsocketMessage = event => {
    const json = JSON.parse(event.data);

    if (json.type === "projectHierarchyChanged") {
      if (this.watchPromise) {
        this.watchPromise.resolve(json.hierarchy);
        this.watchPromise = undefined;
      }

      this.hierarchy = json.hierarchy;
      this.emit("projectHierarchyChanged", this.hierarchy);
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

  async optimizeScene(sceneURI, outputURI) {
    const res = await this.fetch("/api/optimize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sceneURI,
        outputURI
      })
    });

    const json = await res.json();

    return json;
  }

  close() {
    this.ws.close();
    return Promise.resolve(this);
  }
}
