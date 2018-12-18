import THREE from "../../vendor/three";
import EditorNodeMixin from "./EditorNodeMixin";
import Picker from "../objects/Picker";
import PhysicalPointLight from "../objects/PhysicalPointLight";
import SpokePointLightHelper from "../helpers/SpokePointLightHelper";
import serializeColor from "../utils/serializeColor";

export default class PointLightNode extends EditorNodeMixin(PhysicalPointLight) {
  static legacyComponentName = "point-light";

  static nodeName = "Point Light";

  static async deserialize(editor, json) {
    const node = await super.deserialize(editor, json);

    const { color, intensity, range, castShadow, shadowMapResolution } = json.components.find(
      c => c.name === "point-light"
    ).props;

    node.color.set(color);
    node.intensity = intensity;
    node.range = range;
    node.castShadow = castShadow;

    if (shadowMapResolution) {
      node.shadowMapResolution.fromArray(shadowMapResolution);
    }

    return node;
  }

  constructor(editor) {
    super(editor);

    this.picker = new Picker();
    this.add(this.picker);

    this.helper = new SpokePointLightHelper(this);
    this.add(this.helper);
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

  onChange() {
    this.helper.update();
  }

  serialize() {
    const json = super.serialize();

    json.components.push({
      name: "point-light",
      props: {
        color: serializeColor(this.color),
        intensity: this.intensity,
        range: this.range,
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
        "point-light": {
          color: serializeColor(this.color),
          intensity: this.intensity,
          range: this.range,
          castShadow: this.castShadow,
          shadowMapResolution: this.shadowMapResolution.toArray()
        }
      }
    };

    this.parent.add(replacementObject);
    this.parent.remove(this);
  }
}
