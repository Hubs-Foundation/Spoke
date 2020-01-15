import EditorNodeMixin from "./EditorNodeMixin";
import SimpleWater from "../objects/SimpleWater";

export default class SimpleWaterNode extends EditorNodeMixin(SimpleWater) {
  static legacyComponentName = "simple-water";

  static nodeName = "SimpleWater";

  static async load() {
    await SimpleWater.loadNormalMap();
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

  onUpdate(dt, time) {
    this.update(time);
  }

  serialize() {
    return super.serialize({ "simple-water": {} });
  }

  prepareForExport() {
    super.prepareForExport();
    this.addGLTFComponent("simple-water");
    this.replaceObject();
  }
}
