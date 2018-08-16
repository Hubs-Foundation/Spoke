import SaveableComponent from "./SaveableComponent";
import { types } from "./utils";
import THREE from "../three";
import { textureCache } from "../caches";

function getTextureSrc(texture) {
  if (!texture) return null;
  if (!texture.image) return null;
  return new URL(texture.image.src, window.location).href;
}

const imageFilters = [".jpg", ".png"];

import cubeMapPosX from "../../assets/cubemap/posx.jpg";
import cubeMapNegX from "../../assets/cubemap/negx.jpg";
import cubeMapPosY from "../../assets/cubemap/posy.jpg";
import cubeMapNegY from "../../assets/cubemap/negx.jpg";
import cubeMapPosZ from "../../assets/cubemap/posz.jpg";
import cubeMapNegZ from "../../assets/cubemap/negz.jpg";

async function loadEnvMap() {
  const urls = [cubeMapPosX, cubeMapNegX, cubeMapPosY, cubeMapNegY, cubeMapPosZ, cubeMapNegZ];
  const texture = await new THREE.CubeTextureLoader().load(urls);
  texture.format = THREE.RGBFormat;
  return texture;
}

let cachedEnvMap = null;

export default class StandardMaterialComponent extends SaveableComponent {
  static componentName = "standard-material";

  static canAdd = false;

  static canRemove = false;

  static dontExportProps = true;

  static schema = [
    { name: "color", type: types.color, default: "white" },
    { name: "emissiveFactor", type: types.color, default: "black" },
    { name: "metallic", type: types.number, default: 1, min: 0, max: 1 },
    { name: "roughness", type: types.number, default: 1, min: 0, max: 1 },
    { name: "alphaCutoff", type: types.number, default: 0.5, min: 0, max: 1 },
    { name: "doubleSided", type: types.boolean, default: false },
    { name: "baseColorTexture", type: types.file, default: null, filters: imageFilters },
    { name: "normalTexture", type: types.file, default: null, filters: imageFilters },
    { name: "metallicRoughnessTexture", type: types.file, default: null, filters: imageFilters },
    { name: "emissiveTexture", type: types.file, default: null, filters: imageFilters },
    { name: "occlusionTexture", type: types.file, default: null, filters: imageFilters }
    // TODO alphaMode
  ];

  constructor(node, object) {
    super(node, object, ".material");
  }

  async _updateTexture(propertyName, map, url, sRGB) {
    if (!url) {
      this._object[map] = null;
      return;
    }

    try {
      const texture = await textureCache.get(url);
      if (sRGB) {
        texture.encoding = THREE.sRGBEncoding;
      }
      // Defaults in glTF spec
      texture.flipY = false;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      this._object[map] = texture;
    } catch (e) {
      console.error(e);
      this._object[map] = null;
      this._object.needsUpdate = true;
      this.propValidation[propertyName] = false;
    }
  }

  async updateProperty(propertyName, value) {
    await super.updateProperty(propertyName, value);
    if (!this._object) return;
    switch (propertyName) {
      case "color":
        this._object.color.set(value);
        break;
      case "emissiveFactor":
        this._object.emissive.set(value);
        break;
      case "metallic":
        this._object.metalness = value;
        break;
      case "alphaCutoff":
        this._object.alphaTest = value;
        break;
      case "doubleSided":
        this._object.side = value ? THREE.DoubleSide : THREE.FrontSide;
        break;
      case "baseColorTexture":
        await this._updateTexture(propertyName, "map", value, true);
        break;
      case "normalTexture":
        await this._updateTexture(propertyName, "normalMap", value);
        break;
      case "metallicRoughnessTexture":
        await this._updateTexture(propertyName, "roughnessMap", value);
        await this._updateTexture(propertyName, "metalnessMap", value);
        break;
      case "emissiveTexture":
        await this._updateTexture(propertyName, "emissiveMap", value, true);
        break;
      case "occlusionTexture":
        await this._updateTexture(propertyName, "aoMap", value);
        break;
      default:
        this._object[propertyName] = value;
    }
    this._object.needsUpdate = true;
  }

  static _propsFromObject(node) {
    if (!node.material) return null;
    const { map, normalMap, emissiveMap, roughnessMap, aoMap } = node.material;
    return {
      color: node.material.color.getStyle(),
      emissiveFactor: node.material.emissive.getStyle(),
      metallic: node.material.metalness,
      roughness: node.material.roughness,
      alphaCutoff: node.material.alphaTest,
      doubleSided: node.material.side === THREE.DoubleSide,
      baseColorTexture: getTextureSrc(map),
      normalTexture: getTextureSrc(normalMap),
      metallicRoughnessTexture: getTextureSrc(roughnessMap),
      emissiveTexture: getTextureSrc(emissiveMap),
      occlusionTexture: getTextureSrc(aoMap)
    };
  }

  static async inflate(node, _props) {
    const component = await this._getOrCreateComponent(node, _props, node.material || null);
    if (node.material) {
      if (!cachedEnvMap) {
        cachedEnvMap = loadEnvMap();
      }

      node.material.envMap = await cachedEnvMap;
      node.material.needsUpdate = true;
    }
    return component;
  }
}
