import THREE from "../../vendor/three";
import BaseComponent from "./BaseComponent";
import { types } from "./utils";

export default class PointLightComponent extends BaseComponent {
  static componentName = "point-light";

  static type = "light";

  static schema = [
    { name: "color", type: types.color, default: "white" },
    { name: "intensity", type: types.number, default: 1 },
    { name: "range", type: types.number, default: 0 },
    { name: "castShadow", type: types.boolean, default: true }
  ];

  async updateProperty(propertyName, value) {
    await super.updateProperty(propertyName, value);
    switch (propertyName) {
      case "color":
        this._object.color.set(value);
        break;
      case "range":
        this._object.distance = value;
        break;
      default:
        this._object[propertyName] = value;
    }
  }

  static async inflate(node, _props) {
    const light = new THREE.PointLight();
    light.decay = 2;
    const component = await this._getOrCreateComponent(node, _props, light);
    node.add(light);
    return component;
  }
}
