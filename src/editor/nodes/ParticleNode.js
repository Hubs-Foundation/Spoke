import THREE from "../../vendor/three";
import EditorNodeMixin from "./EditorNodeMixin";
import eventToMessage from "../utils/eventToMessage";
import spokeLogoSrc from "../../assets/spoke-icon.png";

let defaultParticleSprite = null;

const vertexShader = `
      precision highp float;

      #define BASE_PARTICLE_SIZE 300.0

      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;


      attribute vec4 color;
      attribute vec4 position;
      //attribute bool prewarm;

      varying vec4 vColor;
      varying float vPosZ;
      //varyung bool vPrewarm;

      

			void main() {
        vPosZ = position.z;
        vColor = color;
       // vPrewarm = prewarm;
    
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
      //varying bool vPrewarm;
      
      vec4 colorB = vec4(1.000,0.833,0.224,1.0);

      void main() {
        //float a = vColor.a;
        //vec4 temoColor = vec4(0.0);
       // temoColor = mix(vColor, colorB, a);
        gl_FragColor = vColor; //vec4(temoColor.rgb, 1.0);
        gl_FragColor = gl_FragColor * texture2D( texture, gl_PointCoord );
        
        if ( vPosZ < -0.1) discard;
        
				
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
      prewarm,
      curve,
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
      particleCount,
      lifetime,
      lifetimeRandomness
    } = json.components.find(c => c.name === "particle").props;

    node.startColor.set(startColor);
    node.middleColor.set(middleColor);
    node.endColor.set(endColor);
    node.curve = curve;
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
      // TODO: Fix alpha parameters
    });

    super(editor, geometry, material);

    //this.colorNeedsUpdate = false;
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
    this.curve = 0;
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
      initialPositions[i + 2] = 0; // Z

      positions.push(initialPositions[i]);
      positions.push(initialPositions[i + 1]);
      positions.push(initialPositions[i + 2]);
      positions.push(this.size);

      colors.push(this.startColor.r);
      colors.push(this.startColor.g);
      colors.push(this.startColor.b);
      colors.push(this.startOpacity);
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
    const colorFactor = [] || 0;
    const opacityFactor = [] || 0;

    for (let i = 0; i < this.particleCount; i++) {
      this.ages[i] += dt;
      position[i * 4 + 3] = this.size;

      if (this.ages[i] < 0) {
        color[i * 4] = this.startColor.r;
        color[i * 4 + 1] = this.startColor.g;
        color[i * 4 + 2] = this.startColor.b;
        color[i * 4 + 3] = this.startColor;
        continue;
      }

      if (this.ages[i] > this.lifetimes[i]) {
        colorFactor[i] = 0;
        opacityFactor[i] = 0;
        position[i * 4] = this.initialPositions[i * 3];
        position[i * 4 + 1] = this.initialPositions[i * 3 + 1];
        position[i * 4 + 2] = -1; //this.initialPositions[i * 3 + 2];
        this.ages[i] = this.initialAges[i];

        continue;
      }
      if (this.ages[i] == this.initialAges[i]) {
        colorFactor[i] = 0;
        opacityFactor[i] = 0;
      }

      position[i * 4] += this.velocity.x * dt;
      position[i * 4 + 1] += this.velocity.y * dt;
      position[i * 4 + 2] += this.velocity.z * dt;

      colorFactor[i] = position[i * 4 + 2] / (this.lifetimes[i] - this.initialAges[i] + 0.2); // color colorFactor
      opacityFactor[i] = position[i * 4 + 2] / (this.lifetimes[i] - this.initialAges[i] + 0.2);

      switch (this.curve) {
        case 0:
          break;
        case 1:
          colorFactor[i] = Math.pow(colorFactor[i], 0.6);
          break;
        case 2:
          colorFactor[i] = this.smoothstep(0.0, 1.0, colorFactor[i]);
          break;
      }

      if (colorFactor[i] <= 0.25) {
        color[i * 4] = this.gradient(this.startColor.r, this.middleColor.r, colorFactor[i] / 0.25);
        color[i * 4 + 1] = this.gradient(this.startColor.g, this.middleColor.g, colorFactor[i] / 0.25);
        color[i * 4 + 2] = this.gradient(this.startColor.b, this.middleColor.b, colorFactor[i] / 0.25);
        color[i * 4 + 3] = this.gradient(this.startOpacity, this.middleOpacity, opacityFactor[i] / 0.25);
      } else if (colorFactor[i] > 0.25) {
        color[i * 4] = this.gradient(this.middleColor.r, this.endColor.r, colorFactor[i] / 0.5);
        color[i * 4 + 1] = this.gradient(this.middleColor.g, this.endColor.g, colorFactor[i] / 0.5);
        color[i * 4 + 2] = this.gradient(this.middleColor.b, this.endColor.b, colorFactor[i] / 0.5);
        color[i * 4 + 3] = this.gradient(this.middleOpacity, this.endOpacity, opacityFactor[i] / 0.5);
      }

      this.geometry.attributes.position.needsUpdate = true;
      this.geometry.attributes.color.needsUpdate = true;
    }
  }

  gradient(start, end, a) {
    return (end - start) * a + start;
  }

  smoothstep(min, max, x) {
    x = this.clamp((x - min) / (max - min), 0.0, 1.0);
    return x * x * (3 - 2 * x);
  }

  clamp(x, min, max) {
    if (x < min) x = min;
    if (x > max) x = max;
    return x;
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
        particleCount: this.particleCount,
        lifetime: this.lifetime,
        lifetimeRandomness: this.lifetimeRandomness,
        curve: this.curve
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
