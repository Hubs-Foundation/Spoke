import BaseComponent from "./BaseComponent";
import { types } from "./utils";

export default class MediaLoaderComponent extends BaseComponent {
  static componentName = "media-loader";

  static iconClassName = "fa-cloud-download-alt";

  static schema = [
    { name: "src", type: types.string, default: "" },
    // TODO: add integer type
    // { name: "index", type: types.number },
    { name: "resize", type: types.boolean, default: false }
  ];
}
