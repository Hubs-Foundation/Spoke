import Command from "./Command";

export default class ReparentMultipleCommand extends Command {
  constructor(editor, objects, newParent, newBefore) {
    super(editor);
    this.objects = objects.slice(0);
    this.newParent = newParent;
    this.oldParents = objects.map(o => o.parent);
    this.newBefore = newBefore;
    this.oldBefores = objects.map(o => {
      if (o.parent) {
        const siblings = o.parent.children;
        const index = siblings.indexOf(o);

        if (index + 1 < siblings.length) {
          return siblings[index + 1];
        } else {
          return undefined;
        }
      }
    });
  }

  execute() {
    this.editor.reparentMultiple(this.objects, this.newParent, this.newBefore, false);
  }

  undo() {
    // There is no command for this function so we don't need to pass useHistory = false
    this.editor.reparentMultipleWithParents(this.objects, this.oldParents, this.oldBefores);
  }
}
