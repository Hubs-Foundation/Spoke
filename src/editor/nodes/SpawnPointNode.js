import THREE from "../../vendor/three";
import EditorNodeMixin from "./EditorNodeMixin";
import spawnPointModelUrl from "../../assets/spawn-point.glb";
import loadGLTF from "../utils/loadGLTF";

let spawnPointHelperModel = null;

export default class SpawnPointNode extends EditorNodeMixin(THREE.Object3D) {
  static legacyComponentName = "spawn-point";

  static nodeName = "Spawn Point";

  static async load() {
    const { scene } = await loadGLTF(spawnPointModelUrl);

    scene.traverse(child => {
      if (child.isMesh) {
        child.layers.enable(3);
      }
    });

    spawnPointHelperModel = scene;
  }

  constructor(editor) {
    super(editor);
    this.helper = spawnPointHelperModel.clone();
    this.add(this.helper);
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
    return super.serialize({
      "spawn-point": {}
    });
  }

  prepareForExport() {
    super.prepareForExport();
    this.remove(this.helper);
    this.addGLTFComponent("spawn-point", {});
  }
}
