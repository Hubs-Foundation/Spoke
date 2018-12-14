import THREE from "../../vendor/three";

const vertexShader = `
  attribute vec2 uvOffset;

  varying vec2 v_uv;
  varying vec2 v_uvOffset;

  void main() {
    v_uv = uv;
    v_uvOffset = uvOffset;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  #define INV_PI_2 0.636619772
  #define EPSILON 0.0005

  uniform sampler2D map;
  uniform vec2 texScale;

  varying vec2 v_uv;
  varying vec2 v_uvOffset;
  varying vec3 v_position;

  void main() {
    vec2 normalizedUv = (v_uv * 2.0) - 1.0;
    vec2 equiangularCubemapUv = (INV_PI_2 * atan(normalizedUv)) + 0.5;
    vec2 uvFor6Faces = (equiangularCubemapUv * texScale) + v_uvOffset;
    gl_FragColor = texture2D(map, uvFor6Faces);
  }
`;

export default class EquiangularCubemapMesh extends THREE.Mesh {
  constructor(texture) {
    const geometry = new THREE.BufferGeometry();

    // prettier-ignore
    const indices = [
      0,  1,  2,  0,  2,  3,  // front
      4,  5,  6,  4,  6,  7,  // back
      8,  9,  10, 8,  10, 11, // top
      12, 13, 14, 12, 14, 15, // bottom
      16, 17, 18, 16, 18, 19, // right
      20, 21, 22, 20, 22, 23  // left
    ];

    geometry.setIndex(indices);

    // prettier-ignore
    const positions = new Float32Array([
      // Front face
      -1.0, -1.0, -1.0,
      1.0, -1.0, -1.0,
      1.0, 1.0, -1.0,
      -1.0, 1.0, -1.0,

      // Back face
      1.0, -1.0, 1.0,
      -1.0, -1.0, 1.0,
      -1.0, 1.0, 1.0,
      1.0, 1.0, 1.0,

      // Top face
      -1.0, 1.0, -1.0,
      1.0, 1.0, -1.0,
      1.0, 1.0, 1.0,
      -1.0, 1.0, 1.0,

      // Bottom face
      -1.0, -1.0, 1.0,
      1.0, -1.0, 1.0,
      1.0, -1.0, -1.0,
      -1.0, -1.0, -1.0,

      // Right face
      1.0, -1.0, -1.0,
      1.0, -1.0, 1.0,
      1.0, 1.0, 1.0,
      1.0, 1.0, -1.0,

      // Left face
      -1.0, -1.0, 1.0,
      -1.0, -1.0, -1.0,
      -1.0, 1.0, -1.0,
      -1.0, 1.0, 1.0
    ]);
    geometry.addAttribute("position", new THREE.BufferAttribute(positions, 3));

    // prettier-ignore
    const uvs = new Float32Array([
      // Front face
      0.0, 1.0,
      1.0, 1.0,
      1.0, 0.0,
      0.0, 0.0,
      // Back face
      0.0, 0.0,
      0.0, 1.0,
      1.0, 1.0,
      1.0, 0.0,
      // Top face
      1.0, 1.0,
      1.0, 0.0,
      0.0, 0.0,
      0.0, 1.0,
      // Bottom face
      1.0, 1.0,
      1.0, 0.0,
      0.0, 0.0,
      0.0, 1.0,
      // Right face
      0.0, 1.0,
      1.0, 1.0,
      1.0, 0.0,
      0.0, 0.0,
      // Left face
      0.0, 1.0,
      1.0, 1.0,
      1.0, 0.0,
      0.0, 0.0,
    ]);
    geometry.addAttribute("uv", new THREE.BufferAttribute(uvs, 2));

    // Youtube adds padding at the discontinuities
    const EPSILON = 0.0012;

    // prettier-ignore
    const uvOffsets = new Float32Array([
      // Front face
      1 / 3, EPSILON,
      1 / 3, EPSILON,
      1 / 3, EPSILON,
      1 / 3, EPSILON,
      // Back face
      1 / 3, (1 / 2) + EPSILON,
      1 / 3, (1 / 2) + EPSILON,
      1 / 3, (1 / 2) + EPSILON,
      1 / 3, (1 / 2) + EPSILON,
      // Top face
      2 / 3, (1 / 2) + EPSILON,
      2 / 3, (1 / 2) + EPSILON,
      2 / 3, (1 / 2) + EPSILON,
      2 / 3, (1 / 2) + EPSILON,
      // Bottom face
      0, (1 / 2) + EPSILON,
      0, (1 / 2) + EPSILON,
      0, (1 / 2) + EPSILON,
      0, (1 / 2) + EPSILON,
      // Right face
      2 / 3, EPSILON,
      2 / 3, EPSILON,
      2 / 3, EPSILON,
      2 / 3, EPSILON,
      // Left face
      0, EPSILON,
      0, EPSILON,
      0, EPSILON,
      0, EPSILON,
    ]);
    geometry.addAttribute("uvOffset", new THREE.BufferAttribute(uvOffsets, 2));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        map: {
          value: texture || new THREE.Texture()
        },
        texScale: {
          value: new THREE.Vector2(1 / 3, 1 / 2 - 2 * EPSILON)
        }
      },
      vertexShader,
      fragmentShader
    });

    super(geometry, material);
  }
}
