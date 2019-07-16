import {
  Points,
  TextureLoader,
  BufferGeometry,
  RawShaderMaterial,
  AdditiveBlending,
  Vector3,
  Color,
  Float32BufferAttribute,
  Math as _Math
} from "three";
import EditorNodeMixin from "./EditorNodeMixin";
import eventToMessage from "../utils/eventToMessage";
import defaultParticleUrl from "../../assets/dot.png";

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

      attribute vec4 color;
      attribute vec4 position;
      attribute float customAngle;

      varying float vAngle;
      varying vec4 vColor;

      void main() {
        vColor = color;
        vAngle = customAngle;

        vec4 mvPosition = modelViewMatrix * vec4( position.xyz, 1.0 );
        gl_PointSize = position.w * ( BASE_PARTICLE_SIZE / -mvPosition.z );
        gl_Position = projectionMatrix * mvPosition;
      }
      `;

const fragmentShader = `
      precision highp float;

      uniform sampler2D texture;

      varying float vAngle;
      varying vec4 vColor;

      void main() {
        float c = cos(vAngle);
        float s = sin(vAngle);
        gl_FragColor = vColor;

        vec2 rotatedUV = vec2(c * (gl_PointCoord.x - 0.5) + s * (gl_PointCoord.y - 0.5) + 0.5,
        c * (gl_PointCoord.y - 0.5) - s * (gl_PointCoord.x - 0.5) + 0.5);  // rotate UV coordinates to rotate texture
        vec4 rotatedTexture = texture2D( texture,  rotatedUV );

        gl_FragColor = gl_FragColor * rotatedTexture;
      }
  `;

const Curves = {
  Even(k) {
    return k * k;
  },

  EaseIn(k) {
    return k * k * k * k; //Quadratic
  },

  EaseOut(k) {
    return Math.sin((k * Math.PI) / 2);
  },

  EaseInOut(k) {
    if ((k *= 2) < 1) {
      return 0.5 * k * k * k * k * k;
    }

    return 0.5 * ((k -= 2) * k * k * k * k + 2);
  },
  Linear(k) {
    return k;
  }
};

export default class ParticleEmitterNode extends EditorNodeMixin(Points) {
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
      size,
      velocity,
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
    node.size = size;
    node.ageRandomness = ageRandomness;
    node.lifetime = lifetime;
    node.lifetimeRandomness = lifetimeRandomness;
    node.particleCount = particleCount;
    node.velocity.copy(velocity);
    node.endVelocity.copy(endVelocity);
    node.velocityCurve = velocityCurve || "Linear";
    node.angularVelocity = angularVelocity;

    loadAsync(
      (async () => {
        await node.load(src);
      })()
    );
    node.createParticle();

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
    const geometry = new BufferGeometry();
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
    this.size = 0.25;
    this.velocities = [];
    this.velocity = new Vector3(0, 0, 0.5);
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
    this.colorCurve = "Even";
    this.velocityCurve = "Linear";
    this.colorFactor = [];
    this.velFactor = [];
    this.createParticle();
  }

  get src() {
    return this._canonicalUrl;
  }

  set src(value) {
    this.load(value).catch(console.error);
  }

  createParticle() {
    const tempGeo = new BufferGeometry();
    const positions = [];
    const colors = [];
    const lifetimes = [];
    const ages = [];
    const initialAges = [];
    const initialPositions = [];
    const angles = [];

    for (let i = 0; i < this.particleCount; i++) {
      initialAges[i] = ages[i] = Math.random() * this.ageRandomness - this.ageRandomness;
      lifetimes[i] = this.lifetime + Math.random() * 2 * this.lifetimeRandomness;

      initialPositions[i] = this.emitterWidth * (Math.random() * 2 - 1); // X
      initialPositions[i + 1] = this.emitterHeight * (Math.random() * 2 - 1); // Y
      initialPositions[i + 2] = 0; // Z

      positions.push(initialPositions[i]);
      positions.push(initialPositions[i + 1]);
      positions.push(initialPositions[i + 2]);
      positions.push(this.size);

      angles.push(0);
      colors.push(0, 0, 0, 0);
    }
    tempGeo.addAttribute("position", new Float32BufferAttribute(positions, 4).setDynamic(true));
    tempGeo.addAttribute("color", new Float32BufferAttribute(colors, 4).setDynamic(true));
    tempGeo.addAttribute("customAngle", new Float32BufferAttribute(angles, 1).setDynamic(true));

    this.geometry = tempGeo;
    this.initialPositions = initialPositions;
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
    const position = this.geometry.attributes.position.array;
    const color = this.geometry.attributes.color.array;
    const customAngle = this.geometry.attributes.customAngle.array;
    const colorFactor = this.colorFactor;
    const velFactor = this.velFactor;

    for (let i = 0; i < this.particleCount; i++) {
      const prevAge = this.ages[i];
      this.ages[i] += dt;

      // Particle is dead
      if (this.ages[i] < 0) {
        continue;
      }

      velFactor[i] = clamp(0, 1, this.ages[i] / this.lifetimes[i]);
      colorFactor[i] = clamp(0, 1, this.ages[i] / this.lifetimes[i]);
      position[i * 4 + 3] = this.size;

      // Particle became alive
      if (this.ages[i] > 0 && prevAge <= 0) {
        color[i * 4] = this.startColor.r;
        color[i * 4 + 1] = this.startColor.g;
        color[i * 4 + 2] = this.startColor.b;
        color[i * 4 + 3] = this.startOpacity;
        velFactor[i] = 0;
        continue;
      }

      // Particle died
      if (this.ages[i] > this.lifetimes[i]) {
        position[i * 4] = this.initialPositions[i * 3];
        position[i * 4 + 1] = this.initialPositions[i * 3 + 1];
        position[i * 4 + 2] = this.initialPositions[i * 3 + 2];
        velFactor[i] = 0;
        this.ages[i] = this.initialAges[i];
        color[i * 4 + 3] = 0;
        colorFactor[i] = 0;
        continue;
      }

      const VelCurveFunction = Curves[this.velocityCurve];
      velFactor[i] = VelCurveFunction(velFactor[i]);

      this.velocities[i * 3] = lerp(this.velocity.x, this.endVelocity.x, velFactor[i]);
      this.velocities[i * 3 + 1] = lerp(this.velocity.y, this.endVelocity.y, velFactor[i]);
      this.velocities[i * 3 + 2] = lerp(this.velocity.z, this.endVelocity.z, velFactor[i]);

      position[i * 4] += this.velocities[i * 3] * dt;
      position[i * 4 + 1] += this.velocities[i * 3 + 1] * dt;
      position[i * 4 + 2] += this.velocities[i * 3 + 2] * dt;
      customAngle[i] += this.angularVelocity * _Math.DEG2RAD * dt;

      const ColCurveFunction = Curves[this.colorCurve];
      colorFactor[i] = ColCurveFunction(colorFactor[i]);

      if (colorFactor[i] <= 0.5) {
        color[i * 4] = lerp(this.startColor.r, this.middleColor.r, colorFactor[i] / 0.5);
        color[i * 4 + 1] = lerp(this.startColor.g, this.middleColor.g, colorFactor[i] / 0.5);
        color[i * 4 + 2] = lerp(this.startColor.b, this.middleColor.b, colorFactor[i] / 0.5);
        color[i * 4 + 3] = lerp(this.startOpacity, this.middleOpacity, colorFactor[i] / 0.5);
      } else if (colorFactor[i] > 0.5) {
        color[i * 4] = lerp(this.middleColor.r, this.endColor.r, (colorFactor[i] - 0.5) / 0.5);
        color[i * 4 + 1] = lerp(this.middleColor.g, this.endColor.g, (colorFactor[i] - 0.5) / 0.5);
        color[i * 4 + 2] = lerp(this.middleColor.b, this.endColor.b, (colorFactor[i] - 0.5) / 0.5);
        color[i * 4 + 3] = lerp(this.middleOpacity, this.endOpacity, (colorFactor[i] - 0.5) / 0.5);
      }

      this.geometry.attributes.position.needsUpdate = true;
      this.geometry.attributes.color.needsUpdate = true;
      this.geometry.attributes.customAngle.needsUpdate = true;
    }
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
        size: this.size,
        ageRandomness: this.ageRandomness,
        lifetime: this.lifetime,
        lifetimeRandomness: this.lifetimeRandomness,
        particleCount: this.particleCount,
        velocity: this.velocity,
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
      size: this.size,
      ageRandomness: this.ageRandomness,
      lifetime: this.lifetime,
      lifetimeRandomness: this.lifetimeRandomness,
      particleCount: this.particleCount,
      velocity: this.velocity,
      endVelocity: this.endVelocity,
      velocityCurve: this.velocityCurve,
      angularVelocity: this.angularVelocity
    });
    this.replaceObject();
  }
}
