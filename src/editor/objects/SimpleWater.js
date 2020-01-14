import {
  Mesh,
  PlaneBufferGeometry,
  MeshPhongMaterial,
  Vector2,
  TextureLoader,
  RepeatWrapping,
  Color,
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

  constructor(resolution = 20) {
    const geometry = new PlaneBufferGeometry(10, 10, resolution, resolution);
    geometry.rotateX(-Math.PI / 2);

    const waterUniforms = {
      alpha: { value: 1 },
      scale: { value: 0.1 },
      intensity: { value: 1 },
      speed: { value: 1 },
      time: { value: 0 },
      color: { value: new Color(0xffffff) },
      colorA: { value: new Color(0xffffff) },
      colorB: { value: new Color(0x0054df) }
    };

    const material = new MeshPhongMaterial();
    material.name = "SimpleWaterMaterial";

    material.onBeforeCompile = shader => {
      console.log("onBeforeCompile", shader.vertexShader);
      Object.assign(shader.uniforms, waterUniforms);

      shader.vertexShader = shader.vertexShader.replace(
        "#include <fog_pars_vertex>",
        `
        #include <fog_pars_vertex>
        varying vec3 vWPosition;
        varying vec3 vWNormal;
      `
      );

      shader.vertexShader = shader.vertexShader.replace(
        "#include <fog_vertex>",
        `
        #include <fog_vertex>
        vWPosition = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;
        vWNormal = inverseTransformDirection( transformedNormal, viewMatrix ).xyz;
      `
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <fog_pars_fragment>",
        `
        #include <fog_pars_vertex>
        
        uniform vec3 color;
        uniform vec3 colorB;
        uniform vec3 colorA;
        uniform float scale;
        uniform float time;
        uniform float speed;
        uniform float intensity;
        uniform float alpha;
      
        varying vec3 vWPosition;
        varying vec3 vWNormal;
      
        vec2 hash2(vec2 p) {
          return fract(sin(vec2(dot(p, vec2(123.4, 748.6)), dot(p, vec2(547.3, 659.3))))*5232.85324);
        }
      
        float voronoi(vec2 p, in float time) {
          vec2 n = floor(p);
          vec2 f = fract(p);
          float md = 5.0;
          vec2 m = vec2(0.0);
          for (int i = -1; i <= 1; i++) {
            for (int j = -1; j <= 1; j++) {
              vec2 g = vec2(i, j);
              vec2 o = hash2(n + g);
              o = 0.5 + 0.5 * sin(time + 5.038 * o);
              vec2 r = g + o - f;
              float d = dot(r, r);
              if (d < md) {
                md = d;
                m = n+g+o;
              }
            }
          }
          return md;
        }
      
        float voronoiLayers(vec2 p, in float time) {
          float v = 0.0;
          float a = 0.4;
          for (int i = 0; i < 3; i++) {
            v += voronoi(p, time) * a;
            p *= 2.0;
            a *= 0.5;
          }
          return v;
        }
      `
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        "vec4 diffuseColor = vec4( diffuse, opacity );",
        `
        vec2 uvPos = ( vWPosition.xz * vec2( scale ) );
        float timeOffset = ( time * speed );
        float voronoiValue = voronoiLayers( uvPos, timeOffset );
        float voronoiIntensity = ( voronoiValue * intensity );
        float mask = saturate( vWNormal.y );
        float maskCaustic = ( alpha * mask );
        vec4 diffuseColor = vec4(mix( color, mix( colorB, colorA, saturate( voronoiIntensity ) ), maskCaustic ), opacity);
      `
      );

      material.needsUpdate = true;

      console.log(shader.vertexShader, shader.fragmentShader);
    };

    super(geometry, material);

    this.waterUniforms = waterUniforms;
    //this.material.normalMap = waterNormalsTexture;
    this.receiveShadow = true;

    // TODO: Use dynamic draw after updating three
    //this.geometry.attributes.position.usage = DynamicDrawUsage;

    this.resolution = resolution;
    this.octaves = [
      new Octave(new Vector2(0.5, 0.5), new Vector2(1, 1), 0.01, true),
      new Octave(new Vector2(0.05, 6), new Vector2(0.5, 20), 0.1, false)
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
