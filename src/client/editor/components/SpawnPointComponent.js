import THREE from "../three";
import BaseComponent from "./BaseComponent";
import spawnPointModelUrl from "../../assets/spawn-point.glb";

const spawnPointModel = new Promise((resolve, reject) => {
  const loader = new THREE.GLTFLoader();
  loader.load(spawnPointModelUrl, resolve, null, reject);
});

export default class SpawnPointComponent extends BaseComponent {
  static componentName = "spawn-point";

  static componentDescription =
    "A point where people will appear when they enter your scene.\nThe icon in the Viewport represents the actual size of an avatar.";

  static iconClassName = "fa-street-view";

  static schema = [];

  static async inflate(node, _props) {
    const spawnPoint = (await spawnPointModel).scene.clone();
    spawnPoint.rotation.y = Math.PI;
    spawnPoint.traverse(obj => {
      if (!obj.isMesh) return;
      obj.userData._dontExport = true;
      obj.layers.set(1);
      Object.defineProperty(obj.userData, "_selectionRoot", {
        value: node,
        configurable: true,
        enumerable: false
      });
    });
    const component = await this._getOrCreateComponent(node, _props, spawnPoint);
    node.add(spawnPoint);
    return component;
  }
}
