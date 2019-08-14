import Command from "./Command";

export default class DeselectAllCommand extends Command {
  constructor(editor) {
    super(editor);
    this.oldSelection = editor.selected.slice(0);
  }

  execute() {
    this.editor.deselectAll(false);
  }

  undo() {
    this.editor.setSelection(this.oldSelection, false);
  }
}
