/**
 * Extracted and modified from Three.js
 * https://github.com/mrdoob/three.js/blob/dev/examples/jsm/loaders/GLTFLoader.js
 * https://github.com/mrdoob/three.js/blob/dev/LICENSE
 **/

/**
 * @author Rich Tibbett / https://github.com/richtr
 * @author mrdoob / http://mrdoob.com/
 * @author Tony Parisi / http://www.tonyparisi.com/
 * @author Takahiro / https://github.com/takahirox
 * @author Don McCurdy / https://www.donmccurdy.com
 */

import { RethrownError } from "../utils/errors";
import loadTexture from "../utils/loadTexture";

import {
  AnimationClip,
  Bone,
  BufferAttribute,
  BufferGeometry,
  ClampToEdgeWrapping,
  DefaultLoadingManager,
  DoubleSide,
  FileLoader,
  FrontSide,
  Group,
  Interpolant,
  InterpolateDiscrete,
  InterpolateLinear,
  Line,
  LineBasicMaterial,
  LineLoop,
  LineSegments,
  LinearFilter,
  LinearMipMapLinearFilter,
  LinearMipMapNearestFilter,
  Loader,
  LoaderUtils,
  Material,
  Math as _Math,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  MirroredRepeatWrapping,
  NearestFilter,
  NearestMipMapLinearFilter,
  NearestMipMapNearestFilter,
  NumberKeyframeTrack,
  Object3D,
  OrthographicCamera,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  PropertyBinding,
  QuaternionKeyframeTrack,
  RGBAFormat,
  RGBFormat,
  RepeatWrapping,
  Scene,
  Skeleton,
  SkinnedMesh,
  TextureLoader,
  TriangleFanDrawMode,
  TriangleStripDrawMode,
  VectorKeyframeTrack,
  VertexColors,
  sRGBEncoding
} from "three";

import { MaterialsUnlitLoaderExtension } from "./extensions/loader/MaterialsUnlitLoaderExtension";
import { LightmapLoaderExtension } from "./extensions/loader/LightmapLoaderExtension";

/* CONSTANTS */

export const WEBGL_CONSTANTS = {
  FLOAT: 5126,
  //FLOAT_MAT2: 35674,
  FLOAT_MAT3: 35675,
  FLOAT_MAT4: 35676,
  FLOAT_VEC2: 35664,
  FLOAT_VEC3: 35665,
  FLOAT_VEC4: 35666,
  LINEAR: 9729,
  REPEAT: 10497,
  SAMPLER_2D: 35678,
  POINTS: 0,
  LINES: 1,
  LINE_LOOP: 2,
  LINE_STRIP: 3,
  TRIANGLES: 4,
  TRIANGLE_STRIP: 5,
  TRIANGLE_FAN: 6,
  UNSIGNED_BYTE: 5121,
  UNSIGNED_SHORT: 5123
};

export const WEBGL_COMPONENT_TYPES = {
  5120: Int8Array,
  5121: Uint8Array,
  5122: Int16Array,
  5123: Uint16Array,
  5125: Uint32Array,
  5126: Float32Array
};

export const WEBGL_FILTERS = {
  9728: NearestFilter,
  9729: LinearFilter,
  9984: NearestMipMapNearestFilter,
  9985: LinearMipMapNearestFilter,
  9986: NearestMipMapLinearFilter,
  9987: LinearMipMapLinearFilter
};

export const WEBGL_WRAPPINGS = {
  33071: ClampToEdgeWrapping,
  33648: MirroredRepeatWrapping,
  10497: RepeatWrapping
};

export const WEBGL_TYPE_SIZES = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16
};

export const ATTRIBUTES = {
  POSITION: "position",
  NORMAL: "normal",
  TANGENT: "tangent",
  TEXCOORD_0: "uv",
  TEXCOORD_1: "uv2",
  COLOR_0: "color",
  WEIGHTS_0: "skinWeight",
  JOINTS_0: "skinIndex"
};

export const PATH_PROPERTIES = {
  scale: "scale",
  translation: "position",
  rotation: "quaternion",
  weights: "morphTargetInfluences"
};

export const INTERPOLATION = {
  CUBICSPLINE: undefined, // We use a custom interpolant (GLTFCubicSplineInterpolation) for CUBICSPLINE tracks. Each
  // keyframe track will be initialized with a default interpolation type, then modified.
  LINEAR: InterpolateLinear,
  STEP: InterpolateDiscrete
};

export const ALPHA_MODES = {
  OPAQUE: "OPAQUE",
  MASK: "MASK",
  BLEND: "BLEND"
};

export const MIME_TYPE_FORMATS = {
  "image/png": RGBAFormat,
  "image/jpeg": RGBFormat
};

/*********************************/
/********** GLTF EXTENSIONS ***********/
/*********************************/

const EXTENSIONS = {
  KHR_BINARY_GLTF: "KHR_binary_glTF",
  KHR_DRACO_MESH_COMPRESSION: "KHR_draco_mesh_compression",
  KHR_LIGHTS_PUNCTUAL: "KHR_lights_punctual",
  KHR_MATERIALS_CLEARCOAT: "KHR_materials_clearcoat",
  KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS: "KHR_materials_pbrSpecularGlossiness",
  KHR_MATERIALS_TRANSMISSION: "KHR_materials_transmission",
  KHR_MATERIALS_UNLIT: "KHR_materials_unlit",
  KHR_TEXTURE_BASISU: "KHR_texture_basisu",
  KHR_TEXTURE_TRANSFORM: "KHR_texture_transform",
  KHR_MESH_QUANTIZATION: "KHR_mesh_quantization",
  MSFT_TEXTURE_DDS: "MSFT_texture_dds"
};

/*********************************/
/********** EXTENSIONS ***********/
/*********************************/

const GLB_HEADER_MAGIC = "glTF";
const GLB_HEADER_LENGTH = 12;
const GLB_CHUNK_TYPES = { JSON: 0x4e4f534a, BIN: 0x004e4942 };

/*********************************/
/********** INTERPOLATION ********/
/*********************************/

// Spline Interpolation
// Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#appendix-c-spline-interpolation
class GLTFCubicSplineInterpolant extends Interpolant {
  constructor(parameterPositions, sampleValues, sampleSize, resultBuffer) {
    super(parameterPositions, sampleValues, sampleSize, resultBuffer);
  }

  copySampleValue_(index) {
    // Copies a sample value to the result buffer. See description of glTF
    // CUBICSPLINE values layout in interpolate_() function below.

    const result = this.resultBuffer,
      values = this.sampleValues,
      valueSize = this.valueSize,
      offset = index * valueSize * 3 + valueSize;

    for (let i = 0; i !== valueSize; i++) {
      result[i] = values[offset + i];
    }

    return result;
  }

  beforeStart_(index) {
    return this.copySampleValue_(index);
  }

  afterEnd_(index) {
    return this.copySampleValue_(index);
  }

  interpolate_(i1, t0, t, t1) {
    const result = this.resultBuffer;
    const values = this.sampleValues;
    const stride = this.valueSize;

    const stride2 = stride * 2;
    const stride3 = stride * 3;

    const td = t1 - t0;

    const p = (t - t0) / td;
    const pp = p * p;
    const ppp = pp * p;

    const offset1 = i1 * stride3;
    const offset0 = offset1 - stride3;

    const s2 = -2 * ppp + 3 * pp;
    const s3 = ppp - pp;
    const s0 = 1 - s2;
    const s1 = s3 - pp + p;

    // Layout of keyframe output values for CUBICSPLINE animations:
    //   [ inTangent_1, splineVertex_1, outTangent_1, inTangent_2, splineVertex_2, ... ]
    for (let i = 0; i !== stride; i++) {
      const p0 = values[offset0 + i + stride]; // splineVertex_k
      const m0 = values[offset0 + i + stride2] * td; // outTangent_k * (t_k+1 - t_k)
      const p1 = values[offset1 + i + stride]; // splineVertex_k+1
      const m1 = values[offset1 + i] * td; // inTangent_k+1 * (t_k+1 - t_k)

      result[i] = s0 * p0 + s1 * m0 + s2 * p1 + s3 * m1;
    }

    return result;
  }
}

