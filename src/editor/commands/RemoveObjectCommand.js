import Command from "./Command";

export default class RemoveObjectCommand extends Command {
  constructor(editor, object) {
    super(editor);
    this.object = object;
    this.parent = object.parent;
    if (this.parent !== undefined) {
      const index = this.parent.children.indexOf(this.object);

      if (this.parent.children.length > index + 1) {
        this.before = this.parent.children[index + 1];
      }
    }
    this.oldSelection = editor.selected.slice(0);
  }

  execute() {
    this.editor.removeObject(this.object, false);
  }

  undo() {
    this.editor.addObject(this.object, this.parent, this.before, false, true, false);
    this.editor.setSelection(this.oldSelection, false);
  }
}
