import BaseComponent from "./BaseComponent";
import { types } from "./utils";

export default class ShadowComponent extends BaseComponent {
  static componentName = "shadow";

  static canRemove = false;

  static dontExportProps = true;

  static schema = [
    { name: "castShadow", type: types.boolean, default: true },
    { name: "receiveShadow", type: types.boolean, default: true }
  ];

  async updateProperty(propertyName, value) {
    await super.updateProperty(propertyName, value);
    this._object[propertyName] = value;

    if (this._object.material) {
      this._object.material.needsUpdate = true;
    }
  }

  static _propsFromObject(object) {
    return {
      castShadow: object.castShadow,
      receiveShadow: object.receiveShadow
    };
  }
}
