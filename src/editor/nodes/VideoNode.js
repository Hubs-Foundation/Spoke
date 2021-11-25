import Video from "../objects/Video";
import AudioParamsNode from "./AudioParamsNode";
import Hls from "hls.js/dist/hls.light";
import isHLS from "../utils/isHLS";
import spokeLandingVideo from "../../assets/video/SpokePromo.mp4";
import { RethrownError } from "../utils/errors";
import { getObjectPerfIssues } from "../utils/performance";
import { AudioElementType } from "../objects/AudioParams";

export default class VideoNode extends AudioParamsNode(Video) {
  static componentName = "video";

  static nodeName = "Video";

  static initialElementProps = {
    src: new URL(spokeLandingVideo, location).href
  };

  static async deserialize(editor, json, loadAsync, onError) {
    const node = await super.deserialize(editor, json);

    const videoComp = json.components.find(c => c.name === "video");
    const { src, controls, autoPlay, loop, projection } = videoComp.props;

    loadAsync(
      (async () => {
        await node.load(src, onError);
        node.controls = controls || false;
        node.autoPlay = autoPlay;
        node.loop = loop;
        node.projection = projection;
      })()
    );

    if (json.components.find(c => c.name === "billboard")) {
      node.billboard = true;
    }

    const linkComponent = json.components.find(c => c.name === "link");

    if (linkComponent) {
      node.href = linkComponent.props.href;
    }

    loadAsync(
      (async () => {
        await node.load(src, onError);
        node.controls = controls || false;
        node.autoPlay = autoPlay;
        node.loop = loop;
        node.projection = projection;
      })()
    );

    return node;
  }

  constructor(editor) {
    super(editor, editor.audioListener, AudioElementType.VIDEO);

    this._canonicalUrl = "";
    this._autoPlay = true;
    this.controls = true;
    this.billboard = false;
    this.href = "";
  }

  get src() {
    return this._canonicalUrl;
  }

  get autoPlay() {
    return this._autoPlay;
  }

  set autoPlay(value) {
    this._autoPlay = value;
  }

  set src(value) {
    this.load(value).catch(console.error);
  }

  async load(src, onError) {
    const nextSrc = src || "";

    if (nextSrc === this._canonicalUrl && nextSrc !== "") {
      return;
    }

    this._canonicalUrl = src || "";

    this.issues = [];
    this._mesh.visible = false;

    this.hideErrorIcon();
    this.showLoadingCube();

    if (this.editor.playing) {
      this.el.pause();
    }

    try {
      const { accessibleUrl, contentType, meta } = await this.editor.api.resolveMedia(src);

      this.meta = meta;

      this.updateAttribution();

      const isHls = isHLS(src, contentType);

      if (isHls) {
        this.hls = new Hls({
          xhrSetup: (xhr, url) => {
            xhr.open("GET", this.editor.api.unproxyUrl(src, url));
          }
        });
      }

      await super.load(accessibleUrl, contentType);

      if (isHls && this.hls) {
        this.hls.stopLoad();
      } else if (this.el.duration) {
        this.el.currentTime = 1;
      }

      if (this.editor.playing && this.autoPlay) {
        this.el.play();
      }

      this.issues = getObjectPerfIssues(this._mesh, false);
    } catch (error) {
      this.showErrorIcon();

      const videoError = new RethrownError(`Error loading video ${this._canonicalUrl}`, error);

      if (onError) {
        onError(this, videoError);
      }

      console.error(videoError);

      this.issues.push({ severity: "error", message: "Error loading video." });
    }

    this.editor.emit("objectsChanged", [this]);
    this.editor.emit("selectionChanged");
    this.hideLoadingCube();

    return this;
  }

  onPlay() {
    if (this.autoPlay) {
      this.el.play();
    }
  }

  onPause() {
    this.el.pause();
    this.el.currentTime = 0;
  }

  onChange() {
    this.onResize();
  }

  clone(recursive) {
    return new this.constructor(this.editor, this.audioListener).copy(this, recursive);
  }

  copy(source, recursive = true) {
    super.copy(source, recursive);

    this.controls = source.controls;
    this.billboard = source.billboard;
    this._canonicalUrl = source._canonicalUrl;
    this.href = source.href;

    return this;
  }

  serialize() {
    const components = {
      video: {
        src: this._canonicalUrl,
        controls: this.controls,
        autoPlay: this.autoPlay,
        loop: this.loop,
        projection: this.projection
      }
    };

    if (this.billboard) {
      components.billboard = {};
    }

    if (this.href) {
      components.link = { href: this.href };
    }

    return super.serialize(components);
  }

  prepareForExport() {
    super.prepareForExport();

    this.addGLTFComponent("video", {
      src: this._canonicalUrl,
      controls: this.controls,
      autoPlay: this.autoPlay,
      loop: this.loop,
      projection: this.projection
    });

    this.addGLTFComponent("networked", {
      id: this.uuid
    });

    if (this.billboard && this.projection === "flat") {
      this.addGLTFComponent("billboard", {});
    }

    if (this.href && this.projection === "flat") {
      this.addGLTFComponent("link", { href: this.href });
    }

    this.replaceObject();
  }

  getRuntimeResourcesForStats() {
    if (this._texture) {
      return { textures: [this._texture], meshes: [this._mesh], materials: [this._mesh.material] };
    }
  }
}
