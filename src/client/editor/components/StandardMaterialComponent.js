import SaveableComponent from "./SaveableComponent";
import { types, getFilePath } from "./utils";
import THREE from "../../vendor/three";
import envMapURL from "../../assets/envmap.jpg";
import { getSrcObject } from "../../utils";

const imageFilters = [".jpg", ".png"];
const textureLoader = new THREE.TextureLoader();
const envMap = new THREE.TextureLoader().load(envMapURL);
envMap.mapping = THREE.EquirectangularReflectionMapping;
envMap.magFilter = THREE.LinearFilter;
envMap.minFilter = THREE.LinearMipMapLinearFilter;
const defaultSrc = { path: "", isValid: true };
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
    { name: "baseColorTexture", type: types.file, default: defaultSrc, filters: imageFilters },
    { name: "normalTexture", type: types.file, default: defaultSrc, filters: imageFilters },
    { name: "metallicRoughnessTexture", type: types.file, default: defaultSrc, filters: imageFilters },
    { name: "emissiveTexture", type: types.file, default: defaultSrc, filters: imageFilters },
    { name: "occlusionTexture", type: types.file, default: defaultSrc, filters: imageFilters }
    // TODO alphaMode
  ];

  constructor(node, object) {
    super(node, object, ".material");
  }

  _updateTexture(propertyName, map, url, sRGB) {
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
        // TODO: the right place to handle error texture loading
        this.updateProperty(propertyName, { path: url, isValid: false });
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
      // TODO Should show warning on texture property when this happens
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
        this._updateTexture(propertyName, "map", value, true);
        break;
      case "normalTexture":
        this._updateTexture(propertyName, "normalMap", value);
        break;
      case "metallicRoughnessTexture":
        this._updateTexture(propertyName, "roughnessMap", value);
        this._updateTexture(propertyName, "metalnessMap", value);
        break;
      case "emissiveTexture":
        this._updateTexture(propertyName, "emissiveMap", value, true);
        break;
      case "occlusionTexture":
        this._updateTexture(propertyName, "aoMap", value);
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
      baseColorTexture: this._setSrcObject(map, true),
      normalTexture: this._setSrcObject(normalMap, true),
      metallicRoughnessTexture: this._setSrcObject(roughnessMap, true),
      emissiveTexture: this._setSrcObject(emissiveMap, true),
      occlusionTexture: this._setSrcObject(aoMap, true)
    };
  }

  static _setSrcObject(map, valid) {
    return {
      path: map ? getFilePath(map.image) : "",
      isValid: valid
    };
  }

  static inflate(node, _props) {
    const component = this._getOrCreateComponent(node, _props, node.material || null);
    component.props.baseColorTexture = getSrcObject(component.props.baseColorTexture);
    component.props.normalTexture = getSrcObject(component.props.normalTexture);
    component.props.metallicRoughnessTexture = getSrcObject(component.props.metallicRoughnessTexture);
    component.props.emissiveTexture = getSrcObject(component.props.emissiveTexture);
    component.props.occlusionTexture = getSrcObject(component.props.occlusionTexture);
    if (node.material) {
      node.material.envMap = envMap;
      node.material.needsUpdate = true;
    }
    return component;
  }
}
