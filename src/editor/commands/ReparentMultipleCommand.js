import Command from "./Command";
import { serializeObject3DArray, serializeObject3D } from "../utils/debug";
import reverseDepthFirstTraverse from "../utils/reverseDepthFirstTraverse";

export default class ReparentMultipleCommand extends Command {
  constructor(editor, objects, newParent, newBefore) {
    super(editor);
    this.objects = [];
    this.undoObjects = [];
    this.newParent = newParent;
    this.newBefore = newBefore;
    this.oldParents = [];
    this.oldBefores = [];
    this.oldSelection = editor.selected.slice(0);

    editor.scene.traverse(object => {
      if (objects.indexOf(object) !== -1) {
        this.objects.push(object);
      }
    });

    // Sort objects, parents, and befores with a depth first search so that undo adds nodes in the correct order
    reverseDepthFirstTraverse(editor.scene, object => {
      if (objects.indexOf(object) !== -1) {
        this.undoObjects.push(object);
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
    this.editor.reparentMultiple(this.objects, this.newParent, this.newBefore, false);
  }

  undo() {
    for (let i = 0; i < this.objects.length; i++) {
      this.editor.reparent(this.undoObjects[i], this.oldParents[i], this.oldBefores[i], false, false, false, false);
    }

    this.editor.setSelection(this.oldSelection, false, true, false);

    this.editor.updateTransformRoots();

    this.editor.emit("sceneGraphChanged");
  }

  toString() {
    return `${this.constructor.name} id: ${this.id} objects: ${serializeObject3DArray(
      this.objects
    )} newParent: ${serializeObject3D(this.newParent)} newBefore: ${serializeObject3D(this.newBefore)}`;
  }
}
