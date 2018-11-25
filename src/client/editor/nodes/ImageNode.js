import THREE from "../../vendor/three";
import EditorNodeMixin from "./EditorNodeMixin";
import Image from "../objects/Image";

export default class ImageNode extends EditorNodeMixin(Image) {
  static legacyComponentName = "image";

  static nodeName = "Image";

  static async deserialize(editor, json) {
    const node = await super.deserialize(editor, json);

    const { src } = json.components.find(c => c.name === "image").props;

    await node.load(src);

    return node;
  }

  constructor(editor) {
    super(editor);

    this._canonicalUrl = null;
  }

  get src() {
    return this._canonicalUrl;
  }

  set src(value) {
    this.load(value).catch(console.error);
  }

  loadTexture(src) {
    return this.editor.textureCache.get(src);
  }

  async load(src) {
    this._canonicalUrl = src;
    const proxiedUrl = await this.editor.project.getProxiedUrl(src);
    return super.load(proxiedUrl);
  }

  serialize() {
    const json = super.serialize();

    json.components.push({
      name: "image",
      props: {
        src: this._canonicalUrl
      }
    });

    return json;
  }

  prepareForExport() {
    const replacementObject = new THREE.Object3D().copy(this, false);

    replacementObject.userData.gltfExtensions = {
      HUBS_components: {
        image: {
          src: this._canonicalUrl
        }
      }
    };

    this.parent.add(replacementObject);
    this.parent.remove(this);
  }
}
