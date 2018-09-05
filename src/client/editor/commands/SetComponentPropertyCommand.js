import Command from "../Command";

/**
 * @param object THREE.Object3D
 * @param componentName String
 * @constructor
 */

export default class SetComponentPropertyCommand extends Command {
  constructor(object, componentName, propertyName, value) {
    super();
    this.type = "SetComponentPropertyCommand";

    this.object = object;
    this.componentName = componentName;
    this.propertyName = propertyName;
    this.oldValue = this.editor.getComponentProperty(object, componentName, propertyName);
    this.newValue = value;

    this.name = `Set ${componentName}.${propertyName} on ${object.name}`;
  }

  execute() {
    this.editor.updateComponentProperty(this.object, this.componentName, this.propertyName, this.newValue);
  }

  undo() {
    this.editor.updateComponentProperty(this.object, this.componentName, this.propertyName, this.oldValue);
  }
}
