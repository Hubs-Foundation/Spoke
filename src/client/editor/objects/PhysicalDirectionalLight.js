import THREE from "../three";

export default class PhysicalDirectionalLight extends THREE.DirectionalLight {
  constructor() {
    super();
    this.position.set(0, 0, 0);
    this.target.position.set(0, 0, 1);
    this.add(this.target);
  }
}
