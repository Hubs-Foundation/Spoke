import Command from "./Command";
import { serializeObject3D } from "../utils/debug";

export default class ReparentCommand extends Command {
  constructor(editor, object, newParent, newBefore) {
    super(editor);
    this.object = object;

    this.oldParent = object.parent;

    if (object.parent) {
      const siblings = object.parent.children;
      const index = siblings.indexOf(object);

      if (index + 1 < siblings.length) {
        this.oldBefore = siblings[index + 1];
      }
    }

    this.newParent = newParent;
    this.newBefore = newBefore;
    this.oldSelection = editor.selected.slice(0);
  }

  execute() {
    this.editor.reparent(this.object, this.newParent, this.newBefore, false);
  }

  undo() {
    this.editor.reparent(this.object, this.oldParent, this.oldBefore, false, true, false);
    this.editor.setSelection(this.oldSelection, false);
  }

  toString() {
    return `${this.constructor.name} id: ${this.id} object: ${serializeObject3D(
      this.object
    )} newParent: ${serializeObject3D(this.newParent)} newBefore: ${serializeObject3D(this.newBefore)}`;
  }
}
