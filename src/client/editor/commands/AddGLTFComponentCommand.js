import Command from "../Command";

/**
 * @param object THREE.Object3D
 * @param componentName String
 * @constructor
 */

export default class AddGLTFComponentCommand extends Command {
  constructor(object, componentName) {
    super();
    this.type = "AddGLTFComponentCommand";

    this.object = object;
    this.componentName = componentName;

    this.name = `Add ${object.name} GLTF Component to ${componentName}`;
  }

  execute() {
    const componentClass = this.editor.gltfComponents.get(this.componentName);
    const component = componentClass.inflate(this.object);
    component.shouldSave = true;
    this.object.traverse(child => {
      this.editor.addHelper(child, this.object);
    });
    this.editor.signals.objectChanged.dispatch(this.object);
  }

  undo() {
    const component = this.editor.gltfComponents.get(this.componentName);
    component.deflate(this.object);
    this.editor.removeHelper(this.object);
    this.editor.signals.objectChanged.dispatch(this.object);
  }
}
