import BaseComponent from "./BaseComponent";
import { types } from "./utils";

export default class TransformComponent extends BaseComponent {
  static componentName = "transform";

  static removable = false;

  static schema = [
    { name: "position", type: types.vector },
    { name: "rotation", type: types.euler },
    { name: "scale", type: types.vector }
  ];

  static _propsFromObject(node) {
    const rot = node.rotation;
    return {
      position: node.position,
      rotation: { x: rot.x, y: rot.y, z: rot.z },
      scale: node.scale
    };
  }

  constructor(node, object) {
    super(node, object);
    Object.defineProperty(this, "props", {
      get: () => {
        return TransformComponent._propsFromObject(this._object);
      }
    });
  }

  updateProperty(propertyName, value) {
    this._object[propertyName].set(value.x, value.y, value.z);
  }
}
