import THREE from "../../vendor/three";
import EditorNodeMixin from "./EditorNodeMixin";
import GroundPlane from "../objects/GroundPlane";
import serializeColor from "../utils/serializeColor";

export default class GroundPlaneNode extends EditorNodeMixin(GroundPlane) {
  static legacyComponentName = "ground-plane";

  static nodeName = "Ground Plane";

  static async deserialize(editor, json) {
    const node = await super.deserialize(editor, json);

    const { color } = json.components.find(c => c.name === "ground-plane").props;

    node.color.set(color);

    return node;
  }

  serialize() {
    const json = super.serialize();

    json.components.push({
      name: "ground-plane",
      props: {
        color: serializeColor(this.color)
      }
    });

    return json;
  }

  prepareForExport() {
    const groundPlaneCollider = new THREE.Object3D();
    groundPlaneCollider.scale.set(4000, 0.01, 4000);
    groundPlaneCollider.userData.gltfExtensions = {
      HUBS_components: {
        "box-collider": {}
      }
    };
    this.add(groundPlaneCollider);
  }
}
