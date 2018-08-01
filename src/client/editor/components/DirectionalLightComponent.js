import THREE from "../../vendor/three";
import BaseComponent from "./BaseComponent";
import { types } from "./utils";

const { DEG2RAD } = THREE.Math;

export default class DirectionalLightComponent extends BaseComponent {
  static componentName = "directional-light";

  static schema = [
    { name: "color", type: types.color, default: "white" },
    { name: "intensity", type: types.number, default: 1, min: 0 },
    { name: "castShadow", type: types.boolean, default: true },
    { name: "elevation", type: types.number, default: 63, min: -90, max: 90 },
    { name: "azimuth", type: types.number, default: 245, min: 0, max: 360 }
  ];

  static _tempEuler = new THREE.Euler(0, 0, 0, "YXZ");

  async updateProperty(propertyName, value) {
    await super.updateProperty(propertyName, value);
    const { _tempEuler } = DirectionalLightComponent;
    switch (propertyName) {
      case "color":
        this._object.color.set(value);
        break;
      case "elevation":
      case "azimuth":
        _tempEuler.set(this.props.elevation * DEG2RAD, -this.props.azimuth * DEG2RAD, 0);
        this._object.position.set(0, 0, -20);
        this._object.position.applyEuler(_tempEuler);
        break;
      default:
        this._object[propertyName] = value;
    }
  }

  static async inflate(node, _props) {
    const light = new THREE.DirectionalLight();
    const component = await this._getOrCreateComponent(node, _props, light);
    node.add(light);
    return component;
  }
}
