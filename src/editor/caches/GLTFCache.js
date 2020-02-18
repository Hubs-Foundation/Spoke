import { GLTFLoader } from "../gltf/GLTFLoader";

export default class GLTFCache {
  constructor() {
    this.cache = new Map();
  }

  getLoader(url, options) {
    const absoluteURL = new URL(url, window.location).href;

    if (this.cache.has(absoluteURL)) {
      return this.cache.get(absoluteURL);
    } else {
      const loader = new GLTFLoader(absoluteURL, undefined, { revokeObjectURLs: false, ...options });
      this.cache.set(absoluteURL, loader);
      return loader;
    }
  }

  disposeAndClear() {
    this.cache.clear();
  }
}
