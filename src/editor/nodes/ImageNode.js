import EditorNodeMixin from "./EditorNodeMixin";
import Image from "../objects/Image";
import spokeLogoSrc from "../../assets/spoke-icon.png";

export default class ImageNode extends EditorNodeMixin(Image) {
  static legacyComponentName = "image";

  static nodeName = "Image";

  static initialElementProps = {
    src: new URL(spokeLogoSrc, location).href
  };

  static async deserialize(editor, json, loadAsync) {
    const node = await super.deserialize(editor, json);

    const { src, projection } = json.components.find(c => c.name === "image").props;

    loadAsync(
      (async () => {
        await node.load(src);
        node.projection = projection;
      })()
    );

    return node;
  }

  constructor(editor) {
    super(editor);

    this._canonicalUrl = "";
  }

  get src() {
    return this._canonicalUrl;
  }

  set src(value) {
    this.load(value).catch(console.error);
  }

  onChange() {
    this.onResize();
  }

  loadTexture(src) {
    return this.editor.textureCache.get(src);
  }

  async load(src) {
    const nextSrc = src || "";

    if (nextSrc === this._canonicalUrl) {
      return;
    }

    this._canonicalUrl = nextSrc;

    this._mesh.visible = false;

    this.showLoadingCube();

    try {
      const { accessibleUrl } = await this.editor.api.resolveMedia(src);
      await super.load(accessibleUrl);
    } catch (e) {
      console.error(e);
    }

    this.hideLoadingCube();

    return this;
  }

  copy(source, recursive) {
    super.copy(source, recursive);

    this._canonicalUrl = source._canonicalUrl;

    return this;
  }

  serialize() {
    return super.serialize({
      image: {
        src: this._canonicalUrl,
        projection: this.projection
      }
    });
  }

  prepareForExport() {
    super.prepareForExport();
    this.addGLTFComponent("image", {
      src: this._canonicalUrl,
      projection: this.projection
    });
    this.addGLTFComponent("networked", {
      id: this.uuid
    });
    this.replaceObject();
  }
}
