import Command from "./Command";

export default class SetObjectPropertyCommand extends Command {
  constructor(object, propertyName, value) {
    super();

    this.type = "SetObjectPropertyCommand";

    this.object = object;
    this.propertyName = propertyName;
    this.updatable = true;

    if (value && value.clone) {
      this.newValue = value.clone();
    } else {
      this.newValue = value;
    }

    const oldValue = this.object[propertyName];

    if (oldValue && oldValue.clone) {
      this.oldValue = oldValue.clone();
    } else {
      this.oldValue = oldValue;
    }
  }

  execute() {
    const value = this.object[this.propertyName];

    if (value && value.copy) {
      this.object[this.propertyName].copy(this.newValue);
    } else {
      this.object[this.propertyName] = this.newValue;
    }

    this.editor.signals.objectChanged.dispatch(this.object);
    this.editor.signals.propertyChanged.dispatch(this.propertyName, this.object);
  }

  undo() {
    const value = this.object[this.propertyName];

    if (value && value.copy) {
      this.object[this.propertyName].copy(this.oldValue);
    } else {
      this.object[this.propertyName] = this.oldValue;
    }

    this.editor.signals.objectChanged.dispatch(this.object);
    this.editor.signals.propertyChanged.dispatch(this.propertyName, this.object);
  }

  update(command) {
    const newValue = command.newValue;

    if (newValue && newValue.clone && newValue.copy) {
      this.newValue = newValue.clone();
      this.object[this.propertyName].copy(this.newValue);
    } else {
      this.newValue = newValue;
      this.object[this.propertyName] = this.newValue;
    }

    this.editor.signals.propertyChanged.dispatch(this.propertyName, this.object);
  }
}
