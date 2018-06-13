import THREE from "../../vendor/three";
import Command from "../Command";
import Editor from "../Editor";

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
    const component = Editor.gltfComponents.get(this.componentName);
    component.inflate(this.object);
    this.editor.signals.objectChanged.dispatch(this.object);
  }

  undo() {}

  toJSON() {
    const output = super.toJSON();
    output.object = this.object.toJSON();
    output.component = this.component;

    return output;
  }

  fromJSON(json) {
    super.fromJSON(json);

    this.object = this.editor.objectByUuid(json.object.object.uuid);
    this.component = json.component;

    // TODO: Does this make sense for AddGLTFComponentCommand?
    if (this.object === undefined) {
      const loader = new THREE.ObjectLoader();
      this.object = loader.parse(json.object);
    }
  }
}
