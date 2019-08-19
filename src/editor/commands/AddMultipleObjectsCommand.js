import Command from "./Command";
import { serializeObject3DArray, serializeObject3D } from "../utils/debug";

export default class AddMultipleObjectsCommand extends Command {
  constructor(editor, objects, parent, before) {
    super(editor);
    this.objects = objects.slice(0);
    this.parent = parent;
    this.before = before;
    this.oldSelection = editor.selected.slice(0);
  }

  execute() {
    this.editor.addMultipleObjects(this.objects, this.parent, this.before, false);
  }

  undo() {
    this.editor.removeMultipleObjects(this.objects, false, true, false);
    this.editor.setSelection(this.oldSelection, false);
  }

  toString() {
    return `AddMultipleObjectsCommand id: ${this.id} objects: ${serializeObject3DArray(
      this.objects
    )} parent: ${serializeObject3D(this.parent)} before: ${serializeObject3D(this.before)}`;
  }
}
