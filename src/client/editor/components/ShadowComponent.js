import BaseComponent from "./BaseComponent";
import { types } from "./utils";

export default class ShadowComponent extends BaseComponent {
  static componentName = "shadow";

  static iconClassName = "fa-clone";

  static dontExportProps = true;

  static schema = [
    { name: "castShadow", type: types.boolean, default: true },
    { name: "receiveShadow", type: types.boolean, default: true }
  ];

  async updateProperty(propertyName, value) {
    await super.updateProperty(propertyName, value);
    this._node[propertyName] = value;

    if (this._node.material) {
      this._node.material.needsUpdate = true;
    }
  }

  static _propsFromObject(object) {
    return {
      castShadow: object.castShadow,
      receiveShadow: object.receiveShadow
    };
  }
}
