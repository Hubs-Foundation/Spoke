import EditorNodeMixin from "./EditorNodeMixin";
import { TextureLoader, PlaneBufferGeometry, MeshBasicMaterial, Mesh, DoubleSide } from "three";
import eventToMessage from "../utils/eventToMessage";
import audioIconUrl from "../../assets/audio-icon.png";
import AudioSource from "../objects/AudioSource";

let audioHelperTexture = null;

export default class AudioNode extends EditorNodeMixin(AudioSource) {
  static legacyComponentName = "audio";

  static nodeName = "Audio";

  static async load() {
    audioHelperTexture = await new Promise((resolve, reject) => {
      new TextureLoader().load(audioIconUrl, resolve, null, e => reject(`Error loading Image. ${eventToMessage(e)}`));
    });
  }

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
      coneOuterGain
    } = json.components.find(c => c.name === "audio").props;

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
      })()
    );

    return node;
  }

  constructor(editor) {
    super(editor, editor.audioListener);

    this._canonicalUrl = "";

    const geometry = new PlaneBufferGeometry();
    const material = new MeshBasicMaterial();
    material.map = audioHelperTexture;
    material.side = DoubleSide;
    material.transparent = true;
    this.helper = new Mesh(geometry, material);
    this.helper.layers.set(1);
    this.add(this.helper);
  }

  get src() {
    return this._canonicalUrl;
  }

  set src(value) {
    this.load(value).catch(console.error);
  }

  async load(src) {
    const nextSrc = src || "";

    if (nextSrc === this._canonicalUrl && nextSrc !== "") {
      return;
    }

    this._canonicalUrl = src || "";

    this.helper.visible = false;
    this.hideErrorIcon();
    this.showLoadingCube();

    if (this.editor.playing) {
      this.el.pause();
    }

    try {
      const { accessibleUrl, contentType } = await this.editor.api.resolveMedia(src);

      await super.load(accessibleUrl, contentType);

      if (this.editor.playing && this.autoPlay) {
        this.el.play();
      }

      this.helper.visible = true;
    } catch (e) {
      this.showErrorIcon();
      console.error(e);
    }

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

  clone(recursive) {
    return new this.constructor(this.editor, this.audioListener).copy(this, recursive);
  }

  copy(source, recursive = true) {
    if (recursive) {
      this.remove(this.helper);
    }

    super.copy(source, recursive);

    if (recursive) {
      const helperIndex = source.children.findIndex(child => child === source.helper);

      if (helperIndex !== -1) {
        this.helper = this.children[helperIndex];
      }
    }

    this._canonicalUrl = source._canonicalUrl;

    return this;
  }

  serialize() {
    return super.serialize({
      audio: {
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
        coneOuterGain: this.coneOuterGain
      }
    });
  }

  prepareForExport() {
    super.prepareForExport();
    this.remove(this.helper);
    this.addGLTFComponent("audio", {
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
      coneOuterGain: this.coneOuterGain
    });
    this.addGLTFComponent("networked", {
      id: this.uuid
    });
    this.replaceObject();
  }
}
