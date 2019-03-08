import Model from "../objects/Model";
import EditorNodeMixin from "./EditorNodeMixin";

export default class SpawnerNode extends EditorNodeMixin(Model) {
  static legacyComponentName = "spawner";

  static nodeName = "Spawner";

  static async deserialize(editor, json) {
    const node = await super.deserialize(editor, json);

    const { src } = json.components.find(c => c.name === "spawner").props;

    await node.load(src);

    return node;
  }

  constructor(editor) {
    super(editor);
    this._canonicalUrl = null;
  }

  // Overrides Model's src property and stores the original (non-resolved) url.
  get src() {
    return this._canonicalUrl;
  }

  // When getters are overridden you must also override the setter.
  set src(value) {
    this.load(value).catch(console.error);
  }

  // Overrides Model's loadGLTF method and uses the Editor's gltf cache.
  async loadGLTF(src) {
    return await this.editor.gltfCache.get(src);
  }

  // Overrides Model's load method and resolves the src url before loading.
  async load(src) {
    this._canonicalUrl = src;

    const { accessibleUrl, files } = await this.editor.api.resolveMedia(src);

    await super.load(accessibleUrl);

    if (files) {
      // Revoke any object urls from the SketchfabZipLoader.
      for (const key in files) {
        URL.revokeObjectURL(files[key]);
      }
    }

    return this;
  }

  serialize() {
    return super.serialize({
      spawner: {
        src: this._canonicalUrl
      }
    });
  }

  copy(source, recursive) {
    super.copy(source, recursive);
    this._canonicalUrl = source._canonicalUrl;
    return this;
  }

  prepareForExport() {
    super.prepareForExport();
    this.addGLTFComponent("spawner", {
      src: this._canonicalUrl
    });
    this.replaceObject();
  }
}
