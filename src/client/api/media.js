import SketchfabZipWorker from "./sketchfab-zip.worker.js";

const resolveUrlCache = new Map();

async function resolveUrl(url, index) {
  const cacheKey = `${url}|${index}`;
  if (resolveUrlCache.has(cacheKey)) return resolveUrlCache.get(cacheKey);
  const apiUrl = new URL("/api/media", window.location);
  const queryParams = new URLSearchParams([["url", url]]);
  if (index) {
    queryParams.append("index", index);
  }
  apiUrl.search = queryParams;
  const response = await fetch(apiUrl);
  const resolved = await response.json();
  resolveUrlCache.set(cacheKey, resolved);
  return resolved;
}

// thanks to https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
function b64EncodeUnicode(str) {
  // first we use encodeURIComponent to get percent-encoded UTF-8, then we convert the percent-encodings
  // into raw bytes which can be fed into btoa.
  const CHAR_RE = /%([0-9A-F]{2})/g;
  return btoa(encodeURIComponent(str).replace(CHAR_RE, (_, p1) => String.fromCharCode("0x" + p1)));
}

function proxiedUrlFor(url, index) {
  // farspark doesn't know how to read '=' base64 padding characters
  const base64Url = b64EncodeUnicode(url).replace(/=+$/g, "");
  // translate base64 + to - and / to _ for URL safety
  const encodedUrl = base64Url.replace(/\+/g, "-").replace(/\//g, "_");
  const method = index != null ? "extract" : "raw";
  return new URL(`/api/farspark/0/${method}/0/0/0/${index || 0}/${encodedUrl}`, window.location).href;
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

export async function getContentType(url) {
  const result = await resolveUrl(url);
  const canonicalUrl = result.origin;
  const accessibleUrl = proxiedUrlFor(canonicalUrl);

  return (
    (result.meta && result.meta.expected_content_type) ||
    guessContentType(canonicalUrl) ||
    (await fetchContentType(accessibleUrl))
  );
}

export async function farsparkUrl(src, index) {
  const href = new URL(src, window.location).href;
  const result = await resolveUrl(href);
  const canonicalUrl = result.origin;
  const accessibleUrl = proxiedUrlFor(canonicalUrl, index);

  const contentType =
    (result.meta && result.meta.expected_content_type) ||
    guessContentType(canonicalUrl) ||
    (await fetchContentType(accessibleUrl));

  if (contentType === "model/gltf+zip") {
    const files = await getFilesFromSketchfabZip(accessibleUrl);
    return { canonicalUrl, accessibleUrl: files["scene.gtlf"], contentType };
  }

  return { canonicalUrl, accessibleUrl, contentType };
}
