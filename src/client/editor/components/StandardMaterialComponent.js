import SaveableComponent from "./SaveableComponent";
import { types, getFilePath } from "./utils";
import THREE from "../../vendor/three";
import envMapURL from "../../assets/envmap.jpg";

const imageFilters = [".jpg", ".png"];
const textureLoader = new THREE.TextureLoader();
const envMap = new THREE.TextureLoader().load(envMapURL);
envMap.mapping = THREE.EquirectangularReflectionMapping;
envMap.magFilter = THREE.LinearFilter;
envMap.minFilter = THREE.LinearMipMapLinearFilter;
export default class StandardMaterialComponent extends SaveableComponent {
  static componentName = "standard-material";

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

  _updateTexture(map, url, sRGB) {
    if (!url) {
      this._object[map] = null;
      return;
    }

    const currentMap = this._object[map];
    const currentUrl = currentMap && getFilePath(currentMap.image);
    if (url === currentUrl) return;

    try {
      const texture = textureLoader.load(url, () => {}, null, () => {
        this._object[map] = null;
        this._object.needsUpdate = true;
      });
      if (sRGB) {
        texture.encoding = THREE.sRGBEncoding;
      }
      // Defaults in glTF spec
      texture.flipY = false;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      this._object[map] = texture;
    } catch (e) {
      // TODO Should show warning on texture property when this happens.
    }
  }

  updateProperty(propertyName, value) {
    super.updateProperty(propertyName, value);
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
        this._updateTexture("map", value, true);
        break;
      case "normalTexture":
        this._updateTexture("normalMap", value);
        break;
      case "metallicRoughnessTexture":
        this._updateTexture("roughnessMap", value);
        this._updateTexture("metalnessMap", value);
        break;
      case "emissiveTexture":
        this._updateTexture("emissiveMap", value, true);
        break;
      case "occlusionTexture":
        this._updateTexture("aoMap", value);
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
      baseColorTexture: (map && getFilePath(map.image)) || "",
      normalTexture: (normalMap && getFilePath(normalMap.image)) || "",
      metallicRoughnessTexture: (roughnessMap && getFilePath(roughnessMap.image)) || "",
      emissiveTexture: (emissiveMap && getFilePath(emissiveMap.image)) || "",
      occlusionTexture: (aoMap && getFilePath(aoMap.image)) || ""
    };
  }

  static inflate(node, _props) {
    const component = this._getOrCreateComponent(node, _props, node.material || null);
    if (node.material) {
      node.material.envMap = envMap;
      node.material.needsUpdate = true;
    }
    return component;
  }
}
