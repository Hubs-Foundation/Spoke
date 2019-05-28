import THREE from "../../vendor/three";
import EditorNodeMixin from "./EditorNodeMixin";

export default class SphereNode extends EditorNodeMixin(THREE.Mesh) {
  static legacyComponentName = "sphere";

  static nodeName = "Sphere";

  static async deserialize(editor, json) {
    const node = await super.deserialize(editor, json);

    const { color, radius } = json.components.find(c => c.name === "sphere").props;

    node.color.set(color);
    node.radius = radius || 1;

    return node;
  }

  constructor(editor) {
    const geometry = new THREE.CircleBufferGeometry();
    const material = new THREE.MeshStandardMaterial();
    super(editor, geometry, material);
    this._radius = 1;
  }

  get color() {
    return this.material.color;
  }

  get radius() {
    return this._radius;
  }

  set radius(radius) {
    this._radius = radius;
    const newgeo = new THREE.CircleBufferGeometry(radius);
    this.geometry = newgeo;
  }

  serialize() {
    return super.serialize({
      sphere: {
        color: this.color,
        radius: this.radius
      }
    });
  }
}
