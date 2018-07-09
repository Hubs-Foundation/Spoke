import BaseComponent from "./BaseComponent";
import { types } from "./utils";

export default class SceneReferenceComponent extends BaseComponent {
  static componentName = "scene-reference";

  static schema = [{ name: "src", type: types.file, default: "" }];

  static inflate(node, props) {
    return this._getOrCreateComponent(node, props).component;
  }
}