const defaultOptions = {
  revokeObjectURLs: true,
  crossOrigin: true,
  addUnknownExtensionsToUserData: false,
  path: undefined
};

class GLTFLoader {
  constructor(url, manager, options) {
    this.url = url;
    this.manager = manager !== undefined ? manager : DefaultLoadingManager;
    this.options = Object.assign({}, defaultOptions, options);

    // loader object cache
    this.cache = new Map();

    // BufferGeometry caching
    this.primitiveCache = {};
    this.meshReferences = {};
    this.meshUses = {};
    this.stats = {
      nodes: 0,
      meshes: 0,
      materials: 0,
      textures: 0,
      triangles: 0,
      vertices: 0,
      totalSize: 0,
      jsonSize: 0,
      bufferInfo: {},
      textureInfo: {},
      meshInfo: {}
    };

    this.textureLoader = new TextureLoader(this.manager);
    this.textureLoader.setCrossOrigin(this.options.crossOrigin);

    this.fileLoader = new FileLoader(this.manager);
    this.fileLoader.setResponseType("arraybuffer");

    if (this.options.crossOrigin === "use-credentials") {
      this.fileLoader.setWithCredentials(true);
    }

    if (this.options.path === undefined) {
      this.options.path = LoaderUtils.extractUrlBase(url);
    }

    this.knownExtensions = new Set();
    this.extensions = [];
    this.hooks = {};

    this.registerExtension(MaterialsUnlitLoaderExtension);
    this.registerExtension(LightmapLoaderExtension);
  }

  registerExtension(Extension, options = {}) {
    const extension = new Extension(this, options);

    this.extensions.push(extension);

    for (const extensionName of extension.extensionNames) {
      this.knownExtensions.add(extensionName);
    }
  }

  addKnownExtension(extensionName) {
    this.knownExtensions.push(extensionName);
  }

  addHook(hookName, test, callback) {
    let hooks = this.hooks[hookName];

    if (!hooks) {
      hooks = this.hooks[hookName] = [];
    }

    hooks.push({ test, callback });
  }

  async runFirstHook(hookName, ...args) {
    const hooks = this.hooks[hookName];

    if (hooks) {
      for (const { test, callback } of hooks) {
        if (test(...args)) {
          return callback(...args);
        }
      }
    }

    return undefined;
  }

  async runAllHooks(hookName, ...args) {
    const hooks = this.hooks[hookName];

    const matchedHooks = [];

    if (hooks) {
      for (const { test, callback } of hooks) {
        if (test(...args)) {
          matchedHooks.push(callback(...args));
        }
      }
    }

    return Promise.all(matchedHooks);
  }

  async loadRoot() {
    // Tells the LoadingManager to track an extra item, which resolves after
    // the model is fully loaded. This means the count of items loaded will
    // be incorrect, but ensures manager.onLoad() does not fire early.
    this.manager.itemStart(this.url);

    const fileLoader = new FileLoader(this.manager);

    fileLoader.setPath(this.path);
    fileLoader.setResponseType("arraybuffer");

    if (this.options.crossOrigin === "use-credentials") {
      fileLoader.setWithCredentials(true);
    }

    let glbBuffer, json;

    try {
      const data = await new Promise((resolve, reject) =>
        fileLoader.load(this.url, resolve, undefined, event => {
          reject(event);
        })
      );

      let content;

      if (typeof data === "string") {
        content = data;
      } else {
        const magic = LoaderUtils.decodeText(new Uint8Array(data, 0, 4));

        if (magic === GLB_HEADER_MAGIC) {
          const headerView = new DataView(data, 0, GLB_HEADER_LENGTH);

          const header = {
            magic: LoaderUtils.decodeText(new Uint8Array(data.slice(0, 4))),
            version: headerView.getUint32(4, true),
            length: headerView.getUint32(8, true)
          };

          if (header.magic !== GLB_HEADER_MAGIC) {
            throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");
          } else if (header.version < 2.0) {
            throw new Error("THREE.GLTFLoader: Legacy binary file detected. Use LegacyGLTFLoader instead.");
          }

          const chunkView = new DataView(data, GLB_HEADER_LENGTH);
          let chunkIndex = 0;

          while (chunkIndex < chunkView.byteLength) {
            const chunkLength = chunkView.getUint32(chunkIndex, true);
            chunkIndex += 4;

            const chunkType = chunkView.getUint32(chunkIndex, true);
            chunkIndex += 4;

            if (chunkType === GLB_CHUNK_TYPES.JSON) {
              const contentArray = new Uint8Array(data, GLB_HEADER_LENGTH + chunkIndex, chunkLength);
              content = LoaderUtils.decodeText(contentArray);
            } else if (chunkType === GLB_CHUNK_TYPES.BIN) {
              const byteOffset = GLB_HEADER_LENGTH + chunkIndex;
              glbBuffer = data.slice(byteOffset, byteOffset + chunkLength);
            }

            // Clients must ignore chunks with unknown types.

            chunkIndex += chunkLength;
          }

          if (content === null) {
            throw new Error("THREE.GLTFLoader: JSON content not found.");
          }
        } else {
          content = LoaderUtils.decodeText(new Uint8Array(data));
        }
      }

      json = JSON.parse(content);

      this.json = json;

      if (json.asset === undefined || json.asset.version[0] < 2) {
        throw new Error(
          "THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported. Use LegacyGLTFLoader instead."
        );
      }

      this.stats.nodes = json.nodes ? json.nodes.length : 0;
      this.stats.meshes = json.meshes ? json.meshes.length : 0;
      this.stats.materials = json.materials ? json.materials.length : 0;
      this.stats.textures = json.textures ? json.textures.length : 0;
      this.stats.jsonSize = content.length;

      this.markDefs(json);

      for (const extension of this.extensions) {
        extension.onLoad();
      }

      this.manager.itemEnd(this.url);
    } catch (error) {
      this.manager.itemError(this.url);
      this.manager.itemEnd(this.url);
      throw new RethrownError(`Error loading glTF root`, error);
    }

    return { json, glbBuffer };
  }

  usesExtension(extensionName) {
    return Array.isArray(this.json.extensionsUsed) && this.json.extensionsUsed.indexOf(extensionName) !== -1;
  }

  /**
   * Marks the special nodes/meshes in json for efficient parse.
   */
  markDefs(json) {
    const nodeDefs = json.nodes || [];
    const skinDefs = json.skins || [];
    const meshDefs = json.meshes || [];

    const meshReferences = {};
    const meshUses = {};

    // Nothing in the node definition indicates whether it is a Bone or an
    // Object3D. Use the skins' joint references to mark bones.
    for (let skinIndex = 0, skinLength = skinDefs.length; skinIndex < skinLength; skinIndex++) {
      const joints = skinDefs[skinIndex].joints;

      for (let i = 0, il = joints.length; i < il; i++) {
        nodeDefs[joints[i]].isBone = true;
      }
    }

    // Meshes can (and should) be reused by multiple nodes in a glTF asset. To
    // avoid having more than one Mesh with the same name, count
    // references and rename instances below.
    //
    // Example: CesiumMilkTruck sample model reuses "Wheel" meshes.
    for (let nodeIndex = 0, nodeLength = nodeDefs.length; nodeIndex < nodeLength; nodeIndex++) {
      const nodeDef = nodeDefs[nodeIndex];

      if (nodeDef.mesh !== undefined) {
        if (meshReferences[nodeDef.mesh] === undefined) {
          meshReferences[nodeDef.mesh] = meshUses[nodeDef.mesh] = 0;
        }

        meshReferences[nodeDef.mesh]++;

        // Nothing in the mesh definition indicates whether it is
        // a SkinnedMesh or Mesh. Use the node's mesh reference
        // to mark SkinnedMesh if node has skin.
        if (nodeDef.skin !== undefined) {
          meshDefs[nodeDef.mesh].isSkinnedMesh = true;
        }
      }
    }

    this.meshReferences = meshReferences;
    this.meshUses = meshUses;
  }

