import Mirror from "../objects/Mirror";
import EditorNodeMixin from "./EditorNodeMixin";

export default class MirrorNode extends EditorNodeMixin(Mirror) {
  static componentName = "mirror";

  static nodeName = "Mirror";

  static async deserialize(editor, json) {
    const node = await super.deserialize(editor, json);

    const { color } = json.components.find(c => c.name === MirrorNode.componentName).props;

    node.color = color;

    return node;
  }

  constructor(editor) {
    super(editor);

    this.color = "#7f7f7f";
  }

  copy(source, recursive = true) {
    super.copy(source, recursive);

    return this;
  }

  serialize() {
    return super.serialize({
      [MirrorNode.componentName]: {
        color: this.color
      }
    });
  }

  prepareForExport() {
    super.prepareForExport();

    this.addGLTFComponent("mirror", {
      color: this.color
    });

    this.replaceObject();
  }
}
