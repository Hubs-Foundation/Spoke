import EditorNodeMixin from "./EditorNodeMixin";
import Video from "../objects/Video";
import Hls from "hls.js/dist/hls.light";
import isHLS from "../utils/isHLS";
import spokeLandingVideo from "../../assets/video/SpokePromo.mp4";

export default class VideoNode extends EditorNodeMixin(Video) {
  static legacyComponentName = "video";

  static nodeName = "Video";

  static initialElementProps = {
    src: new URL(spokeLandingVideo, location).href
  };

  static async deserialize(editor, json, loadAsync) {
    const node = await super.deserialize(editor, json);

    const {
      src,
      controls,
      autoPlay,
      loop,
      audioType,
      volume,
      distanceModel,
      rolloffFactor,
      refDistance,
      maxDistance,
      coneInnerAngle,
      coneOuterAngle,
      coneOuterGain,
      projection
    } = json.components.find(c => c.name === "video").props;

    loadAsync(
      (async () => {
        await node.load(src);
        node.controls = controls;
        node.autoPlay = autoPlay;
        node.loop = loop;
        node.audioType = audioType;
        node.volume = volume;
        node.distanceModel = distanceModel;
        node.rolloffFactor = rolloffFactor;
        node.refDistance = refDistance;
        node.maxDistance = maxDistance;
        node.coneInnerAngle = coneInnerAngle;
        node.coneOuterAngle = coneOuterAngle;
        node.coneOuterGain = coneOuterGain;
        node.projection = projection;
      })()
    );

    return node;
  }

  constructor(editor) {
    super(editor, editor.audioListener);

    this._canonicalUrl = "";
    this._autoPlay = true;
    this.volume = 0.5;
  }

  get src() {
    return this._canonicalUrl;
  }

  set src(value) {
    this.load(value).catch(console.error);
  }

  get autoPlay() {
    return this._autoPlay;
  }

  set autoPlay(value) {
    this._autoPlay = value;
  }

  async load(src) {
    const nextSrc = src || "";

    if (nextSrc === this._canonicalUrl) {
      return;
    }

    this._canonicalUrl = src || "";

    this._mesh.visible = false;

    this.showLoadingCube();

    if (this.editor.playing) {
      this.videoEl.pause();
    }

    try {
      const { accessibleUrl, contentType } = await this.editor.api.resolveMedia(src);

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
      } else if (this.videoEl.duration) {
        this.videoEl.currentTime = 1;
      }

      if (this.editor.playing && this.autoPlay) {
        this.videoEl.play();
      }
    } catch (e) {
      console.error(e);
    }

    this.hideLoadingCube();

    return this;
  }

  onPlay() {
    if (this.autoPlay) {
      this.videoEl.play();
    }
  }

  onPause() {
    this.videoEl.pause();
    this.videoEl.currentTime = 0;
  }

  onChange() {
    this.onResize();
  }

  clone(recursive) {
    return new this.constructor(this.editor, this.audioListener).copy(this, recursive);
  }

  copy(source, recursive = true) {
    super.copy(source, recursive);

    this._canonicalUrl = source._canonicalUrl;

    return this;
  }

  serialize() {
    return super.serialize({
      video: {
        src: this._canonicalUrl,
        controls: this.controls,
        autoPlay: this.autoPlay,
        loop: this.loop,
        audioType: this.audioType,
        volume: this.volume,
        distanceModel: this.distanceModel,
        rolloffFactor: this.rolloffFactor,
        refDistance: this.refDistance,
        maxDistance: this.maxDistance,
        coneInnerAngle: this.coneInnerAngle,
        coneOuterAngle: this.coneOuterAngle,
        coneOuterGain: this.coneOuterGain,
        projection: this.projection
      }
    });
  }

  prepareForExport() {
    super.prepareForExport();
    this.addGLTFComponent("video", {
      src: this._canonicalUrl,
      controls: this.controls,
      autoPlay: this.autoPlay,
      loop: this.loop,
      audioType: this.audioType,
      volume: this.volume,
      distanceModel: this.distanceModel,
      rolloffFactor: this.rolloffFactor,
      refDistance: this.refDistance,
      maxDistance: this.maxDistance,
      coneInnerAngle: this.coneInnerAngle,
      coneOuterAngle: this.coneOuterAngle,
      coneOuterGain: this.coneOuterGain,
      projection: this.projection
    });
    this.addGLTFComponent("networked", {
      id: this.uuid
    });
    this.replaceObject();
  }
}
