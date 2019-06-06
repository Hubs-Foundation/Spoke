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
			void main() {
        //vColor = customColor;
        vAge = age;
				vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
				gl_PointSize = size * ( BASE_PARTICLE_SIZE / -mvPosition.z );
				gl_Position = projectionMatrix * mvPosition;
      }
      `;

const fragmentShader = `
      uniform vec3 color;
			uniform sampler2D texture;
      varying float vAge;
			void main() {

        gl_FragColor = vec4( color , vAge );
				gl_FragColor = gl_FragColor * texture2D( texture, gl_PointCoord );
			//	if ( gl_FragColor.a < ALPHATEST ) discard;
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

    const { src, color, range, size, idle, speed, particleCount, lifeTime } = json.components.find(
      c => c.name === "particle"
    ).props;

    node.color.set(color);
    node.lifeTime = lifeTime || 5; // use the bouding as life time, should be timed -1 later
    node.range = range || 5;
    node.size = size || 1;
    node.idle = idle || false;
    node.particleCount = particleCount || 1000;
    if (this._idle) {
      node.speed = speed || 0.5;
    } else {
      node.speed = speed || 2;
    }

    loadAsync(
      (async () => {
        await node.load(src);
      })()
    );
    node.rebuildGeometry();

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
    this.range = 5;
    this.initialPositions = [];
    this.size = 1;
    this.idle = false;
    this._speed = 1;
    this._idleSpeed = 0.5;
    this.particleCount = 100;
    this.lifeTime = 10;
    this.scatter = 5;
    this.rebuildGeometry();
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

  rebuildGeometry() {
    const tempGeo = new THREE.BufferGeometry();
    const positions = [];
    const sizes = [];
    const ages = [];
    const initialPositions = [];

    for (let i = 0; i < this.particleCount; i++) {
      initialPositions[i] = this.scatter * (Math.random() * 2 - 1); // X
      initialPositions[i + 1] = this.scatter * (Math.random() * 2 - 1); // Y
      initialPositions[i + 2] = this.scatter * (Math.random() * 2 - 1); // Z

      positions.push(initialPositions[i] * this.scatter);
      positions.push(initialPositions[i + 1] * this.scatter);
      positions.push(initialPositions[i + 2] * this.scatter);
      sizes.push(this.size);
      ages.push(0);
    }
    tempGeo.addAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    tempGeo.addAttribute("age", new THREE.Float32BufferAttribute(ages, 1).setDynamic(true));
    tempGeo.addAttribute("size", new THREE.Float32BufferAttribute(sizes, 1).setDynamic(true));
    this.geometry = tempGeo;
    this.initialPositions = initialPositions;
  }

  get idle() {
    return this._idle;
  }

  set idle(bool) {
    this._idle = bool;
  }

  get speed() {
    if (this._idle) {
      return this._idleSpeed;
    } else {
      return this._speed;
    }
  }

  set speed(vel) {
    if (this._idle) {
      this._idleSpeed = vel;
    } else {
      this._speed = vel;
    }
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
    const lifeTime = this.lifeTime * -1; // turm it to actual position, which is negetive
    const tempPos = [];
    const tempScatter = [];
    let count = 0;
    for (let i = 0; i < 3 * this.particleCount; i++) {
      const check = (i - 1) % 3;
      if (check == 0) {
        const t = dt * 10;

        if (this._idle) {
          position[i] = this.scatter * (this.initialPositions[i] + this._idleSpeed * Math.sin(0.4 * i + time)); // jellyfish
        } else {
          position[i] -= this.speed * t; // * -1 for default particle falling behaviour

          if (position[i] < lifeTime) {
            position[i] = this.initialPositions[i]; // * this.range;
          }
        }
        //tempPos.push(position[i]); //position 是原来的ARRAY, temppos是新的ARRAY
        //tempScatter.push(this.scatter[i]);
        tempPos[count] = position[i];
        tempScatter[count] = this.initialPositions[i];
        count++;

        //age[i] = 1 - (this.lifeTime - position[i]) / this.lifeTime; // normalized age, oldest euquals to 0

        // if (position[i] < -10) {
        //   position[i] = this._scatter[i] * this.range;
        // }
      }
    }
    count = 0;
    const sizes = this.geometry.attributes.size.array;
    for (let i = 0; i < this.particleCount; i++) {
      if (this._idle) {
        sizes[i] = this.size + this._idleSpeed * 5 * Math.sin(0.1 * i + time);
        age[i] = 1;
      } else {
        sizes[i] = this.size;
        age[i] = 1;
        // age[i] = (this.lifeTime + tempPos[i]) / (this.lifeTime - tempScatter[i]);
      }

      // normalized age, oldest euquals to 0
      //console.log("age 10 " + age[10]);
      //sizes[i] = 2 + 0.5 * Math.sin(0.1 * i + time);
      //sizes[i] = 1;
    }
    //tempPos = [];
    //tempScatter = [];

    if (time - this.lastUpdated > 2) {
      //this.material.uniforms.color.value.setRGB(Math.random(), Math.random(), Math.random());
      this.lastUpdated = time;
    }

    this.geometry.attributes.size.needsUpdate = true;
    this.geometry.attributes.position.needsUpdate = true;
  }

  serialize() {
    return super.serialize({
      particle: {
        src: this._canonicalUrl,
        color: this.color,
        range: this.range,
        size: this.size,
        idle: this.idle,
        speed: this.speed,
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
