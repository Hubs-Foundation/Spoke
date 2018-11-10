import SketchfabZipWorker from "./sketchfab-zip.worker.js";

export default function getFilesFromSketchfabZip(src) {
  return new Promise((resolve, reject) => {
    const worker = new SketchfabZipWorker();
    worker.onmessage = e => {
      const [success, fileMapOrError] = e.data;
      (success ? resolve : reject)(fileMapOrError);
    };
    worker.postMessage(src);
  });
}
