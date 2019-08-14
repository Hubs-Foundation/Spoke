import Command from "./Command";

export default class SetPropertyCommand extends Command {
  constructor(editor, object, propertyName, value) {
    super(editor);
    this.updatable = true;

    this.object = object;
    this.propertyName = propertyName;

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
    this.editor.setProperty(this.object, this.propertyName, this.newValue, false);
  }

  update(command) {
    const newValue = command.newValue;

    if (newValue && newValue.clone && newValue.copy) {
      this.newValue = newValue.clone();
    } else {
      this.newValue = newValue;
    }

    this.editor.setProperty(this.object, this.propertyName, this.newValue, false);
  }

  undo() {
    this.editor.setProperty(this.object, this.propertyName, this.oldValue, false);
  }
}
