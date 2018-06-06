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

export default class SetMaterialColorCommand extends Command {
  constructor(object, attributeName, newValue, materialSlot) {
    super();

    this.type = "SetMaterialColorCommand";
    this.name = "Set Material." + attributeName;
    this.updatable = true;

    this.object = object;
    this.material = this.editor.getObjectMaterial(object, materialSlot);

    this.oldValue = this.material !== undefined ? this.material[attributeName].getHex() : undefined;
    this.newValue = newValue;

    this.attributeName = attributeName;
  }
  execute() {
    this.material[this.attributeName].setHex(this.newValue);

    this.editor.signals.materialChanged.dispatch(this.material);
  }

  undo() {
    this.material[this.attributeName].setHex(this.oldValue);

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

    this.object = this.editor.objectByUuid(json.objectUuid);
    this.attributeName = json.attributeName;
    this.oldValue = json.oldValue;
    this.newValue = json.newValue;
  }
}
