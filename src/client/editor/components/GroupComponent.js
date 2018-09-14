import BaseComponent from "./BaseComponent";

export default class GroupComponent extends BaseComponent {
  static componentName = "group";

  static componentDescription =
    "A group of multiple objects that can be moved or duplicated together.\nDrag and drop objects into the Group in the Hierarchy.";

  static iconClassName = "fa-cubes";

  static dontExportProps = true;

  static schema = [];
}
