import Command from "../Command";

/**
 * @param object THREE.Object3D
 * @param componentName String
 * @constructor
 */

export default class AddComponentCommand extends Command {
  constructor(object, componentName) {
    super();
    this.type = "AddComponentCommand";

    this.object = object;
    this.componentName = componentName;

    this.name = `Add ${object.name} Component to ${componentName}`;
  }

  execute() {
    this.editor.addComponent(this.object, this.componentName).then(() => {
      this.editor.signals.objectChanged.dispatch(this.object);
    });
  }

  undo() {
    this.editor.removeComponent(this.object, this.componentName);
    this.editor.removeHelper(this.object);
    this.editor.signals.objectChanged.dispatch(this.object);
  }
}
