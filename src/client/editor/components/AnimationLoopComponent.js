import BaseComponent from "./BaseComponent";
import { types } from "./utils";

export default class AnimationLoopComponent extends BaseComponent {
  static componentName = "animation-loop";

  static iconClassName = "fa-redo";

  static schema = [{ name: "clip", type: types.string }];
}
