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
}
