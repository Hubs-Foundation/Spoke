import Command from "./Command";
import { Matrix4 } from "three";

/**
 * @author dforrer / https://github.com/dforrer
 * Developed as part of a project at University of Applied Sciences and Arts Northwestern Switzerland (www.fhnw.ch)
 */

/**
 * @param object Object3D
 * @param newParent Object3D
 * @param newBefore Object3D
 * @constructor
 */

const matrix = new Matrix4();
export default class MoveObjectCommand extends Command {
  constructor(object, newParent, newBefore) {
    super();

    this.type = "MoveObjectCommand";
    this.name = "Move Object";

    this.object = object;
    this.oldMatrix = this.object.matrix.clone();
    this.oldParent = object !== undefined ? object.parent : undefined;
    this.oldIndex = this.oldParent !== undefined ? this.oldParent.children.indexOf(this.object) : undefined;
    this.newParent = newParent;

    if (newBefore !== undefined) {
      this.newIndex = newParent !== undefined ? newParent.children.indexOf(newBefore) : undefined;
    } else {
      this.newIndex = newParent !== undefined ? newParent.children.length : undefined;
    }

    if (this.oldParent === this.newParent && this.newIndex > this.oldIndex) {
      this.newIndex--;
    }

    this.newBefore = newBefore;
  }

  execute() {
    if (this.newParent !== this.oldParent) {
      // Maintain world position when reparenting.
      this.newParent.updateWorldMatrix(true, false);

      matrix.getInverse(this.newParent.matrixWorld);

      this.oldParent.updateWorldMatrix(true, false);
      matrix.multiply(this.oldParent.matrixWorld);

      this.object.applyMatrix(matrix);

      this.object.updateWorldMatrix(false, false);
    }

    this.oldParent.children.splice(this.oldIndex, 1);

    this.object.parent = this.newParent;

    const children = this.newParent.children;
    children.splice(this.newIndex, 0, this.object);

    this.editor.signals.sceneGraphChanged.dispatch();
  }

  undo() {
    const object = this.object;
    this.newParent.remove(object);

    const children = this.oldParent.children;
    children.splice(this.oldIndex, 0, object);
    object.parent = this.oldParent;
    this.oldMatrix.decompose(object.position, object.quaternion, object.scale);

    this.editor.signals.sceneGraphChanged.dispatch();
  }
}
