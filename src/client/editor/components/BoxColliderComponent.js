import THREE from "../three";
import TransformComponent from "./TransformComponent";

// BoxCollider exists because the editor needs something to create a helper for.
export class BoxCollider extends THREE.Mesh {
  constructor(geometry, material) {
    super(geometry, material);
    this.visible = false;
  }
}

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
    const box = new BoxCollider(BoxColliderComponent._geometry);
    box.userData._dontExport = true;
    box.userData._dontShowInHierarchy = true;
    box.userData._inflated = true;
    const component = await this._getOrCreateComponent(node, _props);
    node.add(box);
    node.updateMatrixWorld(true);
    return component;
  }
}
