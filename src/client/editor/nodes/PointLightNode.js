import THREE from "../../vendor/three";
import EditorNodeMixin from "./EditorNodeMixin";
import PhysicalPointLight from "../objects/PhysicalPointLight";
import SpokePointLightHelper from "../helpers/SpokePointLightHelper";
import serializeColor from "../utils/serializeColor";

export default class PointLightNode extends EditorNodeMixin(PhysicalPointLight) {
  static legacyComponentName = "point-light";

  static nodeName = "Point Light";

  static async deserialize(editor, json) {
    const node = await super.deserialize(editor, json);

    const { color, intensity, range, castShadow, shadowMapResolution, shadowBias, shadowRadius } = json.components.find(
      c => c.name === "point-light"
    ).props;

    node.color.set(color);
    node.intensity = intensity;
    node.range = range;
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

    this.helper = new SpokePointLightHelper(this);
    this.helper.visible = false;
    this.add(this.helper);
  }

  copy(source, recursive) {
    super.copy(source, false);

    this.helper.update();

    if (recursive) {
      for (const child of source.children) {
        if (child !== this.helper) {
          const clonedChild = child.clone();
          this.add(clonedChild);
        }
      }
    }

    return this;
  }

  onSelect() {
    this.helper.visible = true;
  }

  onDeselect() {
    this.helper.visible = false;
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
