import EditorNodeMixin from "./EditorNodeMixin";
import Sky from "../objects/Sky";

export default class SkyboxNode extends EditorNodeMixin(Sky) {
  static componentName = "skybox";

  static disableTransform = true;

  static ignoreRaycast = true;

  static nodeName = "Skybox";

  static canAddNode(editor) {
    return editor.scene.findNodeByType(SkyboxNode) === null;
  }

  static async deserialize(editor, json) {
    const node = await super.deserialize(editor, json);

    const {
      turbidity,
      rayleigh,
      luminance,
      mieCoefficient,
      mieDirectionalG,
      inclination,
      azimuth,
      distance
    } = json.components.find(c => c.name === "skybox").props;

    node.turbidity = turbidity;
    node.rayleigh = rayleigh;
    node.luminance = luminance;
    node.mieCoefficient = mieCoefficient;
    node.mieDirectionalG = mieDirectionalG;
    node.inclination = inclination;
    node.azimuth = azimuth;
    node.distance = distance;

    return node;
  }

  onRendererChanged() {
    this.updateEnvironmentMap();
  }

  onAdd() {
    this.updateEnvironmentMap();
  }

  onChange() {
    this.updateEnvironmentMap();
  }

  onRemove() {
    this.editor.scene.updateEnvironmentMap(null);
  }

  updateEnvironmentMap() {
    const renderer = this.editor.renderer.renderer;
    const envMap = this.generateEnvironmentMap(renderer);
    this.editor.scene.updateEnvironmentMap(envMap);
  }

  serialize() {
    return super.serialize({
      skybox: {
        turbidity: this.turbidity,
        rayleigh: this.rayleigh,
        luminance: this.luminance,
        mieCoefficient: this.mieCoefficient,
        mieDirectionalG: this.mieDirectionalG,
        inclination: this.inclination,
        azimuth: this.azimuth,
        distance: this.distance
      }
    });
  }

  prepareForExport() {
    super.prepareForExport();
    this.addGLTFComponent("skybox", {
      turbidity: this.turbidity,
      rayleigh: this.rayleigh,
      luminance: this.luminance,
      mieCoefficient: this.mieCoefficient,
      mieDirectionalG: this.mieDirectionalG,
      inclination: this.inclination,
      azimuth: this.azimuth,
      distance: this.distance
    });
    this.replaceObject();
  }

  getRuntimeResourcesForStats() {
    return { meshes: [this.sky], materials: [this.sky.material] };
  }
}
