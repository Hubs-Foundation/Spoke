import THREE from "../../vendor/three";
import EditorNodeMixin from "./EditorNodeMixin";
import eventToMessage from "../utils/eventToMessage";
//import linkIconUrl from "../../assets/smile.png";
import spokeLogoSrc from "../../assets/spoke-icon.png";

let defaultParticleSprite = null;

const vertexShader = `
      precision highp float;

      #define BASE_PARTICLE_SIZE 300.0

      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;


      attribute vec4 color;
      attribute vec4 position;

      varying vec4 vColor;
      varying float vPosZ;

      

			void main() {
        vPosZ = position.z;
        vColor = color;
    
				vec4 mvPosition = modelViewMatrix * vec4( position.xyz, 1.0 );
				gl_PointSize = position.w * ( BASE_PARTICLE_SIZE / -mvPosition.z );
				gl_Position = projectionMatrix * mvPosition;
      }
      `;

const fragmentShader = `
      precision highp float;

      uniform sampler2D texture;

      varying vec4 vColor;
      varying float vPosZ;
      
      //vec4 colorB = vec4(1.000,0.833,0.224,1.0);

      void main() {
       
        //gl_FragColor = mix(vColor, colorB, a);
        gl_FragColor = vColor;
				gl_FragColor = gl_FragColor * texture2D( texture, gl_PointCoord );
				if ( vPosZ < 0.0 || gl_FragColor.a < 0.001) discard;
			}
  `;

export default class ParticleNode extends EditorNodeMixin(THREE.Points) {
  static legacyComponentName = "particle";

  static nodeName = "Particle";

  static initialElementProps = {
    src: new URL(spokeLogoSrc, location).href
  };

  static async deserialize(editor, json, loadAsync) {
    const node = await super.deserialize(editor, json);

    const {
      src,
      color,
      emitterWidth,
      emitterHeight,
      size,
      velocity,
      particleCount,
      lifetime,
      lifetimeRandomness
    } = json.components.find(c => c.name === "particle").props;

    node.color.set(color);
    node.emitterHeight = emitterHeight || 1;
    node.emitterWidth = emitterWidth || 1;
    node.lifetime = lifetime || 5; // use the bouding as life time, should be timed -1 later
    node.size = size || 1;
    node.lifetimeRandomness = lifetimeRandomness || 0.2;
    node.particleCount = particleCount || 1000;
    node.velocity.copy(velocity);

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
      blendEquation: THREE.AdditiveBlending
      // TODO: Fix alpha parameters
    });

    super(editor, geometry, material);

    this.colorNeedsUpdate = false;
    this.lastUpdated = 0;
    this._canonicalUrl = "";
    this.emitterHeight = 1;
    this.emitterWidth = 1;
    this.initialPositions = [];
    this.size = 1;
    this.velocity = new THREE.Vector3(0, 0, 0.5);
    this.particleCount = 100;
    this.lifetime = 5;
    this.lifetimes = [];
    this.lifetimeRandomness = 0.2;
    this.ageRandomness = Math.random();
    this.ages = [];
    this.colors = [];
    this.color = new THREE.Color();
    this.opacity = 1;
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

    for (let i = 0; i < this.particleCount; i++) {
      initialAges[i] = ages[i] = Math.random() * this.ageRandomness - this.ageRandomness;
      lifetimes[i] = this.lifetime + Math.random() * 2 * this.lifetimeRandomness;

      initialPositions[i] = this.emitterWidth * (Math.random() * 2 - 1); // x
      initialPositions[i + 1] = this.emitterHeight * (Math.random() * 2 - 1); // Y
      initialPositions[i + 2] = Math.random() * (this.lifetime - ages[i]) * 2 - (this.lifetime - ages[i]) * 2; // Z

      positions.push(initialPositions[i]);
      positions.push(initialPositions[i + 1]);
      positions.push(initialPositions[i + 2]);
      positions.push(this.size);

      colors.push(this.color.r);
      colors.push(this.color.g);
      colors.push(this.color.b);
      colors.push(this.opacity);
    }
    tempGeo.addAttribute("position", new THREE.Float32BufferAttribute(positions, 4).setDynamic(true));
    tempGeo.addAttribute("color", new THREE.Float32BufferAttribute(colors, 4).setDynamic(true));

    this.geometry = tempGeo;
    this.initialPositions = initialPositions;
    this.ages = ages;
    this.initialAges = initialAges;
    this.lifetimes = lifetimes;
    this.colors = colors;

    console.log(this);
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
    for (let i = 0; i < this.particleCount; i++) {
      this.ages[i] += dt;

      if (this.ages[i] < 0) {
        continue;
      }

      if (this.ages[i] > this.lifetimes[i]) {
        position[i * 4] = this.initialPositions[i * 3];
        position[i * 4 + 1] = this.initialPositions[i * 3 + 1];
        position[i * 4 + 2] = this.initialPositions[i * 3 + 2];
        this.ages[i] = this.initialAges[i];
        continue;
      }

      position[i * 4] += this.velocity.x * dt;
      position[i * 4 + 1] += this.velocity.y * dt;
      position[i * 4 + 2] += this.velocity.z * dt;
      if (this.colorNeedsUpdate) {
        color[i * 4] = this.color.r;
        color[i * 4 + 1] = this.color.g;
        color[i * 4 + 2] = this.color.b;
        this.geometry.attributes.color.needsUpdate = true;
      }
      this.geometry.attributes.position.needsUpdate = true;
    }
    this.colorNeedsUpdate = false;
  }

  serialize() {
    return super.serialize({
      particle: {
        src: this._canonicalUrl,
        emitterHeight: this.emitterHeight,
        emitterWidth: this.emitterWidth,
        color: this.color,
        size: this.size,
        velocity: this.velocity,
        particleCount: this.particleCount,
        lifetime: this.lifetime,
        lifetimeRandomness: this.lifetimeRandomness
      }
    });
  }

  prepareForExport() {
    super.prepareForExport();
    this.addGLTFComponent("particle", {
      src: this._canonicalUrl
    });
    this.replaceObject();
  }
}
