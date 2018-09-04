import THREE from "../three";
import BaseComponent from "./BaseComponent";
import { types, addPicker } from "./utils";

export default class HemisphereLightComponent extends BaseComponent {
  static componentName = "hemisphere-light";

  static iconClassName = "fa-certificate";

  static type = "light";

  static schema = [
    { name: "skyColor", type: types.color, default: "white" },
    { name: "groundColor", type: types.color, default: "white" },
    { name: "intensity", type: types.number, default: 1 }
  ];

  async updateProperty(propertyName, value) {
    await super.updateProperty(propertyName, value);
    switch (propertyName) {
      case "skyColor":
        this._object.color.set(value);
        break;
      case "groundColor":
        this._object.groundColor.set(value);
        break;
      default:
        this._object[propertyName] = value;
    }
  }

  static async inflate(node, props) {
    const light = new THREE.HemisphereLight();
    light.position.set(0, 0, 0);
    addPicker(light, node);

    const component = await this._getOrCreateComponent(node, props, light);
    node.add(light);

    return component;
  }
}
