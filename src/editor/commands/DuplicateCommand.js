import Command from "./Command";

export default class DuplicateCommand extends Command {
  constructor(editor, object, parent, before) {
    super(editor);
    this.object = object;
    this.parent = parent;
    this.before = before;
    this.oldSelection = editor.selected.slice(0);
    this.duplicatedObject = null;
  }

  execute() {
    this.duplicatedObject = this.editor.duplicate(this.object, this.parent, this.before, false);
  }

  undo() {
    this.editor.removeObject(this.duplicatedObject, false, true, false);
    this.editor.setSelection(this.oldSelection, false);
  }
}
