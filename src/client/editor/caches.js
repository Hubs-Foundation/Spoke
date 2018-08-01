import THREE from "../vendor/three";

const textureLoader = new THREE.TextureLoader();

class Cache {
  _cache = new Map();

  evict(url) {
    this._cache.delete(url);
  }

  _clear() {
    this._cache.clear();
  }
}

class TextureCache extends Cache {
  get(url) {
    if (!this._cache.has(url)) {
      this._cache.set(
        url,
        new Promise((resolve, reject) => {
          textureLoader.load(url, resolve, null, reject);
        })
      );
    }
    return this._cache.get(url);
  }

  disposeAndClear() {
    for (const texturePromise of this._cache.values()) {
      texturePromise.then(texture => texture.dispose());
    }
    this._clear();
  }
}

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
    if (!this._cache.has(url)) {
      this._cache.set(
        url,
        new Promise((resolve, reject) => {
          const loader = new THREE.GLTFLoader();
          loader.load(url, resolve, null, reject);
        })
      );
    }
    return this._cache.get(url).then(gltf => {
      if (!clonable(gltf.scene)) return gltf;
      const clonedGLTF = { scene: gltf.scene.clone() };
      clonedGLTF.scene.traverse(obj => {
        if (!obj.material) return;
        if (obj.material.clone) {
          obj.material = obj.material.clone();
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

export const textureCache = new TextureCache();

export const gltfCache = new GLTFCache();
