import THREE from "../../vendor/three";
import Cache from "./Cache";
import eventToMessage from "../utils/eventToMessage";

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
          this.textureLoader.load(absoluteURL, resolve, null, e => {
            reject(new Error(`Error loading texture with url: ${absoluteURL}. ${eventToMessage(e)}`));
          });
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
