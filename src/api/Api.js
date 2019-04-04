import EventEmitter from "eventemitter3";
import { Socket } from "phoenix";
import uuid from "uuid/v4";
import AuthContainer from "./AuthContainer";
import LoginDialog from "./LoginDialog";
import PublishDialog from "./PublishDialog";
import ProgressDialog from "../ui/dialogs/ProgressDialog";
import Fuse from "fuse.js";
import jwtDecode from "jwt-decode";

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

async function getFilesFromSketchfabZip(src) {
  const SketchfabZipWorker = await import(/* webpackChunkName: "sketchfab-zip-worker", webpackPrefetch: true */ "./sketchfab-zip.worker.js");
  return new Promise(async (resolve, reject) => {
    const worker = new SketchfabZipWorker();
    worker.onmessage = e => {
      const [success, fileMapOrError] = e.data;
      (success ? resolve : reject)(fileMapOrError);
    };
    worker.postMessage(src);
  });
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

  async authenticate(email) {
    const reticulumServer = RETICULUM_SERVER;
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
      channel.on("auth_credentials", ({ credentials }) => {
        localStorage.setItem(LOCAL_STORE_KEY, credentials);
        resolve();
      })
    );

    channel.push("auth_request", { email, origin: "spoke" });

    return authComplete;
  }

  isAuthenticated() {
    return localStorage.getItem(LOCAL_STORE_KEY) !== null;
  }

  getAccountId() {
    const credentials = localStorage.getItem(LOCAL_STORE_KEY);
    return jwtDecode(credentials).sub;
  }

  logout() {
    localStorage.removeItem(LOCAL_STORE_KEY);
  }

  async getProjects() {
    const credentials = localStorage.getItem(LOCAL_STORE_KEY);

    const headers = {
      "content-type": "application/json",
      authorization: `Bearer ${credentials}`
    };

    const response = await this.fetch(`https://${RETICULUM_SERVER}/api/v1/projects`, { headers });

    const json = await response.json();

    if (!Array.isArray(json.projects)) {
      throw new Error(`Error fetching projects: ${json.error || "Unknown error."}`);
    }

    return json.projects.map(project => ({
      projectId: project.project_id,
      name: project.name,
      thumbnailUrl: project.thumbnail_url
    }));
  }

  async getProject(projectId) {
    const credentials = localStorage.getItem(LOCAL_STORE_KEY);

    const headers = {
      "content-type": "application/json",
      authorization: `Bearer ${credentials}`
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
      const files = await getFilesFromSketchfabZip(accessibleUrl);
      return { canonicalUrl, accessibleUrl: files["scene.gtlf"], contentType, files };
    }

    return { canonicalUrl, accessibleUrl, contentType };
  }

  async searchMedia(source, params, cursor, signal) {
    const url = new URL(`https://${RETICULUM_SERVER}/api/v1/media/search`);

    const searchParams = url.searchParams;

    searchParams.set("source", source);

    if (source === "assets") {
      searchParams.set("user", this.getAccountId());
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

    const credentials = localStorage.getItem(LOCAL_STORE_KEY);

    const headers = {
      "content-type": "application/json",
      authorization: `Bearer ${credentials}`
    };

    const resp = await this.fetch(url, { headers, signal });

    const json = await resp.json();

    return {
      results: json.entries,
      suggestions: json.suggestions,
      nextCursor: json.meta.next_cursor
    };
  }

  async createProject(projectName) {
    const credentials = localStorage.getItem(LOCAL_STORE_KEY);

    const headers = {
      "content-type": "application/json",
      authorization: `Bearer ${credentials}`
    };

    const body = JSON.stringify({
      project: {
        name: projectName
      }
    });

    const projectEndpoint = `https://${RETICULUM_SERVER}/api/v1/projects`;

    const resp = await this.fetch(projectEndpoint, { method: "POST", headers, body });

    if (resp.status === 401) {
      throw new Error("Not authenticated");
    }

    if (resp.status !== 200) {
      throw new Error(`Project creation failed. ${await resp.text()}`);
    }

    const json = await resp.json();

    return { projectId: json.project_id };
  }

  async saveProject(projectId, editor, showDialog, hideDialog) {
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

    const credentials = localStorage.getItem(LOCAL_STORE_KEY);

    const headers = {
      "content-type": "application/json",
      authorization: `Bearer ${credentials}`
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

    const resp = await this.fetch(projectEndpoint, { method: "PATCH", headers, body });

    if (resp.status === 401) {
      return await new Promise((resolve, reject) => {
        showDialog(LoginDialog, {
          onSuccess: async () => {
            try {
              await this.saveProject(projectId, editor, showDialog, hideDialog);
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
  }

  async publishProject(projectId, editor, showDialog, hideDialog) {
    let screenshotURL;

    try {
      const scene = editor.scene;

      // Save the scene if it has been modified.
      if (editor.sceneModified) {
        await this.saveProject(projectId, editor, showDialog, hideDialog);
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
      screenshotURL = URL.createObjectURL(screenshotBlob);

      // Gather all the info needed to display the publish dialog
      const { name, creatorAttribution, description, allowRemixing, allowPromotion, sceneId } = scene.metadata;
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
          screenshotURL,
          contentAttributions,
          initialName: name || editor.scene.name,
          initialCreatorAttribution,
          initialDescription: description,
          initialAllowRemixing: allowRemixing,
          initialAllowPromotion: allowPromotion,
          isNewScene: !sceneId,
          onCancel: () => resolve(null),
          onPublish: resolve
        });
      });

      // User clicked cancel
      if (!publishParams) {
        URL.revokeObjectURL(screenshotURL);
        hideDialog();
        return;
      }

      // Update the scene with the metadata from the publishDialog
      scene.setMetadata({
        name: publishParams.name,
        creatorAttribution: publishParams.creatorAttribution,
        description: publishParams.description,
        allowRemixing: publishParams.allowRemixing,
        allowPromotion: publishParams.allowPromotion,
        previewCameraTransform: screenshotCameraTransform
      });

      // Save the creatorAttribution to localStorage so that the user doesn't have to input it again
      this.setUserInfo({ creatorAttribution: publishParams.creatorAttribution });

      showDialog(ProgressDialog, {
        title: "Publishing Scene",
        message: "Exporting scene..."
      });

      // Clone the existing scene, process it for exporting, and then export as a glb blob
      const glbBlob = await editor.exportScene();

      // Serialize Spoke scene
      const serializedScene = editor.scene.serialize();
      const sceneBlob = new Blob([JSON.stringify(serializedScene)], { type: "application/json" });

      showDialog(ProgressDialog, {
        title: "Publishing Scene",
        message: `${sceneId ? "updating" : "creating"} scene`
      });

      const size = glbBlob.size / 1024 / 1024;
      const maxSize = this.maxUploadSize;
      if (size > maxSize) {
        throw new Error(`Scene is too large (${size.toFixed(2)}MB) to publish. Maximum size is ${maxSize}MB.`);
      }

      showDialog(ProgressDialog, {
        title: "Publishing Scene",
        message: "Uploading thumbnail..."
      });

      // Upload the screenshot file
      const {
        file_id: screenshotId,
        meta: { access_token: screenshotToken }
      } = await this.upload(screenshotBlob);

      const {
        file_id: glbId,
        meta: { access_token: glbToken }
      } = await this.upload(glbBlob, uploadProgress => {
        showDialog(ProgressDialog, {
          title: "Publishing Scene",
          message: `Uploading scene: ${Math.floor(uploadProgress * 100)}%`
        });
      });

      const {
        file_id: sceneFileId,
        meta: { access_token: sceneFileToken }
      } = await this.upload(sceneBlob);

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
        description: publishParams.description,
        attributions: {
          creator: publishParams.creatorAttribution,
          content: publishParams.contentAttributions
        }
      };

      const credentials = localStorage.getItem(LOCAL_STORE_KEY);

      const headers = {
        "content-type": "application/json",
        authorization: `Bearer ${credentials}`
      };
      const body = JSON.stringify({ scene: sceneParams });

      let sceneEndpoint = `https://${RETICULUM_SERVER}/api/v1/scenes`;
      let method = "POST";
      if (sceneId) {
        sceneEndpoint = `${sceneEndpoint}/${sceneId}`;
        method = "PATCH";
      }

      const resp = await this.fetch(sceneEndpoint, { method, headers, body });

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
      let sceneUrl = json.scenes[0].url;

      if (process.env.HUBS_SERVER) {
        if (process.env.NODE_ENV === "development") {
          sceneUrl = `https://${process.env.HUBS_SERVER}/scene.html?scene_id=${newSceneId}`;
        } else {
          sceneUrl = `https://${process.env.HUBS_SERVER}/scenes/${newSceneId}`;
        }
      }

      scene.setMetadata({ sceneUrl, sceneId: newSceneId });

      await this.saveProject(projectId, editor, showDialog, hideDialog);

      showDialog(PublishDialog, {
        screenshotURL,
        initialName: name,
        initialCreatorAttribution: creatorAttribution,
        published: true,
        sceneUrl
      });
    } catch (e) {
      throw e;
    } finally {
      if (screenshotURL) {
        URL.revokeObjectURL(screenshotURL);
      }
    }
  }

  upload(blob, onUploadProgress) {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();

      request.open("post", `https://${RETICULUM_SERVER}/api/v1/media`, true);

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

      const formData = new FormData();
      formData.set("media", blob);

      request.send(formData);
    });
  }

  async getProjectAssets(projectId, params) {
    const credentials = localStorage.getItem(LOCAL_STORE_KEY);
    const projectAssetsEndpoint = `https://${RETICULUM_SERVER}/api/v1/projects/${projectId}/assets`;
    const headers = {
      "content-type": "application/json",
      authorization: `Bearer ${credentials}`
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

  lastUploadProjectAssetRequest = 0;

  async uploadProjectAsset(projectId, editor, file, showDialog, hideDialog) {
    const thumbnailTask = (async () => {
      const blob = await editor.generateFileThumbnail(file);
      return this.upload(blob);
    })();

    const uploadTask = this.upload(file, uploadProgress => {
      showDialog(ProgressDialog, {
        title: "Uploading File",
        message: `Uploading file: ${Math.floor(uploadProgress * 100)}%`
      });
    });

    const [
      {
        file_id: thumbnail_file_id,
        meta: { access_token: thumbnail_access_token }
      },
      {
        file_id: asset_file_id,
        meta: { access_token: asset_access_token }
      }
    ] = await Promise.all([thumbnailTask, uploadTask]);

    const delta = Date.now() - this.lastUploadProjectAssetRequest;

    if (delta < 1100) {
      await new Promise(resolve => setTimeout(resolve, 1100 - delta));
    }

    const credentials = localStorage.getItem(LOCAL_STORE_KEY);

    const headers = {
      "content-type": "application/json",
      authorization: `Bearer ${credentials}`
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

    const projectAssetsEndpoint = `https://${RETICULUM_SERVER}/api/v1/projects/${projectId}/assets`;

    const resp = await this.fetch(projectAssetsEndpoint, { method: "POST", headers, body });

    const json = await resp.json();

    hideDialog();

    const asset = json.assets[0];

    this.lastUploadProjectAssetRequest = Date.now();

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
