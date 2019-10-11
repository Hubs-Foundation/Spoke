import { Mesh, Color, PlaneBufferGeometry, ShaderMaterial, DoubleSide, Plane, Vector3 } from "three";
import { addIsHelperFlag } from "./utils";

/**
 * Original Author: Fyrestar
 * https://discourse.threejs.org/t/three-infinitegridhelper-anti-aliased/8377
 */

const vertexShader = `
varying vec3 worldPosition;
      
uniform float uDistance;

void main() {

      vec3 pos = position.xzy * uDistance;
      pos.xz += cameraPosition.xz;
      
      worldPosition = pos;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

      gl_Position.z -= 0.01;
}
`;

const fragmentShader = `
varying vec3 worldPosition;

uniform float uSize1;
uniform float uSize2;
uniform vec3 uColor;
uniform float uDistance;

float getGrid(float size) {
    vec2 r = worldPosition.xz / size;
    vec2 grid = abs(fract(r - 0.5) - 0.5) / fwidth(r);
    float line = min(grid.x, grid.y);
    return 1.0 - min(line, 1.0);
}

void main() {

  float d = 1.0 - min(distance(cameraPosition.xz, worldPosition.xz) / uDistance, 1.0);

  float g1 = getGrid(uSize1);
  float g2 = getGrid(uSize2);


  gl_FragColor = vec4(uColor.rgb, mix(g2, g1, g1) * pow(d, 3.0));
  gl_FragColor.a = mix(0.5 * gl_FragColor.a, gl_FragColor.a, g2);

  if ( gl_FragColor.a <= 0.0 ) discard;
}
`;

export default class SpokeInfiniteGridHelper extends Mesh {
  constructor(size1, size2, color, distance) {
    color = color || new Color("white");
    size1 = size1 || 1;
    size2 = size2 || 10;
    distance = distance || 8000;

    const geometry = new PlaneBufferGeometry(2, 2, 1, 1);

    const material = new ShaderMaterial({
      side: DoubleSide,

      uniforms: {
        uSize1: {
          value: size1
        },
        uSize2: {
          value: size2
        },
        uColor: {
          value: color
        },
        uDistance: {
          value: distance
        }
      },
      transparent: true,
      vertexShader,
      fragmentShader,

      extensions: {
        derivatives: true
      }
    });

    super(geometry, material);

    this.name = "SpokeInfiniteGridHelper";
    this.layers.set(1);
    addIsHelperFlag(this);
    this.frustumCulled = false;
    this.plane = new Plane(this.up);

    this.intersectionPointWorld = new Vector3();

    this.intersection = {
      distance: 0,
      point: this.intersectionPointWorld,
      object: this
    };
  }

  setSize(size) {
    this.material.uniforms.uSize1.value = size;
    this.material.uniforms.uSize2.value = size * 10;
  }

  raycast(raycaster, intersects) {
    const point = new Vector3();
    const intersection = raycaster.ray.intersectPlane(this.plane, point);

    if (intersection === null) return null;

    this.intersectionPointWorld.copy(point);
    this.intersectionPointWorld.applyMatrix4(this.matrixWorld);

    const distance = raycaster.ray.origin.distanceTo(this.intersectionPointWorld);

    if (distance < raycaster.near || distance > raycaster.far) return null;

    this.intersection.distance = distance;

    intersects.push(this.intersection);
  }
}
