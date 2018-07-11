import BaseComponent from "./BaseComponent";
import { types } from "./utils";

export default class SceneReferenceComponent extends BaseComponent {
  static componentName = "scene-reference";

  static schema = [{ name: "src", type: types.file, filters: [".scene", ".gltf"], default: "" }];

  static inflate(node, props) {
    return this._getOrCreateComponent(node, props).component;
  }
}
