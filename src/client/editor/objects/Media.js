import THREE from "../../vendor/three";
import loadGLTF from "../utils/loadGLTF";
import cloneObject3D from "../utils/cloneObject3D";
import getFilesFromSketchfabZip from "../workers/getFilesFromSketchfabZip";

const resolveUrlCache = new Map();

export const resolveUrl = async (url, index) => {
  const cacheKey = `${url}|${index}`;
  if (resolveUrlCache.has(cacheKey)) return resolveUrlCache.get(cacheKey);
  const resolved = await fetch("/api/media", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ media: { url, index } })
  }).then(r => r.json());
  resolveUrlCache.set(cacheKey, resolved);
  return resolved;
};

const fetchContentType = url => {
  return fetch(url, { method: "HEAD" }).then(r => r.headers.get("content-type"));
};

// thanks to https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
function b64EncodeUnicode(str) {
  // first we use encodeURIComponent to get percent-encoded UTF-8, then we convert the percent-encodings
  // into raw bytes which can be fed into btoa.
  const CHAR_RE = /%([0-9A-F]{2})/g;
  return btoa(encodeURIComponent(str).replace(CHAR_RE, (_, p1) => String.fromCharCode("0x" + p1)));
}

export const proxiedUrlFor = (url, index) => {
  // farspark doesn't know how to read '=' base64 padding characters
  const base64Url = b64EncodeUnicode(url).replace(/=+$/g, "");
  // translate base64 + to - and / to _ for URL safety
  const encodedUrl = base64Url.replace(/\+/g, "-").replace(/\//g, "_");
  const method = index != null ? "extract" : "raw";
  return new URL(`/api/farspark/0/${method}/0/0/0/${index || 0}/${encodedUrl}`, window.location).href;
};

const commonKnownContentTypes = {
  gltf: "model/gltf",
  glb: "model/gltf-binary",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  pdf: "application/pdf",
  mp4: "video/mp4",
  mp3: "audio/mpeg"
};

export const guessContentType = url => {
  const extension = new URL(url).pathname.split(".").pop();
  return commonKnownContentTypes[extension];
};

/**
 * Create video element to be used as a texture.
 *
 * @param {string} src - Url to a video file.
 * @returns {Element} Video element.
 */
function createVideoEl(src) {
  const videoEl = document.createElement("video");
  videoEl.setAttribute("playsinline", "");
  videoEl.setAttribute("webkit-playsinline", "");
  videoEl.preload = "auto";
  videoEl.loop = true;
  videoEl.crossOrigin = "anonymous";
  videoEl.src = src;
  return videoEl;
}

function createVideoTexture(url) {
  return new Promise((resolve, reject) => {
    const videoEl = createVideoEl(url);

    const texture = new THREE.VideoTexture(videoEl);
    texture.minFilter = THREE.LinearFilter;
    texture.encoding = THREE.sRGBEncoding;

    videoEl.addEventListener("loadeddata", () => resolve(texture), { once: true });
    videoEl.onerror = reject;
  });
}

const textureLoader = new THREE.TextureLoader();
textureLoader.setCrossOrigin("anonymous");

function createImageTexture(url) {
  return new Promise((resolve, reject) => {
    textureLoader.load(
      url,
      texture => {
        texture.encoding = THREE.sRGBEncoding;
        texture.minFilter = THREE.LinearFilter;
        resolve(texture);
      },
      null,
      function(xhr) {
        reject(`'${url}' could not be fetched (Error code: ${xhr.status}; Response: ${xhr.statusText})`);
      }
    );
  });
}

function createPlaneMesh(texture) {
  const material = new THREE.MeshBasicMaterial();
  material.side = THREE.DoubleSide;
  material.transparent = true;
  material.map = texture;
  material.needsUpdate = true;

  const geometry = new THREE.PlaneGeometry();
  return new THREE.Mesh(geometry, material);
}

function fitToTexture(object3D, texture) {
  const ratio =
    (texture.image.videoHeight || texture.image.height || 1.0) /
    (texture.image.videoWidth || texture.image.width || 1.0);
  const width = Math.min(1.0, 1.0 / ratio);
  const height = Math.min(1.0, ratio);
  object3D.scale.set(width, height, 1);
}

export default class Media extends THREE.Object3D {
  constructor() {
    super();
    this.type = "Media";

    this.media = null;
    this.src = "";
  }

  async setMedia(src) {
    const href = new URL(src, window.location).href;

    if (this.media) {
      this.remove(this.media);
    }

    const result = await resolveUrl(href);
    const canonicalUrl = result.origin;
    const accessibleUrl = proxiedUrlFor(canonicalUrl);
    const contentType =
      (result.meta && result.meta.expected_content_type) ||
      guessContentType(canonicalUrl) ||
      (await fetchContentType(accessibleUrl));

    if (contentType.startsWith("video/") || contentType.startsWith("audio/")) {
      const videoTexture = await createVideoTexture(accessibleUrl);
      const videoEl = videoTexture.image;
      videoEl.currentTime = videoEl.duration / 2;
      const videoMesh = createPlaneMesh(videoTexture);
      fitToTexture(videoMesh, videoTexture);
      this.media = videoMesh;
      this.add(this.media);
    } else if (contentType.startsWith("image/")) {
      const imageTexture = await createImageTexture(accessibleUrl);
      const imageMesh = createPlaneMesh(imageTexture);
      fitToTexture(imageMesh, imageTexture);
      this.media = imageMesh;
      this.add(this.media);
    } else if (contentType.startsWith("application/pdf")) {
      const pdfUrl = proxiedUrlFor(canonicalUrl, 0);
      const pdfTexture = await createImageTexture(pdfUrl);
      const pdfMesh = createPlaneMesh(pdfTexture);
      fitToTexture(pdfMesh, pdfTexture);
      this.media = pdfMesh;
      this.add(this.media);
    } else if (
      contentType.includes("application/octet-stream") ||
      contentType.includes("x-zip-compressed") ||
      contentType.startsWith("model/gltf")
    ) {
      let gltfUrl = accessibleUrl;

      if (contentType === "model/gltf+zip") {
        const files = await getFilesFromSketchfabZip(accessibleUrl);
        gltfUrl = files["scene.gtlf"];
      }

      const { scene } = await loadGLTF(gltfUrl);
      this.media = scene;
      this.add(this.media);
    }

    this.src = src;
  }

  copy(source, recursive) {
    super.copy(source, false);

    this.src = source.src;

    for (const child of source.children) {
      let clonedChild;

      if (child === source.media) {
        clonedChild = cloneObject3D(child);
        this.media = clonedChild;
      } else if (recursive === true) {
        clonedChild = child.clone();
      }

      if (clonedChild) {
        this.add(clonedChild);
      }
    }

    return this;
  }
}
