import EventEmitter from "eventemitter3";
import { Socket } from "phoenix";
import uuid from "uuid/v4";
import AuthContainer from "./AuthContainer";
import LoginDialog from "./LoginDialog";
import PublishDialog from "./PublishDialog";
import ProgressDialog from "../ui/dialogs/ProgressDialog";
import Fuse from "fuse.js";
import jwtDecode from "jwt-decode";
import { buildAbsoluteURL } from "url-toolkit";
import PublishedSceneDialog from "./PublishedSceneDialog";

// Media related functions should be kept up to date with Hubs media-utils:
// https://github.com/mozilla/hubs/blob/master/src/utils/media-utils.js

const resolveUrlCache = new Map();
const RETICULUM_SERVER = process.env.RETICULUM_SERVER || document.location.hostname;

// thanks to https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
function b64EncodeUnicode(str) {
  // first we use encodeURIComponent to get percent-encoded UTF-8, then we convert the percent-encodings
  // into raw bytes which can be fed into btoa.
  const CHAR_RE = /%([0-9A-F]{2})/g;
  return btoa(encodeURIComponent(str).replace(CHAR_RE, (_, p1) => String.fromCharCode("0x" + p1)));
}

const farsparkEncodeUrl = url => {
  // farspark doesn't know how to read '=' base64 padding characters
  // translate base64 + to - and / to _ for URL safety
  return b64EncodeUnicode(url)
    .replace(/=+$/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
};

const nonCorsProxyDomains = (process.env.NON_CORS_PROXY_DOMAINS || "").split(",");
if (process.env.CORS_PROXY_SERVER) {
  nonCorsProxyDomains.push(process.env.CORS_PROXY_SERVER);
}

function shouldCorsProxy(url) {
  // Skip known domains that do not require CORS proxying.
  try {
    const parsedUrl = new URL(url);
    if (nonCorsProxyDomains.find(domain => parsedUrl.hostname.endsWith(domain))) return false;
  } catch (e) {
    // Ignore
  }

  return true;
}

export const proxiedUrlFor = (url, index) => {
  if (!(url.startsWith("http:") || url.startsWith("https:"))) return url;

  if (!shouldCorsProxy(url)) {
    return url;
  }

  if (index != null || !process.env.CORS_PROXY_SERVER) {
    const method = index != null ? "extract" : "raw";
    return `https://${process.env.FARSPARK_SERVER}/0/${method}/0/0/0/${index || 0}/${farsparkEncodeUrl(url)}`;
  } else {
    return `https://${process.env.CORS_PROXY_SERVER}/${url}`;
  }
};

export const scaledThumbnailUrlFor = (url, width, height) => {
  if (
    process.env.RETICULUM_SERVER &&
    process.env.RETICULUM_SERVER.includes("hubs.local") &&
    url.includes("hubs.local")
  ) {
    return url;
  }

  return `https://${process.env.THUMBNAIL_SERVER}/thumbnail/${farsparkEncodeUrl(url)}?w=${width}&h=${height}`;
};

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

const LOCAL_STORE_KEY = "___hubs_store";

export default class Project extends EventEmitter {
  constructor() {
    super();

    const { protocol, host } = new URL(window.location.href);

    this.serverURL = protocol + "//" + host;

    this.projectDirectoryPath = "/api/files/";

    // Max size in MB
    this.maxUploadSize = 128;
  }

  getAuthContainer() {
    return AuthContainer;
  }

  async authenticate(email, signal) {
    const reticulumServer = RETICULUM_SERVER;
    const socketUrl = `wss://${reticulumServer}/socket`;
    const socket = new Socket(socketUrl, { params: { session_id: uuid() } });
    socket.connect();

    const channel = socket.channel(`auth:${uuid()}`);

    const onAbort = () => socket.disconnect();

    signal.addEventListener("abort", onAbort);

    await new Promise((resolve, reject) =>
      channel
        .join()
        .receive("ok", resolve)
        .receive("error", err => {
          signal.removeEventListener("abort", onAbort);
          reject(err);
        })
    );

    const authComplete = new Promise(resolve =>
      channel.on("auth_credentials", ({ credentials: token }) => {
        localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify({ credentials: { email, token } }));
        this.emit("authentication-changed", true);
        resolve();
      })
    );

    channel.push("auth_request", { email, origin: "spoke" });

    signal.removeEventListener("abort", onAbort);

    return authComplete;
  }

  isAuthenticated() {
    const value = localStorage.getItem(LOCAL_STORE_KEY);

    const store = JSON.parse(value);

    return !!(store && store.credentials && store.credentials.token);
  }

  getToken() {
    const value = localStorage.getItem(LOCAL_STORE_KEY);

    if (!value) {
      throw new Error("Not authenticated");
    }

    const store = JSON.parse(value);

    if (!store || !store.credentials || !store.credentials.token) {
      throw new Error("Not authenticated");
    }

    return store.credentials.token;
  }

  getAccountId() {
    const token = this.getToken();
    return jwtDecode(token).sub;
  }

  logout() {
    localStorage.removeItem(LOCAL_STORE_KEY);
    this.emit("authentication-changed", false);
  }

  showLoginDialog(showDialog, hideDialog) {
    return new Promise(resolve => {
      showDialog(LoginDialog, {
        onSuccess: () => {
          hideDialog();
          resolve();
        }
      });
    });
  }

  async getProjects() {
    const token = this.getToken();

    const headers = {
      "content-type": "application/json",
      authorization: `Bearer ${token}`
    };

    const response = await this.fetch(`https://${RETICULUM_SERVER}/api/v1/projects`, { headers });

    const json = await response.json();

    if (!Array.isArray(json.projects)) {
      throw new Error(`Error fetching projects: ${json.error || "Unknown error."}`);
    }

    return json.projects.map(project => ({
      id: project.project_id,
      name: project.name,
      thumbnailUrl: project.thumbnail_url
    }));
  }

  async getProject(projectId) {
    const token = this.getToken();

    const headers = {
      "content-type": "application/json",
      authorization: `Bearer ${token}`
    };

    const response = await this.fetch(`https://${RETICULUM_SERVER}/api/v1/projects/${projectId}`, {
      headers
    });

    const json = await response.json();

    let project = null;

    if (json.project_url) {
      const projectFileResponse = await this.fetch(json.project_url, { headers });
      project = await projectFileResponse.json();
    }

    return {
      id: json.project_id,
      name: json.name,
      thumbnailUrl: json.thumbnail_url,
      project
    };
  }

  async resolveUrl(url, index) {
    if (!shouldCorsProxy(url)) {
      return { origin: url };
    }

    const cacheKey = `${url}|${index}`;
    if (resolveUrlCache.has(cacheKey)) return resolveUrlCache.get(cacheKey);

    const response = await this.fetch(`https://${RETICULUM_SERVER}/api/v1/media`, {
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

  fetchContentType(accessibleUrl) {
    return this.fetch(accessibleUrl, { method: "HEAD" }).then(r => r.headers.get("content-type"));
  }

  async getContentType(url) {
    const result = await this.resolveUrl(url);
    const canonicalUrl = result.origin;
    const accessibleUrl = proxiedUrlFor(canonicalUrl);

    return (
      (result.meta && result.meta.expected_content_type) ||
      guessContentType(canonicalUrl) ||
      (await this.fetchContentType(accessibleUrl))
    );
  }

  async resolveMedia(url, index) {
    const absoluteUrl = new URL(url, window.location).href;

    if (absoluteUrl.startsWith(this.serverURL)) {
      return { accessibleUrl: absoluteUrl };
    }

    const result = await this.resolveUrl(absoluteUrl);
    const canonicalUrl = result.origin;
    const accessibleUrl = proxiedUrlFor(canonicalUrl, index);

    const contentType =
      (result.meta && result.meta.expected_content_type) ||
      guessContentType(canonicalUrl) ||
      (await this.fetchContentType(accessibleUrl));

    if (contentType === "model/gltf+zip") {
      // TODO: Sketchfab object urls should be revoked after they are loaded by the glTF loader.
      const {
        getFilesFromSketchfabZip
      } = await import(/* webpackChunkName: "SketchfabZipLoader", webpackPrefetch: true */ "./SketchfabZipLoader");
      const files = await getFilesFromSketchfabZip(accessibleUrl);
      return { canonicalUrl, accessibleUrl: files["scene.gtlf"], contentType, files };
    }

    return { canonicalUrl, accessibleUrl, contentType };
  }

  unproxyUrl(baseUrl, url) {
    if (process.env.CORS_PROXY_SERVER) {
      const corsProxyPrefix = `https://${process.env.CORS_PROXY_SERVER}/`;

      if (baseUrl.startsWith(corsProxyPrefix)) {
        baseUrl = baseUrl.substring(corsProxyPrefix.length);
      }

      if (url.startsWith(corsProxyPrefix)) {
        url = url.substring(corsProxyPrefix.length);
      }
    }

    // HACK HLS.js resolves relative urls internally, but our CORS proxying screws it up. Resolve relative to the original unproxied url.
    // TODO extend HLS.js to allow overriding of its internal resolving instead
    if (!url.startsWith("http")) {
      url = buildAbsoluteURL(baseUrl, url.startsWith("/") ? url : `/${url}`);
    }

    return proxiedUrlFor(url);
  }

  async searchMedia(source, params, cursor, signal) {
    const url = new URL(`https://${RETICULUM_SERVER}/api/v1/media/search`);

    const headers = {
      "content-type": "application/json"
    };

    const searchParams = url.searchParams;

    searchParams.set("source", source);

    if (source === "assets") {
      searchParams.set("user", this.getAccountId());
      const token = this.getToken();
      headers.authorization = `Bearer ${token}`;
    }

    if (params.type) {
      searchParams.set("type", params.type);
    }

    if (params.query) {
      searchParams.set("q", params.query);
    }

    if (params.filter) {
      searchParams.set("filter", params.filter);
    }

    if (cursor) {
      searchParams.set("cursor", cursor);
    }

    const resp = await this.fetch(url, { headers, signal });

    const json = await resp.json();

    const thumbnailedEntries = json.entries.map(entry => {
      if (entry.images && entry.images.preview && entry.images.preview.url) {
        if (entry.images.preview.type === "mp4") {
          entry.images.preview.url = proxiedUrlFor(entry.images.preview.url);
        } else {
          entry.images.preview.url = scaledThumbnailUrlFor(entry.images.preview.url, 100, 100);
        }
      }
      return entry;
    });

    return {
      results: thumbnailedEntries,
      suggestions: json.suggestions,
      nextCursor: json.meta.next_cursor
    };
  }

  async createProject(editor, showDialog, hideDialog) {
    this.emit("project-saving");

    // Ensure the user is authenticated before continuing.
    if (!this.isAuthenticated()) {
      await new Promise(resolve => {
        showDialog(LoginDialog, {
          onSuccess: resolve
        });
      });
    }

    const { blob: thumbnailBlob } = await editor.takeScreenshot(512, 320);
    const {
      file_id: thumbnail_file_id,
      meta: { access_token: thumbnail_file_token }
    } = await this.upload(thumbnailBlob);

    const serializedScene = editor.scene.serialize();
    const projectBlob = new Blob([JSON.stringify(serializedScene)], { type: "application/json" });
    const {
      file_id: project_file_id,
      meta: { access_token: project_file_token }
    } = await this.upload(projectBlob);

    const token = this.getToken();

    const headers = {
      "content-type": "application/json",
      authorization: `Bearer ${token}`
    };

    const body = JSON.stringify({
      project: {
        name: editor.scene.name,
        thumbnail_file_id,
        thumbnail_file_token,
        project_file_id,
        project_file_token
      }
    });

    const projectEndpoint = `https://${RETICULUM_SERVER}/api/v1/projects`;

    const resp = await this.fetch(projectEndpoint, { method: "POST", headers, body });

    if (resp.status === 401) {
      return await new Promise((resolve, reject) => {
        showDialog(LoginDialog, {
          onSuccess: async () => {
            try {
              await this.createProject(editor, showDialog, hideDialog);
              resolve();
            } catch (e) {
              reject(e);
            }
          }
        });
      });
    }

    if (resp.status !== 200) {
      throw new Error(`Project creation failed. ${await resp.text()}`);
    }

    const json = await resp.json();

    this.emit("project-saved");

    return { projectId: json.project_id };
  }

  async deleteProject(projectId) {
    const token = this.getToken();

    const headers = {
      "content-type": "application/json",
      authorization: `Bearer ${token}`
    };

    const projectEndpoint = `https://${RETICULUM_SERVER}/api/v1/projects/${projectId}`;

    const resp = await this.fetch(projectEndpoint, { method: "DELETE", headers });

    if (resp.status === 401) {
      throw new Error("Not authenticated");
    }

    if (resp.status !== 200) {
      throw new Error(`Project deletion failed. ${await resp.text()}`);
    }

    return true;
  }

  async saveProject(projectId, editor, signal, showDialog, hideDialog) {
    this.emit("project-saving");

    // Ensure the user is authenticated before continuing.
    if (!this.isAuthenticated()) {
      await new Promise(resolve => {
        showDialog(LoginDialog, {
          onSuccess: resolve
        });
      });
    }

    if (signal.aborted) {
      throw new Error("Save project aborted");
    }

    const { blob: thumbnailBlob } = await editor.takeScreenshot(512, 320);

    if (signal.aborted) {
      throw new Error("Save project aborted");
    }

    const {
      file_id: thumbnail_file_id,
      meta: { access_token: thumbnail_file_token }
    } = await this.upload(thumbnailBlob, undefined, signal);

    if (signal.aborted) {
      throw new Error("Save project aborted");
    }

    const serializedScene = editor.scene.serialize();
    const projectBlob = new Blob([JSON.stringify(serializedScene)], { type: "application/json" });
    const {
      file_id: project_file_id,
      meta: { access_token: project_file_token }
    } = await this.upload(projectBlob, undefined, signal);

    if (signal.aborted) {
      throw new Error("Save project aborted");
    }

    const token = this.getToken();

    const headers = {
      "content-type": "application/json",
      authorization: `Bearer ${token}`
    };

    const body = JSON.stringify({
      project: {
        name: editor.scene.name,
        thumbnail_file_id,
        thumbnail_file_token,
        project_file_id,
        project_file_token
      }
    });

    const projectEndpoint = `https://${RETICULUM_SERVER}/api/v1/projects/${projectId}`;

    const resp = await this.fetch(projectEndpoint, { method: "PATCH", headers, body, signal });

    if (signal.aborted) {
      throw new Error("Save project aborted");
    }

    if (resp.status === 401) {
      return await new Promise((resolve, reject) => {
        showDialog(LoginDialog, {
          onSuccess: async () => {
            try {
              await this.saveProject(projectId, editor, signal, showDialog, hideDialog);
              resolve();
            } catch (e) {
              reject(e);
            }
          }
        });
      });
    }

    if (resp.status !== 200) {
      throw new Error(`Saving project failed. ${await resp.text()}`);
    }

    this.emit("project-saved");
  }

  getSceneUrl(sceneId) {
    if (process.env.HUBS_SERVER === "localhost:8080" || process.env.HUBS_SERVER === "hubs.local:8080") {
      return `https://${process.env.HUBS_SERVER}/scene.html?scene_id=${sceneId}`;
    } else {
      return `https://${process.env.HUBS_SERVER}/scenes/${sceneId}`;
    }
  }

  async publishProject(projectId, editor, showDialog, hideDialog) {
    let screenshotUrl;

    try {
      const scene = editor.scene;

      const abortController = new AbortController();
      const signal = abortController.signal;

      // Save the scene if it has been modified.
      if (editor.sceneModified) {
        showDialog(ProgressDialog, {
          title: "Saving Project",
          message: "Saving project...",
          cancelable: true,
          onCancel: () => {
            abortController.abort();
          }
        });

        await this.saveProject(projectId, editor, signal, showDialog, hideDialog);

        if (signal.aborted) {
          const error = new Error("Publish project aborted");
          error.aborted = true;
          throw error;
        }
      }

      // Ensure the user is authenticated before continuing.
      if (!this.isAuthenticated()) {
        await new Promise(resolve => {
          showDialog(LoginDialog, {
            onSuccess: resolve
          });
        });
      }

      // Take a screenshot of the scene from the current camera position to use as the thumbnail
      const { blob: screenshotBlob, cameraTransform: screenshotCameraTransform } = await editor.takeScreenshot();
      screenshotUrl = URL.createObjectURL(screenshotBlob);

      if (signal.aborted) {
        const error = new Error("Publish project aborted");
        error.aborted = true;
        throw error;
      }

      // Gather all the info needed to display the publish dialog
      const { name, creatorAttribution, allowRemixing, allowPromotion, sceneId } = scene.metadata;
      const userInfo = this.getUserInfo();

      let initialCreatorAttribution = creatorAttribution;
      if (
        (!initialCreatorAttribution || initialCreatorAttribution.length === 0) &&
        userInfo &&
        userInfo.creatorAttribution
      ) {
        initialCreatorAttribution = userInfo.creatorAttribution;
      }

      const contentAttributions = scene.getContentAttributions();

      // Display the publish dialog and wait for the user to submit / cancel
      const publishParams = await new Promise(resolve => {
        showDialog(PublishDialog, {
          screenshotUrl,
          contentAttributions,
          initialSceneParams: {
            name: name || editor.scene.name,
            creatorAttribution: initialCreatorAttribution || "",
            allowRemixing: typeof allowRemixing !== "undefined" ? allowRemixing : true,
            allowPromotion: typeof allowPromotion !== "undefined" ? allowPromotion : true
          },
          onCancel: () => resolve(null),
          onPublish: resolve
        });
      });

      // User clicked cancel
      if (!publishParams) {
        URL.revokeObjectURL(screenshotUrl);
        hideDialog();
        return;
      }

      // Update the scene with the metadata from the publishDialog
      scene.setMetadata({
        name: publishParams.name,
        creatorAttribution: publishParams.creatorAttribution,
        allowRemixing: publishParams.allowRemixing,
        allowPromotion: publishParams.allowPromotion,
        previewCameraTransform: screenshotCameraTransform
      });

      // Save the creatorAttribution to localStorage so that the user doesn't have to input it again
      this.setUserInfo({ creatorAttribution: publishParams.creatorAttribution });

      showDialog(ProgressDialog, {
        title: "Publishing Scene",
        message: "Exporting scene...",
        cancelable: true,
        onCancel: () => {
          abortController.abort();
        }
      });

      // Clone the existing scene, process it for exporting, and then export as a glb blob
      const glbBlob = await editor.exportScene(abortController.signal);

      if (signal.aborted) {
        const error = new Error("Publish project aborted");
        error.aborted = true;
        throw error;
      }

      // Serialize Spoke scene
      const serializedScene = editor.scene.serialize();
      const sceneBlob = new Blob([JSON.stringify(serializedScene)], { type: "application/json" });

      showDialog(ProgressDialog, {
        title: "Publishing Scene",
        message: `${sceneId ? "updating" : "creating"} scene`,
        cancelable: true,
        onCancel: () => {
          abortController.abort();
        }
      });

      const size = glbBlob.size / 1024 / 1024;
      const maxSize = this.maxUploadSize;
      if (size > maxSize) {
        throw new Error(`Scene is too large (${size.toFixed(2)}MB) to publish. Maximum size is ${maxSize}MB.`);
      }

      showDialog(ProgressDialog, {
        title: "Publishing Scene",
        message: "Uploading thumbnail...",
        cancelable: true,
        onCancel: () => {
          abortController.abort();
        }
      });

      // Upload the screenshot file
      const {
        file_id: screenshotId,
        meta: { access_token: screenshotToken }
      } = await this.upload(screenshotBlob, undefined, abortController.signal);

      if (signal.aborted) {
        const error = new Error("Publish project aborted");
        error.aborted = true;
        throw error;
      }

      const {
        file_id: glbId,
        meta: { access_token: glbToken }
      } = await this.upload(glbBlob, uploadProgress => {
        showDialog(
          ProgressDialog,
          {
            title: "Publishing Scene",
            message: `Uploading scene: ${Math.floor(uploadProgress * 100)}%`,
            onCancel: () => {
              abortController.abort();
            }
          },
          abortController.signal
        );
      });

      if (signal.aborted) {
        const error = new Error("Publish project aborted");
        error.aborted = true;
        throw error;
      }

      const {
        file_id: sceneFileId,
        meta: { access_token: sceneFileToken }
      } = await this.upload(sceneBlob, undefined, abortController.signal);

      if (signal.aborted) {
        const error = new Error("Publish project aborted");
        error.aborted = true;
        throw error;
      }

      const sceneParams = {
        screenshot_file_id: screenshotId,
        screenshot_file_token: screenshotToken,
        model_file_id: glbId,
        model_file_token: glbToken,
        scene_file_id: sceneFileId,
        scene_file_token: sceneFileToken,
        allow_remixing: publishParams.allowRemixing,
        allow_promotion: publishParams.allowPromotion,
        name: publishParams.name,
        attributions: {
          creator: publishParams.creatorAttribution,
          content: publishParams.contentAttributions
        }
      };

      const token = this.getToken();

      const headers = {
        "content-type": "application/json",
        authorization: `Bearer ${token}`
      };
      const body = JSON.stringify({ scene: sceneParams });

      let sceneEndpoint = `https://${RETICULUM_SERVER}/api/v1/scenes`;
      let method = "POST";
      if (sceneId && !publishParams.isNewScene) {
        sceneEndpoint = `${sceneEndpoint}/${sceneId}`;
        method = "PATCH";
      }

      const resp = await this.fetch(sceneEndpoint, { method, headers, body });

      if (signal.aborted) {
        const error = new Error("Publish project aborted");
        error.aborted = true;
        throw error;
      }

      if (resp.status === 401) {
        return await new Promise((resolve, reject) => {
          showDialog(LoginDialog, {
            onSuccess: async () => {
              try {
                await this.publish(editor, showDialog, hideDialog);
                resolve();
              } catch (e) {
                reject(e);
              }
            }
          });
        });
      }

      if (resp.status !== 200) {
        throw new Error(`Scene creation failed. ${await resp.text()}`);
      }

      const json = await resp.json();
      const newSceneId = json.scenes[0].scene_id;
      const sceneUrl = this.getSceneUrl(newSceneId);
      editor.sceneUrl = sceneUrl;

      scene.setMetadata({ sceneUrl, sceneId: newSceneId });

      await this.saveProject(projectId, editor, abortController.signal, showDialog, hideDialog);

      if (signal.aborted) {
        const error = new Error("Publish project aborted");
        error.aborted = true;
        throw error;
      }

      showDialog(PublishedSceneDialog, {
        sceneName: sceneParams.name,
        screenshotUrl,
        sceneUrl,
        onConfirm: () => {
          this.emit("project-published");
          hideDialog();
        }
      });
    } catch (e) {
      throw e;
    } finally {
      if (screenshotUrl) {
        URL.revokeObjectURL(screenshotUrl);
      }
    }
  }

  upload(blob, onUploadProgress, signal) {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();

      const onAbort = () => {
        request.abort();
        const error = new Error("Upload aborted");
        error.name = "AbortError";
        error.aborted = true;
        reject(error);
      };

      if (signal) {
        signal.addEventListener("abort", onAbort);
      }

      request.open("post", `https://${RETICULUM_SERVER}/api/v1/media`, true);

      request.upload.addEventListener("progress", e => {
        if (onUploadProgress) {
          onUploadProgress(e.loaded / e.total);
        }
      });

      request.addEventListener("error", e => {
        if (signal) {
          signal.removeEventListener("abort", onAbort);
        }
        reject(new Error(`Upload failed ${e}`));
      });

      request.addEventListener("load", () => {
        if (signal) {
          signal.removeEventListener("abort", onAbort);
        }

        if (request.status < 300) {
          const response = JSON.parse(request.responseText);
          resolve(response);
        } else {
          reject(new Error(`Upload failed ${request.statusText}`));
        }
      });

      const formData = new FormData();
      formData.set("media", blob);

      request.send(formData);
    });
  }

  async getProjectAssets(projectId, params) {
    const token = this.getToken();
    const projectAssetsEndpoint = `https://${RETICULUM_SERVER}/api/v1/projects/${projectId}/assets`;
    const headers = {
      "content-type": "application/json",
      authorization: `Bearer ${token}`
    };
    const resp = await this.fetch(projectAssetsEndpoint, { headers });
    const json = await resp.json();

    // TODO: Filter assets server-side
    let assets = json.assets;

    if (params.type) {
      assets = assets.filter(a => a.type === params.type);
    }

    if (params.query) {
      const options = {
        shouldSort: true,
        threshold: 0.6,
        location: 0,
        distance: 100,
        maxPatternLength: 32,
        minMatchCharLength: 1,
        keys: ["name"]
      };
      const fuse = new Fuse(assets, options);
      assets = fuse.search(params.query);
    }

    assets = assets.map(asset => ({
      id: asset.asset_id,
      name: asset.name,
      url: asset.file_url,
      type: asset.type,
      attributions: {},
      images: {
        preview: { url: asset.thumbnail_url }
      }
    }));

    return { results: assets, nextCursor: 0 };
  }

  uploadAssets(editor, files, onProgress, signal) {
    return this._uploadAssets(`https://${RETICULUM_SERVER}/api/v1/assets`, editor, files, onProgress, signal);
  }

  uploadProjectAssets(editor, projectId, files, onProgress, signal) {
    return this._uploadAssets(
      `https://${RETICULUM_SERVER}/api/v1/projects/${projectId}/assets`,
      editor,
      files,
      onProgress,
      signal
    );
  }

  async _uploadAssets(endpoint, editor, files, onProgress, signal) {
    const assets = [];

    for (const file of Array.from(files)) {
      if (signal.aborted) {
        break;
      }

      const abortController = new AbortController();
      const onAbort = () => abortController.abort();
      signal.addEventListener("abort", onAbort);

      const asset = await this._uploadAsset(
        endpoint,
        editor,
        file,
        progress => onProgress(assets.length + 1, files.length, progress),
        abortController.signal
      );

      assets.push(asset);
      signal.removeEventListener("abort", onAbort);

      if (signal.aborted) {
        break;
      }
    }

    return assets;
  }

  uploadAsset(editor, file, onProgress, signal) {
    return this._uploadAsset(`https://${RETICULUM_SERVER}/api/v1/assets`, editor, file, onProgress, signal);
  }

  uploadProjectAsset(editor, projectId, file, onProgress, signal) {
    return this._uploadAsset(
      `https://${RETICULUM_SERVER}/api/v1/projects/${projectId}/assets`,
      editor,
      file,
      onProgress,
      signal
    );
  }

  lastUploadAssetRequest = 0;

  async _uploadAsset(endpoint, editor, file, onProgress, signal) {
    const thumbnailBlob = await editor.generateFileThumbnail(file);

    const {
      file_id: thumbnail_file_id,
      meta: { access_token: thumbnail_access_token }
    } = await this.upload(thumbnailBlob, undefined, signal);

    const {
      file_id: asset_file_id,
      meta: { access_token: asset_access_token }
    } = await this.upload(file, onProgress, signal);

    const delta = Date.now() - this.lastUploadAssetRequest;

    if (delta < 1100) {
      await new Promise(resolve => setTimeout(resolve, 1100 - delta));
    }

    const token = this.getToken();

    const headers = {
      "content-type": "application/json",
      authorization: `Bearer ${token}`
    };

    const body = JSON.stringify({
      asset: {
        name: file.name,
        file_id: asset_file_id,
        access_token: asset_access_token,
        thumbnail_file_id,
        thumbnail_access_token
      }
    });

    const resp = await this.fetch(endpoint, { method: "POST", headers, body, signal });

    const json = await resp.json();

    const asset = json.assets[0];

    this.lastUploadAssetRequest = Date.now();

    return {
      id: asset.asset_id,
      name: asset.name,
      url: asset.file_url,
      type: asset.type,
      attributions: {},
      images: {
        preview: { url: asset.thumbnail_url }
      }
    };
  }

  async addAssetToProject(projectId, assetId) {
    const token = this.getToken();

    const headers = {
      "content-type": "application/json",
      authorization: `Bearer ${token}`
    };

    const body = JSON.stringify({
      asset_id: assetId
    });

    const projectAssetsEndpoint = `https://${RETICULUM_SERVER}/api/v1/projects/${projectId}/assets`;

    const resp = await this.fetch(projectAssetsEndpoint, { method: "POST", headers, body });

    return resp.ok;
  }

  async deleteAsset(assetId) {
    const token = this.getToken();

    const headers = {
      "content-type": "application/json",
      authorization: `Bearer ${token}`
    };

    const assetEndpoint = `https://${RETICULUM_SERVER}/api/v1/assets/${assetId}`;

    const resp = await this.fetch(assetEndpoint, { method: "DELETE", headers });

    if (resp.status === 401) {
      throw new Error("Not authenticated");
    }

    if (resp.status !== 200) {
      throw new Error(`Asset deletion failed. ${await resp.text()}`);
    }

    return true;
  }

  async deleteProjectAsset(projectId, assetId) {
    const token = this.getToken();

    const headers = {
      "content-type": "application/json",
      authorization: `Bearer ${token}`
    };

    const projectAssetEndpoint = `https://${RETICULUM_SERVER}/api/v1/projects/${projectId}/assets/${assetId}`;

    const resp = await this.fetch(projectAssetEndpoint, { method: "DELETE", headers });

    if (resp.status === 401) {
      throw new Error("Not authenticated");
    }

    if (resp.status !== 200) {
      throw new Error(`Project Asset deletion failed. ${await resp.text()}`);
    }

    return true;
  }

  setUserInfo(userInfo) {
    localStorage.setItem("spoke-user-info", JSON.stringify(userInfo));
  }

  getUserInfo() {
    return JSON.parse(localStorage.getItem("spoke-user-info"));
  }

  async fetch(url, options) {
    const res = await fetch(url, options);

    if (res.ok) {
      return res;
    }

    const err = new Error("Network Error: " + res.statusText);
    err.response = res;
    throw err;
  }
}
