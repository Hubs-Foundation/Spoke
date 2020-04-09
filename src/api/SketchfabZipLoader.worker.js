// Keep in sync with https://github.com/mozilla/hubs/blob/master/src/workers/sketchfab-zip.worker.js
import JSZip from "jszip";

async function fetchZipAndGetBlobs(src) {
  const zip = await fetch(src)
    .then(r => r.blob())
    .then(JSZip.loadAsync);

  // Rewrite any url refferences in the GLTF to blob urls
  const fileMap = {};
  const files = Object.values(zip.files);
  const fileBlobs = await Promise.all(files.map(f => f.async("blob")));
  for (let i = 0; i < fileBlobs.length; i++) {
    const name = files[i].name;
    const blob = fileBlobs[i];

    const url = URL.createObjectURL(blob);

    fileMap[name] = {
      url,
      size: blob.size,
      type: blob.type
    };
  }

  const gltfJson = JSON.parse(await zip.file("scene.gltf").async("text"));
  gltfJson.buffers && gltfJson.buffers.forEach(b => (b.uri = fileMap[b.uri].url));
  gltfJson.images && gltfJson.images.forEach(i => (i.uri = fileMap[i.uri].url));

  const blob = new Blob([JSON.stringify(gltfJson, null, 2)], { type: "model/gltf+json" });

  const url = URL.createObjectURL(blob);

  fileMap["scene.gtlf"] = {
    url,
    size: blob.size,
    type: blob.type
  };

  return fileMap;
}

self.onmessage = async e => {
  try {
    const fileMap = await fetchZipAndGetBlobs(e.data);
    self.postMessage([true, fileMap]);
  } catch (e) {
    self.postMessage([false, e.message]);
  }
  delete self.onmessage;
};
