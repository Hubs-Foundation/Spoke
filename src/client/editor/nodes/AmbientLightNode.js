import * as THREE from "three";
import EditorNodeMixin from "./EditorNodeMixin";
import serializeColor from "../utils/serializeColor";

export default class AmbientLightNode extends EditorNodeMixin(THREE.AmbientLight) {
  static legacyComponentName = "ambient-light";

  static nodeName = "Ambient Light";

  static hideTransform = true;

  static async deserialize(editor, json) {
    const node = await super.deserialize(editor, json);

    const { color, intensity } = json.components.find(c => c.name === "ambient-light").props;

    node.color.set(color);
    node.intensity = intensity;

    return node;
  }

  serialize() {
    const json = super.serialize();

    json.components.push({
      name: "ambient-light",
      props: {
        color: serializeColor(this.color),
        intensity: this.intensity
      }
    });

    return json;
  }

  prepareForExport() {
    const replacementObject = new THREE.Object3D().copy(this, false);

    replacementObject.userData.gltfExtensions = {
      HUBS_components: {
        "ambient-light": {
          color: serializeColor(this.color),
          intensity: this.intensity
        }
      }
    };

    this.parent.add(replacementObject);
    this.parent.remove(this);
  }
}
