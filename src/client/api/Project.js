import EventEmitter from "eventemitter3";

export default class Project extends EventEmitter {
  constructor() {
    super();

    const { protocol, host } = new URL(window.location.href);

    this.serverUrl = protocol + "//" + host;

    if (protocol === "http:") {
      this.wsServerUrl = "ws://" + host;
    } else {
      this.wsServerUrl = "wss://" + host;
    }

    this.ws = null;

    this.hierarchy = null;
  }

  getUrl(relativePath) {
    return new URL(`api/files/${relativePath}`, window.location).href;
  }

  async writeBlob(relativePath, blob) {
    const res = await fetch(this.serverUrl + relativePath, {
      method: "POST",
      body: blob
    });

    const json = await res.json();

    return json;
  }

  async readBlob(relativePath) {
    const res = await fetch(this.serverUrl + relativePath);

    const blob = await res.blob();

    return blob;
  }

  async readJSON(relativePath) {
    const res = await fetch(this.serverUrl + relativePath);

    const json = await res.json();

    return json;
  }

  async writeJSON(relativePath, data) {
    const res = await fetch(this.serverUrl + relativePath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const json = await res.json();

    return json;
  }

  async mkdir(relativePath) {
    const res = await fetch(this.serverUrl + relativePath + "?mkdir=true", { method: "POST" });

    const json = await res.json();

    return json;
  }

  async openFile(relativePath) {
    const res = await fetch(this.serverUrl + relativePath + "?open=true", {
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
      this.ws = new WebSocket(this.wsServerUrl);
      this.ws.addEventListener("message", this._onWebsocketMessage);
      this.ws.addEventListener("error", this._onWebsocketMessage);
    });
  }

  unwatch() {
    this.ws.close();
    return Promise.resolve(this);
  }

  async optimizeScene(sceneURI, outputURI) {
    const res = await fetch(this.serverUrl + "/api/optimize", {
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
