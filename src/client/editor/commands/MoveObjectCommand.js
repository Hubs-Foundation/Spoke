import Command from "./Command";
import * as THREE from "three";

/**
 * @author dforrer / https://github.com/dforrer
 * Developed as part of a project at University of Applied Sciences and Arts Northwestern Switzerland (www.fhnw.ch)
 */

/**
 * @param object THREE.Object3D
 * @param newParent THREE.Object3D
 * @param newBefore THREE.Object3D
 * @constructor
 */

const matrix = new THREE.Matrix4();
export default class MoveObjectCommand extends Command {
  constructor(object, newParent, newBefore) {
    super();

    this.type = "MoveObjectCommand";
    this.name = "Move Object";

    this.object = object;
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
    this.oldParent.remove(this.object);

    if (this.newParent !== this.oldParent) {
      // Maintain world position when reparenting.
      this.object.matrix.multiplyMatrices(this.oldParent.matrixWorld, this.object.matrix);
      this.object.applyMatrix(matrix.getInverse(this.newParent.matrixWorld));
    }
    const children = this.newParent.children;
    children.splice(this.newIndex, 0, this.object);
    this.object.parent = this.newParent;

    this.editor.signals.sceneGraphChanged.dispatch();
  }

  undo() {
    this.newParent.remove(this.object);

    const children = this.oldParent.children;
    children.splice(this.oldIndex, 0, this.object);
    this.object.parent = this.oldParent;

    this.editor.signals.sceneGraphChanged.dispatch();
  }
}
