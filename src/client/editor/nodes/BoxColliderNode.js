import THREE from "../../vendor/three";
import EditorNodeMixin from "./EditorNodeMixin";

export default class BoxColliderNode extends EditorNodeMixin(THREE.Object3D) {
  static legacyComponentName = "box-collider";

  static nodeName = "Box Collider";

  static _geometry = new THREE.BoxBufferGeometry();

  static _material = new THREE.Material();

  constructor() {
    super();

    const boxMesh = new THREE.Mesh(BoxColliderNode._geometry, BoxColliderNode._material);
    const box = new THREE.BoxHelper(boxMesh, 0x00ff00);
    box.layers.set(1);
    this.helper = box;
    this.add(box);
  }

  copy(source, recursive) {
    super.copy(source, false);

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

  serialize() {
    const json = super.serialize();

    json.components.push({
      name: "box-collider",
      props: {}
    });

    return json;
  }

  prepareForExport() {
    this.userData.gltfExtensions = {
      HUBS_components: {
        "box-collider": {
          // TODO: Remove exporting these properties. They are already included in the transform props.
          position: this.position,
          rotation: this.rotation,
          scale: this.scale
        }
      }
    };

    this.remove(this.helper);
  }
}
