import THREE from "../three";
import TransformComponent from "./TransformComponent";

export default class BoxColliderComponent extends TransformComponent {
  static componentName = "box-collider";

  static _geometry = new THREE.BoxBufferGeometry();

  static _material = new THREE.Material();

  static canAdd = true;

  static canRemove = true;

  // Since the box collider props just mirror the node's transform, we hide the props.
  static showProps = false;

  static dontExportProps = false;

  static async inflate(node, _props) {
    const boxMesh = new THREE.Mesh(this._geometry, this._material);
    const box = new THREE.BoxHelper(boxMesh, 0x00ff00);
    box.userData._selectionRoot = node;
    Object.defineProperty(box.userData, "_selectionRoot", { value: node, configurable: true, enumerable: false });
    box.userData._dontExport = true;
    box.userData._dontShowInHierarchy = true;
    box.userData._inflated = true;
    const component = await this._getOrCreateComponent(node, _props);
    node.add(box);
    return component;
  }
}
