import BaseComponent from "./BaseComponent";
import { types } from "./utils";

export default class GLTFModelComponent extends BaseComponent {
  static componentName = "gltf-model";

  static iconClassName = "fa-cube";

  static dontExportProps = true;

  static schema = [{ name: "src", type: types.file, filters: [".gltf", ".glb"], default: null }];
}
