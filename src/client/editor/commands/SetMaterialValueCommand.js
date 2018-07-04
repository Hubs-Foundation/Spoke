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

export default class SetMaterialValueCommand extends Command {
  constructor(object, attributeName, newValue, materialSlot) {
    super();

    this.type = "SetMaterialValueCommand";
    this.name = "Set Material." + attributeName;
    this.updatable = true;

    this.object = object;
    this.material = this.editor.getObjectMaterial(object, materialSlot);

    this.oldValue = this.material !== undefined ? this.material[attributeName] : undefined;
    this.newValue = newValue;

    this.attributeName = attributeName;
  }

  execute() {
    this.material[this.attributeName] = this.newValue;
    this.material.needsUpdate = true;

    this.editor.signals.objectChanged.dispatch(this.object);
    this.editor.signals.materialChanged.dispatch(this.material);
  }

  undo() {
    this.material[this.attributeName] = this.oldValue;
    this.material.needsUpdate = true;

    this.editor.signals.objectChanged.dispatch(this.object);
    this.editor.signals.materialChanged.dispatch(this.material);
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
