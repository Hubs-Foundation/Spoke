import Command from "./Command";

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
}
