import Command from "../Command";

/**
 * @author dforrer / https://github.com/dforrer
 * Developed as part of a project at University of Applied Sciences and Arts Northwestern Switzerland (www.fhnw.ch)
 */

/**
 * @param object THREE.Object3D
 * @param newScale THREE.Vector3
 * @param optionalOldScale THREE.Vector3
 * @constructor
 */

export default class SetScaleCommand extends Command {
  constructor(object, newScale, optionalOldScale) {
    super();

    this.type = "SetScaleCommand";
    this.name = "Set Scale";
    this.updatable = true;

    this.object = object;

    if (object !== undefined && newScale !== undefined) {
      this.oldScale = object.scale.clone();
      this.newScale = newScale.clone();
    }

    if (optionalOldScale !== undefined) {
      this.oldScale = optionalOldScale.clone();
    }
  }

  execute() {
    this.object.scale.copy(this.newScale);
    this.object.updateMatrixWorld(true);
    this.editor.signals.objectChanged.dispatch(this.object);
  }

  undo() {
    this.object.scale.copy(this.oldScale);
    this.object.updateMatrixWorld(true);
    this.editor.signals.objectChanged.dispatch(this.object);
  }

  update(command) {
    this.newScale.copy(command.newScale);
  }
}
