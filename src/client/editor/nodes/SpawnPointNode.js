import THREE from "../three";
import EditorNodeMixin from "./EditorNodeMixin";
import spawnPointModelUrl from "../../assets/spawn-point.glb";

let spawnPointHelperModel = null;

export default class SpawnPointNode extends EditorNodeMixin(THREE.Object3D) {
  static legacyComponentName = "spawn-point";

  static nodeName = "Spawn Point";

  static async load() {
    const { scene } = await new Promise((resolve, reject) => {
      const loader = new THREE.GLTFLoader();
      loader.load(spawnPointModelUrl, resolve, null, reject);
    });

    spawnPointHelperModel = scene;
  }

  constructor() {
    super();
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
    const json = super.serialize();

    json.components.push({
      name: "spawn-point",
      props: {}
    });

    return json;
  }

  prepareForExport() {
    this.remove(this.helper);

    this.userData.gltfExtensions = {
      HUBS_components: {
        "spawn-point": {}
      }
    };
  }
}
