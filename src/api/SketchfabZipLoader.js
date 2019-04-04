import SketchfabZipWorker from "./SketchfabZipLoader.worker.js";

export async function getFilesFromSketchfabZip(src) {
  return new Promise(async (resolve, reject) => {
    const worker = new SketchfabZipWorker();
    worker.onmessage = e => {
      const [success, fileMapOrError] = e.data;
      (success ? resolve : reject)(fileMapOrError);
    };
    worker.postMessage(src);
  });
}