  /**
   * Requests the specified dependency asynchronously, with caching.
   * @param {string} type
   * @param {number} index
   * @return {Promise<Object3D|Material|Texture|AnimationClip|ArrayBuffer|Object>}
   */
  getDependency(type, index, { key, ...options } = {}) {
    let cacheKey = type;

    if (index !== undefined) {
      cacheKey += ":" + index;
    }

    if (key !== undefined) {
      cacheKey = cacheKey + ":" + key;
    }

    let dependency = this.cache.get(cacheKey);

    if (!dependency) {
      switch (type) {
        case "gltf":
          dependency = this.loadGLTF();
          break;

        case "sceneAnimations":
          dependency = this.loadSceneAnimations(index);
          break;

        case "root":
          dependency = this.loadRoot();
          break;

        case "scene":
          dependency = this.loadScene(index);
          break;

        case "node":
          dependency = this.loadNode(index, options);
          break;

        case "mesh":
          dependency = this.loadMesh(index, options);
          break;

        case "accessor":
          dependency = this.loadAccessor(index);
          break;

        case "bufferView":
          dependency = this.loadBufferView(index);
          break;

        case "buffer":
          dependency = this.loadBuffer(index);
          break;

        case "material":
          dependency = this.loadMaterial(index);
          break;

        case "texture":
          dependency = this.loadTexture(index);
          break;

        case "skin":
          dependency = this.loadSkin(index);
          break;

        case "animation":
          dependency = this.loadAnimation(index);
          break;

        case "camera":
          dependency = this.loadCamera(index);
          break;

        default:
          throw new Error("Unknown type: " + type);
      }

      this.cache.set(cacheKey, dependency);
    }

    return dependency;
  }

  async loadGLTF() {
    try {
      const { json } = await this.getDependency("root");
      const sceneIndex = json.scene || 0;
      const scene = await this.getDependency("scene", sceneIndex);
      const sceneAnimations = await this.getDependency("sceneAnimations", sceneIndex);
      scene.animations = sceneAnimations || [];

      const stats = this.stats;

      stats.totalSize = stats.jsonSize;

      for (const key in stats.bufferInfo) {
        if (!Object.prototype.hasOwnProperty.call(stats.bufferInfo, key)) continue;
        const item = stats.bufferInfo[key];
        stats.totalSize += item.size || 0;
      }

      for (const key in stats.textureInfo) {
        if (!Object.prototype.hasOwnProperty.call(stats.textureInfo, key)) continue;
        const item = stats.textureInfo[key];
        stats.totalSize += item.size || 0;
      }

      return { scene, json, stats };
    } catch (error) {
      throw new RethrownError(`Error loading glTF "${this.url}"`, error);
    }
  }

  /**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#scenes
   * @param {number} sceneIndex
   * @return {Promise<Scene>}
   */
  async loadScene(sceneIndex) {
    const { json } = await this.getDependency("root");

    const sceneDef = json.scenes[sceneIndex];

    const scene = new Scene();
    if (sceneDef.name !== undefined) scene.name = sceneDef.name;

    this.assignExtrasToUserData(scene, sceneDef);

    if (sceneDef.extensions) this.addUnknownExtensionsToUserData(scene, sceneDef);

    const nodeIds = sceneDef.nodes || [];

    const pending = [];

    for (let i = 0, il = nodeIds.length; i < il; i++) {
      pending.push(this.getDependency("node", nodeIds[i]));
    }

    const children = await Promise.all(pending);

    for (const child of children) {
      scene.add(child);
    }

    return scene;
  }

  /**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#nodes-and-hierarchy
   * @param {number} nodeIndex
   * @return {Promise<Object3D>}
   */
  async loadNode(nodeIndex, options) {
    const { json } = await this.getDependency("root");

    const meshReferences = this.meshReferences;
    const meshUses = this.meshUses;

    const nodeDef = json.nodes[nodeIndex];

    let node;

    // .isBone isn't in glTF spec. See .markDefs
    if (nodeDef.isBone === true) {
      node = new Bone();
    } else if (nodeDef.mesh !== undefined) {
      const mesh = await this.getDependency("mesh", nodeDef.mesh, options);

      if (meshReferences[nodeDef.mesh] > 1) {
        const instanceNum = meshUses[nodeDef.mesh]++;

        node = mesh.clone();
        node.name += "_instance_" + instanceNum;

        // onBeforeRender copy for Specular-Glossiness
        node.onBeforeRender = mesh.onBeforeRender;

        for (let i = 0, il = node.children.length; i < il; i++) {
          node.children[i].name += "_instance_" + instanceNum;
          node.children[i].onBeforeRender = mesh.children[i].onBeforeRender;
        }
      } else {
        node = mesh;
      }

      // if weights are provided on the node, override weights on the mesh.
      if (nodeDef.weights !== undefined) {
        node.traverse(function(o) {
          if (!o.isMesh) return;

          for (let i = 0, il = nodeDef.weights.length; i < il; i++) {
            o.morphTargetInfluences[i] = nodeDef.weights[i];
          }
        });
      }
    } else if (nodeDef.camera !== undefined) {
      node = await this.getDependency("camera", nodeDef.camera);
    } else {
      node = new Object3D();
    }

    if (nodeDef.name !== undefined) {
      node.name = PropertyBinding.sanitizeNodeName(nodeDef.name);
    }

    this.assignExtrasToUserData(node, nodeDef);

    if (nodeDef.extensions) this.addUnknownExtensionsToUserData(node, nodeDef);

    if (nodeDef.matrix !== undefined) {
      const matrix = new Matrix4();
      matrix.fromArray(nodeDef.matrix);
      node.applyMatrix(matrix);
    } else {
      if (nodeDef.translation !== undefined) {
        node.position.fromArray(nodeDef.translation);
      }

      if (nodeDef.rotation !== undefined) {
        node.quaternion.fromArray(nodeDef.rotation);
      }

      if (nodeDef.scale !== undefined) {
        node.scale.fromArray(nodeDef.scale);
      }
    }

    if (nodeDef.skin !== undefined) {
      // build skeleton here as well

      const skin = await this.getDependency("skin", nodeDef.skin);

      const pendingJoints = [];

      for (let i = 0, il = skin.joints.length; i < il; i++) {
        pendingJoints.push(this.getDependency("node", skin.joints[i], options));
      }

      const jointNodes = await Promise.all(pendingJoints);

      const meshes = node.isGroup === true ? node.children : [node];

      for (let i = 0, il = meshes.length; i < il; i++) {
        const mesh = meshes[i];

        const bones = [];
        const boneInverses = [];

        for (let j = 0, jl = jointNodes.length; j < jl; j++) {
          const jointNode = jointNodes[j];

          if (jointNode) {
            bones.push(jointNode);

            const mat = new Matrix4();

            if (skin.inverseBindMatrices !== undefined) {
              mat.fromArray(skin.inverseBindMatrices.array, j * 16);
            }

            boneInverses.push(mat);
          } else {
            console.warn('THREE.GLTFLoader: Joint "%s" could not be found.', skin.joints[j]);
          }
        }

        mesh.bind(new Skeleton(bones, boneInverses), mesh.matrixWorld);
      }
    }

    if (nodeDef.children) {
      const pending = [];

      for (let i = 0, il = nodeDef.children.length; i < il; i++) {
        pending.push(this.getDependency("node", nodeDef.children[i], options));
      }

      const children = await Promise.all(pending);

      for (const child of children) {
        node.add(child);
      }
    }

    return node;
  }

