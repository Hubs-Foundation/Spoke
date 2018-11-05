import THREE from "../three";
import EditorNodeMixin from "./EditorNodeMixin";

export default class GroupNode extends EditorNodeMixin(THREE.Group) {
  static legacyComponentName = "group";

  static nodeName = "Group";

  serialize() {
    const json = super.serialize();

    json.components.push({
      name: "group",
      props: {}
    });

    return json;
  }
}
