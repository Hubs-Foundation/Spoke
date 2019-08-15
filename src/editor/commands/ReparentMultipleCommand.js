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
    this.oldSelection = editor.selected.slice(0);
  }

  execute() {
    this.editor.reparentMultiple(this.objects, this.newParent, this.newBefore, false);
  }

  undo() {
    for (let i = 0; i < this.objects.length; i++) {
      this.editor.reparent(this.objects[i], this.oldParents[i], this.oldBefores[i], false, false, false, false);
    }

    this.editor.setSelection(this.oldSelection, false, true, false);

    this.editor.updateTransformRoots();

    this.editor.emit("sceneGraphChanged");
  }
}