  async loadSceneAnimations(sceneIndex) {
    const { json } = await this.getDependency("root");
    const sceneDef = json.scenes[sceneIndex];

    const decendantNodeIds = [];

    if (Array.isArray(sceneDef.nodes)) {
      for (const nodeId of sceneDef.nodes) {
        this.gatherDecendantNodeIds(json, nodeId, decendantNodeIds);
      }
    }

    return this.loadAnimationsForNodes(json, decendantNodeIds);
  }

  async loadNodeAnimations(nodeIndex) {
    const { json } = await this.getDependency("root");
    const decendantNodeIds = this.gatherDecendantNodeIds(json, nodeIndex, []);
    return this.loadAnimationsForNodes(json, decendantNodeIds);
  }

  gatherDecendantNodeIds(json, nodeIndex, decendantNodeIds) {
    const nodeDef = json.nodes[nodeIndex];

    decendantNodeIds.push(nodeIndex);

    if (nodeDef.children) {
      for (const childIndex of nodeDef.children) {
        this.gatherDecendantNodeIds(json, childIndex, decendantNodeIds);
      }
    }

    return decendantNodeIds;
  }

  loadAnimationsForNodes(json, nodeIds) {
    const animationDefs = json.animations || [];

    const pending = [];

    for (let animationIndex = 0; animationIndex < animationDefs.length; animationIndex++) {
      const animationDef = animationDefs[animationIndex];
      const animationTargetsDecendant = animationDef.channels.some(
        channel => nodeIds.indexOf(channel.target.node) !== -1
      );

      if (animationTargetsDecendant) {
        pending.push(this.loadAnimation(animationIndex));
      }
    }

    return Promise.all(pending);
  }

  /**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#animations
   * @param {number} animationIndex
   * @return {Promise<AnimationClip>}
   */
  async loadAnimation(animationIndex) {
    const { json } = await this.getDependency("root");

    const animationDef = json.animations[animationIndex];

    const pendingNodes = [];
    const pendingInputAccessors = [];
    const pendingOutputAccessors = [];
    const pendingSamplers = [];
    const pendingTargets = [];

    for (let i = 0, il = animationDef.channels.length; i < il; i++) {
      const channel = animationDef.channels[i];
      const sampler = animationDef.samplers[channel.sampler];
      const target = channel.target;
      const name = target.node !== undefined ? target.node : target.id; // NOTE: target.id is deprecated.
      const input = animationDef.parameters !== undefined ? animationDef.parameters[sampler.input] : sampler.input;
      const output = animationDef.parameters !== undefined ? animationDef.parameters[sampler.output] : sampler.output;

      pendingNodes.push(this.getDependency("node", name));
      pendingInputAccessors.push(this.getDependency("accessor", input));
      pendingOutputAccessors.push(this.getDependency("accessor", output));
      pendingSamplers.push(sampler);
      pendingTargets.push(target);
    }

    const [nodes, inputAccessors, outputAccessors, samplers, targets] = await Promise.all([
      Promise.all(pendingNodes),
      Promise.all(pendingInputAccessors),
      Promise.all(pendingOutputAccessors),
      Promise.all(pendingSamplers),
      Promise.all(pendingTargets)
    ]);

    const tracks = [];

    for (let i = 0, il = nodes.length; i < il; i++) {
      const node = nodes[i];
      const inputAccessor = inputAccessors[i];
      const outputAccessor = outputAccessors[i];
      const sampler = samplers[i];
      const target = targets[i];

      if (node === undefined) continue;

      node.updateMatrix();
      node.matrixAutoUpdate = true;

      let TypedKeyframeTrack;

      switch (PATH_PROPERTIES[target.path]) {
        case PATH_PROPERTIES.weights:
          TypedKeyframeTrack = NumberKeyframeTrack;
          break;

        case PATH_PROPERTIES.rotation:
          TypedKeyframeTrack = QuaternionKeyframeTrack;
          break;

        case PATH_PROPERTIES.position:
        case PATH_PROPERTIES.scale:
        default:
          TypedKeyframeTrack = VectorKeyframeTrack;
          break;
      }

      const interpolation =
        sampler.interpolation !== undefined ? INTERPOLATION[sampler.interpolation] : InterpolateLinear;

      const targetNames = [];

      if (PATH_PROPERTIES[target.path] === PATH_PROPERTIES.weights) {
        // Node may be a Group (glTF mesh with several primitives) or a Mesh.
        node.traverse(function(object) {
          if (object.isMesh === true && object.morphTargetInfluences) {
            targetNames.push(object.uuid);
          }
        });
      } else {
        targetNames.push(node.uuid);
      }

      let outputArray = outputAccessor.array;

      if (outputAccessor.normalized) {
        let scale;

        if (outputArray.constructor === Int8Array) {
          scale = 1 / 127;
        } else if (outputArray.constructor === Uint8Array) {
          scale = 1 / 255;
        } else if (outputArray.constructor == Int16Array) {
          scale = 1 / 32767;
        } else if (outputArray.constructor === Uint16Array) {
          scale = 1 / 65535;
        } else {
          throw new Error("THREE.GLTFLoader: Unsupported output accessor component type.");
        }

        const scaled = new Float32Array(outputArray.length);

        for (let j = 0, jl = outputArray.length; j < jl; j++) {
          scaled[j] = outputArray[j] * scale;
        }

        outputArray = scaled;
      }

      for (let j = 0, jl = targetNames.length; j < jl; j++) {
        const track = new TypedKeyframeTrack(
          targetNames[j] + "." + PATH_PROPERTIES[target.path],
          inputAccessor.array,
          outputArray,
          interpolation
        );

        // Override interpolation with custom factory method.
        if (sampler.interpolation === "CUBICSPLINE") {
          track.createInterpolant = function InterpolantFactoryMethodGLTFCubicSpline(result) {
            // A CUBICSPLINE keyframe in glTF has three output values for each input value,
            // representing inTangent, splineVertex, and outTangent. As a result, track.getValueSize()
            // must be divided by three to get the interpolant's sampleSize argument.

            return new GLTFCubicSplineInterpolant(this.times, this.values, this.getValueSize() / 3, result);
          };

          // Mark as CUBICSPLINE. `track.getInterpolation()` doesn't support custom interpolants.
          track.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline = true;
        }

        tracks.push(track);
      }
    }

    const name = animationDef.name !== undefined ? animationDef.name : "animation_" + animationIndex;

    return new AnimationClip(name, undefined, tracks);
  }

  /**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#skins
   * @param {number} skinIndex
   * @return {Promise<Object>}
   */
  async loadSkin(skinIndex) {
    const { json } = await this.getDependency("root");
    const skinDef = json.skins[skinIndex];

    const skinEntry = { joints: skinDef.joints };

    if (skinDef.inverseBindMatrices === undefined) {
      return skinEntry;
    }

    const accessor = await this.getDependency("accessor", skinDef.inverseBindMatrices);
    skinEntry.inverseBindMatrices = accessor;

    return skinEntry;
  }

