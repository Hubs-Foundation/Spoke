import BaseComponent from "./BaseComponent";
import { types } from "./utils";

export default class VisibleComponent extends BaseComponent {
  static componentName = "visible";

  static iconClassName = "fa-eye";

  static schema = [{ name: "visible", type: types.boolean, default: true }];

  static _propsFromObject(node) {
    return {
      visible: node.visible
    };
  }

  async updateProperty(propertyName, value) {
    await super.updateProperty(propertyName, value);
    this._node[propertyName] = value;
  }
}
