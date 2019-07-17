import {
  Mesh,
  TextureLoader,
  InstancedBufferGeometry,
  PlaneBufferGeometry,
  RawShaderMaterial,
  AdditiveBlending,
  Vector3,
  Color,
  InstancedBufferAttribute,
  Math as _Math
} from "three";
import EditorNodeMixin from "./EditorNodeMixin";
import eventToMessage from "../utils/eventToMessage";
import defaultParticleUrl from "../../assets/dot.png";
import { Curves } from "../utils/Curves";

function lerp(start, end, a) {
  return (end - start) * a + start;
}

function clamp(min, max, x) {
  if (x < min) x = min;
  if (x > max) x = max;
  return x;
}

let defaultParticleSprite = null;

const vertexShader = `
      precision highp float;

      #define BASE_PARTICLE_SIZE 300.0

      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;

      attribute vec3 position;
      attribute vec2 uv;

      attribute vec4 particlePosition;
      attribute vec4 particleColor;
      attribute float particleAngle;

      varying vec4 vColor;
      varying vec2 vUV;

      void main() {
        vUV = uv;
        vColor = particleColor;

        float particleScale = particlePosition.w;
        vec4 transformedPosition = modelViewMatrix * vec4(particlePosition.xyz, 1.0);
        
        vec3 rotatedPosition = position;
        rotatedPosition.x = cos( particleAngle ) * position.x - sin( particleAngle ) * position.y;
        rotatedPosition.y = sin( particleAngle ) * position.x + cos( particleAngle ) * position.y;

        transformedPosition.xyz += rotatedPosition * particleScale;

        gl_Position = projectionMatrix * transformedPosition;
      }
      `;

const fragmentShader = `
      precision highp float;

      uniform sampler2D texture;

      varying vec2 vUV;
      varying vec4 vColor;

      void main() {
        gl_FragColor = texture2D(texture,  vUV) * vColor;
      }
  `;

export default class ParticleEmitterNode extends EditorNodeMixin(Mesh) {
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
      emitterWidth,
      emitterHeight,
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
    node.emitterHeight = emitterHeight;
    node.emitterWidth = emitterWidth;
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
    const planeGeometry = new PlaneBufferGeometry();
    const geometry = new InstancedBufferGeometry();
    geometry.index = planeGeometry.index;
    geometry.attributes = planeGeometry.attributes;
    const material = new RawShaderMaterial({
      uniforms: {
        texture: { value: defaultParticleSprite }
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blendEquation: AdditiveBlending
    });

    super(editor, geometry, material);

    this.disableOutline = true;
    this.lastUpdated = 0;
    this._canonicalUrl = "";
    this.emitterHeight = 1;
    this.emitterWidth = 1;
    this.initialPositions = [];
    this.startSize = 0.25;
    this.endSize = 0.25;
    this.sizeRandomness = 0;
    this.startVelocity = new Vector3(0, 0, 0.5);
    this.endVelocity = new Vector3(0, 0, 0.5);
    this.angularVelocity = 0;
    this.particleCount = 100;
    this.lifetime = 5;
    this.lifetimes = [];
    this.lifetimeRandomness = 5;
    this.ageRandomness = 10;
    this.ages = [];
    this.colors = [];
    this.endColor = new Color();
    this.middleColor = new Color();
    this.startColor = new Color();
    this.startOpacity = 1;
    this.middleOpacity = 1;
    this.endOpacity = 1;
    this.colorCurve = "Linear";
    this.velocityCurve = "Linear";
    this.sizeCurve = "Linear";
    this.updateParticles();
  }

  get src() {
    return this._canonicalUrl;
  }

  set src(value) {
    this.load(value).catch(console.error);
  }

  updateParticles() {
    const planeGeometry = new PlaneBufferGeometry();
    const tempGeo = new InstancedBufferGeometry();
    tempGeo.index = planeGeometry.index;
    tempGeo.attributes = planeGeometry.attributes;

    const positions = [];
    const colors = [];
    const lifetimes = [];
    const ages = [];
    const initialAges = [];
    const initialPositions = [];
    const particleSizeRandomness = [];
    const angles = [];

    for (let i = 0; i < this.particleCount; i++) {
      initialAges[i] = Math.random() * this.ageRandomness - this.ageRandomness;
      lifetimes[i] = this.lifetime + Math.random() * 2 * this.lifetimeRandomness;
      ages[i] = initialAges[i];
      initialPositions[i * 3] = this.emitterWidth * (Math.random() * 2 - 1); // X
      initialPositions[i * 3 + 1] = this.emitterHeight * (Math.random() * 2 - 1); // Y
      initialPositions[i * 3 + 2] = 0; // Z
      particleSizeRandomness[i] = Math.random() * this.sizeRandomness;

      positions.push(initialPositions[i * 3]);
      positions.push(initialPositions[i * 3 + 1]);
      positions.push(initialPositions[i * 3 + 2]);
      positions.push(this.startSize + particleSizeRandomness[i]);

      angles.push(0);
      colors.push(this.startColor.r, this.startColor.g, this.startColor.b, 0);
    }
    tempGeo.addAttribute(
      "particlePosition",
      new InstancedBufferAttribute(new Float32Array(positions), 4).setDynamic(true)
    );
    tempGeo.addAttribute("particleColor", new InstancedBufferAttribute(new Float32Array(colors), 4).setDynamic(true));
    tempGeo.addAttribute("particleAngle", new InstancedBufferAttribute(new Float32Array(angles), 1).setDynamic(true));

    this.geometry = tempGeo;
    this.initialPositions = initialPositions;
    this.particleSizeRandomness = particleSizeRandomness;
    this.ages = ages;
    this.initialAges = initialAges;
    this.lifetimes = lifetimes;
    this.colors = colors;
  }

