import THREE from "../three";
import BaseComponent from "./BaseComponent";
import { types, addPicker } from "./utils";
const { degToRad, radToDeg } = THREE.Math;

export default class SpotLightComponent extends BaseComponent {
  static componentName = "spot-light";

  static componentDescription = "A light which emits along a direction, illuminating objects within a cone.";

  static iconClassName = "fa-bullseye";

  static type = "light";

  static schema = [
    { name: "color", type: types.color, default: "white" },
    { name: "intensity", type: types.number, default: 1 },
    { name: "range", type: types.number, default: 0 },
    { name: "innerConeAngle", type: types.number, default: 0, min: 0, format: radToDeg, parse: degToRad },
    {
      name: "outerConeAngle",
      type: types.number,
      default: Math.PI / 4.0, // default in radians
      min: 1, // min in degrees (applied after format)
      format: radToDeg,
      parse: degToRad
    },
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
      case "innerConeAngle":
      case "outerConeAngle": {
        this._object.angle = this.props.outerConeAngle;
        this._object.penumbra = 1.0 - this.props.innerConeAngle / this.props.outerConeAngle;
        break;
      }
      default:
        this._object[propertyName] = value;
    }
  }

  static async inflate(node, _props) {
    const light = new THREE.SpotLight();
    light.position.set(0, 0, 0);
    light.decay = 2;
    light.target.position.set(0, 0, 1);
    light.add(light.target);
    addPicker(light, node);

    const component = await this._getOrCreateComponent(node, _props, light);
    node.add(light);

    return component;
  }
}
