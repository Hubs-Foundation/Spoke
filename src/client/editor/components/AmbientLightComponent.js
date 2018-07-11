import BaseComponent from "./BaseComponent";
import { types } from "./utils";

export default class AmbientLightComponent extends BaseComponent {
  static componentName = "ambient-light";

  static schema = [
    { name: "color", type: types.color, default: "white" },
    { name: "intensity", type: types.number, default: 1 }
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
    const { component, props } = this._getOrCreateComponent(node, _props);
    const light = new THREE.AmbientLight(props.color, props.intensity);
    Object.defineProperty(component, "_object", { enumerable: false, value: light });
    light.userData._dontShowInHierarchy = true;
    light.userData._inflated = true;
    node.add(light);
    return component;
  }
}
