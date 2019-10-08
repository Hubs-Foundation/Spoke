import Command from "./Command";
import { serializeObject3DArray, serializeObject3D } from "../utils/debug";

export default class DuplicateMultipleCommand extends Command {
  constructor(editor, objects, parent, before) {
    super(editor);
    this.objects = objects.slice(0);
    this.parent = parent;
    this.before = before;
    this.oldSelection = editor.selected.slice(0);
    this.duplicatedObjects = null;
  }

  execute(redo) {
    if (redo) {
      this.editor.addMultipleObjects(this.duplicatedObjects, this.parent, this.before, false);
    } else {
      this.duplicatedObjects = this.editor.duplicateMultiple(this.objects, this.parent, this.before, false);
    }
  }

  undo() {
    this.editor.removeMultipleObjects(this.duplicatedObjects, false, true, false);
    this.editor.setSelection(this.oldSelection, false);
  }

  toString() {
    return `DuplicateMultipleCommand id: ${this.id} objects: ${serializeObject3DArray(
      this.objects
    )} parent: ${serializeObject3D(this.parent)} before: ${serializeObject3D(this.before)}`;
  }
}
