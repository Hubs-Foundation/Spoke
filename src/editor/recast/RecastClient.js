import { BufferGeometry, Float32BufferAttribute, Uint16BufferAttribute } from "three";
import RecastWorker from "./recast.worker";

const statuses = [
  "success",
  "unknown error",
  "out of memory error",
  "invalid navmesh data",
  "error generating navmesh heightfield",
  "error rasterizing navmesh",
  "error generating navmesh compact heightfield",
  "error eroding navmesh walkable area",
  "error generating navmesh distance field",
  "error generating navmesh regions",
  "error generating monotone navmesh regions",
  "error generating navmesh layer regions",
  "error generating navmesh contours",
  "error generating navmesh data",
  "error generating navmesh detail geometry"
];

export default class RecastClient {
  constructor() {
    this.worker = new RecastWorker();
    this.working = false;
  }

  async buildNavMesh(geometry, params, signal) {
    if (this.working) {
      throw new Error("Already building nav mesh");
    }

    this.working = true;

    if (geometry.attributes.position.count === 0) {
      this.working = false;
      return geometry;
    }

    const verts = geometry.attributes.position.array;
    const faces = new Int32Array(verts.length / 3);
    for (let i = 0; i < faces.length; i++) {
      faces[i] = i;
    }

    const navMeshPromise = new Promise((resolve, reject) => {
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
        this.worker = new RecastWorker();
        const error = new Error("Canceled navmesh generation.");
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

    this.worker.postMessage(
      {
        verts,
        faces,
        params
      },
      [verts.buffer, faces.buffer]
    );

    const result = await navMeshPromise;

    if (result.error) {
      throw new Error(statuses[result.status] || result.error);
    }

    const navmesh = new BufferGeometry();
    navmesh.addAttribute("position", new Float32BufferAttribute(result.verts, 3));
    navmesh.setIndex(new Uint16BufferAttribute(result.indices, 1));

    return navmesh;
  }
}
