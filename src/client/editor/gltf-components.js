import THREE from "../vendor/three";

const { DEG2RAD } = THREE.Math;

export const types = {
  color: Symbol("color"),
  number: Symbol("number"),
  boolean: Symbol("boolean"),
  file: Symbol("file")
};

export function getDisplayName(name) {
  if (name.includes("-")) {
    return name
      .split("-")
      .map(([f, ...rest]) => f.toUpperCase() + rest.join(""))
      .join(" ");
  } else {
    const displayName = name.replace(/[A-Z]/g, " $&");
    return displayName[0].toUpperCase() + displayName.substr(1);
  }
}

function getFilePath(image) {
  const fullPath = image.src.substr(image.baseURI.length);
  // TODO Shouldn't have to hardcode api path here.
  return fullPath.replace("api/files/", "");
}

function getDefaultsFromSchema(schema) {
  const defaults = {};
  schema.forEach(prop => {
    defaults[prop.name] = prop.default;
  });
  return defaults;
}

class BaseComponent {
  constructor() {
    this.name = this.constructor.componentName;
    this.schema = this.constructor.schema;
    this.props = {};
    this.shouldSave = false;
  }

  getProperty(propertyName) {
    return this.props[propertyName];
  }

  _updateComponentProperty(propertyName, value) {
    this.props[propertyName] = value;
  }

  updateProperty(propertyName, value) {
    this._updateComponentProperty(propertyName, value);
  }

  static getComponent(node) {
    if (!node.userData._gltfComponents) return null;
    return node.userData._gltfComponents.find(component => component.name === this.componentName);
  }

  static _propsFromObject() {
    return {};
  }

  static _getOrCreateComponent(node, props) {
    if (!props) {
      props = { ...getDefaultsFromSchema(this.schema), ...this._propsFromObject(node) };
    }
    if (!node.userData._gltfComponents) {
      node.userData._gltfComponents = [];
    }

    let component = this.getComponent(node);
    if (!component || !(component instanceof this)) {
      component = new this();
      node.userData._gltfComponents.push(component);
    }

    for (const key in props) {
      if (props.hasOwnProperty(key)) {
        component.props[key] = props[key];
      }
    }

    return { component, props };
  }

  static inflate(node, props) {
    return this._getOrCreateComponent(node, props).component;
  }

  static deflate(node) {
    const components = node.userData._gltfComponents;
    const componentIndex = components.findIndex(component => component.name === this.componentName);
    const component = components[componentIndex];
    if (component._object) {
      component._object.parent.remove(component._object);
    }
    components.splice(componentIndex, 1);
  }
}

const lightSchema = [
  { name: "color", type: types.color, default: "white" },
  { name: "intensity", type: types.number, default: 1 }
];

class DirectionalLightComponent extends BaseComponent {
  static componentName = "directional-light";

  static schema = [
    ...lightSchema,
    { name: "castShadow", type: types.boolean, default: true },
    { name: "elevation", type: types.number, default: 63 },
    { name: "azimuth", type: types.number, default: 245 }
  ];

  static _tempEuler = new THREE.Euler(0, 0, 0, "YXZ");

  _updateComponentProperty(propertyName, value) {
    super._updateComponentProperty(propertyName, value);
    const { _tempEuler } = DirectionalLightComponent;
    switch (propertyName) {
      case "color":
        this._object.color.set(value);
        break;
      case "elevation":
      case "azimuth":
        _tempEuler.set(this.props.elevation * DEG2RAD, -this.props.azimuth * DEG2RAD, 0);
        this._object.position.set(0, 0, -100);
        this._object.position.applyEuler(_tempEuler);
        break;
      default:
        this._object[propertyName] = value;
    }
  }

  static inflate(node, _props) {
    const { component, props } = this._getOrCreateComponent(node, _props);
    const light = new THREE.DirectionalLight(props.color, props.intensity);
    Object.defineProperty(component, "_object", { enumerable: false, value: light });
    component._updateComponentProperty("azimuth", props.azimuth);
    component._updateComponentProperty("elevation", props.elevation);
    component._updateComponentProperty("castShadow", props.castShadow);
    light.userData._dontShowInHierarchy = true;
    light.userData._inflated = true;
    node.add(light);
    return component;
  }
}

class PointLightComponent extends BaseComponent {
  static componentName = "point-light";

  static schema = [...lightSchema, { name: "castShadow", type: types.boolean, default: true }];