  /**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#cameras
   * @param {number} cameraIndex
   * @return {Promise<THREE.Camera>}
   */
  async loadCamera(cameraIndex) {
    const { json } = await this.getDependency("root");
    let camera;
    const cameraDef = json.cameras[cameraIndex];
    const params = cameraDef[cameraDef.type];

    if (!params) {
      console.warn("THREE.GLTFLoader: Missing camera parameters.");
      return;
    }

    if (cameraDef.type === "perspective") {
      camera = new PerspectiveCamera(
        _Math.radToDeg(params.yfov),
        params.aspectRatio || 1,
        params.znear || 1,
        params.zfar || 2e6
      );
    } else if (cameraDef.type === "orthographic") {
      camera = new OrthographicCamera(
        params.xmag / -2,
        params.xmag / 2,
        params.ymag / 2,
        params.ymag / -2,
        params.znear,
        params.zfar
      );
    }

    if (cameraDef.name !== undefined) camera.name = cameraDef.name;

    this.assignExtrasToUserData(camera, cameraDef);

    return camera;
  }

  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#meshes
   * @param {number} meshIndex
   * @return {Promise<Group|Mesh|SkinnedMesh>}
   */
  async loadMesh(meshIndex, options) {
    const { json } = await this.getDependency("root");

    const meshDef = json.meshes[meshIndex];
    const primitives = meshDef.primitives;

    const pending = [];

    for (let i = 0, il = primitives.length; i < il; i++) {
      const loadDefaultMaterial = options && options.loadDefaultMaterial;
      const material =
        primitives[i].material === undefined || loadDefaultMaterial
          ? this.createDefaultMaterial()
          : this.getDependency("material", primitives[i].material);

      pending.push(material);
    }

    const originalMaterials = await Promise.all(pending);
    const geometries = await this.loadGeometries(primitives);
    const meshes = [];

    const stats = {
      name: meshDef.name || `Mesh ${meshIndex}`,
      triangles: 0,
      vertices: 0
    };

    for (let i = 0, il = geometries.length; i < il; i++) {
      const geometry = geometries[i];
      const primitive = primitives[i];

      // 1. create Mesh

      const material = originalMaterials[i];

      let mesh = await this.runFirstHook("createPrimitive", meshDef, primitive, geometry, material);

      if (!mesh) {
        if (
          primitive.mode === WEBGL_CONSTANTS.TRIANGLES ||
          primitive.mode === WEBGL_CONSTANTS.TRIANGLE_STRIP ||
          primitive.mode === WEBGL_CONSTANTS.TRIANGLE_FAN ||
          primitive.mode === undefined
        ) {
          // .isSkinnedMesh isn't in glTF spec. See .markDefs()
          mesh = meshDef.isSkinnedMesh === true ? new SkinnedMesh(geometry, material) : new Mesh(geometry, material);
        } else if (primitive.mode === WEBGL_CONSTANTS.LINES) {
          mesh = new LineSegments(geometry, material);
        } else if (primitive.mode === WEBGL_CONSTANTS.LINE_STRIP) {
          mesh = new Line(geometry, material);
        } else if (primitive.mode === WEBGL_CONSTANTS.LINE_LOOP) {
          mesh = new LineLoop(geometry, material);
        } else if (primitive.mode === WEBGL_CONSTANTS.POINTS) {
          mesh = new Points(geometry, material);
        } else {
          throw new Error("THREE.GLTFLoader: Primitive mode unsupported: " + primitive.mode);
        }
      }

      if (mesh.geometry.index) {
        stats.triangles += mesh.geometry.index.count / 3;
      } else {
        stats.triangles += mesh.geometry.attributes.position.count / 3;
      }

      stats.vertices += mesh.geometry.attributes.position.count;

      this.stats.triangles += stats.triangles;
      this.stats.vertices += stats.vertices;

      if (mesh.isMesh) {
        if (primitive.mode === WEBGL_CONSTANTS.TRIANGLE_STRIP) {
          mesh.drawMode = TriangleStripDrawMode;
        } else if (primitive.mode === WEBGL_CONSTANTS.TRIANGLE_FAN) {
          mesh.drawMode = TriangleFanDrawMode;
        }
      }

      if (mesh.isSkinnedMesh === true && !mesh.geometry.attributes.skinWeight.normalized) {
        // we normalize floating point skin weight array to fix malformed assets (see #15319)
        // it's important to skip this for non-float32 data since normalizeSkinWeights assumes non-normalized inputs
        mesh.normalizeSkinWeights();
      }

      if (Object.keys(mesh.geometry.morphAttributes).length > 0) {
        this.updateMorphTargets(mesh, meshDef);
      }

      mesh.name = meshDef.name || "mesh_" + meshIndex;

      if (geometries.length > 1) mesh.name += "_" + i;

      this.assignExtrasToUserData(mesh, meshDef);

      this.assignFinalMaterial(mesh);

      meshes.push(mesh);
    }

    this.stats.meshInfo[meshIndex] = stats;

    if (meshes.length === 1) {
      return meshes[0];
    }

    const group = new Group();

    for (let i = 0, il = meshes.length; i < il; i++) {
      group.add(meshes[i]);
    }

    return group;
  }

  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#geometry
   *
   * Creates BufferGeometries from primitives.
   *
   * @param {Array<GLTF.Primitive>} primitives
   * @return {Promise<Array<BufferGeometry>>}
   */
  loadGeometries(primitives) {
    const cache = this.primitiveCache;

    const pending = [];

    for (let i = 0, il = primitives.length; i < il; i++) {
      const primitive = primitives[i];
      const cacheKey = this.createPrimitiveKey(primitive);

      // See if we've already created this geometry
      const cached = cache[cacheKey];

      if (cached) {
        // Use the cached geometry if it exists
        pending.push(cached.promise);
      } else {
        const geometryPromise = this.addPrimitiveAttributes(new BufferGeometry(), primitive);

        // Cache this geometry
        cache[cacheKey] = { primitive: primitive, promise: geometryPromise };

        pending.push(geometryPromise);
      }
    }

    return Promise.all(pending);
  }

