import Command from "./Command";
import { serializeObject3DArray } from "../utils/debug";

export default class RemoveMultipleObjectsCommand extends Command {
  constructor(editor, objects) {
    super(editor);

    this.objects = [];
    this.oldParents = [];
    this.oldBefores = [];
    this.oldNodes = editor.nodes.slice(0);
    this.oldSelection = editor.selected.slice(0);

    // Sort objects, parents, and befores with a depth first search so that undo adds nodes in the correct order
    editor.scene.traverse(object => {
      if (objects.indexOf(object) !== -1) {
        this.objects.push(object);
        this.oldParents.push(object.parent);
        if (object.parent) {
          const siblings = object.parent.children;
          const index = siblings.indexOf(object);

          if (index + 1 < siblings.length) {
            this.oldBefores.push(siblings[index + 1]);
          } else {
            this.oldBefores.push(undefined);
          }
        }
      }
    });
  }

  execute() {
    this.editor.removeMultipleObjects(this.objects, false);
  }

  undo() {
    this.editor._addMultipleObjectsWithParentsAndBefores(this.objects, this.oldParents, this.oldBefores, this.oldNodes);
    this.editor.setSelection(this.oldSelection, false);
  }

  toString() {
    return `RemoveMultipleObjectsCommand id: ${this.id} objects: ${serializeObject3DArray(this.objects)}`;
  }
}
