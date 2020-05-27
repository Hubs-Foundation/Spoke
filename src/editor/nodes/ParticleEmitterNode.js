import { ParticleEmitter } from "@mozillareality/three-particle-emitter";
import EditorNodeMixin from "./EditorNodeMixin";
import defaultParticleUrl from "../../assets/dot.png";
import DirectionalPlaneHelper from "../helpers/DirectionalPlaneHelper";
import loadTexture from "../utils/loadTexture";

let defaultParticleSprite = null;

export default class ParticleEmitterNode extends EditorNodeMixin(ParticleEmitter) {
  static legacyComponentName = "particle-emitter";

  static nodeName = "Particle Emitter";

  static initialElementProps = {
    src: new URL(defaultParticleUrl, location).href
  };

  static async deserialize(editor, json, loadAsync, onError) {
    const node = await super.deserialize(editor, json);

    const {
      src,
      colorCurve,
      velocityCurve,
      startColor,
      middleColor,
      endColor,
      startOpacity,
      middleOpacity,
      endOpacity,
      sizeCurve,
      startSize,
      endSize,
      sizeRandomness,
      startVelocity,
      endVelocity,
      angularVelocity,
      particleCount,
      ageRandomness,
      lifetime,
      lifetimeRandomness
    } = json.components.find(c => c.name === "particle-emitter").props;

    node.startColor.set(startColor);
    node.middleColor.set(middleColor);
    node.endColor.set(endColor);
    node.startOpacity = startOpacity;
    node.middleOpacity = middleOpacity;
    node.endOpacity = endOpacity;
    node.colorCurve = colorCurve;
    node.startSize = startSize;
    node.endSize = endSize;
    node.sizeRandomness = sizeRandomness;
    node.ageRandomness = ageRandomness;
    node.lifetime = lifetime;
    node.lifetimeRandomness = lifetimeRandomness;
    node.particleCount = particleCount;
    node.startVelocity.copy(startVelocity);
    node.endVelocity.copy(endVelocity);
    node.sizeCurve = sizeCurve;
    node.velocityCurve = velocityCurve;
    node.angularVelocity = angularVelocity;

    loadAsync(
      (async () => {
        await node.load(src, onError);
      })()
    );
    node.updateParticles();

    return node;
  }

  static async load() {
    defaultParticleSprite = await loadTexture(defaultParticleUrl);
    defaultParticleSprite.flipY = false;
  }

  constructor(editor) {
    super(editor, defaultParticleSprite);
    this.disableOutline = true;
    this._canonicalUrl = "";
    this.helper = new DirectionalPlaneHelper();
    this.helper.visible = false;
    this.add(this.helper);
  }

  get src() {
    return this._canonicalUrl;
  }

  set src(value) {
    this.load(value).catch(console.error);
  }

  async load(src, onError) {
    const nextSrc = src || "";
    if (nextSrc === this._canonicalUrl) {
      return;
    }

    this._canonicalUrl = nextSrc;

    try {
      const { accessibleUrl } = await this.editor.api.resolveMedia(src);
      this.material.uniforms.map.value = await loadTexture(accessibleUrl);
    } catch (error) {
      if (onError) {
        onError(this, error);
      }

      console.error(error);
    }

    return this;
  }

  onSelect() {
    this.helper.visible = true;
  }

  onDeselect() {
    this.helper.visible = false;
  }

  onUpdate(dt) {
    this.update(dt);
  }

  copy(source, recursive = true) {
    if (recursive) {
      this.remove(this.helper);
    }

    super.copy(source, recursive);

    if (recursive) {
      const helperIndex = source.children.indexOf(source.helper);

      if (helperIndex === -1) {
        throw new Error("Source helper could not be found.");
      }

      this.helper = this.children[helperIndex];
    }

    this.src = source._canonicalUrl;

    return this;
  }

  serialize() {
    return super.serialize({
      "particle-emitter": {
        src: this._canonicalUrl,
        startColor: this.startColor,
        middleColor: this.middleColor,
        endColor: this.endColor,
        startOpacity: this.startOpacity,
        middleOpacity: this.middleOpacity,
        endOpacity: this.endOpacity,
        colorCurve: this.colorCurve,
        sizeCurve: this.sizeCurve,
        startSize: this.startSize,
        endSize: this.endSize,
        sizeRandomness: this.sizeRandomness,
        ageRandomness: this.ageRandomness,
        lifetime: this.lifetime,
        lifetimeRandomness: this.lifetimeRandomness,
        particleCount: this.particleCount,
        startVelocity: this.startVelocity,
        endVelocity: this.endVelocity,
        velocityCurve: this.velocityCurve,
        angularVelocity: this.angularVelocity
      }
    });
  }

  prepareForExport() {
    super.prepareForExport();
    this.addGLTFComponent("particle-emitter", {
      src: this._canonicalUrl,
      startColor: this.startColor,
      middleColor: this.middleColor,
      endColor: this.endColor,
      startOpacity: this.startOpacity,
      middleOpacity: this.middleOpacity,
      endOpacity: this.endOpacity,
      colorCurve: this.colorCurve,
      sizeCurve: this.sizeCurve,
      startSize: this.startSize,
      endSize: this.endSize,
      sizeRandomness: this.sizeRandomness,
      ageRandomness: this.ageRandomness,
      lifetime: this.lifetime,
      lifetimeRandomness: this.lifetimeRandomness,
      particleCount: this.particleCount,
      startVelocity: this.startVelocity,
      endVelocity: this.endVelocity,
      velocityCurve: this.velocityCurve,
      angularVelocity: this.angularVelocity
    });
    this.replaceObject();
  }

  getRuntimeResourcesForStats() {
    const textures = [];

    if (this.material.uniforms.map.value) {
      textures.push(this.material.uniforms.map.value);
    }

    return { meshes: [this], materials: [this.material], textures };
  }
}
