import Command from "./Command";

export default class RemoveMultipleObjectsCommand extends Command {
  constructor(editor, objects) {
    super(editor);

    this.objects = objects.slice(0);
    this.parents = objects.map(o => o.parent);
    this.befores = objects.map(o => {
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
    this.editor.removeMultipleObjects(this.objects, false);
  }

  undo() {
    this.editor._addMultipleObjectsWithParentsAndBefores(this.objects, this.parents, this.befores);
  }
}
