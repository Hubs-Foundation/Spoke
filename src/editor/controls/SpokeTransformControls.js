import THREE from "../../vendor/three";
import TransformControls from "./TransformControls";

export default class SpokeTransformControls extends TransformControls {
  constructor(camera) {
    super(camera);
    this.name = "SpokeTransformControls";
    this.traverse(obj => (obj.renderOrder = 100));
  }

  clone() {
    // You can only have one instance of TransformControls so return a dummy object when cloning.
    return new THREE.Object3D().copy(this);
  }
}
