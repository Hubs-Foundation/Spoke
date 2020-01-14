import {
  Mesh,
  PlaneBufferGeometry,
  ShaderMaterial,
  Vector2,
  TextureLoader,
  RepeatWrapping,
  Color,
  UniformsLib,
  UniformsUtils
} from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise";
import waterNormalsUrl from "three/examples/textures/waternormals.jpg";
import eventToMessage from "../utils/eventToMessage";

/**
 * Adapted dynamic geometry code from: https://github.com/ditzel/UnityOceanWavesAndShip
 */

const vertexShader = `
  #define PHYSICALLY_CORRECT_LIGHTS
  #define USE_ENVMAP
  #ifdef TEXTURE_LOD_EXT
  #define texCube(a, b) textureCube(a, b)
  #define texCubeBias(a, b, c) textureCubeLodEXT(a, b, c)
  #define tex2D(a, b) texture2D(a, b)
  #define tex2DBias(a, b, c) texture2DLodEXT(a, b, c)
  #else
  #define texCube(a, b) textureCube(a, b)
  #define texCubeBias(a, b, c) textureCube(a, b, c)
  #define tex2D(a, b) texture2D(a, b)
  #define tex2DBias(a, b, c) texture2D(a, b, c)
  #endif
  varying vec3 vIndirectFront;
  #ifdef DOUBLE_SIDED
    varying vec3 vLightBack;
    varying vec3 vIndirectBack;
  #endif
  #include <packing>
  #include <common>
  #include <uv_pars_vertex>
  #include <uv2_pars_vertex>
  #include <envmap_pars_vertex>
  #include <bsdfs>
  #include <lights_pars_begin>
  #include <color_pars_vertex>
  varying vec3 vViewPosition;
  #ifndef FLAT_SHADED
  varying vec3 vNormal;
  #endif
  #include <fog_pars_vertex>
  #include <morphtarget_pars_vertex>
  #include <skinning_pars_vertex>
  #include <shadowmap_pars_vertex>
  #include <logdepthbuf_pars_vertex>
  #include <clipping_planes_pars_vertex>
  varying vec3 vLightFront;
  varying vec3 vWPosition;
  varying vec3 vWNormal;

  void main() {
    #include <uv_vertex>
    #include <uv2_vertex>
    #include <color_vertex>
    #include <beginnormal_vertex>
    #include <morphnormal_vertex>
    #include <skinbase_vertex>
    #include <skinnormal_vertex>
    #include <defaultnormal_vertex>
    #ifndef FLAT_SHADED
    vNormal = normalize( transformedNormal );
    #endif
    #include <begin_vertex>
    #include <morphtarget_vertex>
    #include <skinning_vertex>
    #include <project_vertex>
    #include <logdepthbuf_vertex>
    #include <clipping_planes_vertex>
    vViewPosition = - mvPosition.xyz;
    #include <worldpos_vertex>
    #include <envmap_vertex>
    #include <lights_lambert_vertex>
    #include <shadowmap_vertex>
    #include <fog_vertex>
    vWPosition = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;
    vWNormal = inverseTransformDirection( transformedNormal, viewMatrix ).xyz;
  }
`;

const fragmentShader = `
  #define PHYSICALLY_CORRECT_LIGHTS
  #define USE_ENVMAP
  varying vec3 vLightFront;
  varying vec3 vIndirectFront;
  #ifdef DOUBLE_SIDED
    varying vec3 vLightBack;
    varying vec3 vIndirectBack;
  #endif
  #include <common>
  #include <packing>
  #include <dithering_pars_fragment>
  #include <color_pars_fragment>
  #include <uv_pars_fragment>
  #include <uv2_pars_fragment>
  #include <map_pars_fragment>
  #include <alphamap_pars_fragment>
  #include <aomap_pars_fragment>
  #include <lightmap_pars_fragment>
  #include <emissivemap_pars_fragment>
  #include <envmap_pars_fragment>
  #include <cube_uv_reflection_fragment>
  #include <bsdfs>
  #include <lights_pars_begin>
  #include <fog_pars_fragment>
  #include <shadowmap_pars_fragment>
  #include <shadowmask_pars_fragment>
  #include <specularmap_pars_fragment>
  #include <logdepthbuf_pars_fragment>
  #include <clipping_planes_pars_fragment>

  uniform vec3 color;
  uniform vec3 colorB;
  uniform vec3 colorA;
  uniform float scale;
  uniform float time;
  uniform float speed;
  uniform float intensity;
  uniform float alpha;
  uniform float opacity;
  uniform vec3 emissive;

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

  void main() {
    #include <clipping_planes_fragment>

    vec2 uvPos = ( vWPosition.xz * vec2( scale ) );
    float timeOffset = ( time * speed );
    float voronoiValue = voronoiLayers( uvPos, timeOffset );
    float voronoiIntensity = ( voronoiValue * intensity );
    float mask = saturate( vWNormal.y );
    float maskCaustic = ( alpha * mask );
    vec4 diffuseColor = vec4(mix( color, mix( colorB, colorA, saturate( voronoiIntensity ) ), maskCaustic ), opacity);
    
    ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
    vec3 totalEmissiveRadiance = emissive;
    #include <logdepthbuf_fragment>
    #include <map_fragment>
    #include <color_fragment>
    #include <alphamap_fragment>
    #include <alphatest_fragment>
    #include <specularmap_fragment>
    #include <emissivemap_fragment>
    // accumulation
    reflectedLight.indirectDiffuse = getAmbientLightIrradiance( ambientLightColor );
    #ifdef DOUBLE_SIDED
      reflectedLight.indirectDiffuse += ( gl_FrontFacing ) ? vIndirectFront : vIndirectBack;
    #else
      reflectedLight.indirectDiffuse += vIndirectFront;
    #endif
    #include <lightmap_fragment>
    reflectedLight.indirectDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb );
    #ifdef DOUBLE_SIDED
      reflectedLight.directDiffuse = ( gl_FrontFacing ) ? vLightFront : vLightBack;
    #else
      reflectedLight.directDiffuse = vLightFront;
    #endif
    reflectedLight.directDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb ) * getShadowMask();
    // modulation
    #include <aomap_fragment>
    vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
    #include <envmap_fragment>
    gl_FragColor = vec4( outgoingLight, diffuseColor.a );
    #include <tonemapping_fragment>
    #include <encodings_fragment>
    #include <fog_fragment>
    #include <premultiplied_alpha_fragment>
    #include <dithering_fragment>
  }
`;

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

    const material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: UniformsUtils.clone(
        UniformsUtils.merge([
          UniformsLib.common,
          UniformsLib.specularmap,
          UniformsLib.envmap,
          UniformsLib.aomap,
          UniformsLib.lightmap,
          UniformsLib.emissivemap,
          UniformsLib.fog,
          UniformsLib.lights,
          {
            emissive: { value: new Color(0x000000) }
          },
          {
            opacity: { value: 1 },
            alpha: { value: 1 },
            scale: { value: 0.1 },
            intensity: { value: 1 },
            speed: { value: 1 },
            time: { value: 0 },
            color: { value: new Color(0xffffff) },
            colorA: { value: new Color(0xffffff) },
            colorB: { value: new Color(0x0054df) }
          }
        ])
      ),
      lights: true,
      transparent: true
    });

    material.name = "SimpleWaterMaterial";

    super(geometry, material);

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
    this.material.uniforms.time.value = time;
  }
}
