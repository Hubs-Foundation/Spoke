import THREE from "../../vendor/three";
import EditorNodeMixin from "./EditorNodeMixin";
import Video from "../objects/Video";

export default class VideoNode extends EditorNodeMixin(Video) {
  static legacyComponentName = "video";

  static nodeName = "Video";

  static async deserialize(editor, json) {
    const node = await super.deserialize(editor, json);

    const {
      src,
      controls,
      autoPlay,
      loop,
      startTime,
      endTime,
      audioType,
      volume,
      distanceModel,
      rolloffFactor,
      refDistance,
      maxDistance,
      coneInnerAngle,
      coneOuterAngle,
      coneOuterGain
    } = json.components.find(c => c.name === "video").props;

    await node.load(src);
    node.controls = controls;
    node.autoPlay = autoPlay;
    node.loop = loop;
    node.startTime = startTime;
    node.endTime = endTime;
    node.audioType = audioType;
    node.volume = volume;
    node.distanceModel = distanceModel;
    node.rolloffFactor = rolloffFactor;
    node.refDistance = refDistance;
    node.maxDistance = maxDistance;
    node.coneInnerAngle = coneInnerAngle;
    node.coneOuterAngle = coneOuterAngle;
    node.coneOuterGain = coneOuterGain;

    return node;
  }

  constructor(editor) {
    super(editor, editor.audioListener);

    this._canonicalUrl = null;
    this._startTime = 0;
  }

  get src() {
    return this._canonicalUrl;
  }

  set src(value) {
    this.load(value).catch(console.error);
  }

  async load(src) {
    this._canonicalUrl = src;
    const proxiedUrl = await this.editor.project.getProxiedUrl(src);

    await super.load(proxiedUrl);

    return this;
  }

  set startTime(value) {
    this.videoEl.currentTime = value;
    this._startTime = value;
  }

  get startTime() {
    return this._startTime;
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
    const json = super.serialize();

    json.components.push({
      name: "video",
      props: {
        src: this._canonicalUrl,
        controls: this.controls,
        autoPlay: this.autoPlay,
        loop: this.loop,
        startTime: this.startTime,
        endTime: this.endTime,
        audioType: this.audioType,
        volume: this.volume,
        distanceModel: this.distanceModel,
        rolloffFactor: this.rolloffFactor,
        refDistance: this.refDistance,
        maxDistance: this.maxDistance,
        coneInnerAngle: this.coneInnerAngle,
        coneOuterAngle: this.coneOuterAngle,
        coneOuterGain: this.coneOuterGain
      }
    });

    return json;
  }

  prepareForExport() {
    const replacementObject = new THREE.Object3D().copy(this, false);

    replacementObject.userData.gltfExtensions = {
      HUBS_components: {
        video: {
          src: this._canonicalUrl,
          controls: this.controls,
          autoPlay: this.autoPlay,
          loop: this.loop,
          startTime: this.startTime,
          endTime: this.endTime,
          audioType: this.audioType,
          volume: this.volume,
          distanceModel: this.distanceModel,
          rolloffFactor: this.rolloffFactor,
          refDistance: this.refDistance,
          maxDistance: this.maxDistance,
          coneInnerAngle: this.coneInnerAngle,
          coneOuterAngle: this.coneOuterAngle,
          coneOuterGain: this.coneOuterGain
        },
        networked: {
          id: this.uuid
        }
      }
    };

    this.parent.add(replacementObject);
    this.parent.remove(this);
  }
}
