import Command from "./Command";
import { serializeObject3D } from "../utils/debug";

export default class DeselectCommand extends Command {
  constructor(editor, object) {
    super(editor);
    this.object = object;
    this.oldSelection = editor.selected.slice(0);
  }

  execute() {
    this.editor.deselect(this.object, false);
  }

  undo() {
    this.editor.setSelection(this.oldSelection, false);
  }

  toString() {
    return `DeselectCommand id: ${this.id} object: ${serializeObject3D(this.object)}`;
  }
}
