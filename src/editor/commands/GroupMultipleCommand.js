import Command from "./Command";
import { serializeObject3DArray, serializeObject3D } from "../utils/debug";
import reverseDepthFirstTraverse from "../utils/reverseDepthFirstTraverse";

export default class GroupMultipleCommand extends Command {
  constructor(editor, objects, groupParent, groupBefore) {
    super(editor);
    this.objects = [];
    this.undoObjects = [];
    this.groupParent = groupParent;
    this.groupBefore = groupBefore;
    this.oldParents = [];
    this.oldBefores = [];
    this.oldSelection = editor.selected.slice(0);

    editor.scene.traverse(object => {
      if (objects.indexOf(object) !== -1) {
        this.objects.push(object);
      }
    });

    // Sort objects, parents, and befores with a reverse depth first search so that undo adds nodes in the correct order
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

    this.groupNode = null;
  }

  execute() {
    this.groupNode = this.editor.groupMultiple(this.objects, this.groupParent, this.groupBefore, false);
  }

  undo() {
    for (let i = 0; i < this.objects.length; i++) {
      this.editor.reparent(this.undoObjects[i], this.oldParents[i], this.oldBefores[i], false, false, false, false);
    }

    this.editor.removeObject(this.groupNode, false, false, false);

    this.editor.updateTransformRoots();

    this.editor.emit("sceneGraphChanged");

    this.editor.setSelection(this.oldSelection, false, true, false);
  }

  toString() {
    return `GroupMultipleObjectsCommand id: ${this.id} objects: ${serializeObject3DArray(
      this.objects
    )} groupParent: ${serializeObject3D(this.groupParent)} groupBefore: ${serializeObject3D(this.groupBefore)}`;
  }
}
