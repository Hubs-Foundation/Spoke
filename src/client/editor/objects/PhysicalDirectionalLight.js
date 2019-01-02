import THREE from "../../vendor/three";
import createShadowMapResolutionProxy from "../utils/createShadowMapResolutionProxy";

export default class PhysicalDirectionalLight extends THREE.DirectionalLight {
  constructor() {
    super();
    this.position.set(0, 0, 0);
    this.target.position.set(0, 0, 1);
    this.add(this.target);
    this.castShadow = true;
    this.shadowMapResolution = createShadowMapResolutionProxy(this);
  }

  get shadowBias() {
    return this.shadow.bias;
  }

  set shadowBias(value) {
    this.shadow.bias = value;
  }

  get shadowRadius() {
    return this.shadow.radius;
  }

  set shadowRadius(value) {
    this.shadow.radius = value;
  }

  copy(source, recursive) {
    // Override DirectionalLight's copy method and pass the recursive parameter so we can avoid cloning children.
    THREE.Object3D.prototype.copy.call(this, source, recursive);

    this.color.copy(source.color);
    this.intensity = source.intensity;

    this.shadow.copy(source.shadow);

    return this;
  }
}
