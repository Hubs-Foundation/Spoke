import THREE from "../../vendor/three";
import Command from "../Command";

/**
 * @author dforrer / https://github.com/dforrer
 * Developed as part of a project at University of Applied Sciences and Arts Northwestern Switzerland (www.fhnw.ch)
 */

/**
 * @param object THREE.Object3D
 * @param newRotation THREE.Euler
 * @param optionalOldRotation THREE.Euler
 * @constructor
 */

export default class SetRotationCommand extends Command {
  constructor(object, newRotation, optionalOldRotation) {
    super();

    this.type = "SetRotationCommand";
    this.name = "Set Rotation";
    this.updatable = true;

    this.object = object;

    if (object !== undefined && newRotation !== undefined) {
      this.oldRotation = object.rotation.clone();
      this.newRotation = newRotation.clone();
    }

    if (optionalOldRotation !== undefined) {
      this.oldRotation = optionalOldRotation.clone();
    }
  }

  execute() {
    this.object.rotation.copy(this.newRotation);
    this.object.updateMatrixWorld(true);
    this.editor.signals.objectChanged.dispatch(this.object);
  }

  undo() {
    this.object.rotation.copy(this.oldRotation);
    this.object.updateMatrixWorld(true);
    this.editor.signals.objectChanged.dispatch(this.object);
  }

  update(command) {
    this.newRotation.copy(command.newRotation);
  }

  toJSON() {
    const output = super.toJSON();

    output.objectUuid = this.object.uuid;
    output.oldRotation = this.oldRotation.toArray();
    output.newRotation = this.newRotation.toArray();

    return output;
  }

  fromJSON(json) {
    super.fromJSON(json);

    this.object = this.editor.objectByUuid(json.objectUuid);
    this.oldRotation = new THREE.Euler().fromArray(json.oldRotation);
    this.newRotation = new THREE.Euler().fromArray(json.newRotation);
  }
}
