import Command from "../Command";

export default class SetObjectPropertyCommand extends Command {
  constructor(object, propertyName, value) {
    super();

    this.type = "SetObjectPropertyCommand";

    this.object = object;
    this.propertyName = propertyName;

    if (value.clone) {
      this.newValue = value.clone();
    } else {
      this.newValue = value;
    }

    if (this.object[propertyName].clone) {
      this.oldValue = this.object[propertyName].clone();
    } else {
      this.oldValue = this.object[propertyName];
    }
  }

  execute() {
    if (this.object[this.propertyName].copy) {
      this.object[this.propertyName].copy(this.newValue);
    } else {
      this.object[this.propertyName] = this.newValue;
    }

    this.editor.signals.objectChanged.dispatch(this.object);
  }

  undo() {
    if (this.object[this.propertyName].copy) {
      this.object[this.propertyName].copy(this.oldValue);
    } else {
      this.object[this.propertyName] = this.oldValue;
    }

    this.editor.signals.objectChanged.dispatch(this.object);
  }
}
