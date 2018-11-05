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
    this.editor.signals.transformChanged.dispatch(this.object);
  }

  undo() {
    this.object.rotation.copy(this.oldRotation);
    this.object.updateMatrixWorld(true);
    this.editor.signals.objectChanged.dispatch(this.object);
    this.editor.signals.transformChanged.dispatch(this.object);
  }

  update(command) {
    this.newRotation.copy(command.newRotation);
  }
}
