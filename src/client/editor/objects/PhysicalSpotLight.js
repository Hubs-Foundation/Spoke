import THREE from "../three";

export default class PhysicalSpotLight extends THREE.SpotLight {
  constructor() {
    super();
    this.position.set(0, 0, 0);
    this.decay = 2;
    this.target.position.set(0, 0, 1);
    this.add(this.target);
    this.castShadow = true;
    this.innerConeAngle = 0;
    this.outerConeAngle = Math.PI / 4;
  }

  get range() {
    return this.distance;
  }

  set range(value) {
    this.distance = value;
  }

  get innerConeAngle() {
    return (1 - this.penumbra) * this.angle;
  }

  set innerConeAngle(value) {
    this.penumbra = 1.0 - value / this.angle;
  }

  get outerConeAngle() {
    return this.angle;
  }

  set outerConeAngle(value) {
    this.angle = value;
    this.penumbra = 1.0 - this.innerConeAngle / value;
  }
}
