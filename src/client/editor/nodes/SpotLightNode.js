import THREE from "../../vendor/three";
import EditorNodeMixin from "./EditorNodeMixin";
import Picker from "../objects/Picker";
import PhysicalSpotLight from "../objects/PhysicalSpotLight";
import SpokeSpotLightHelper from "../helpers/SpokeSpotLightHelper";
import serializeColor from "../utils/serializeColor";

export default class SpotLightNode extends EditorNodeMixin(PhysicalSpotLight) {
  static legacyComponentName = "spot-light";

  static nodeName = "Spot Light";

  static async deserialize(editor, json) {
    const node = await super.deserialize(editor, json);

    const {
      color,
      intensity,
      range,
      innerConeAngle,
      outerConeAngle,
      castShadow,
      shadowMapResolution,
      shadowBias,
      shadowRadius
    } = json.components.find(c => c.name === "spot-light").props;

    node.color.set(color);
    node.intensity = intensity;
    node.range = range;
    node.innerConeAngle = innerConeAngle;
    node.outerConeAngle = outerConeAngle;
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

    this.helper = new SpokeSpotLightHelper(this);
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
      name: "spot-light",
      props: {
        color: serializeColor(this.color),
        intensity: this.intensity,
        range: this.range,
        innerConeAngle: this.innerConeAngle,
        outerConeAngle: this.outerConeAngle,
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
        "spot-light": {
          color: serializeColor(this.color),
          intensity: this.intensity,
          range: this.range,
          innerConeAngle: this.innerConeAngle,
          outerConeAngle: this.outerConeAngle,
          castShadow: this.castShadow,
          shadowMapResolution: this.shadowMapResolution.toArray()
        }
      }
    };

    this.parent.add(replacementObject);
    this.parent.remove(this);
  }
}
