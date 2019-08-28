import { Texture, RGBAFormat, RGBFormat, PropertyBinding } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import Cache from "./Cache";
import cloneObject3D from "../utils/cloneObject3D";
import eventToMessage from "../utils/eventToMessage";

function animationClipBelongsToScene(scene, clip) {
  return clip.tracks.every(track => {
    const { nodeName: uuid } = PropertyBinding.parseTrackName(track.name);
    const result = scene.getObjectByProperty("uuid", uuid) !== undefined;
    return result;
  });
}

function getSceneAnimations(scene, animations) {
  return animations.filter(clip => animationClipBelongsToScene(scene, clip));
}

export default class GLTFCache extends Cache {
  constructor(textureCache) {
    super();
    this.textureCache = textureCache;
  }

  get(url) {
    const absoluteURL = new URL(url, window.location).href;
    if (!this._cache.has(absoluteURL)) {
      const gltfPromise = new Promise((resolve, reject) => {
        const loader = new GLTFLoader();
        loader.revokeObjectURLs = false;
        loader.load(absoluteURL, resolve, null, e => {
          reject(new Error(`Error loading glTF model with url: ${absoluteURL}. ${eventToMessage(e)}`));
        });
      }).then(gltf => {
        if (!gltf.scene.name) {
          gltf.scene.name = "Scene";
        }
        gltf.scene.animations = getSceneAnimations(gltf.scene, gltf.animations);
        return gltf;
      });

      this._cache.set(absoluteURL, gltfPromise);
    }
    return this._cache.get(absoluteURL).then(gltf => {
      const clonedScene = cloneObject3D(gltf.scene);
      const clonedGLTF = { ...gltf, scene: clonedScene, animations: clonedScene.animations };
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
            if (prop instanceof Texture) {
              if (prop.image.src) {
                if (key === "map") {
                  prop.format = obj.material.transparent || obj.material.alphaTest !== 0 ? RGBAFormat : RGBFormat;
                }

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
              if (prop instanceof Texture) {
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
