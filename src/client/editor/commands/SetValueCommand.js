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
    this.editor.updateObjectAttribute(this.object, this.attributeName, this.newValue);
    this.editor.signals.objectChanged.dispatch(this.object);
    // this.editor.signals.sceneGraphChanged.dispatch();
  }

  undo() {
    this.editor.updateObjectAttribute(this.object, this.attributeName, this.oldValue);
    this.editor.signals.objectChanged.dispatch(this.object);
    // this.editor.signals.sceneGraphChanged.dispatch();
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

    this.attributeName = json.attributeName;
    this.oldValue = json.oldValue;
    this.newValue = json.newValue;
    this.object = this.editor.objectByUuid(json.objectUuid);
  }
}
