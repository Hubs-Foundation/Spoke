import * as THREE from "three";
import EditorNodeMixin from "./EditorNodeMixin";
import PhysicalHemisphereLight from "../objects/PhysicalHemisphereLight";
import serializeColor from "../utils/serializeColor";

export default class HemisphereLightNode extends EditorNodeMixin(PhysicalHemisphereLight) {
  static legacyComponentName = "hemisphere-light";

  static hideTransform = true;

  static nodeName = "Hemisphere Light";

  static async deserialize(editor, json) {
    const node = await super.deserialize(editor, json);

    const { skyColor, groundColor, intensity } = json.components.find(c => c.name === "hemisphere-light").props;

    node.skyColor.set(skyColor);
    node.groundColor.set(groundColor);
    node.intensity = intensity;

    return node;
  }

  serialize() {
    const json = super.serialize();

    json.components.push({
      name: "hemisphere-light",
      props: {
        skyColor: serializeColor(this.skyColor),
        groundColor: serializeColor(this.groundColor),
        intensity: this.intensity
      }
    });

    return json;
  }

  prepareForExport() {
    const replacementObject = new THREE.Object3D().copy(this, false);

    replacementObject.userData.gltfExtensions = {
      HUBS_components: {
        "hemisphere-light": {
          skyColor: serializeColor(this.skyColor),
          groundColor: serializeColor(this.groundColor),
          intensity: this.intensity
        }
      }
    };

    this.parent.add(replacementObject);
    this.parent.remove(this);
  }
}
