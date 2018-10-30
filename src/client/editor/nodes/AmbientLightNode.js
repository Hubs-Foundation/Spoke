import THREE from "../three";
import EditorNodeMixin from "./EditorNodeMixin";

export default class AmbientLightNode extends EditorNodeMixin(THREE.AmbientLight) {
  static legacyComponentName = "ambient-light";

  static nodeName = "Ambient Light";

  static hideTransform = true;

  static async deserialize(editor, json) {
    const node = super.deserialize(editor, json);

    const { color, intensity } = json.components.find(c => c.name === "ambient-light").props;

    node.color.copy(color);
    node.intensity = intensity;

    return node;
  }

  serialize() {
    const json = super.serialize();

    json.components.push({
      name: "ambient-light",
      props: {
        color: this.color,
        intensity: this.intensity
      }
    });

    return json;
  }

  prepareForExport() {
    const replacementObject = new THREE.Object3D();

    replacementObject.userData.gltfExtensions = {
      HUBS_components: {
        "ambient-light": {
          color: this.color,
          intensity: this.intensity
        }
      }
    };

    this.parent.add(replacementObject);
    this.parent.remove(this);
  }
}
