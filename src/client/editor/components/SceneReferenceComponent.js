import BaseComponent from "./BaseComponent";
import { types } from "./utils";

export default class SceneReferenceComponent extends BaseComponent {
  static componentName = "scene-reference";

  static dontExportProps = true;

  static iconClassName = "fa-cube";

  static schema = [{ name: "src", type: types.file, filters: [".spoke"], default: null }];
}
