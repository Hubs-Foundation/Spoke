import { Matrix4, PerspectiveCamera, CameraHelper } from "three";
import EditorNodeMixin from "./EditorNodeMixin";

export default class ScenePreviewCameraNode extends EditorNodeMixin(PerspectiveCamera) {
  static componentName = "scene-preview-camera";

  static nodeName = "Scene Preview Camera";

  static canAddNode(editor) {
    return editor.scene.findNodeByType(ScenePreviewCameraNode) === null;
  }

  constructor(editor) {
    super(editor, 80, 16 / 9, 0.2, 8000);

    const cameraHelper = new CameraHelper(this);
    cameraHelper.layers.set(1);
    this.helper = cameraHelper;
  }

  setFromViewport() {
    const matrix = new Matrix4().getInverse(this.parent.matrixWorld).multiply(this.editor.camera.matrixWorld);
    matrix.decompose(this.position, this.rotation, this.scale);
    this.editor.emit("objectsChanged", [this]);
    this.editor.emit("selectionChanged");
  }

  onSelect() {
    this.editor.scene.add(this.helper);
    this.helper.update();
  }

  onDeselect() {
    this.editor.scene.remove(this.helper);
  }

  serialize() {
    return super.serialize({ "scene-preview-camera": {} });
  }

  prepareForExport() {
    super.prepareForExport();
    // This name is required in the current Hubs client.
    // It's possible to migrate to the scene-preview-camera component in the future.
    this.name = "scene-preview-camera";
    this.addGLTFComponent("scene-preview-camera");
    this.replaceObject();
  }
}
