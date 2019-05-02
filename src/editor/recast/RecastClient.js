import THREE from "../../vendor/three";
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

  async buildNavMesh(verts, faces, params, generateHeightfield) {
    if (this.working) {
      throw new Error("Already building nav mesh");
    }

    const navMeshPromise = new Promise((resolve, reject) => {
      let onMessage = null;
      let onError = null;

      const cleanUp = () => {
        this.worker.removeEventListener("message", onMessage);
        this.worker.removeEventListener("message", onError);
      };

      onMessage = event => {
        resolve(event.data);
        cleanUp();
      };

      onError = error => {
        reject(error);
        cleanUp();
      };

      this.worker.addEventListener("message", onMessage);
      this.worker.addEventListener("error", onError);
    });

    this.worker.postMessage(
      {
        verts,
        faces,
        params,
        generateHeightfield
      },
      [verts.buffer, faces.buffer]
    );

    const result = await navMeshPromise;

    if (result.error) {
      throw new Error(statuses[result.status] || result.error);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.addAttribute("position", new THREE.Float32BufferAttribute(result.verts, 3));
    geometry.setIndex(new THREE.Uint16BufferAttribute(result.indices, 1));

    return { navmesh: geometry, heightfield: result.heightfield };
  }
}