  /**
   * @param {BufferGeometry} geometry
   * @param {GLTF.Primitive} primitiveDef
   * @return {Promise<BufferGeometry>}
   */
  async addPrimitiveAttributes(geometry, primitiveDef) {
    const attributes = primitiveDef.attributes;

    const pending = [];

    const assignAttributeAccessor = (accessorIndex, attributeName) => {
      return this.getDependency("accessor", accessorIndex).then(function(accessor) {
        geometry.addAttribute(attributeName, accessor);
      });
    };

    for (const gltfAttributeName in attributes) {
      if (!Object.prototype.hasOwnProperty.call(attributes, gltfAttributeName)) continue;

      const threeAttributeName = ATTRIBUTES[gltfAttributeName] || gltfAttributeName.toLowerCase();

      // Skip attributes already provided by e.g. Draco extension.
      if (threeAttributeName in geometry.attributes) continue;

      pending.push(assignAttributeAccessor(attributes[gltfAttributeName], threeAttributeName));
    }

    if (primitiveDef.indices !== undefined && !geometry.index) {
      const accessor = this.getDependency("accessor", primitiveDef.indices).then(function(accessor) {
        geometry.setIndex(accessor);
      });

      pending.push(accessor);
    }

    this.assignExtrasToUserData(geometry, primitiveDef);

    await Promise.all(pending);

    return primitiveDef.targets !== undefined ? this.addMorphTargets(geometry, primitiveDef.targets) : geometry;
  }

  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#morph-targets
   *
   * @param {BufferGeometry} geometry
   * @param {Array<GLTF.Target>} targets
   * @return {Promise<BufferGeometry>}
   */
  async addMorphTargets(geometry, targets) {
    let hasMorphPosition = false;
    let hasMorphNormal = false;

    for (let i = 0, il = targets.length; i < il; i++) {
      const target = targets[i];

      if (target.POSITION !== undefined) hasMorphPosition = true;
      if (target.NORMAL !== undefined) hasMorphNormal = true;

      if (hasMorphPosition && hasMorphNormal) break;
    }

    if (!hasMorphPosition && !hasMorphNormal) {
      return geometry;
    }

    const pendingPositionAccessors = [];
    const pendingNormalAccessors = [];

    for (let i = 0, il = targets.length; i < il; i++) {
      const target = targets[i];

      if (hasMorphPosition) {
        const pendingAccessor =
          target.POSITION !== undefined
            ? this.getDependency("accessor", target.POSITION)
            : geometry.attributes.position;

        pendingPositionAccessors.push(pendingAccessor);
      }

      if (hasMorphNormal) {
        const pendingAccessor =
          target.NORMAL !== undefined ? this.getDependency("accessor", target.NORMAL) : geometry.attributes.normal;

        pendingNormalAccessors.push(pendingAccessor);
      }
    }

    const [morphPositions, morphNormals] = await Promise.all([
      Promise.all(pendingPositionAccessors),
      Promise.all(pendingNormalAccessors)
    ]);

    // Clone morph target accessors before modifying them.

    for (let i = 0, il = morphPositions.length; i < il; i++) {
      if (geometry.attributes.position === morphPositions[i]) continue;

      morphPositions[i] = morphPositions[i].clone();
    }

    for (let i = 0, il = morphNormals.length; i < il; i++) {
      if (geometry.attributes.normal === morphNormals[i]) continue;

      morphNormals[i] = morphNormals[i].clone();
    }

    for (let i = 0, il = targets.length; i < il; i++) {
      const target = targets[i];
      const attributeName = "morphTarget" + i;

      if (hasMorphPosition) {
        // Three.js morph position is absolute value. The formula is
        //   basePosition
        //     + weight0 * ( morphPosition0 - basePosition )
        //     + weight1 * ( morphPosition1 - basePosition )
        //     ...
        // while the glTF one is relative
        //   basePosition
        //     + weight0 * glTFmorphPosition0
        //     + weight1 * glTFmorphPosition1
        //     ...
        // then we need to convert from relative to absolute here.

        if (target.POSITION !== undefined) {
          const positionAttribute = morphPositions[i];
          positionAttribute.name = attributeName;

          const position = geometry.attributes.position;

          for (let j = 0, jl = positionAttribute.count; j < jl; j++) {
            positionAttribute.setXYZ(
              j,
              positionAttribute.getX(j) + position.getX(j),
              positionAttribute.getY(j) + position.getY(j),
              positionAttribute.getZ(j) + position.getZ(j)
            );
          }
        }
      }

      if (hasMorphNormal) {
        // see target.POSITION's comment

        if (target.NORMAL !== undefined) {
          const normalAttribute = morphNormals[i];
          normalAttribute.name = attributeName;

          const normal = geometry.attributes.normal;

          for (let j = 0, jl = normalAttribute.count; j < jl; j++) {
            normalAttribute.setXYZ(
              j,
              normalAttribute.getX(j) + normal.getX(j),
              normalAttribute.getY(j) + normal.getY(j),
              normalAttribute.getZ(j) + normal.getZ(j)
            );
          }
        }
      }
    }

    if (hasMorphPosition) geometry.morphAttributes.position = morphPositions;
    if (hasMorphNormal) geometry.morphAttributes.normal = morphNormals;

    return geometry;
  }

  /**
   * @param {Mesh} mesh
   * @param {GLTF.Mesh} meshDef
   */
  updateMorphTargets(mesh, meshDef) {
    mesh.updateMorphTargets();

    if (meshDef.weights !== undefined) {
      for (let i = 0, il = meshDef.weights.length; i < il; i++) {
        mesh.morphTargetInfluences[i] = meshDef.weights[i];
      }
    }

    // .extras has user-defined data, so check that .extras.targetNames is an array.
    if (meshDef.extras && Array.isArray(meshDef.extras.targetNames)) {
      const targetNames = meshDef.extras.targetNames;

      if (mesh.morphTargetInfluences.length === targetNames.length) {
        mesh.morphTargetDictionary = {};

        for (let i = 0, il = targetNames.length; i < il; i++) {
          mesh.morphTargetDictionary[targetNames[i]] = i;
        }
      } else {
        console.warn("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.");
      }
    }
  }

  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#materials
   * @param {number} materialIndex
   * @return {Promise<Material>}
   */
  async loadMaterial(materialIndex) {
    const { json } = await this.getDependency("root");
    const materialDef = json.materials[materialIndex];

    let material = await this.runFirstHook("createMaterial", materialDef);

    if (!material) {
      material = await this.createStandardMaterial(materialDef);
    }

    await this.runAllHooks("setMaterialParams", material, materialDef);

    if (materialDef.name !== undefined) material.name = materialDef.name;

    this.assignExtrasToUserData(material, materialDef);

    if (materialDef.extensions) this.addUnknownExtensionsToUserData(material, materialDef);

    return material;
  }

  async createStandardMaterial(materialDef) {
    const material = new MeshStandardMaterial();

    const pending = [];

    // Specification:
    // https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#metallic-roughness-material

    const metallicRoughness = materialDef.pbrMetallicRoughness || {};

    material.color.set(0xffffff);
    material.opacity = 1.0;

    const alphaMode = materialDef.alphaMode || ALPHA_MODES.OPAQUE;

    if (Array.isArray(metallicRoughness.baseColorFactor)) {
      const array = metallicRoughness.baseColorFactor;

      material.color.fromArray(array);
      material.opacity = array[3];
    }

    if (metallicRoughness.baseColorTexture !== undefined) {
      const format = alphaMode === ALPHA_MODES.OPAQUE ? RGBFormat : RGBAFormat;
      pending.push(this.assignTexture(material, "map", metallicRoughness.baseColorTexture, sRGBEncoding, format));
    }

    material.metalness = metallicRoughness.metallicFactor !== undefined ? metallicRoughness.metallicFactor : 1.0;
    material.roughness = metallicRoughness.roughnessFactor !== undefined ? metallicRoughness.roughnessFactor : 1.0;

    if (metallicRoughness.metallicRoughnessTexture !== undefined) {
      pending.push(
        this.assignTexture(material, "metalnessMap", metallicRoughness.metallicRoughnessTexture, undefined, RGBFormat)
      );
      pending.push(
        this.assignTexture(material, "roughnessMap", metallicRoughness.metallicRoughnessTexture, undefined, RGBFormat)
      );
    }

    if (materialDef.doubleSided === true) {
      material.side = DoubleSide;
    }

    if (alphaMode === ALPHA_MODES.BLEND) {
      material.transparent = true;
    } else {
      material.transparent = false;

      if (alphaMode === ALPHA_MODES.MASK) {
        material.alphaTest = materialDef.alphaCutoff !== undefined ? materialDef.alphaCutoff : 0.5;
      }
    }

    if (materialDef.normalTexture !== undefined) {
      pending.push(this.assignTexture(material, "normalMap", materialDef.normalTexture, undefined, RGBFormat));

      material.normalScale.set(1, 1);

      if (materialDef.normalTexture.scale !== undefined) {
        material.normalScale.set(materialDef.normalTexture.scale, materialDef.normalTexture.scale);
      }
    }

    if (materialDef.occlusionTexture !== undefined) {
      pending.push(this.assignTexture(material, "aoMap", materialDef.occlusionTexture, undefined, RGBFormat));

      if (materialDef.occlusionTexture.strength !== undefined) {
        material.aoMapIntensity = materialDef.occlusionTexture.strength;
      }
    }

    if (materialDef.emissiveFactor !== undefined) {
      material.emissive.fromArray(materialDef.emissiveFactor);
    }

    if (materialDef.emissiveTexture !== undefined) {
      pending.push(this.assignTexture(material, "emissiveMap", materialDef.emissiveTexture, sRGBEncoding, RGBFormat));
    }

    await Promise.all(pending);

    return material;
  }

