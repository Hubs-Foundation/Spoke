import { Mesh, MeshStandardMaterial, PlaneBufferGeometry, Vector2, TextureLoader, RepeatWrapping } from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise";
import waterNormalsUrl from "three/examples/textures/waternormals.jpg";
import eventToMessage from "../utils/eventToMessage";

let waterNormalsTexture = null;

class Octave {
  constructor(speed = new Vector2(1, 1), scale = new Vector2(1, 1), height = 0.0025, alternate = true) {
    this.speed = speed;
    this.scale = scale;
    this.height = height;
    this.alternate = alternate;
  }
}

export default class SimpleWater extends Mesh {
  static async loadNormalMap() {
    waterNormalsTexture = await new Promise((resolve, reject) => {
      new TextureLoader().load(waterNormalsUrl, resolve, null, e =>
        reject(`Error loading Image. ${eventToMessage(e)}`)
      );
    });
    waterNormalsTexture.wrapS = waterNormalsTexture.wrapT = RepeatWrapping;
  }

  constructor(resolution = 10) {
    const geometry = new PlaneBufferGeometry(10, 10, resolution, resolution);
    geometry.rotateX(-Math.PI / 2);

    const material = new MeshStandardMaterial({ color: 0x0044ff, normalMap: waterNormalsTexture });

    super(geometry, material);

    // TODO: Use dynamic draw after updating three
    //this.geometry.attributes.position.usage = DynamicDrawUsage;

    this.resolution = resolution;
    this.octaves = [
      new Octave(new Vector2(0.5, 0.5), new Vector2(1, 1), 0.25, true),
      new Octave(new Vector2(0.05, 2), new Vector2(0.5, 10), 0.5, false)
    ];

    this.simplex = new SimplexNoise();
  }

  update(time) {
    const positionAttribute = this.geometry.attributes.position;

    for (let x = 0; x <= this.resolution; x++) {
      for (let z = 0; z <= this.resolution; z++) {
        let y = 0;

        for (let o = 0; o < this.octaves.length; o++) {
          const octave = this.octaves[o];

          if (octave.alternate) {
            const noise = this.simplex.noise(
              (x * octave.scale.x) / this.resolution,
              (z * octave.scale.y) / this.resolution
            );
            y += Math.cos(noise + octave.speed.length() * time) * octave.height;
          } else {
            const noise =
              this.simplex.noise(
                (x * octave.scale.x + time * octave.speed.x) / this.resolution,
                (z * octave.scale.y + time * octave.speed.y) / this.resolution
              ) - 0.5;
            y += noise * octave.height;
          }
        }

        positionAttribute.setY(x * (this.resolution + 1) + z, y);
      }
    }

    this.geometry.computeVertexNormals();
    positionAttribute.needsUpdate = true;
  }
}
