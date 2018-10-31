import THREE from "../three";

export default class PhysicalPointLight extends THREE.PointLight {
  constructor() {
    super();
    this.decay = 2;
    this.castShadow = true;
  }

  get range() {
    return this.distance;
  }

  set range(value) {
    this.distance = value;
  }

  copy(source, recursive) {
    // Override PointLight's copy method and pass the recursive parameter so we can avoid cloning children.
    THREE.Object3D.prototype.copy.call(this, source, recursive);

    this.color.copy(source.color);
    this.intensity = source.intensity;

    this.distance = source.distance;
    this.decay = source.decay;

    this.shadow = source.shadow.clone();

    return this;
  }
}
