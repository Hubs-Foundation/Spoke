import THREE from "./three";

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

function clonable(obj) {
  // Punting on skinned meshes for now because of https://github.com/mrdoob/three.js/pull/14494
  // We solved this in Hubs here:
  // https://github.com/mozilla/hubs/blob/9f48f8ee/src/components/gltf-model-plus.js#L28-L77
  if (obj.isSkinnedMesh) return false;
  for (const child of obj.children) {
    if (!clonable(child)) return false;
  }
  return true;
}

class GLTFCache extends Cache {
  get(url) {
    const absoluteURL = new URL(url, window.location).href;
    if (!this._cache.has(absoluteURL)) {
      this._cache.set(
        absoluteURL,
        new Promise((resolve, reject) => {
          const loader = new THREE.GLTFLoader();
          loader.load(absoluteURL, resolve, null, reject);
        })
      );
    }
    return this._cache.get(absoluteURL).then(gltf => {
      if (!clonable(gltf.scene)) return gltf;
      const clonedGLTF = { scene: gltf.scene.clone() };
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
