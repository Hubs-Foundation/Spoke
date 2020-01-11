import EditorNodeMixin from "./EditorNodeMixin";
import SimpleWater from "../objects/SimpleWater";

export default class SimpleWaterNode extends EditorNodeMixin(SimpleWater) {
  static legacyComponentName = "simple-water";

  static nodeName = "SimpleWater";

  static canAddNode(editor) {
    return editor.scene.findNodeByType(SimpleWaterNode) === null;
  }

  static async load() {
    await SimpleWater.loadNormalMap();
  }

  onUpdate(dt, time) {
    this.update(time);
  }

  serialize() {
    return super.serialize({ "simple-water": {} });
  }

  prepareForExport() {
    super.prepareForExport();
    this.addGLTFComponent("simple-water");
    this.replaceObject();
  }
}
