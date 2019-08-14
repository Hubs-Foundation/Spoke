import Command from "./Command";

export default class ReparentCommand extends Command {
  constructor(editor, object, newParent, newBefore) {
    super(editor);
    this.object = object;

    this.oldParent = object.parent;

    if (object.parent) {
      const siblings = object.parent.children;
      const index = siblings.indexOf(object);

      if (index + 1 < siblings.length) {
        this.oldBefore = siblings[index + 1];
      }
    }

    this.newParent = newParent;
    this.newBefore = newBefore;
  }

  execute() {
    this.editor.reparent(this.object, this.newParent, this.newBefore, false);
  }

  undo() {
    this.editor.reparent(this.object, this.oldParent, this.oldBefore, false);
  }
}
