import Command from "./Command";

export default class SelectAllCommand extends Command {
  constructor(editor) {
    super(editor);
    this.oldSelection = editor.selected.slice(0);
  }

  execute() {
    this.editor.selectAll(false);
  }

  undo() {
    this.editor.setSelection(this.oldSelection, false);
  }

  toString() {
    return `SelectAllCommand id: ${this.id}`;
  }
}
