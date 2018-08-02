import Command from "../Command";

/**
 * @author dforrer / https://github.com/dforrer
 * Developed as part of a project at University of Applied Sciences and Arts Northwestern Switzerland (www.fhnw.ch)
 */

/**
 * @param object THREE.Object3D
 * @param attributeName string
 * @param newValue number, string, boolean or object
 * @constructor
 */

export default class SetValueCommand extends Command {
  constructor(object, attributeName, newValue) {
    super();

    this.type = "SetValueCommand";
    this.name = "Set " + attributeName;
    this.updatable = true;

    this.object = object;
    this.attributeName = attributeName;
    this.oldValue = object !== undefined ? object[attributeName] : undefined;
    this.newValue = newValue;
  }

  execute() {
    this.editor.updateObject(this.object, this.attributeName, this.newValue);
    this.editor.signals.objectChanged.dispatch(this.object);
  }

  undo() {
    this.editor.updateObject(this.object, this.attributeName, this.oldValue);
    this.editor.signals.objectChanged.dispatch(this.object);
  }

  update(cmd) {
    this.newValue = cmd.newValue;
  }
}
