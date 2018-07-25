import BaseComponent from "./BaseComponent";
import { types } from "./utils";

export default class TransformComponent extends BaseComponent {
  static componentName = "transform";

  static canAdd = false;

  static canRemove = false;

  static dontExportProps = true;

  static schema = [
    { name: "position", type: types.vector },
    { name: "rotation", type: types.euler },
    { name: "scale", type: types.vector }
  ];

  static _propsFromObject(node) {
    const rotation = node.rotation;
    return {
      position: node.position,
      rotation: { x: rotation.x, y: rotation.y, z: rotation.z },
      scale: node.scale
    };
  }

  constructor(node, object) {
    super(node, object);
    // Initialize an internal _props that is mutated below in order to avoid allocating new objects.
    this._props = {
      position: null,
      rotation: { x: null, y: null, z: null },
      scale: null
    };
    // TransformComponent is special. It doesn't store its own position/rotation/transform props,
    // it reads them directly from the Object3D.
    Object.defineProperty(this, "props", {
      get: () => {
        const rotation = this._object.rotation;
        this._props.position = this._object.position;
        this._props.rotation.x = rotation.x;
        this._props.rotation.y = rotation.z;
        this._props.rotation.z = rotation.z;
        this._props.scale = this._object.scale;
        return this._props;
      }
    });
  }

  updateProperty(propertyName, value) {
    this._object[propertyName].set(value.x, value.y, value.z);
  }
}
