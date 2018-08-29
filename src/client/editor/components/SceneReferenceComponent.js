import BaseComponent from "./BaseComponent";
import { types } from "./utils";

export default class SceneReferenceComponent extends BaseComponent {
  static componentName = "scene-reference";

  static dontExportProps = true;

  static canAdd = false;

  static schema = [{ name: "src", type: types.file, filters: [".scene"], default: null }];
}
