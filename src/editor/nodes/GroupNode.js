import { Group } from "three";
import EditorNodeMixin from "./EditorNodeMixin";

export default class GroupNode extends EditorNodeMixin(Group) {
  static legacyComponentName = "group";

  static nodeName = "Group";

  serialize() {
    return super.serialize({
      group: {}
    });
  }
}
