import Command from "./Command";
import { serializeObject3DArray, serializeObject3D, serializeVector3 } from "../utils/debug";
import reverseDepthFirstTraverse from "../utils/reverseDepthFirstTraverse";
import { TransformSpace } from "../Editor";

export default class ReparentMultipleWithPositionCommand extends Command {
  constructor(editor, objects, newParent, newBefore, position) {
    super(editor);
    this.objects = [];
    this.undoObjects = [];
    this.newParent = newParent;
    this.newBefore = newBefore;
    this.oldParents = [];
    this.oldBefores = [];
    this.oldSelection = editor.selected.slice(0);
    this.oldPositions = objects.map(o => o.position.clone());
    this.position = position.clone();

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
    this.editor.setPositionMultiple(this.objects, this.position, TransformSpace.Local, false);
  }

  undo() {
    for (let i = 0; i < this.objects.length; i++) {
      this.editor.reparent(this.undoObjects[i], this.oldParents[i], this.oldBefores[i], false, false, false, false);
    }

    for (let i = 0; i < this.objects.length; i++) {
      this.editor.setPosition(this.objects[i], this.oldPositions[i], TransformSpace.Local, false, false);
    }

    this.editor.setSelection(this.oldSelection, false, true, false);

    this.editor.updateTransformRoots();

    this.editor.emit("sceneGraphChanged");
    this.editor.emit("objectsChanged", this.objects, "position");
  }

  toString() {
    return `${this.constructor.name} id: ${this.id} objects: ${serializeObject3DArray(
      this.objects
    )} newParent: ${serializeObject3D(this.newParent)} newBefore: ${serializeObject3D(
      this.newBefore
    )} position: ${serializeVector3(this.position)}`;
  }
}
