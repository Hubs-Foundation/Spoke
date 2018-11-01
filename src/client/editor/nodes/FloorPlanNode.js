import EditorNodeMixin from "./EditorNodeMixin";
import THREE from "../three";

async function yieldFor(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default class FloorPlanNode extends EditorNodeMixin(THREE.Object3D) {
  static nodeName = "Floor Plan";

  static shouldDeserialize(entityJson) {
    const gltfModelComponent = entityJson.components.find(c => c.name === "gltf-model");
    const navMeshComponent = entityJson.components.find(c => c.name === "nav-mesh");
    return gltfModelComponent && navMeshComponent;
  }

  static async generateHeightfield(mesh) {
    mesh.geometry.computeBoundingBox();
    const size = new THREE.Vector3();
    mesh.geometry.boundingBox.getSize(size);

    const maxSide = Math.max(size.x, size.z);
    const distance = Math.max(0.25, Math.pow(maxSide, 1 / 2) / 10);
    const resolution = Math.ceil(maxSide / distance);

    const data = [];

    const down = new THREE.Vector3(0, -1, 0);
    const position = new THREE.Vector3();
    const raycaster = new THREE.Raycaster();
    const intersections = [];

    const offsetX = -size.x / 2;
    const offsetZ = -size.z / 2;

    let min = Infinity;
    for (let z = 0; z < resolution; z++) {
      data[z] = [];
      for (let x = 0; x < resolution; x++) {
        position.set(offsetX + x * distance, size.y / 2, offsetZ + z * distance);
        raycaster.set(position, down);
        intersections.length = 0;
        raycaster.intersectObject(mesh, false, intersections);
        let val;
        if (intersections.length) {
          val = -intersections[0].distance + size.y / 2;
        } else {
          val = -size.y / 2;
        }
        data[z][x] = val;
        if (val < min) {
          min = data[z][x];
        }
      }
      // Yield the main thread periodically, so that the browser doesn't lock up
      await yieldFor(5);
    }

    const offset = new THREE.Vector3(-size.x / 2, min, -size.z / 2);

    // Cannon.js will be consuming this data and it doesn't like heightfields with negative heights.
    for (let z = 0; z < resolution; z++) {
      for (let x = 0; x < resolution; x++) {
        data[z][x] -= min;
      }
    }

    return { offset, distance, data };
  }
}
