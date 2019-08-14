import Command from "./Command";

export default class SetSelectionCommand extends Command {
  constructor(editor, objects) {
    super(editor);
    this.oldSelection = editor.selected.slice(0);
    this.objects = objects.slice(0);
  }

  execute() {
    this.editor.setSelection(this.objects, false);
  }

  undo() {
    this.editor.setSelection(this.oldSelection, false);
  }
}
