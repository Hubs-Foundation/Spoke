import EditorNodeMixin from "../../src/editor/nodes/EditorNodeMixin";
import { Object3D } from "three";

export default class MockNode extends EditorNodeMixin(Object3D) {
  constructor(editor, callbacks = {}) {
    super(editor);
    this.callbacks = callbacks;
  }

  onAdd() {
    if (this.callbacks.onAdd) {
      this.callbacks.onAdd();
    }
  }

  onRemove() {
    if (this.callbacks.onRemove) {
      this.callbacks.onRemove();
    }
  }

  onChange(propertyName) {
    if (this.callbacks.onChange) {
      this.callbacks.onChange(propertyName);
    }
  }

  onSelect() {
    if (this.callbacks.onSelect) {
      this.callbacks.onSelect();
    }
  }

  onDeselect() {
    if (this.callbacks.onDeselect) {
      this.callbacks.onDeselect();
    }
  }
}
