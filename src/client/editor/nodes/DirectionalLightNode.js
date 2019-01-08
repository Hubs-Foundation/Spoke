import THREE from "../../vendor/three";
import EditorNodeMixin from "./EditorNodeMixin";
import Picker from "../objects/Picker";
import PhysicalDirectionalLight from "../objects/PhysicalDirectionalLight";
import SpokeDirectionalLightHelper from "../helpers/SpokeDirectionalLightHelper";
import serializeColor from "../utils/serializeColor";

export default class DirectionalLightNode extends EditorNodeMixin(PhysicalDirectionalLight) {
  static legacyComponentName = "directional-light";

  static nodeName = "Directional Light";

  static async deserialize(editor, json) {
    const node = await super.deserialize(editor, json);

    const { color, intensity, castShadow, shadowMapResolution, shadowBias, shadowRadius } = json.components.find(
      c => c.name === "directional-light"
    ).props;

    node.color.set(color);
    node.intensity = intensity;
    node.castShadow = castShadow;
    node.shadowBias = shadowBias || 0;
    node.shadowRadius = shadowRadius === undefined ? 1 : shadowRadius;

    if (shadowMapResolution) {
      node.shadowMapResolution.fromArray(shadowMapResolution);
    }

    return node;
  }

  constructor(editor) {
    super(editor);

    this.picker = new Picker();
    this.add(this.picker);

    this.helper = new SpokeDirectionalLightHelper(this);
    this.add(this.helper);
  }

  onAdd() {
    this.helper.update();
  }

  onChange() {
    this.helper.update();
  }

  copy(source, recursive) {
    super.copy(source, false);

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
        color: serializeColor(this.color),
        intensity: this.intensity,
        castShadow: this.castShadow,
        shadowMapResolution: this.shadowMapResolution.toArray()
      }
    });

    return json;
  }

  prepareForExport() {
    this.remove(this.helper);
    this.remove(this.picker);

    const replacementObject = new THREE.Object3D().copy(this, false);

    replacementObject.userData.gltfExtensions = {
      HUBS_components: {
        "directional-light": {
          color: serializeColor(this.color),
          intensity: this.intensity,
          castShadow: this.castShadow,
          shadowMapResolution: this.shadowMapResolution.toArray()
        }
      }
    };

    this.parent.add(replacementObject);
    this.parent.remove(this);
  }
}
