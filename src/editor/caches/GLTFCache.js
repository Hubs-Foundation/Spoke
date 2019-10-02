import { Texture } from "three";
import { GLTFLoader } from "../gltf/GLTFLoader";
import cloneObject3D from "../utils/cloneObject3D";

export default class GLTFCache {
  constructor() {
    this.cache = new Map();
  }

  async get(url, cloneScene = true) {
    const absoluteURL = new URL(url, window.location).href;

    if (this.cache.has(absoluteURL)) {
      const { scene, json } = await this.cache.get(absoluteURL);

      if (cloneScene) {
        return { scene: cloneObject3D(scene), json };
      } else {
        return { scene, json };
      }
    } else {
      const loader = new GLTFLoader(absoluteURL, undefined, { revokeObjectURLs: false });
      const gltfPromise = loader.loadGLTF();
      this.cache.set(absoluteURL, gltfPromise);
      return gltfPromise;
    }
  }

  disposeAndClear() {
    for (const gltfPromise of this.cache.values()) {
      gltfPromise.then(({ scene }) => {
        scene.traverse(obj => {
          if (obj.material) {
            for (const key in obj.material) {
              const prop = obj.material[key];
              if (prop instanceof Texture) {
                prop.dispose();
              }
            }
          }
        });
      });
    }

    this.cache.clear();
  }
}
