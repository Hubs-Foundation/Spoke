import Command from "./Command";

export default class SetPropertiesCommand extends Command {
  constructor(editor, object, properties) {
    super(editor);

    this.object = object;
    this.newProperties = {};
    this.oldProperties = {};

    for (const propertyName in properties) {
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
}
