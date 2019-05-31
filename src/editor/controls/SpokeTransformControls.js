import { Object3D } from "three";
import TransformControls from "./TransformControls";

export default class SpokeTransformControls extends TransformControls {
  constructor(camera) {
    super(camera);
    this.name = "SpokeTransformControls";
    this.traverse(obj => (obj.renderOrder = 100));
  }

  clone() {
    // You can only have one instance of TransformControls so return a dummy object when cloning.
    return new Object3D().copy(this);
  }
}
