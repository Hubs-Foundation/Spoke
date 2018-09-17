import THREE from "../three";
import TransformComponent from "./TransformComponent";

export default class BoxColliderComponent extends TransformComponent {
  static componentName = "box-collider";

  static componentDescription =
    "An invisible box that objects will bounce off of or rest on top of.\nWithout colliders, objects will fall through floors and go through walls.";

  static iconClassName = "fa-hand-paper";

  static _geometry = new THREE.BoxBufferGeometry();

  static _material = new THREE.Material();

  // Since the box collider props just mirror the node's transform, we hide the props.
  static showProps = false;

  static dontExportProps = false;

  static async inflate(node, _props) {
    const boxMesh = new THREE.Mesh(this._geometry, this._material);
    const box = new THREE.BoxHelper(boxMesh, 0x00ff00);
    box.layers.set(1);
    Object.defineProperty(box.userData, "_selectionRoot", { value: node, configurable: true, enumerable: false });
    box.userData._dontExport = true;
    box.userData._dontShowInHierarchy = true;
    box.userData._inflated = true;
    const component = await this._getOrCreateComponent(node, _props);
    component._box = box;
    node.add(box);
    return component;
  }

  static deflate(node) {
    node.remove(this.getComponent(node)._box);
    super.deflate(node);
  }
}
