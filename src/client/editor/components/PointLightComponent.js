import BaseComponent from "./BaseComponent";
import { types } from "./utils";

export default class PointLightComponent extends BaseComponent {
  static componentName = "point-light";

  static schema = [
    { name: "color", type: types.color, default: "white" },
    { name: "intensity", type: types.number, default: 1 },
    { name: "castShadow", type: types.boolean, default: true }
  ];

  updateProperty(propertyName, value) {
    super.updateProperty(propertyName, value);
    switch (propertyName) {
      case "color":
        this._object.color.set(value);
        break;
      default:
        this._object[propertyName] = value;
    }
  }

  static inflate(node, _props) {
    const light = new THREE.PointLight();
    const component = this._getOrCreateComponent(node, _props, light);
    node.add(light);
    return component;
  }
}
