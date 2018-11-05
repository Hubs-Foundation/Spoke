import * as THREE from "three";
import Cache from "./Cache";

const textureLoader = new THREE.TextureLoader();

export default class TextureCache extends Cache {
  constructor() {
    super();
    this.textureLoader = new THREE.TextureLoader();
  }

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
