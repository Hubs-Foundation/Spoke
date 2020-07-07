import EditorNodeMixin from "./EditorNodeMixin";
import Image, { ImageAlphaMode } from "../objects/Image";
import spokeLogoSrc from "../../assets/spoke-icon.png";
import { RethrownError } from "../utils/errors";
import { getObjectPerfIssues, maybeAddLargeFileIssue } from "../utils/performance";

export default class ImageNode extends EditorNodeMixin(Image) {
  static legacyComponentName = "image";

  static nodeName = "Image";

  static initialElementProps = {
    src: new URL(spokeLogoSrc, location).href
  };

  static async deserialize(editor, json, loadAsync, onError) {
    const node = await super.deserialize(editor, json);

    const { src, projection, controls, alphaMode, alphaCutoff } = json.components.find(c => c.name === "image").props;

    loadAsync(
      (async () => {
        await node.load(src, onError);
        node.controls = controls || false;
        node.alphaMode = alphaMode === undefined ? ImageAlphaMode.Blend : alphaMode;
        node.alphaCutoff = alphaCutoff === undefined ? 0.5 : alphaCutoff;
        node.projection = projection;
      })()
    );

    return node;
  }

  constructor(editor) {
    super(editor);

    this._canonicalUrl = "";
    this.controls = true;
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

  async load(src, onError) {
    const nextSrc = src || "";

    if (nextSrc === this._canonicalUrl && nextSrc !== "") {
      return;
    }

    this._canonicalUrl = nextSrc;

    this.issues = [];
    this._mesh.visible = false;

    this.hideErrorIcon();
    this.showLoadingCube();

    try {
      const { accessibleUrl } = await this.editor.api.resolveMedia(src);
      await super.load(accessibleUrl);
      this.issues = getObjectPerfIssues(this._mesh, false);

      const perfEntries = performance.getEntriesByName(accessibleUrl);

      if (perfEntries.length > 0) {
        const imageSize = perfEntries[0].encodedBodySize;
        maybeAddLargeFileIssue("image", imageSize, this.issues);
      }
    } catch (error) {
      this.showErrorIcon();

      const imageError = new RethrownError(`Error loading image ${this._canonicalUrl}`, error);

      if (onError) {
        onError(this, imageError);
      }

      console.error(imageError);

      this.issues.push({ severity: "error", message: "Error loading image." });
    }

    this.editor.emit("objectsChanged", [this]);
    this.editor.emit("selectionChanged");
    this.hideLoadingCube();

    return this;
  }

  copy(source, recursive = true) {
    super.copy(source, recursive);

    this.controls = source.controls;
    this.alphaMode = source.alphaMode;
    this.alphaCutoff = source.alphaCutoff;
    this._canonicalUrl = source._canonicalUrl;

    return this;
  }

  serialize() {
    return super.serialize({
      image: {
        src: this._canonicalUrl,
        controls: this.controls,
        alphaMode: this.alphaMode,
        alphaCutoff: this.alphaCutoff,
        projection: this.projection
      }
    });
  }

  prepareForExport() {
    super.prepareForExport();

    const imageData = {
      src: this._canonicalUrl,
      controls: this.controls,
      alphaMode: this.alphaMode,
      projection: this.projection
    };
    if (this.alphaMode === ImageAlphaMode.Mask) {
      imageData.alphaCutoff = this.alphaCutoff;
    }

    this.addGLTFComponent("image", imageData);
    this.addGLTFComponent("networked", {
      id: this.uuid
    });
    this.replaceObject();
  }

  getRuntimeResourcesForStats() {
    if (this._texture) {
      return { textures: [this._texture], meshes: [this._mesh], materials: [this._mesh.material] };
    }
  }
}
