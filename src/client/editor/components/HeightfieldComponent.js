import THREE from "../three";
import { types } from "./utils";
import BaseComponent from "./BaseComponent";

async function yieldFor(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default class HeightfieldComponent extends BaseComponent {
  static componentName = "heightfield";

  static showProps = false;

  static schema = [
    { name: "data", type: types.array, hidden: true },
    { name: "offset", type: types.vector },
    { name: "distance", type: types.number }
  ];

  constructor(node, object) {
    super(node, object);
    // Never save the heightfield component, since it's auto-generated from the nav-mesh on publish.
    this.shouldSave = false;
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
