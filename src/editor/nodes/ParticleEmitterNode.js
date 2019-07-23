import { TextureLoader } from "three";
import { ParticleEmitter } from "@mozillareality/three-particle-emitter";
import EditorNodeMixin from "./EditorNodeMixin";
import eventToMessage from "../utils/eventToMessage";
import defaultParticleUrl from "../../assets/dot.png";
import DirectionalPlaneHelper from "../helpers/DirectionalPlaneHelper";

let defaultParticleSprite = null;

export default class ParticleEmitterNode extends EditorNodeMixin(ParticleEmitter) {
  static legacyComponentName = "particle-emitter";

  static experimental = true;

  static nodeName = "Particle Emitter";

  static initialElementProps = {
    src: new URL(defaultParticleUrl, location).href
  };

  static async deserialize(editor, json, loadAsync) {
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
        await node.load(src);
      })()
    );
    node.updateParticles();

    return node;
  }

  static async load() {
    defaultParticleSprite = await new Promise((resolve, reject) => {
      new TextureLoader().load(defaultParticleUrl, resolve, null, e =>
        reject(`Error loading Image. ${eventToMessage(e)}`)
      );
    });
    defaultParticleSprite.flipY = false;
  }

  constructor(editor) {
    super(editor, defaultParticleSprite);
    this.disableOutline = true;
    this._canonicalUrl = "";
    this.helper = new DirectionalPlaneHelper();
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
    if (nextSrc === this._canonicalUrl) {
      return;
    }

    this._canonicalUrl = nextSrc;

    const { accessibleUrl } = await this.editor.api.resolveMedia(src);
    this.material.uniforms.map.value = await new Promise((resolve, reject) => {
      new TextureLoader().load(accessibleUrl, resolve, null, e => reject(`Error loading Image. ${eventToMessage(e)}`));
    });

    return this;
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
}
