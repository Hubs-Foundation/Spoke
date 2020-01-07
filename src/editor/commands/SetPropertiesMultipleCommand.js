import Command from "./Command";
import { serializeProperties, serializeObject3DArray } from "../utils/debug";

export default class SetPropertiesMultipleCommand extends Command {
  constructor(editor, objects, properties) {
    super(editor);

    this.objects = objects.slice(0);
    this.newProperties = {};
    this.objectsOldProperties = [];

    for (const propertyName in properties) {
      if (!Object.prototype.hasOwnProperty.call(properties, propertyName)) continue;

      const value = properties[propertyName];

      if (value && value.clone) {
        this.newProperties[propertyName] = value.clone();
      } else {
        this.newProperties[propertyName] = value;
      }
    }

    for (let i = 0; i < objects.length; i++) {
      const object = objects[i];
      const objectOldProperties = {};

      for (const propertyName in properties) {
        if (!Object.prototype.hasOwnProperty.call(properties, propertyName)) continue;

        const oldValue = object[propertyName];

        if (oldValue && oldValue.clone) {
          objectOldProperties[propertyName] = oldValue.clone();
        } else {
          objectOldProperties[propertyName] = oldValue;
        }
      }

      this.objectsOldProperties.push(objectOldProperties);
    }
  }

  execute() {
    this.editor.setPropertiesMultiple(this.objects, this.newProperties, false);
  }

  undo() {
    for (let i = 0; i < this.objects.length; i++) {
      this.editor.setProperties(this.objects[i], this.objectsOldProperties[i], false, false);
    }

    this.editor.emit("objectsChanged", this.objects);
  }

  toString() {
    return `SetPropertiesMultipleCommand id: ${this.id} objects: ${serializeObject3DArray(
      this.objects
    )} properties: ${serializeProperties(this.newProperties)}`;
  }
}
