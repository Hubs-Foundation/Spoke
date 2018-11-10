import EditorNodeMixin from "./EditorNodeMixin";
import Media from "../objects/Media";

export default class MediaNode extends EditorNodeMixin(Media) {
  static legacyComponentName = "media";

  static nodeName = "Media";

  static async deserialize(editor, json) {
    const node = await super.deserialize(editor, json);

    const { src } = json.components.find(c => c.name === "media").props;

    await node.setMedia(src);

    return node;
  }

  serialize() {
    const json = super.serialize();

    json.components.push({
      name: "media",
      props: {
        src: this.src
      }
    });

    return json;
  }
}
