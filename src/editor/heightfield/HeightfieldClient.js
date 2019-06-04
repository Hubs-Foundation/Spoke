import HeightfieldWorker from "./heightfield.worker";

export default class HeightfieldClient {
  constructor() {
    this.worker = new HeightfieldWorker();
    this.working = false;
  }

  async buildHeightfield(geometry, params, signal) {
    if (this.working) {
      throw new Error("Already building heightfield");
    }

    this.working = true;

    if (geometry.attributes.position.count === 0) {
      this.working = false;
      return null;
    }

    const heightfieldPromise = new Promise((resolve, reject) => {
      let onMessage = null;
      let onError = null;
      let onAbort = null;

      const cleanUp = () => {
        signal.removeEventListener("abort", onAbort);
        this.worker.removeEventListener("message", onMessage);
        this.worker.removeEventListener("message", onError);
        this.working = false;
      };

      onMessage = event => {
        resolve(event.data);
        cleanUp();
      };

      onAbort = () => {
        this.worker.terminate();
        this.worker = new HeightfieldWorker();
        const error = new Error("Canceled heightfield generation.");
        error.aborted = true;
        reject(error);
        cleanUp();
      };

      onError = error => {
        reject(error);
        cleanUp();
      };

      signal.addEventListener("abort", onAbort);
      this.worker.addEventListener("message", onMessage);
      this.worker.addEventListener("error", onError);
    });

    const verts = geometry.attributes.position.array;

    this.worker.postMessage({
      verts,
      params
    });
    const result = await heightfieldPromise;

    if (result.error) {
      throw new Error(result.error);
    }

    return result.heightfield;
  }
}
