import { SpotLight, Object3D } from "three";
import createShadowMapResolutionProxy from "../utils/createShadowMapResolutionProxy";

export default class PhysicalSpotLight extends SpotLight {
  constructor() {
    super();
    this.position.set(0, 0, 0);
    this.decay = 2;
    this.target.position.set(0, 0, 1);
    this.add(this.target);
    this.castShadow = true;
    this.innerConeAngle = 0;
    this.outerConeAngle = Math.PI / 4;
    this.maxOuterConeAngle = Math.PI / 2;
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
    this.penumbra = 1.0 - Math.max(value, Number.EPSILON) / this.angle;
  }

  get outerConeAngle() {
    return this.angle;
  }

  set outerConeAngle(value) {
    this.angle = value;
    this.penumbra = 1.0 - Math.max(this.innerConeAngle, Number.EPSILON) / value;
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

  copy(source, recursive = true) {
    // Override SpotLight's copy method and pass the recursive parameter so we can avoid cloning children.
    Object3D.prototype.copy.call(this, source, false);

    this.color.copy(source.color);
    this.intensity = source.intensity;

    this.distance = source.distance;
    this.angle = source.angle;
    this.penumbra = source.penumbra;
    this.decay = source.decay;

    this.shadow.copy(source.shadow);

    if (recursive) {
      this.remove(this.target);

      for (let i = 0; i < source.children.length; i++) {
        const child = source.children[i];
        if (child === source.target) {
          this.target = child.clone();
          this.target.position.set(0, 0, 1);
          this.add(this.target);
        } else {
          this.add(child.clone());
        }
      }
    }

    return this;
  }
}
