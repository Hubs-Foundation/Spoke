import Command from "./Command";
import { serializeObject3DArray } from "../utils/debug";

export default class DeselectMultipleCommand extends Command {
  constructor(editor, objects) {
    super(editor);
    this.objects = objects.slice(0);
    this.oldSelection = editor.selected.slice(0);
  }

  execute() {
    this.editor.deselectMultiple(this.objects, false);
  }

  undo() {
    this.editor.setSelection(this.oldSelection, false);
  }

  toString() {
    return `DeselectMultipleCommand id: ${this.id} objects: ${serializeObject3DArray(this.objects)}`;
  }
}
