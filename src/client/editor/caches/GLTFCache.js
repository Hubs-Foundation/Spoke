import THREE from "../../vendor/three";
import Cache from "./Cache";
import cloneObject3D from "../utils/cloneObject3D";

export default class GLTFCache extends Cache {
  constructor(textureCache) {
    super();
    this.textureCache = textureCache;
  }

  get(url) {
    const absoluteURL = new URL(url, window.location).href;
    if (!this._cache.has(absoluteURL)) {
      const gltfPromise = new Promise((resolve, reject) => {
        new THREE.GLTFLoader().load(absoluteURL, resolve, null, reject);
      }).then(gltf => {
        if (!gltf.scene.name) {
          gltf.scene.name = "Scene";
        }
        gltf.scene.animations = gltf.animations;
        return gltf;
      });

      this._cache.set(absoluteURL, gltfPromise);
    }
    return this._cache.get(absoluteURL).then(gltf => {
      const clonedGLTF = { ...gltf, scene: cloneObject3D(gltf.scene) };
      clonedGLTF.scene.traverse(obj => {
        if (!obj.material) return;
        if (obj.material.clone) {
          obj.material = obj.material.clone();

          // Remove MOZ_alt_materials extension from imported glTF models. It does not export properly.
          const matData = obj.material.userData;
          if (matData && matData.gltfExtensions && matData.gltfExtensions.MOZ_alt_materials) {
            delete matData.gltfExtensions.MOZ_alt_materials;
          }

          for (const key in obj.material) {
            const prop = obj.material[key];
            if (prop instanceof THREE.Texture) {
              if (prop.image.src) {
                const absoluteTextureURL = new URL(prop.image.src, window.location).href;
                this.textureCache._cache.set(absoluteTextureURL, Promise.resolve(prop));
              }
            }
          }
        } else if (obj.material.length) {
          obj.material = obj.material.map(mat => mat.clone());
        } else {
          console.warn("GLTFCache: Could not clone material", obj.material);
        }
      });
      return clonedGLTF;
    });
  }

  disposeAndClear() {
    for (const gltfPromise of this._cache.values()) {
      gltfPromise.then(gltf => {
        gltf.scene.traverse(obj => {
          if (obj.material) {
            for (const key in obj.material) {
              const prop = obj.material[key];
              if (prop instanceof THREE.Texture) {
                prop.dispose();
              }
            }
          }
        });
      });
    }
    this._clear();
  }
}
