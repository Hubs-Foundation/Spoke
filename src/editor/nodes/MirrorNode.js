import { Mesh, MeshBasicMaterial, PlaneBufferGeometry } from "three";
import EditorNodeMixin from "./EditorNodeMixin";

export default class MirrorNode extends EditorNodeMixin(Mesh) {
  static componentName = "mirror";

  static nodeName = "Mirror";

  constructor(editor) {
    super(editor, new PlaneBufferGeometry(), new MeshBasicMaterial());
  }

  serialize() {
    return super.serialize({
      [MirrorNode.componentName]: {},
    });
  }

  prepareForExport() {
    super.prepareForExport();
    this.addGLTFComponent("mirror", {});
  }
}
