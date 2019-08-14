import Command from "./Command";

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
}
