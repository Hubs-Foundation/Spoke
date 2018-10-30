import THREE from "../three";

export default class PhysicalPointLight extends THREE.HemisphereLight {
  constructor() {
    super();
    this.position.set(0, 0, 0);
  }

  get skyColor() {
    return this.color;
  }
}