  /**
   * Assigns final material to a Mesh, Line, or Points instance. The instance
   * already has a material (generated from the glTF material options alone)
   * but reuse of the same glTF material may require multiple threejs materials
   * to accomodate different primitive types, defines, etc. New materials will
   * be created if necessary, and reused from a cache.
   * @param  {Object3D} mesh Mesh, Line, or Points instance.
   */
  assignFinalMaterial(mesh) {
    const geometry = mesh.geometry;
    let material = mesh.material;

    const useVertexTangents = geometry.attributes.tangent !== undefined;
    const useVertexColors = geometry.attributes.color !== undefined;
    const useFlatShading = geometry.attributes.normal === undefined;
    const useSkinning = mesh.isSkinnedMesh === true;
    const useMorphTargets = Object.keys(geometry.morphAttributes).length > 0;
    const useMorphNormals = useMorphTargets && geometry.morphAttributes.normal !== undefined;

    if (mesh.isPoints) {
      const cacheKey = "PointsMaterial:" + material.uuid;

      let pointsMaterial = this.cache.get(cacheKey);

      if (!pointsMaterial) {
        pointsMaterial = new PointsMaterial();
        Material.prototype.copy.call(pointsMaterial, material);
        pointsMaterial.color.copy(material.color);
        pointsMaterial.map = material.map;
        pointsMaterial.lights = false; // PointsMaterial doesn't support lights yet

        this.cache.set(cacheKey, pointsMaterial);
      }

      material = pointsMaterial;
    } else if (mesh.isLine) {
      const cacheKey = "LineBasicMaterial:" + material.uuid;

      let lineMaterial = this.cache.get(cacheKey);

      if (!lineMaterial) {
        lineMaterial = new LineBasicMaterial();
        Material.prototype.copy.call(lineMaterial, material);
        lineMaterial.color.copy(material.color);
        lineMaterial.lights = false; // LineBasicMaterial doesn't support lights yet

        this.cache.set(cacheKey, lineMaterial);
      }

      material = lineMaterial;
    }

    // Clone the material if it will be modified
    if (useVertexTangents || useVertexColors || useFlatShading || useSkinning || useMorphTargets) {
      let cacheKey = "ClonedMaterial:" + material.uuid + ":";

      if (material.isGLTFSpecularGlossinessMaterial) cacheKey += "specular-glossiness:";
      if (useSkinning) cacheKey += "skinning:";
      if (useVertexTangents) cacheKey += "vertex-tangents:";
      if (useVertexColors) cacheKey += "vertex-colors:";
      if (useFlatShading) cacheKey += "flat-shading:";
      if (useMorphTargets) cacheKey += "morph-targets:";
      if (useMorphNormals) cacheKey += "morph-normals:";

      let cachedMaterial = this.cache.get(cacheKey);

      if (!cachedMaterial) {
        cachedMaterial = material.clone();

        if (useSkinning) cachedMaterial.skinning = true;
        if (useVertexTangents) cachedMaterial.vertexTangents = true;
        if (useVertexColors) cachedMaterial.vertexColors = VertexColors;
        if (useFlatShading) cachedMaterial.flatShading = true;
        if (useMorphTargets) cachedMaterial.morphTargets = true;
        if (useMorphNormals) cachedMaterial.morphNormals = true;

        this.cache.set(cacheKey, cachedMaterial);
      }

      material = cachedMaterial;
    }

    // workarounds for mesh and geometry

    if (material.aoMap && geometry.attributes.uv2 === undefined && geometry.attributes.uv !== undefined) {
      geometry.addAttribute("uv2", new BufferAttribute(geometry.attributes.uv.array, 2));
    }

    mesh.material = material;
  }

  /**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#textures
   * @param {number} textureIndex
   * @return {Promise<Texture>}
   */
  async loadTexture(textureIndex) {
    const { json } = await this.getDependency("root");
    const options = this.options;
    const textureLoader = this.textureLoader;

    const URL = window.URL || window.webkitURL;

    const textureDef = json.textures[textureIndex];

    const source = json.images[textureDef.source];

    let sourceURI = source.uri;
    let isObjectURL = false;

    let imageSize;

    if (source.bufferView !== undefined) {
      // Load binary image data from bufferView, if provided.
      const bufferView = await this.getDependency("bufferView", source.bufferView);
      isObjectURL = true;
      const blob = new Blob([bufferView], { type: source.mimeType });
      sourceURI = URL.createObjectURL(blob);
      imageSize = blob.size;
    }

    // Load Texture resource.
    let loader = Loader.Handlers.get(sourceURI);

    if (!loader) {
      loader = textureLoader;
    }

    const textureUrl = this.resolveURL(sourceURI, options.path);

    const texture = await loadTexture(textureUrl, this.textureLoader);

    if (!imageSize) {
      const perfEntries = performance.getEntriesByName(textureUrl);
      if (perfEntries.length > 0) {
        imageSize = perfEntries[0].encodedBodySize;
      }
    }

    this.stats.textureInfo[textureDef.source] = {
      name: source.name || textureDef.name || `Image ${textureDef.source}`,
      size: imageSize,
      url: textureUrl,
      width: texture.image.width,
      height: texture.image.height,
      type: source.mimeType
    };

    // Clean up resources and configure Texture.

    if (isObjectURL === true && options.revokeObjectURLs) {
      URL.revokeObjectURL(sourceURI);
    }

    texture.flipY = false;

    if (textureDef.name !== undefined) {
      texture.name = textureDef.name;
    } else if (source.name !== undefined) {
      texture.name = source.name;
    }

    // Ignore unknown mime types, like DDS files.
    if (source.mimeType in MIME_TYPE_FORMATS) {
      texture.format = MIME_TYPE_FORMATS[source.mimeType];
    }

    const samplers = json.samplers || {};
    const sampler = samplers[textureDef.sampler] || {};

    texture.magFilter = WEBGL_FILTERS[sampler.magFilter] || LinearFilter;
    texture.minFilter = WEBGL_FILTERS[sampler.minFilter] || LinearMipMapLinearFilter;
    texture.wrapS = WEBGL_WRAPPINGS[sampler.wrapS] || RepeatWrapping;
    texture.wrapT = WEBGL_WRAPPINGS[sampler.wrapT] || RepeatWrapping;

    return texture;
  }

  /**
   * Asynchronously assigns a texture to the given material parameters.
   * @param {Object} material
   * @param {string} mapName
   * @param {Object} mapDef
   * @param {PixelFormat} format
   * @return {Promise}
   */
  async assignTexture(materialParams, mapName, mapDef, overrideEncoding, overrideFormat) {
    const parser = this;

    return this.getDependency("texture", mapDef.index).then(function(texture) {
      if (mapDef.extensions !== undefined && mapDef.extensions[EXTENSIONS.KHR_TEXTURE_TRANSFORM]) {
        const transform = mapDef.extensions[EXTENSIONS.KHR_TEXTURE_TRANSFORM];
        if (transform) {
          texture = parser.extendTexture(texture, transform);
        }
      }

      if (!texture.isCompressedTexture && overrideFormat) {
        texture.format = overrideFormat;
      }

      if (overrideEncoding) {
        texture.encoding = overrideEncoding;
      }

      materialParams[mapName] = texture;
    });
  }