  _updateComponentProperty(propertyName, value) {
    super._updateComponentProperty(propertyName, value);
    switch (propertyName) {
      case "color":
        this._object.color.set(value);
        break;
      default:
        this._object[propertyName] = value;
    }
  }

  static inflate(node, _props) {
    const { component, props } = this._getOrCreateComponent(node, _props);
    const light = new THREE.PointLight(props.color, props.intensity);
    Object.defineProperty(component, "_object", { enumerable: false, value: light });
    component._updateComponentProperty("castShadow", props.castShadow);
    light.userData._dontShowInHierarchy = true;
    light.userData._inflated = true;
    node.add(light);
    return component;
  }
}

class AmbientLightComponent extends BaseComponent {
  static componentName = "ambient-light";

  static schema = [...lightSchema];

  _updateComponentProperty(propertyName, value) {
    super._updateComponentProperty(propertyName, value);
    switch (propertyName) {
      case "color":
        this._object.color.set(value);
        break;
      default:
        this._object[propertyName] = value;
    }
  }

  static inflate(node, _props) {
    const { component, props } = this._getOrCreateComponent(node, _props);
    const light = new THREE.AmbientLight(props.color, props.intensity);
    Object.defineProperty(component, "_object", { enumerable: false, value: light });
    light.userData._dontShowInHierarchy = true;
    light.userData._inflated = true;
    node.add(light);
    return component;
  }
}

class ShadowComponent extends BaseComponent {
  static componentName = "shadow";

  static schema = [
    { name: "castShadow", type: types.boolean, default: true },
    { name: "receiveShadow", type: types.boolean, default: true }
  ];

  _updateComponentProperty(propertyName, value) {
    super._updateComponentProperty(propertyName, value);
    this._object.traverse(obj => {
      if (obj instanceof THREE.Mesh) {
        obj[propertyName] = value;
        obj.material.needsUpdate = true;
      }
    });
  }

  static inflate(node, _props) {
    const { component, props } = this._getOrCreateComponent(node, _props);
    Object.defineProperty(component, "_object", { enumerable: false, value: node });
    component._updateComponentProperty("castShadow", props.castShadow);
    component._updateComponentProperty("receiveShadow", props.receiveShadow);
    return component;
  }
}

class StandardMaterialComponent extends BaseComponent {
  static componentName = "standard-material";

  static schema = [
    { name: "color", type: types.color, default: "white" },
    { name: "emissiveFactor", type: types.color, default: "white" },
    { name: "metallic", type: types.number, default: 1 },
    { name: "roughness", type: types.number, default: 1 },
    { name: "alphaCutoff", type: types.number, default: 0.5 },
    { name: "doubleSided", type: types.boolean, default: false },
    { name: "baseColorTexture", type: types.file, default: "" },
    { name: "normalTexture", type: types.file, default: "" },
    { name: "metallicRoughnessTexture", type: types.file, default: "" },
    { name: "emissiveTexture", type: types.file, default: "" },
    { name: "occlusionTexture", type: types.file, default: "" }
    // TODO alphaMode
  ];

  _updateComponentProperty(propertyName, value) {
    super._updateComponentProperty(propertyName, value);
    switch (propertyName) {
      case "color":
        this._object.color.set(value);
        break;
      case "emissiveFactor":
        this._object.emissive.set(value);
        break;
      case "metallic":
        this._object.metalness = value;
        this._object.needsUpdate = true;
        break;
      case "alphaCutoff":
        this._object.alphaTest = value;
        this._object.needsUpdate = true;
        break;
      case "doubleSided":
        this._object.side = value ? THREE.DoubleSide : THREE.FrontSide;
        break;
      default:
        this._object[propertyName] = value;
    }
  }

  static _propsFromObject(node) {
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
    const { component } = this._getOrCreateComponent(node, _props);
    Object.defineProperty(component, "_object", { enumerable: false, value: node.material });
    return component;
  }
}

class SceneRefComponent extends BaseComponent {
  static componentName = "scene-ref";

  static schema = [{ name: "src", type: types.file, default: "" }];
}

export function registerGLTFComponents(editor) {
  [
    DirectionalLightComponent,
    PointLightComponent,
    AmbientLightComponent,
    StandardMaterialComponent,
    ShadowComponent,
    SceneRefComponent
  ].forEach(editor.registerGLTFComponent.bind(editor));
}
