import Command from "../Command";

/**
 * @param object THREE.Object3D
 * @param componentName String
 * @constructor
 */

export default class SetGLTFComponentPropertyCommand extends Command {
  constructor(object, componentName, propertyName, value) {
    super();
    this.type = "SetGLTFComponentPropertyCommand";

    this.object = object;
    this.componentName = componentName;
    this.propertyName = propertyName;
    this.value = value;

    this.name = `Set ${componentName}.${propertyName} on ${object.name}`;
  }

  execute() {
    const component = this.editor.gltfComponents.get(this.componentName);
    component.updateProperty(this.object, this.propertyName, this.value);
    this.editor.signals.objectChanged.dispatch(this.object);
  }

  undo() {}

  toJSON() {}

  fromJSON() {}
}
