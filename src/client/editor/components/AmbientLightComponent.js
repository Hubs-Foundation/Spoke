import THREE from "../../vendor/three";
import BaseComponent from "./BaseComponent";
import { types } from "./utils";

export default class AmbientLightComponent extends BaseComponent {
  static componentName = "ambient-light";

  static schema = [
    { name: "color", type: types.color, default: "white" },
    { name: "intensity", type: types.number, default: 1, min: 0 }
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

  static async inflate(node, props) {
    const light = new THREE.AmbientLight();
    const component = await this._getOrCreateComponent(node, props, light);
    node.add(light);
    return component;
  }
}
