import THREE from "../../vendor/three";
import EditorNodeMixin from "./EditorNodeMixin";
import eventToMessage from "../utils/eventToMessage";
import linkIconUrl from "../../assets/link-icon.png";

let defaultParticleSprite = null;

const vertexShader = `
attribute float size;
			attribute vec3 customColor;
			//varying vec3 vColor;
			void main() {
				//vColor = customColor;
				vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
				gl_PointSize = size * ( 300.0 / -mvPosition.z );
				gl_Position = projectionMatrix * mvPosition;
      }
      `;

const fragmentShader = `
  uniform vec3 color;
			uniform sampler2D texture;
		//	varying vec3 vColor;
			void main() {
				gl_FragColor = vec4( color , 1.0 );
				gl_FragColor = gl_FragColor * texture2D( texture, gl_PointCoord );
				if ( gl_FragColor.a < ALPHATEST ) discard;
			}
  `;

export default class ParticleNode extends EditorNodeMixin(THREE.Points) {
  static legacyComponentName = "particle";

  static nodeName = "Particle";

  static async deserialize(editor, json) {
    const node = await super.deserialize(editor, json);

    const { color } = json.components.find(c => c.name === "particle").props;

    node.color.set(color);

    return node;
  }

  static async load() {
    defaultParticleSprite = await new Promise((resolve, reject) => {
      new THREE.TextureLoader().load(linkIconUrl, resolve, null, e =>
        reject(`Error loading Image. ${eventToMessage(e)}`)
      );
    });
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
      alphaTest: 0.9
    });
    super(editor, geometry, material);

    this.lastUpdated = 0;

    const positions = [] || "";
    const sizes = [] || "";

    const radius = 10;
    for (let i = 0; i < 100; i++) {
      positions.push((Math.random() * 5 - 1) * radius);
      positions.push((Math.random() * 5 - 1) * radius);
      positions.push((Math.random() * 5 - 1) * radius);
      sizes.push(1);
    }
    // for (let i = 0; i < 300; i++) {
    //   console.log("postions " + i + " :" + positions[i]);
    // }

    geometry.addAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.addAttribute("size", new THREE.Float32BufferAttribute(sizes, 1).setDynamic(true));
  }

  get color() {
    return this.material.uniforms.color.value;
  }

  onUpdate(dt, time) {
    if (time - this.lastUpdated > 2) {
      this.material.uniforms.color.value.setRGB(Math.random(), Math.random(), Math.random());
      this.lastUpdated = time;
    }
  }
  // update(p, s) {
  //   //requestAnimationFrame(update);

  //   const time = Date.now() * 0.005;
  //   console.log("updating" + time);
  //   for (let i = 0; i < 300; i++) {
  //     p[i]--;
  //     console.log("postions " + i + " :" + p[i]);
  //     // }
  //   }

  //p.rotation.z = 0.01 * time;
  // for (let i = 0; i < 100; i++) {
  //   s[i] = 10 * (1 + Math.sin(0.1 * i + time));
  //   //console.log("sizes " + i + " " + s[i] + " , time: " + time);
  // }
  //}

  serialize() {
    return super.serialize({
      particle: {
        color: this.color
        //particleSystem: this.particleSystem
      }
    });
  }
}
