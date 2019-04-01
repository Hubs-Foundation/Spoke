import EditorNodeMixin from "./EditorNodeMixin";
import Video from "../objects/Video";
import { buildAbsoluteURL } from "url-toolkit";
import Hls from "hls.js/dist/hls.light";
import isHLS from "../utils/isHLS";

export default class VideoNode extends EditorNodeMixin(Video) {
  static legacyComponentName = "video";

  static nodeName = "Video";

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

    loadAsync(node.load(src));

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
    this.showLoadingCube();
    this._canonicalUrl = src || "";

    try {
      const { accessibleUrl } = await this.editor.api.resolveMedia(src);

      const isHls = isHLS(src);

      if (isHls) {
        const corsProxyPrefix = `http://localhost:9090/api/cors-proxy/`;
        const baseUrl = src.startsWith(corsProxyPrefix) ? src.substring(corsProxyPrefix.length) : src;
        this.hls = new Hls({
          xhrSetup: (xhr, u) => {
            if (u.startsWith(corsProxyPrefix)) {
              u = u.substring(corsProxyPrefix.length);
            }

            // HACK HLS.js resolves relative urls internally, but our CORS proxying screws it up. Resolve relative to the original unproxied url.
            // TODO extend HLS.js to allow overriding of its internal resolving instead
            if (!u.startsWith("http")) {
              u = buildAbsoluteURL(baseUrl, u.startsWith("/") ? u : `/${u}`);
            }

            xhr.open("GET", new URL(`/api/cors-proxy/${u}`, window.location).href);
          }
        });
      }

      await super.load(accessibleUrl);

      if (isHls && this.hls) {
        this.hls.stopLoad();
      } else if (this.videoEl.duration) {
        this.videoEl.currentTime = 1;
      }
    } catch (e) {
      console.error(e);
    }

    this.hideLoadingCube();

    return this;
  }

  onChange() {
    this.onResize();
  }

  clone(recursive) {
    return new this.constructor(this.editor, this.audioListener).copy(this, recursive);
  }

  copy(source, recursive) {
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
