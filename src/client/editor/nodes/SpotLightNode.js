import THREE from "../three";
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

    const { color, intensity, range, innerConeAngle, outerConeAngle, castShadow } = json.components.find(
      c => c.name === "spot-light"
    ).props;

    node.color.set(color);
    node.intensity = intensity;
    node.range = range;
    node.innerConeAngle = innerConeAngle;
    node.outerConeAngle = outerConeAngle;
    node.castShadow = castShadow;

    return node;
  }

  constructor() {
    super();

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
        "spot-light": {
          color: serializeColor(this.color),
          intensity: this.intensity,
          range: this.range,
          innerConeAngle: this.innerConeAngle,
          outerConeAngle: this.outerConeAngle,
          castShadow: this.castShadow
        }
      }
    };

    this.parent.add(replacementObject);
    this.parent.remove(this);
  }
}