  async load(src) {
    const nextSrc = src || "";
    if (nextSrc === this._canonicalUrl) {
      return;
    }

    this._canonicalUrl = nextSrc;

    const { accessibleUrl } = await this.editor.api.resolveMedia(src);
    this.material.uniforms.texture.value = await new Promise((resolve, reject) => {
      new TextureLoader().load(accessibleUrl, resolve, null, e => reject(`Error loading Image. ${eventToMessage(e)}`));
    });
    this.material.uniforms.texture.value.flipY = false;

    return this;
  }

  onUpdate(dt) {
    const position = this.geometry.attributes.particlePosition.array;
    const color = this.geometry.attributes.particleColor.array;
    const particleAngle = this.geometry.attributes.particleAngle.array;

    for (let i = 0; i < this.particleCount; i++) {
      const prevAge = this.ages[i];
      const curAge = (this.ages[i] += dt);

      // Particle is dead
      if (curAge < 0) {
        continue;
      }

      // // Particle became alive
      if (curAge > 0 && prevAge <= 0) {
        color[i * 4 + 3] = this.startOpacity;
        continue;
      }

      // Particle died
      if (curAge > this.lifetimes[i]) {
        this.ages[i] = this.initialAges[i];
        position[i * 4] = this.initialPositions[i * 3];
        position[i * 4 + 1] = this.initialPositions[i * 3 + 1];
        position[i * 4 + 2] = this.initialPositions[i * 3 + 2];
        position[i * 4 + 3] = this.startSize + this.particleSizeRandomness[i];
        color[i * 4] = this.startColor.r;
        color[i * 4 + 1] = this.startColor.g;
        color[i * 4 + 2] = this.startColor.b;
        color[i * 4 + 3] = 0; // Set opacity to zero
        continue;
      }

      const normalizedAge = clamp(0, 1, this.ages[i] / this.lifetimes[i]);
      const velFactor = Curves[this.velocityCurve](normalizedAge);
      const sizeFactor = Curves[this.sizeCurve](normalizedAge);
      const colorFactor = Curves[this.colorCurve](normalizedAge);

      position[i * 4] += lerp(this.startVelocity.x, this.endVelocity.x, velFactor) * dt;
      position[i * 4 + 1] += lerp(this.startVelocity.y, this.endVelocity.y, velFactor) * dt;
      position[i * 4 + 2] += lerp(this.startVelocity.z, this.endVelocity.z, velFactor) * dt;
      position[i * 4 + 3] = lerp(
        this.startSize + this.particleSizeRandomness[i],
        this.endSize + this.particleSizeRandomness[i],
        sizeFactor
      );
      particleAngle[i] += this.angularVelocity * _Math.DEG2RAD * dt;

      if (colorFactor <= 0.5) {
        const colorFactor1 = colorFactor / 0.5;
        color[i * 4] = lerp(this.startColor.r, this.middleColor.r, colorFactor1);
        color[i * 4 + 1] = lerp(this.startColor.g, this.middleColor.g, colorFactor1);
        color[i * 4 + 2] = lerp(this.startColor.b, this.middleColor.b, colorFactor1);
        color[i * 4 + 3] = lerp(this.startOpacity, this.middleOpacity, colorFactor1);
      } else if (colorFactor > 0.5) {
        const colorFactor2 = (colorFactor - 0.5) / 0.5;
        color[i * 4] = lerp(this.middleColor.r, this.endColor.r, colorFactor2);
        color[i * 4 + 1] = lerp(this.middleColor.g, this.endColor.g, colorFactor2);
        color[i * 4 + 2] = lerp(this.middleColor.b, this.endColor.b, colorFactor2);
        color[i * 4 + 3] = lerp(this.middleOpacity, this.endOpacity, colorFactor2);
      }
    }

    this.geometry.attributes.particlePosition.needsUpdate = true;
    this.geometry.attributes.particleColor.needsUpdate = true;
    this.geometry.attributes.particleAngle.needsUpdate = true;
  }

  copy(source, recursive = true) {
    super.copy(source, recursive);

    this.src = source._canonicalUrl;
    this.startColor = source.startColor;
    this.middleColor = source.middleColor;
    this.endColor = source.endColor;
    this.startOpacity = source.startOpacity;
    this.middleOpacity = source.middleOpacity;
    this.endOpacity = source.endOpacity;
    this.colorCurve = source.colorCurve;
    this.emitterHeight = source.emitterHeight;
    this.emitterWidth = source.emitterWidth;
    this.sizeCurve = source.sizeCurve;
    this.startSize = source.startSize;
    this.endSize = source.endSize;
    this.sizeRandomness = source.sizeRandomness;
    this.ageRandomness = source.ageRandomness;
    this.lifetime = source.lifetime;
    this.lifetimeRandomness = source.lifetimeRandomness;
    this.particleCount = source.particleCount;
    this.startVelocity = source.startVelocity;
    this.endVelocity = source.endVelocity;
    this.velocityCurve = source.velocityCurve;
    this.angularVelocity = source.angularVelocity;

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
        emitterHeight: this.emitterHeight,
        emitterWidth: this.emitterWidth,
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
      emitterHeight: this.emitterHeight,
      emitterWidth: this.emitterWidth,
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
