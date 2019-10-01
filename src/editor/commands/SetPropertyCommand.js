import Command from "./Command";
import { serializeObject3D, serializeProperty } from "../utils/debug";

export default class SetPropertyCommand extends Command {
  constructor(editor, object, propertyName, value, disableCopy) {
    super(editor);

    this.object = object;
    this.propertyName = propertyName;
    this.disableCopy = disableCopy;

    if (value && value.clone && !disableCopy) {
      this.newValue = value.clone();
    } else {
      this.newValue = value;
    }

    const oldValue = this.object[propertyName];

    if (oldValue && oldValue.clone && !disableCopy) {
      this.oldValue = oldValue.clone();
    } else {
      this.oldValue = oldValue;
    }
  }

  execute() {
    this.editor.setProperty(this.object, this.propertyName, this.newValue, false, true, this.disableCopy);
  }

  shouldUpdate(newCommand) {
    return this.object === newCommand.object && this.propertyName === newCommand.propertyName;
  }

  update(command) {
    const newValue = command.newValue;

    if (newValue && newValue.clone && newValue.copy && !this.disableCopy) {
      this.newValue = newValue.clone();
    } else {
      this.newValue = newValue;
    }

    this.editor.setProperty(this.object, this.propertyName, this.newValue, false, true, this.disableCopy);
  }

  undo() {
    this.editor.setProperty(this.object, this.propertyName, this.oldValue, false, true, this.disableCopy);
  }

  toString() {
    return `SetPropertyCommand id: ${this.id} object: ${serializeObject3D(this.object)} propertyName: ${
      this.propertyName
    } newValue: ${serializeProperty(this.newValue)}`;
  }
}
