import Command from "../Command";

/**
 * @author dforrer / https://github.com/dforrer
 * Developed as part of a project at University of Applied Sciences and Arts Northwestern Switzerland (www.fhnw.ch)
 */

/**
 * @param object THREE.Object3D
 * @param attributeName string
 * @param newValue integer representing a hex color value
 * @constructor
 */

export default class SetColorCommand extends Command {
  constructor(object, attributeName, newValue) {
    super();

    this.type = "SetColorCommand";
    this.name = "Set " + attributeName;
    this.updatable = true;

    this.object = object;
    this.attributeName = attributeName;
    this.oldValue = object !== undefined ? this.object[this.attributeName].getHex() : undefined;
    this.newValue = newValue;
  }

  execute() {
    this.object[this.attributeName].setHex(this.newValue);
    this.editor.signals.objectChanged.dispatch(this.object);
  }

  undo() {
    this.object[this.attributeName].setHex(this.oldValue);
    this.editor.signals.objectChanged.dispatch(this.object);
  }

  update(cmd) {
    this.newValue = cmd.newValue;
  }

  toJSON() {
    const output = super.toJSON();

    output.objectUuid = this.object.uuid;
    output.attributeName = this.attributeName;
    output.oldValue = this.oldValue;
    output.newValue = this.newValue;

    return output;
  }

  fromJSON(json) {
    super.fromJSON(json);

    this.object = this.editor.objectByUuid(json.objectUuid);
    this.attributeName = json.attributeName;
    this.oldValue = json.oldValue;
    this.newValue = json.newValue;
  }
}
