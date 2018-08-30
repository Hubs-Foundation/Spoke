import BaseComponent from "./BaseComponent";
import { types } from "./utils";

export default class LoopAnimationComponent extends BaseComponent {
  static componentName = "loop-animation";

  static iconClassName = "fa-redo";

  static schema = [{ name: "clip", type: types.string }];
}
