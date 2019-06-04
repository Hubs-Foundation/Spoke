import THREE from "../../vendor/three";
import EditorNodeMixin from "./EditorNodeMixin";
import eventToMessage from "../utils/eventToMessage";
//import linkIconUrl from "../../assets/smile.png";
import spokeLogoSrc from "../../assets/spoke-icon.png";

let defaultParticleSprite = null;

const vertexShader = `
attribute float size;
      attribute vec3 customColor;
      attribute float age;
      varying float vAge;
			//varying vec3 vColor;
			void main() {
        //vColor = customColor;
        vAge = age;
				vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
				gl_PointSize = size * ( 300.0 / -mvPosition.z );
				gl_Position = projectionMatrix * mvPosition;
      }
      `;

const fragmentShader = `
  uniform vec3 color;
  //uniform float opacity;
			uniform sampler2D texture;
    //	varying vec3 vColor;
    varying float vAge;
			void main() {
        gl_FragColor = vec4( color , vAge );
        vec2 uv = vec2 (gl_PointCoord.s, gl_PointCoord.t);
				gl_FragColor = gl_FragColor * texture2D( texture, gl_PointCoord );
			//	if ( gl_FragColor.a < ALPHATEST ) discard;
			}
  `;
const c = [] || "";
export default class ParticleNode extends EditorNodeMixin(THREE.Points) {
  static legacyComponentName = "particle";

  static nodeName = "Particle";

  static initialElementProps = {
    src: new URL(spokeLogoSrc, location).href
  };

  static async deserialize(editor, json, loadAsync) {
    const node = await super.deserialize(editor, json);

    const { src, color, range, size, idle, speed, particleCount } = json.components.find(
      c => c.name === "particle"
    ).props;

    node.color.set(color);
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
        texture: { value: defaultParticleSprite },
        opacity: { value: 0.5 }
      },
      vertexShader,
      fragmentShader,
      transparent: true
    });

    super(editor, geometry, material);

    this.lastUpdated = 0;
    this._canonicalUrl = "";
    this._range = 5;
    this._scatter = [];
    this._size = 1;
    this._idle = false;
    this._speed = 4;
    this._idleSpeed = 0.5;
    this._pCount = 1000;

    const positions = [];
    const sizes = [];
    const ages = [];

    for (let i = 0; i < this._pCount; i++) {
      this._scatter[i] = Math.random() * 5 - 1; // scattered position x
      this._scatter[i + 1] = Math.random() * 5 - 1; // scattered position y
      this._scatter[i + 2] = Math.random() * 5 - 1; // scattered position z

      positions.push(this._scatter[i] * this._range);
      positions.push(this._scatter[i + 1] * this._range);
      positions.push(this._scatter[i + 2] * this._range);
      sizes.push(this._size);
      ages.push(0);
    }
    this.geometry.addAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    this.geometry.addAttribute("age", new THREE.Float32BufferAttribute(ages, 1).setDynamic(true));
    this.geometry.addAttribute("size", new THREE.Float32BufferAttribute(sizes, 1).setDynamic(true));

    for (let i = 0; i < 3 * this._pCount; i++) {
      c[i] = this.geometry.attributes.position.array[i];
    }
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

  get range() {
    return this._range;
  }

  get particleCount() {
    return this._pCount;
  }

  set particleCount(num) {
    this._pCount = num;

    const positions = [] || "";
    const sizes = [] || "";
    for (let i = 0; i < this._pCount; i++) {
      positions.push(this._scatter[i] * this.range);
      positions.push(this._scatter[i + 1] * this.range);
      positions.push(this._scatter[i + 2] * this.range);
      sizes.push(this._size);
    }

    this.geometry.addAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    this.geometry.addAttribute("size", new THREE.Float32BufferAttribute(sizes, 1).setDynamic(true));
  }

  set range(range) {
    this._range = range;
    const positions = [] || "";
    for (let i = 0; i < this._pCount; i++) {
      positions.push(this._scatter[i] * this._range);
      positions.push(this._scatter[i + 1] * this._range);
      positions.push(this._scatter[i + 2] * this._range);
    }
    this.geometry.addAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    //console.log("set range to " + this._range);
  }

  get size() {
    return this._size;
  }

  set size(size) {
    this._size = size;
    const sizes = [] || "";
    for (let i = 0; i < this._pCount; i++) {
      sizes.push(this._size);
    }
    this.geometry.addAttribute("size", new THREE.Float32BufferAttribute(sizes, 1).setDynamic(true));
    console.log("set size to " + this._size);
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
    // console.log("p count " + this._pCount);
    for (let i = 0; i < 3 * this._pCount; i++) {
      const check = (i - 1) % 3;
      if (check == 0) {
        const t = dt * 10;

        if (this._idle) {
          position[i] = this.range * (c[i] + this._idleSpeed * Math.sin(0.4 * i + time)); // jellyfish
        } else {
          position[i] += this.speed * t * t * this.range;

          if (position[i] > 5) {
            position[i] = this._scatter[i] * this.range;
          }
        }
        age[i] = 1 - (5 - position[i]) / 5;

        // if (position[i] < -10) {
        //   position[i] = this._scatter[i] * this.range;
        // }
      }
    }
    const sizes = this.geometry.attributes.size.array;
    for (let i = 0; i < this._pCount; i++) {
      if (this._idle) {
        sizes[i] = this._size + this._idleSpeed * 5 * Math.sin(0.1 * i + time);
      } else {
        sizes[i] = this._size;
      }
      //sizes[i] = 2 + 0.5 * Math.sin(0.1 * i + time);
      //sizes[i] = 1;
    }

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
        particleCount: this.particleCount

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
