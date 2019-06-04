import { Object3D, HemisphereLight } from "three";

export default class PhysicalHemisphereLight extends HemisphereLight {
  constructor() {
    super();
    this.position.set(0, 0, 0);
  }

  get skyColor() {
    return this.color;
  }

  copy(source, recursive = true) {
    // Override HemisphereLight's copy method and pass the recursive parameter so we can avoid cloning children.
    Object3D.prototype.copy.call(this, source, recursive);

    this.color.copy(source.color);
    this.intensity = source.intensity;

    this.groundColor.copy(source.groundColor);

    return this;
  }
}
