import Command from "./Command";
import { serializeObject3D, serializeProperties } from "../utils/debug";

export default class SetPropertiesCommand extends Command {
  constructor(editor, object, properties) {
    super(editor);

    this.object = object;
    this.newProperties = {};
    this.oldProperties = {};

    for (const propertyName in properties) {
      if (!Object.prototype.hasOwnProperty.call(properties, propertyName)) continue;

      const value = properties[propertyName];

      if (value && value.clone) {
        this.newProperties[propertyName] = value.clone();
      } else {
        this.newProperties[propertyName] = value;
      }

      const oldValue = this.object[propertyName];

      if (oldValue && oldValue.clone) {
        this.oldProperties[propertyName] = oldValue.clone();
      } else {
        this.oldProperties[propertyName] = oldValue;
      }
    }
  }

  execute() {
    this.editor.setProperties(this.object, this.newProperties, false);
  }

  undo() {
    this.editor.setProperties(this.object, this.oldProperties, false);
  }

  toString() {
    return `SetPropertiesCommand id: ${this.id} object: ${serializeObject3D(
      this.object
    )} properties: ${serializeProperties(this.newProperties)}`;
  }
}
