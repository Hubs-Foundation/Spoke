import THREE from "../../vendor/three";
import EditorNodeMixin from "./EditorNodeMixin";
import eventToMessage from "../utils/eventToMessage";
//import linkIconUrl from "../../assets/smile.png";
import spokeLogoSrc from "../../assets/spoke-icon.png";

let defaultParticleSprite = null;

const vertexShader = `
      #define BASE_PARTICLE_SIZE 300.0
      attribute float size;
      attribute vec3 customColor;
      attribute float age;     
      varying float vAge;
      varying float posz;
			void main() {
        //vColor = customColor;
        // if (age >=0.0 && age <=1.0){
        //   vAge = 1.0 - age;
        // }else if (age <0.0){
        //   vAge = age;
        // }
        vAge = 1.0;
        posz = position.z;
				vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
				gl_PointSize = size * ( BASE_PARTICLE_SIZE / -mvPosition.z );
				gl_Position = projectionMatrix * mvPosition;
      }
      `;

const fragmentShader = `
      uniform vec3 color;
			uniform sampler2D texture;
      varying float vAge;
      varying float posz;
			void main() {

        gl_FragColor = vec4( color , vAge );
				gl_FragColor = gl_FragColor * texture2D( texture, gl_PointCoord );
				if ( posz < 0.0 || gl_FragColor.a < 0.001) discard;
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
      EmitterWidth,
      EmitterHeight,
      size,
      velocity,
      particleCount,
      lifeTime,
      lifeTimeRandomnessRate
    } = json.components.find(c => c.name === "particle").props;

    node.color.set(color);
    node.EmitterHeight = EmitterHeight || 1;
    node.EmitterWidth = EmitterWidth || 1;
    node.lifeTime = lifeTime || 5; // use the bouding as life time, should be timed -1 later
    node.size = size || 1;
    node.lifeTimeRandomness = lifeTimeRandomnessRate || 0;
    node.particleCount = particleCount || 1000;
    node.velocity = velocity || 0.5;

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
    const material = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0xffffff) },
        texture: { value: defaultParticleSprite }
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      blendEquation: THREE.AdditiveBlending
      // TODO: Fix alpha parameters
    });

    super(editor, geometry, material);

    this.lastUpdated = 0;
    this._canonicalUrl = "";
    this.emitterHeight = 1;
    this.emitterWidth = 1;
    this.initialPositions = [];
    this.size = 1;
    this.velocity = 0.5;
    this.particleCount = 100;
    this.lifeTime = 10;
    this._rate = 0;
    this.lifeTimeRandomnessRate = 0;
    this.lifeTimeRandomness = [];
    this.ageRandomness = Math.random();
    this.createParticle();
  }

  get color() {
    return this.material.uniforms.color.value;
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
    const sizes = [];
    //const lifeTimes = [];
    const ages = [];
    const initialPositions = [];
    const lifeTimeRandomness = [];

    for (let i = 0; i < this.particleCount; i++) {
      lifeTimeRandomness[i] = Math.random() * 2;
      ages[i] = Math.random() * this.ageRandomness - this.ageRandomness;
      //lifeTimes[i] = this.lifeTime + lifeTimeRandomness[i] * this.lifeTimeRandomnessRate;
      initialPositions[i] = this.emitterWidth * (Math.random() * 2 - 1); // x
      initialPositions[i + 1] = this.emitterHeight * (Math.random() * 2 - 1); // Y
      initialPositions[i + 2] = Math.random() * this.lifeTime * 3 - this.lifeTime * 3; // Z

      positions.push(initialPositions[i]);
      positions.push(initialPositions[i + 1]);
      positions.push(initialPositions[i + 2]);
      sizes.push(this.size);
      ages.push(ages[i]);
    }
    tempGeo.addAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    //tempGeo.addAttribute("lifeTime", new THREE.Float32BufferAttribute(lifeTimes, 1));
    tempGeo.addAttribute("age", new THREE.Float32BufferAttribute(ages, 1).setDynamic(true));
    tempGeo.addAttribute("size", new THREE.Float32BufferAttribute(sizes, 1).setDynamic(true));
    this.geometry = tempGeo;
    this.initialPositions = initialPositions;
    this.age = ages;
    this.lifeTimeRandomness = lifeTimeRandomness;
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

  onUpdate(dt, time) {
    const position = this.geometry.attributes.position.array;
    const age = this.geometry.attributes.age.array;
    //console.log("age 1: " + age[1]);
    //const tempPos = [];
    let count = 0;
    for (let i = 0; i < 3 * this.particleCount; i++) {
      const check = (i + 1) % 3; // get pos z
      if (check == 0) {
        const t = dt * 10;
        ///age[count] = (position[i] + this.ageRandomness) / (lifeTime[count] + this.ageRandomness);
        age[count] += dt;
        if (age[count] < 0) {
          position[i] = this.initialPositions[i];
        } else if (age[count] >= 0) {
          if (position[i] < this.lifeTime + this.lifeTimeRandomness[i] * this.lifeTimeRandomnessRate) {
            position[i] += this.velocity * t;
          }
        }

        if (position[i] >= this.lifeTime + this.lifeTimeRandomness[i] * this.lifeTimeRandomnessRate) {
          position[i] = this.initialPositions[i];
          age[count] = this.age[count];
        }
        count++;

        //age[i] = 1 - (this.lifeTime - position[i]) / this.lifeTime; // normalized age, oldest euquals to 0
      }
    }
    //count = 0;
    const sizes = this.geometry.attributes.size.array;
    for (let i = 0; i < this.particleCount; i++) {
      age[i] += dt;

      //sizes[i] = 2 + 0.5 * Math.sin(0.1 * i + time);
      sizes[i] = this.size;
    }
    //tempPos = [];
    //tempScatter = [];

    if (time - this.lastUpdated > 2) {
      //this.material.uniforms.color.value.setRGB(Math.random(), Math.random(), Math.random());
      this.lastUpdated = time;
    }

    this.geometry.attributes.size.needsUpdate = true;
    this.geometry.attributes.age.needsUpdate = true;
    this.geometry.attributes.position.needsUpdate = true;
  }

  serialize() {
    return super.serialize({
      particle: {
        src: this._canonicalUrl,
        EmitterHeight: this.EmitterHeight,
        EmitterWidth: this.EmitterWidth,
        color: this.color,
        size: this.size,
        velocity: this.velocity,
        particleCount: this.particleCount,
        lifeTime: this.lifeTime

        //particleSystem: this.particleSystem
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
