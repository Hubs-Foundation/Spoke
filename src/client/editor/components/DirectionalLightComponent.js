import THREE from "../../vendor/three";
import BaseComponent from "./BaseComponent";
import { types } from "./utils";

const { DEG2RAD } = THREE.Math;

export default class DirectionalLightComponent extends BaseComponent {
  static componentName = "directional-light";

  static schema = [
    { name: "color", type: types.color, default: "white" },
    { name: "intensity", type: types.number, default: 1 },
    { name: "castShadow", type: types.boolean, default: true },
    { name: "elevation", type: types.number, default: 63 },
    { name: "azimuth", type: types.number, default: 245 }
  ];

  static _tempEuler = new THREE.Euler(0, 0, 0, "YXZ");

  _updateComponentProperty(propertyName, value) {
    super._updateComponentProperty(propertyName, value);
    const { _tempEuler } = DirectionalLightComponent;
    switch (propertyName) {
      case "color":
        this._object.color.set(value);
        break;
      case "elevation":
      case "azimuth":
        _tempEuler.set(this.props.elevation * DEG2RAD, -this.props.azimuth * DEG2RAD, 0);
        this._object.position.set(0, 0, -100);
        this._object.position.applyEuler(_tempEuler);
        break;
      default:
        this._object[propertyName] = value;
    }
  }

  static inflate(node, _props) {
    const { component, props } = this._getOrCreateComponent(node, _props);
    const light = new THREE.DirectionalLight(props.color, props.intensity);
    Object.defineProperty(component, "_object", { enumerable: false, value: light });
    component._updateComponentProperty("azimuth", props.azimuth);
    component._updateComponentProperty("elevation", props.elevation);
    component._updateComponentProperty("castShadow", props.castShadow);
    light.userData._dontShowInHierarchy = true;
    light.userData._inflated = true;
    node.add(light);
    return component;
  }
}
