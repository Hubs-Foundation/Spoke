import Command from "./Command";
import { serializeObject3D } from "../utils/debug";

export default class AddObjectCommand extends Command {
  constructor(editor, object, parent, before) {
    super(editor);
    this.object = object;
    this.parent = parent;
    this.before = before;
    this.oldSelection = editor.selected.slice(0);
  }

  execute() {
    this.editor.addObject(this.object, this.parent, this.before, false);
  }

  undo() {
    this.editor.removeObject(this.object, false, true, false);
    this.editor.setSelection(this.oldSelection, false);
  }

  toString() {
    return `AddObjectCommand id: ${this.id} object: ${serializeObject3D(this.object)} parent: ${serializeObject3D(
      this.parent
    )} before: ${serializeObject3D(this.before)}`;
  }
}
