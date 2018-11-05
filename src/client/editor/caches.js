import THREE from "./three";
import cloneObject3D from "./utils/cloneObject3D";

const textureLoader = new THREE.TextureLoader();

class Cache {
  _cache = new Map();

  evict(url) {
    const absoluteURL = new URL(url, window.location).href;
    this._cache.delete(absoluteURL);
  }

  _clear() {
    this._cache.clear();
  }
}

class TextureCache extends Cache {
  get(url) {
    const absoluteURL = new URL(url, window.location).href;
    if (!this._cache.has(absoluteURL)) {
      this._cache.set(
        absoluteURL,
        new Promise((resolve, reject) => {
          textureLoader.load(absoluteURL, resolve, null, reject);
        })
      );
    }
    return this._cache.get(absoluteURL);
  }

  disposeAndClear() {
    for (const texturePromise of this._cache.values()) {
      texturePromise.then(texture => texture.dispose());
    }
    this._clear();
  }
}

export const textureCache = new TextureCache();

class GLTFCache extends Cache {
  get(url) {
    const absoluteURL = new URL(url, window.location).href;
    if (!this._cache.has(absoluteURL)) {
      this._cache.set(
        absoluteURL,
        new Promise((resolve, reject) => {
          const loader = new THREE.GLTFLoader();
          loader.load(
            absoluteURL,
            gltf => {
              gltf.scene.animations = gltf.animations;
              resolve(gltf);
            },
            null,
            reject
          );
        })
      );
    }
    return this._cache.get(absoluteURL).then(gltf => {
      const clonedGLTF = { ...gltf, scene: cloneObject3D(gltf.scene) };
      clonedGLTF.scene.traverse(obj => {
        if (!obj.material) return;
        if (obj.material.clone) {
          obj.material = obj.material.clone();

          for (const key in obj.material) {
            const prop = obj.material[key];
            if (prop instanceof THREE.Texture) {
              if (prop.image.src) {
                const absoluteTextureURL = new URL(prop.image.src, window.location).href;
                textureCache._cache.set(absoluteTextureURL, Promise.resolve(prop));
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

export const gltfCache = new GLTFCache();