  /**
   * Applies a texture transform, if present, to the map definition. Requires
   * the KHR_texture_transform extension.
   */
  extendTexture(texture, transform) {
    texture = texture.clone();

    if (transform.offset !== undefined) {
      texture.offset.fromArray(transform.offset);
      texture.needsUpdate = true;
    }

    if (transform.rotation !== undefined) {
      texture.rotation = transform.rotation;
      texture.needsUpdate = true;
    }

    if (transform.scale !== undefined) {
      texture.repeat.fromArray(transform.scale);
      texture.needsUpdate = true;
    }

    if (texture.texCoord !== undefined) {
      console.warn('THREE.GLTFLoader: Custom UV sets in "' + this.name + '" extension not yet supported.');
    }

    return texture;
  }

  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#accessors
   * @param {number} accessorIndex
   * @return {Promise<BufferAttribute|InterleavedBufferAttribute>}
   */
  async loadAccessor(accessorIndex) {
    const { json } = await this.getDependency("root");

    const accessorDef = json.accessors[accessorIndex];

    if (accessorDef.bufferView === undefined && accessorDef.sparse === undefined) {
      // Ignore empty accessors, which may be used to declare runtime
      // information about attributes coming from another source (e.g. Draco
      // compression extension).
      return null;
    }

    const pendingBufferViews = [];

    if (accessorDef.bufferView !== undefined) {
      pendingBufferViews.push(this.getDependency("bufferView", accessorDef.bufferView));
    } else {
      pendingBufferViews.push(null);
    }

    if (accessorDef.sparse !== undefined) {
      pendingBufferViews.push(this.getDependency("bufferView", accessorDef.sparse.indices.bufferView));
      pendingBufferViews.push(this.getDependency("bufferView", accessorDef.sparse.values.bufferView));
    }

    const bufferViews = await Promise.all(pendingBufferViews);
    const bufferView = bufferViews[0];

    const itemSize = WEBGL_TYPE_SIZES[accessorDef.type];
    const TypedArray = WEBGL_COMPONENT_TYPES[accessorDef.componentType];

    // For VEC3: itemSize is 3, elementBytes is 4, itemBytes is 12.
    const elementBytes = TypedArray.BYTES_PER_ELEMENT;
    const itemBytes = elementBytes * itemSize;
    const byteOffset = accessorDef.byteOffset || 0;
    const byteStride =
      accessorDef.bufferView !== undefined ? json.bufferViews[accessorDef.bufferView].byteStride : undefined;
    const normalized = accessorDef.normalized === true;
    let array;

    // The buffer is not interleaved if the stride is the item size in bytes.
    if (byteStride && byteStride !== itemBytes) {
      // Convert interleaved accessors to non-interleaved accessors.
      // Simplifies mesh cloning, combination, and export at the expense of some performace.
      const stride = byteStride / elementBytes;
      const offset = byteOffset / elementBytes;
      const typedBufferView = new TypedArray(bufferView);
      array = new TypedArray(accessorDef.count * itemSize);

      for (let elementIndex = 0; elementIndex < accessorDef.count; elementIndex++) {
        for (let itemIndex = 0; itemIndex < itemSize; itemIndex++) {
          array[elementIndex * itemSize + itemIndex] = typedBufferView[elementIndex * stride + itemIndex + offset];
        }
      }
    } else {
      if (bufferView === null) {
        array = new TypedArray(accessorDef.count * itemSize);
      } else {
        array = new TypedArray(bufferView, byteOffset, accessorDef.count * itemSize);
      }
    }

    const bufferAttribute = new BufferAttribute(array, itemSize, normalized);

    // https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#sparse-accessors
    if (accessorDef.sparse !== undefined) {
      const itemSizeIndices = WEBGL_TYPE_SIZES.SCALAR;
      const TypedArrayIndices = WEBGL_COMPONENT_TYPES[accessorDef.sparse.indices.componentType];

      const byteOffsetIndices = accessorDef.sparse.indices.byteOffset || 0;
      const byteOffsetValues = accessorDef.sparse.values.byteOffset || 0;

      const sparseIndices = new TypedArrayIndices(
        bufferViews[1],
        byteOffsetIndices,
        accessorDef.sparse.count * itemSizeIndices
      );
      const sparseValues = new TypedArray(bufferViews[2], byteOffsetValues, accessorDef.sparse.count * itemSize);

      if (bufferView !== null) {
        // Avoid modifying the original ArrayBuffer, if the bufferView wasn't initialized with zeroes.
        bufferAttribute.setArray(bufferAttribute.array.slice());
      }

      for (let i = 0, il = sparseIndices.length; i < il; i++) {
        const index = sparseIndices[i];

        bufferAttribute.setX(index, sparseValues[i * itemSize]);
        if (itemSize >= 2) bufferAttribute.setY(index, sparseValues[i * itemSize + 1]);
        if (itemSize >= 3) bufferAttribute.setZ(index, sparseValues[i * itemSize + 2]);
        if (itemSize >= 4) bufferAttribute.setW(index, sparseValues[i * itemSize + 3]);
        if (itemSize >= 5) throw new Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.");
      }
    }

    return bufferAttribute;
  }

  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#buffers-and-buffer-views
   * @param {number} bufferViewIndex
   * @return {Promise<ArrayBuffer>}
   */
  async loadBufferView(bufferViewIndex) {
    const { json } = await this.getDependency("root");
    const bufferViewDef = json.bufferViews[bufferViewIndex];

    const buffer = await this.getDependency("buffer", bufferViewDef.buffer);
    const byteLength = bufferViewDef.byteLength || 0;
    const byteOffset = bufferViewDef.byteOffset || 0;
    return buffer.slice(byteOffset, byteOffset + byteLength);
  }

  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#buffers-and-buffer-views
   * @param {number} bufferIndex
   * @return {Promise<ArrayBuffer>}
   */
  async loadBuffer(bufferIndex) {
    const { json, glbBuffer } = await this.getDependency("root");
    const bufferDef = json.buffers[bufferIndex];
    const loader = this.fileLoader;

    if (bufferDef.type && bufferDef.type !== "arraybuffer") {
      throw new Error("THREE.GLTFLoader: " + bufferDef.type + " buffer type is not supported.");
    }

    let buffer;

    // If present, GLB container is required to be the first buffer.
    if (bufferDef.uri === undefined && bufferIndex === 0) {
      buffer = glbBuffer;
    } else {
      const options = this.options;

      buffer = await new Promise((resolve, reject) => {
        loader.load(this.resolveURL(bufferDef.uri, options.path), resolve, undefined, () => {
          reject(new Error('THREE.GLTFLoader: Failed to load buffer "' + bufferDef.uri + '".'));
        });
      });
    }

    this.stats.bufferInfo[bufferIndex] = {
      name: bufferDef.name || `Buffer ${bufferIndex}`,
      size: buffer.byteLength
    };

    return buffer;
  }

  resolveURL(url, path) {
    // Invalid URL
    if (typeof url !== "string" || url === "") return "";

    // Absolute URL http://,https://,//
    if (/^(https?:)?\/\//i.test(url)) return url;

    // Data URI
    if (/^data:.*,.*$/i.test(url)) return url;

    // Blob URL
    if (/^blob:.*$/i.test(url)) return url;

    // Relative URL
    return path + url;
  }

  defaultMaterial = null;

  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#default-material
   */
  createDefaultMaterial() {
    this.defaultMaterial =
      this.defaultMaterial ||
      new MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0x000000,
        metalness: 1,
        roughness: 1,
        transparent: false,
        depthTest: true,
        side: FrontSide
      });

    return this.defaultMaterial;
  }

  addUnknownExtensionsToUserData(object, objectDef) {
    for (const name in objectDef.extensions) {
      if (
        name == "MOZ_hubs_components" ||
        (this.options.addUnknownExtensionsToUserData && !this.knownExtensions.has(name))
      ) {
        object.userData.gltfExtensions = object.userData.gltfExtensions || {};
        object.userData.gltfExtensions[name] = objectDef.extensions[name];
      }
    }
  }

  /**
   * @param {Object3D|Material|BufferGeometry} object
   * @param {GLTF.definition} gltfDef
   */
  assignExtrasToUserData(object, gltfDef) {
    if (gltfDef.extras !== undefined) {
      if (typeof gltfDef.extras === "object") {
        Object.assign(object.userData, gltfDef.extras);
      } else {
        console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, " + gltfDef.extras);
      }
    }
  }

  createPrimitiveKey(primitiveDef) {
    return primitiveDef.indices + ":" + this.createAttributesKey(primitiveDef.attributes) + ":" + primitiveDef.mode;
  }

  createAttributesKey(attributes) {
    let attributesKey = "";

    const keys = Object.keys(attributes).sort();

    for (let i = 0, il = keys.length; i < il; i++) {
      attributesKey += keys[i] + ":" + attributes[keys[i]] + ";";
    }

    return attributesKey;
  }
}

export { GLTFLoader };
