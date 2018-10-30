import THREE from "../three";
import EditorNodeMixin from "./EditorNodeMixin";
import PhysicalHemisphereLight from "../objects/PhysicalHemisphereLight";

export default class HemisphereLightNode extends EditorNodeMixin(PhysicalHemisphereLight) {
  static legacyComponentName = "hemisphere-light";

  static hideTransform = true;

  static nodeName = "Hemisphere Light";

  static async deserialize(editor, json) {
    const node = super.deserialize(editor, json);

    const { skyColor, groundColor, intensity } = json.components.find(c => c.name === "hemisphere-light").props;

    node.skyColor.copy(skyColor);
    node.groundColor.copy(groundColor);
    node.intensity = intensity;

    return node;
  }

  serialize() {
    const json = super.serialize();

    json.components.push({
      name: "hemisphere-light",
      props: {
        skyColor: this.skyColor,
        groundColor: this.groundColor,
        intensity: this.intensity
      }
    });

    return json;
  }

  prepareForExport() {
    const replacementObject = new THREE.Object3D();

    replacementObject.userData.gltfExtensions = {
      HUBS_components: {
        "hemisphere-light": {
          skyColor: this.skyColor,
          groundColor: this.groundColor,
          intensity: this.intensity
        }
      }
    };

    this.parent.add(replacementObject);
    this.parent.remove(this);
  }
}
