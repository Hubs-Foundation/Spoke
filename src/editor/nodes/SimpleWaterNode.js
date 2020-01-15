import EditorNodeMixin from "./EditorNodeMixin";
import SimpleWater from "../objects/SimpleWater";

export default class SimpleWaterNode extends EditorNodeMixin(SimpleWater) {
  static legacyComponentName = "simple-water";

  static nodeName = "Simple Water";

  static async load() {
    await SimpleWater.loadNormalMap();
  }

  static async deserialize(editor, json) {
    const node = await super.deserialize(editor, json);

    const {
      opacity,
      color,
      tideHeight,
      tideScale,
      tideSpeed,
      waveHeight,
      waveScale,
      waveSpeed,
      ripplesHeight,
      ripplesScale
    } = json.components.find(c => c.name === SimpleWaterNode.legacyComponentName).props;

    node.opacity = opacity;
    node.color.set(color);
    node.tideHeight = tideHeight;
    node.tideScale.copy(tideScale);
    node.tideSpeed.copy(tideSpeed);
    node.waveHeight = waveHeight;
    node.waveScale.copy(waveScale);
    node.waveSpeed.copy(waveSpeed);
    node.ripplesHeight = ripplesHeight;
    node.ripplesScale = ripplesScale;

    return node;
  }

  get opacity() {
    return this.material.opacity;
  }

  set opacity(value) {
    this.material.opacity = value;

    if (value !== 1) {
      this.material.transparent = true;
    }
  }

  get color() {
    return this.material.color;
  }

  get tideHeight() {
    return this.octaves[0].height;
  }

  get tideScale() {
    return this.octaves[0].scale;
  }

  get tideSpeed() {
    return this.octaves[0].speed;
  }

  set tideHeight(value) {
    this.octaves[0].height = value;
  }

  get waveHeight() {
    return this.octaves[1].height;
  }

  set waveHeight(value) {
    this.octaves[1].height = value;
  }

  get waveScale() {
    return this.octaves[1].scale;
  }

  get waveSpeed() {
    return this.octaves[1].speed;
  }

  set ripplesSpeed(value) {
    this.waterUniforms.ripplesSpeed.value = value;
  }

  get ripplesSpeed() {
    return this.waterUniforms.ripplesSpeed.value;
  }

  set ripplesScale(value) {
    this.waterUniforms.ripplesScale.value = value;
  }

  get ripplesScale() {
    return this.waterUniforms.ripplesScale.value;
  }

  onUpdate(_dt, time) {
    this.update(time);
  }

  serialize() {
    return super.serialize({
      "simple-water": {
        opacity: this.opacity,
        color: this.color,
        tideHeight: this.tideHeight,
        tideScale: this.tideScale,
        tideSpeed: this.tideSpeed,
        waveHeight: this.waveHeight,
        waveScale: this.waveScale,
        waveSpeed: this.waveSpeed,
        ripplesHeight: this.ripplesHeight,
        ripplesScale: this.ripplesScale
      }
    });
  }

  prepareForExport() {
    super.prepareForExport();
    this.addGLTFComponent("simple-water", {
      opacity: this.opacity,
      color: this.color,
      tideHeight: this.tideHeight,
      tideScale: this.tideScale,
      tideSpeed: this.tideSpeed,
      waveHeight: this.waveHeight,
      waveScale: this.waveScale,
      waveSpeed: this.waveSpeed,
      ripplesHeight: this.ripplesHeight,
      ripplesScale: this.ripplesScale
    });
    this.replaceObject();
  }
}
