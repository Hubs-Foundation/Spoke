import Command from "./Command";

export default class DuplicateMultipleCommand extends Command {
  constructor(editor, objects, parent, before) {
    super(editor);
    this.objects = objects.slice(0);
    this.parent = parent;
    this.before = before;
    this.oldSelection = editor.selected.slice(0);
    this.duplicatedObjects = null;
  }

  execute() {
    this.duplicatedObjects = this.editor.duplicateMultiple(this.objects, this.parent, this.before, false);
  }

  undo() {
    this.editor.removeMultipleObjects(this.duplicatedObjects, false, true, false);
    this.editor.setSelection(this.oldSelection, false);
  }
}
