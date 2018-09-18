import BaseComponent from "./BaseComponent";
import { types } from "./utils";

export default class GLTFModelComponent extends BaseComponent {
  static componentName = "gltf-model";

  static componentDescription = "A 3D model in your scene, loaded from a GLTF URL or file.";

  static iconClassName = "fa-cube";

  static dontExportProps = true;

  static schema = [
    { name: "src", type: types.file, filters: [".gltf", ".glb"], default: null },
    { name: "attribution", type: types.string, hidden: true }
  ];
}
