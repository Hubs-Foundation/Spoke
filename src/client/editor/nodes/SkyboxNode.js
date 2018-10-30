import THREE from "../three";
import EditorNodeMixin from "./EditorNodeMixin";
import Sky from "../objects/Sky";

export default class SkyboxNode extends EditorNodeMixin(THREE.Object3D) {
  static legacyComponentName = "skybox";

  static hideTransform = true;

  static nodeName = "Skybox";

  static async deserialize(editor, json) {
    const node = super.deserialize(editor, json);

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

  constructor() {
    super();

    this.sky = new Sky();
    this.add(this.sky);
  }

  get turbidity() {
    return this.sky.material.uniforms.turbidity.value;
  }

  set turbidity(value) {
    this.sky.material.uniforms.turbidity.value = value;
  }

  get rayleigh() {
    return this.sky.material.uniforms.rayleigh.value;
  }

  set rayleigh(value) {
    this.sky.material.uniforms.rayleigh.value = value;
  }

  get luminance() {
    return this.sky.material.uniforms.luminance.value;
  }

  set luminance(value) {
    this.sky.material.uniforms.luminance.value = value;
  }

  get mieCoefficient() {
    return this.sky.material.uniforms.mieCoefficient.value;
  }

  set mieCoefficient(value) {
    this.sky.material.uniforms.mieCoefficient.value = value;
  }

  get mieDirectionalG() {
    return this.sky.material.uniforms.mieDirectionalG.value;
  }

  set mieDirectionalG(value) {
    this.sky.material.uniforms.mieDirectionalG.value = value;
  }

  get inclination() {
    return this.sky.inclination;
  }

  set inclination(value) {
    this.sky.inclination = value;
    this.sky.updateSunPosition();
  }

  get azimuth() {
    return this.sky.azimuth;
  }

  set azimuth(value) {
    this.sky.azimuth = value;
    this.sky.updateSunPosition();
  }

  get distance() {
    return this.sky.distance;
  }

  set distance(value) {
    this.sky.distance = value;
    this.sky.updateSunPosition();
  }

  serialize() {
    const json = super.serialize();

    json.components.push({
      name: "skybox",
      props: {
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

    return json;
  }

  prepareForExport() {
    this.userData.gltfExtensions = {
      HUBS_components: {
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
      }
    };

    this.remove(this.sky);
  }
}
