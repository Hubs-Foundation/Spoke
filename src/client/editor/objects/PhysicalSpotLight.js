import THREE from "../../vendor/three";
import createShadowMapResolutionProxy from "../utils/createShadowMapResolutionProxy";

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
    this.shadowMapResolution = createShadowMapResolutionProxy(this);
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

  copy(source, recursive) {
    // Override SpotLight's copy method and pass the recursive parameter so we can avoid cloning children.
    THREE.Object3D.prototype.copy.call(this, source, recursive);

    this.color.copy(source.color);
    this.intensity = source.intensity;

    this.distance = source.distance;
    this.angle = source.angle;
    this.penumbra = source.penumbra;
    this.decay = source.decay;

    this.shadow.copy(source.shadow);

    return this;
  }
}
