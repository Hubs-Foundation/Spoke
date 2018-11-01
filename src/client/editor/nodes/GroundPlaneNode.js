import EditorNodeMixin from "./EditorNodeMixin";
import GroundPlane from "../objects/GroundPlane";

export default class GroundPlaneNode extends EditorNodeMixin(GroundPlane) {
  static legacyComponentName = "ground-plane";

  static nodeName = "Ground Plane";

  static async deserialize(editor, json) {
    const node = await super.deserialize(editor, json);

    const { color } = json.components.find(c => c.name === "ground-plane").props;

    node.color.set(color);

    return node;
  }

  serialize() {
    const json = super.serialize();

    json.components.push({
      name: "ground-plane",
      props: {
        color: this.color
      }
    });

    return json;
  }
}
