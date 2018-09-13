import BaseComponent from "./BaseComponent";
import { types } from "./utils";
import THREE from "../three";

export default class SkyboxComponent extends BaseComponent {
  static componentName = "skybox";

  static iconClassName = "fa-cloud";

  static schema = [
    { name: "turbidity", type: types.number, default: 10 },
    { name: "rayleigh", type: types.number, default: 2 },
    { name: "luminance", type: types.number, default: 1 },
    { name: "mieCoefficient", type: types.number, default: 0.005 },
    { name: "mieDirectionalG", type: types.number, default: 0.8 },
    { name: "inclination", type: types.number, default: 0 },
    { name: "azimuth", type: types.number, default: 0.15 },
    { name: "distance", type: types.number, default: 8000, min: 0, max: 1000 }
  ];

  _updateSunPosition() {
    const theta = Math.PI * (this.props.inclination - 0.5);
    const phi = 2 * Math.PI * (this.props.azimuth - 0.5);

    const distance = this.props.distance;

    const x = distance * Math.cos(phi);
    const y = distance * Math.sin(phi) * Math.sin(theta);
    const z = distance * Math.sin(phi) * Math.cos(theta);

    this._object.material.uniforms.sunPosition.value.set(x, y, z).normalize();
    this._object.scale.set(distance, distance, distance);
  }

  async updateProperty(propertyName, value) {
    super.updateProperty(propertyName, value);
    const uniforms = this._object.material.uniforms;
    switch (propertyName) {
      case "inclination":
      case "azimuth":
      case "distance":
        this._updateSunPosition();
        break;
      default:
        uniforms[propertyName].value = value;
        break;
    }
  }

  static async inflate(node, _props) {
    const sky = new THREE.Sky();
    const component = await this._getOrCreateComponent(node, _props, sky);
    node.add(sky);
    return component;
  }
}
