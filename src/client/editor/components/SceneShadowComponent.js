import BaseComponent from "./BaseComponent";
import { types } from "./utils";

export default class SceneShadowComponent extends BaseComponent {
  static componentName = "scene-shadow";

  static iconClassName = "fa-clone";

  static schema = [{ name: "type", type: types.string, default: "pcf" }];
}
