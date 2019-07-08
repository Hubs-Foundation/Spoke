import THREE from "../../vendor/three";
import EditorNodeMixin from "./EditorNodeMixin";
import eventToMessage from "../utils/eventToMessage";
import spokeLogoSrc from "../../assets/spoke-icon.png";

function lerp(start, end, a) {
  return (end - start) * a + start;
}

function Even(k) {
  return k * k;
}

function EaseIn(k) {
  return k * k * k * k; //Quadratic
}

function EaseOut(k) {
  return Math.sin((k * Math.PI) / 2);
}

function EaseInOut(k) {
  if ((k *= 2) < 1) {
    return 0.5 * k * k * k * k * k;
  }

  return 0.5 * ((k -= 2) * k * k * k * k + 2);
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
        if ( position.z < -0.1) gl_PointSize = 0.0;	
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

export default class ParticleEmitterNode extends EditorNodeMixin(THREE.Points) {
  static legacyComponentName = "particle";

  static nodeName = "Particle Emitter";

  static initialElementProps = {
    src: new URL(spokeLogoSrc, location).href
  };

  static async deserialize(editor, json, loadAsync) {
    const node = await super.deserialize(editor, json);

    const {
      src,
      prewarm,
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
      lifetime,
      lifetimeRandomness
    } = json.components.find(c => c.name === "particle").props;

    node.startColor.set(startColor);
    node.middleColor.set(middleColor);
    node.endColor.set(endColor);
    node.colorCurve = colorCurve;
    node.velocityCurve = velocityCurve;
    node.prewarm = prewarm;
    node.startOpacity = startOpacity || 1;
    node.middleOpacity = middleOpacity || 1;
    node.endOpacity = endOpacity || 1;
    node.emitterHeight = emitterHeight || 1;
    node.emitterWidth = emitterWidth || 1;
    node.lifetime = lifetime || 5;
    node.size = size || 1;
    node.lifetimeRandomness = lifetimeRandomness || 5;
    node.particleCount = particleCount || 1000;
    node.velocity.copy(velocity);
    node.angularVelocity = angularVelocity || 0;
    //node.endVelocity = endVelocity || new THREE.Vector3(0, 0, 0.5);
    node.endVelocity.copy(endVelocity);
    // console.log("endVel: " + velocity + " , node.endVel: " + node.endVelocity);
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
      new THREE.TextureLoader().load(spokeLogoSrc, resolve, null, e =>
        reject(`Error loading Image. ${eventToMessage(e)}`)
      );
    });
    defaultParticleSprite.flipY = false;
  }

  constructor(editor) {
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.RawShaderMaterial({
      uniforms: {
        texture: { value: defaultParticleSprite }
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blendEquation: THREE.AdditiveBlending
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
    this.velocity = new THREE.Vector3(0, 0, 0.5);
    this.endVelocity = new THREE.Vector3(0, 0, 0.5);
    this.angularVelocity = 0;
    this.particleCount = 100;
    this.lifetime = 5;
    this.lifetimes = [];
    this.lifetimeRandomness = 5;
    this.ageRandomness = 5;
    this.ages = [];
    this.colors = [];
    this.endColor = new THREE.Color();
    this.middleColor = new THREE.Color();
    this.startColor = new THREE.Color();
    this.startOpacity = 1;
    this.middleOpacity = 1;
    this.endOpacity = 1;
    this.prewarm = false;
    this.colorCurve = "Even";
    this.velocityCurve = "Linear";
    this.createParticle();
  }

  get src() {
    return this._canonicalUrl;
  }

  set src(value) {
    this.load(value).catch(console.error);
  }

  createParticle() {
    const tempGeo = new THREE.BufferGeometry();
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
      colors.push(this.startColor.r);
      colors.push(this.startColor.g);
      colors.push(this.startColor.b);
      colors.push(this.startOpacity);
    }
    tempGeo.addAttribute("position", new THREE.Float32BufferAttribute(positions, 4).setDynamic(true));
    tempGeo.addAttribute("color", new THREE.Float32BufferAttribute(colors, 4).setDynamic(true));
    tempGeo.addAttribute("customAngle", new THREE.Float32BufferAttribute(angles, 1).setDynamic(true));

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
    console.log("accessibleUrl: " + accessibleUrl);
    this.material.uniforms.texture.value = await new Promise((resolve, reject) => {
      new THREE.TextureLoader().load(accessibleUrl, resolve, null, e =>
        reject(`Error loading Image. ${eventToMessage(e)}`)
      );
    });
    this.material.uniforms.texture.value.flipY = false;

    return this;
  }

  onUpdate(dt) {
    const position = this.geometry.attributes.position.array;
    const color = this.geometry.attributes.color.array;
    const customAngle = this.geometry.attributes.customAngle.array;
    const colorFactor = [];

    const velFactor = [];

    for (let i = 0; i < this.particleCount; i++) {
      this.ages[i] += dt;

      velFactor[i] = clamp(0, 1, this.ages[i] / this.lifetimes[i]);
      colorFactor[i] = clamp(0, 1, this.ages[i] / this.lifetimes[i]);
      position[i * 4 + 3] = this.size;

      if (this.ages[i] < 0) {
        color[i * 4] = this.startColor.r;
        color[i * 4 + 1] = this.startColor.g;
        color[i * 4 + 2] = this.startColor.b;
        color[i * 4 + 3] = this.startColor;
        velFactor[i] = 0;
        continue;
      }

      if (this.ages[i] > this.lifetimes[i]) {
        position[i * 4] = this.initialPositions[i * 3];
        position[i * 4 + 1] = this.initialPositions[i * 3 + 1];
        position[i * 4 + 2] = -1;
        velFactor[i] = 0;
        this.ages[i] = this.initialAges[i];
        colorFactor[i] = 0;

        continue;
      }

      switch (this.velocityCurve) {
        case "Linear":
          break;
        case "EaseIn":
          velFactor[i] = EaseIn(velFactor[i]);
          break;
        case "EaseOut":
          velFactor[i] = EaseOut(velFactor[i]);
          break;
        case "EaseInOut":
          velFactor[i] = EaseInOut(velFactor[i]);
          break;
      }

      this.velocities[i * 3] = lerp(this.velocity.x, this.endVelocity.x, velFactor[i]);
      this.velocities[i * 3 + 1] = lerp(this.velocity.y, this.endVelocity.y, velFactor[i]);
      this.velocities[i * 3 + 2] = lerp(this.velocity.z, this.endVelocity.z, velFactor[i]);

      position[i * 4] += this.velocities[i * 3] * dt;
      position[i * 4 + 1] += this.velocities[i * 3 + 1] * dt;
      position[i * 4 + 2] += this.velocities[i * 3 + 2] * dt;

      //angleVel = this.angularVelocity;
      customAngle[i] += this.angularVelocity * THREE.Math.DEG2RAD * dt;

      switch (this.colorCurve) {
        case "Even":
          colorFactor[i] = Even(colorFactor[i]);
          break;
        case "EaseIn":
          colorFactor[i] = EaseIn(colorFactor[i]);
          break;
        case "EaseOut":
          colorFactor[i] = EaseOut(colorFactor[i]);
          break;
        case "EaseInOut":
          colorFactor[i] = EaseInOut(colorFactor[i]);
          break;
      }

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
      particle: {
        src: this._canonicalUrl,
        emitterHeight: this.emitterHeight,
        emitterWidth: this.emitterWidth,
        startColor: this.startColor,
        middleColor: this.middleColor,
        endColor: this.endColor,
        startOpacity: this.startOpacity,
        middleOpacity: this.middleOpacity,
        endOpacity: this.endOpacity,
        size: this.size,
        velocity: this.velocity,
        endVelocity: this.endVelocity,
        angularVelocity: this.angularVelocity,
        particleCount: this.particleCount,
        lifetime: this.lifetime,
        lifetimeRandomness: this.lifetimeRandomness,
        colorCurve: this.colorCurve
      }
    });
  }

  prepareForExport() {
    super.prepareForExport();
    this.addGLTFComponent("particle", {
      src: this._canonicalUrl,
      emitterHeight: this.emitterHeight,
      emitterWidth: this.emitterWidth,
      startColor: this.startColor,
      middleColor: this.middleColor,
      endColor: this.endColor,
      startOpacity: this.startOpacity,
      middleOpacity: this.middleOpacity,
      endOpacity: this.endOpacity,
      size: this.size,
      velocity: this.velocity,
      endVelocity: this.endVelocity,
      angularVelocity: this.angularVelocity,
      particleCount: this.particleCount,
      lifetime: this.lifetime,
      lifetimeRandomness: this.lifetimeRandomness,
      colorCurve: this.colorCurve
    });
    this.replaceObject();
  }
}
