import THREE from "../three";
import EditorNodeMixin from "./EditorNodeMixin";
import Picker from "../objects/Picker";
import PhysicalDirectionalLight from "../objects/PhysicalDirectionalLight";
import SpokeDirectionalLightHelper from "../helpers/SpokeDirectionalLightHelper";

export default class DirectionalLightNode extends EditorNodeMixin(PhysicalDirectionalLight) {
  static legacyComponentName = "directional-light";

  static nodeName = "Directional Light";

  static async deserialize(editor, json) {
    const node = await super.deserialize(editor, json);

    const { color, intensity, castShadow } = json.components.find(c => c.name === "directional-light").props;

    node.color.set(color);
    node.intensity = intensity;
    node.castShadow = castShadow;

    return node;
  }

  constructor() {
    super();

    this.picker = new Picker();
    this.add(this.picker);

    this.helper = new SpokeDirectionalLightHelper(this);
    this.add(this.helper);
  }

  onChange() {
    this.helper.update();
  }

  copy(source, recursive) {
    super.copy(source, false);

    this.helper.update();

    if (recursive) {
      for (const child of source.children) {
        if (child !== this.helper && child !== this.picker) {
          const clonedChild = child.clone();
          this.add(clonedChild);
        }
      }
    }

    return this;
  }

  serialize() {
    const json = super.serialize();

    json.components.push({
      name: "directional-light",
      props: {
        color: this.color,
        intensity: this.intensity,
        castShadow: this.castShadow
      }
    });

    return json;
  }

  prepareForExport() {
    this.remove(this.helper);
    this.remove(this.picker);

    const replacementObject = new THREE.Object3D();

    replacementObject.userData.gltfExtensions = {
      HUBS_components: {
        "directional-light": {
          color: this.color,
          intensity: this.intensity,
          castShadow: this.castShadow
        }
      }
    };

    this.parent.add(replacementObject);
    this.parent.remove(this);
  }
}
