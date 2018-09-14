import THREE from "../three";
import BaseComponent from "./BaseComponent";
import { types } from "./utils";

export default class AmbientLightComponent extends BaseComponent {
  static componentName = "ambient-light";

  static componentDescription = "A light which illuminates all objects in your scene.";

  static type = "light";

  static iconClassName = "fa-sun";

  static schema = [
    { name: "color", type: types.color, default: "white" },
    { name: "intensity", type: types.number, default: 1 }
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
