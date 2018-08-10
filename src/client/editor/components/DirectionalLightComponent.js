import THREE from "../../vendor/three";
import BaseComponent from "./BaseComponent";
import { types } from "./utils";

export default class DirectionalLightComponent extends BaseComponent {
  static componentName = "directional-light";

  static type = "light";

  static schema = [
    { name: "color", type: types.color, default: "white" },
    { name: "intensity", type: types.number, default: 1, min: 0 },
    { name: "castShadow", type: types.boolean, default: true }
  ];

  async updateProperty(propertyName, value) {
    await super.updateProperty(propertyName, value);
    switch (propertyName) {
      case "color":
        this._object.color.set(value);
        break;
      default:
        this._object[propertyName] = value;
    }
  }

  static async inflate(node, _props) {
    const light = new THREE.DirectionalLight();
    light.position.set(0, 0, 0);
    light.target.position.set(0, 0, 1);
    light.add(light.target);
    const component = await this._getOrCreateComponent(node, _props, light);
    node.add(light);
    return component;
  }
}
