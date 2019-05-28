import THREE from "../../vendor/three";
import EditorNodeMixin from "./EditorNodeMixin";

export default class BoxNode extends EditorNodeMixin(THREE.Mesh) {
  static legacyComponentName = "box";

  static nodeName = "Box";

  static async deserialize(editor, json) {
    const node = await super.deserialize(editor, json);

    const { color } = json.components.find(c => c.name === "box").props;

    node.color.set(color);

    return node;
  }

  constructor(editor) {
    const geometry = new THREE.BoxBufferGeometry();
    const material = new THREE.MeshStandardMaterial();
    super(editor, geometry, material);
  }

  get color() {
    return this.material.color;
  }

  serialize() {
    return super.serialize({
      box: {
        color: this.color
      }
    });
  }
}
