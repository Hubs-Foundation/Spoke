import {
  Mesh,
  PlaneBufferGeometry,
  MeshStandardMaterial,
  MeshPhongMaterial,
  Vector2,
  TextureLoader,
  RepeatWrapping,
  UniformsUtils
} from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise";
import waterNormalsUrl from "three/examples/textures/waternormals.jpg";
import eventToMessage from "../utils/eventToMessage";

/**
 * Adapted dynamic geometry code from: https://github.com/ditzel/UnityOceanWavesAndShip
 */

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

  constructor(resolution = 24, lowQuality = false) {
    const geometry = new PlaneBufferGeometry(10, 10, resolution, resolution);
    geometry.rotateX(-Math.PI / 2);

    const waterUniforms = {
      ripplesSpeed: { value: 0.25 },
      ripplesScale: { value: 1 },
      time: { value: 0 }
    };

    const materialClass = lowQuality ? MeshPhongMaterial : MeshStandardMaterial;

    const material = new materialClass({ color: 0x0054df });
    material.name = "SimpleWaterMaterial";

    material.onBeforeCompile = shader => {
      Object.assign(shader.uniforms, waterUniforms);

      shader.vertexShader = shader.vertexShader.replace(
        "#include <fog_pars_vertex>",
        `
        #include <fog_pars_vertex>
        varying vec3 vWPosition;
      `
      );

      shader.vertexShader = shader.vertexShader.replace(
        "#include <fog_vertex>",
        `
        #include <fog_vertex>
        vWPosition = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;
      `
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <normalmap_pars_fragment>",
        `
        #include <normalmap_pars_fragment>

        uniform float time;
        uniform float ripplesSpeed;
        uniform float ripplesScale;
      
        varying vec3 vWPosition;
      
        vec4 getNoise(vec2 uv){
          float timeOffset = time * ripplesSpeed;
          uv = (uv - 0.5) * (1.0 / ripplesScale);
          vec2 uv0 = (uv/103.0)+vec2(timeOffset/17.0, timeOffset/29.0);
          vec2 uv1 = uv/107.0-vec2(timeOffset/-19.0, timeOffset/31.0);
          vec2 uv2 = uv/vec2(897.0, 983.0)+vec2(timeOffset/101.0, timeOffset/97.0);
          vec2 uv3 = uv/vec2(991.0, 877.0)-vec2(timeOffset/109.0, timeOffset/-113.0);
          vec4 noise = (texture2D(normalMap, uv0)) +
                       (texture2D(normalMap, uv1)) +
                       (texture2D(normalMap, uv2)) +
                       (texture2D(normalMap, uv3));
          return noise / 4.0;
        }
      `
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <normal_fragment_maps>",
        `
          // Workaround for Adreno 3XX dFd*( vec3 ) bug. See #9988

          vec3 eye_pos = -vViewPosition;
          vec3 q0 = vec3( dFdx( eye_pos.x ), dFdx( eye_pos.y ), dFdx( eye_pos.z ) );
          vec3 q1 = vec3( dFdy( eye_pos.x ), dFdy( eye_pos.y ), dFdy( eye_pos.z ) );
          vec2 st0 = dFdx( vUv.st );
          vec2 st1 = dFdy( vUv.st );

          float scale = sign( st1.t * st0.s - st0.t * st1.s ); // we do not care about the magnitude

          vec3 S = normalize( ( q0 * st1.t - q1 * st0.t ) * scale );
          vec3 T = normalize( ( - q0 * st1.s + q1 * st0.s ) * scale );
          vec3 N = normalize( normal );
          mat3 tsn = mat3( S, T, N );

          vec3 mapN = getNoise(vWPosition.xz).xyz * 2.0 - 1.0;

          mapN.xy *= normalScale;
          mapN.xy *= ( float( gl_FrontFacing ) * 2.0 - 1.0 );

          normal = normalize( tsn * mapN );
        `
      );
    };

    super(geometry, material);

    this.waterUniforms = waterUniforms;
    this.material.normalMap = waterNormalsTexture;

    if (lowQuality) {
      this.material.specular.set(0xffffff);
    } else {
      this.receiveShadow = true;
    }

    this.geometry.attributes.position.dynamic = true;

    this.resolution = resolution;
    this.octaves = [
      new Octave(new Vector2(0.5, 0.5), new Vector2(1, 1), 0.01, true),
      new Octave(new Vector2(0.05, 6), new Vector2(1, 20), 0.1, false)
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
    this.waterUniforms.time.value = time;
  }

  copy(source, recursive) {
    super.copy(source, recursive);
    this.waterUniforms = UniformsUtils.clone(source.waterUniforms);
  }
}
