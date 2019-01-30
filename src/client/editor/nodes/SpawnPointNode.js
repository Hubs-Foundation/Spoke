import THREE from "../../vendor/three";
import EditorNodeMixin from "./EditorNodeMixin";
import spawnPointModelUrl from "../../assets/spawn-point.glb";
import eventToMessage from "../utils/eventToMessage";

let spawnPointHelperModel = null;

export default class SpawnPointNode extends EditorNodeMixin(THREE.Object3D) {
  static legacyComponentName = "spawn-point";

  static nodeName = "Spawn Point";

  static async load() {
    const { scene } = await new Promise((resolve, reject) => {
      new THREE.GLTFLoader().load(spawnPointModelUrl, resolve, null, e => {
        reject(new Error(`Error loading SpawnPointNode helper with url: ${spawnPointModelUrl}. ${eventToMessage(e)}`));
      });
    });

    scene.traverse(child => {
      if (child.isMesh) {
        child.layers.set(1);
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
