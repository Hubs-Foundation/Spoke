import { Object3D, BoxBufferGeometry, Material, Mesh, BoxHelper } from "three";
import EditorNodeMixin from "./EditorNodeMixin";

export default class BoxColliderNode extends EditorNodeMixin(Object3D) {
  static componentName = "box-collider";

  static nodeName = "Box Collider";

  static _geometry = new BoxBufferGeometry();

  static _material = new Material();

  static async deserialize(editor, json) {
    const node = await super.deserialize(editor, json);

    node.walkable = !!json.components.find(c => c.name === "walkable");

    return node;
  }

  constructor(editor) {
    super(editor);

    const boxMesh = new Mesh(BoxColliderNode._geometry, BoxColliderNode._material);
    const box = new BoxHelper(boxMesh, 0x00ff00);
    box.layers.set(1);
    this.helper = box;
    this.add(box);
    this.walkable = false;
  }

  copy(source, recursive = true) {
    if (recursive) {
      this.remove(this.helper);
    }

    super.copy(source, recursive);

    if (recursive) {
      const helperIndex = source.children.indexOf(source.helper);

      if (helperIndex !== -1) {
        const boxMesh = new Mesh(BoxColliderNode._geometry, BoxColliderNode._material);
        const box = new BoxHelper(boxMesh, 0x00ff00);
        box.layers.set(1);
        this.helper = box;
        box.parent = this;
        this.children.splice(helperIndex, 1, box);
      }
    }

    this.walkable = source.walkable;

    return this;
  }

  serialize() {
    const components = {
      "box-collider": {}
    };

    if (this.walkable) {
      components.walkable = {};
    }

    return super.serialize(components);
  }

  prepareForExport() {
    super.prepareForExport();
    this.remove(this.helper);
    this.addGLTFComponent("box-collider", {
      // TODO: Remove exporting these properties. They are already included in the transform props.
      position: this.position,
      rotation: {
        x: this.rotation.x,
        y: this.rotation.y,
        z: this.rotation.z
      },
      scale: this.scale
    });
  }
}
