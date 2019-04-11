import THREE from "../../vendor/three";
import EditorNodeMixin from "./EditorNodeMixin";
import Sky from "../objects/Sky";

export default class SkyboxNode extends EditorNodeMixin(Sky) {
  static legacyComponentName = "skybox";

  static hideTransform = true;

  static ignoreRaycast = true;

  static nodeName = "Skybox";

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

  constructor(editor) {
    super(editor);

    this.skyScene = new THREE.Scene();
    this.cubeCamera = new THREE.CubeCamera(1, 100000, 512);
    this.cubeCamera.scale.set(-1, 1, 1);
    this.skyScene.add(this.cubeCamera);
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
    const renderer = this.editor.viewport.renderer;
    this.skyScene.add(this.sky);
    this.cubeCamera.update(renderer, this.skyScene);
    this.add(this.sky);
    const pmremGenerator = new THREE.PMREMGenerator(this.cubeCamera.renderTarget.texture);
    pmremGenerator.update(renderer);
    const pmremCubeUVPacker = new THREE.PMREMCubeUVPacker(pmremGenerator.cubeLods);
    pmremCubeUVPacker.update(renderer);
    this.editor.scene.updateEnvironmentMap(pmremCubeUVPacker.CubeUVRenderTarget.texture);
    pmremGenerator.dispose();
    pmremCubeUVPacker.dispose();
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
}
