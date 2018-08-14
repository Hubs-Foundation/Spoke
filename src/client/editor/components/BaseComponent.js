import THREE from "../three";
import { types } from "./utils";
import { absoluteToRelativeURL } from "../utils/absoluteToRelativeURL";

export function getDefaultsFromSchema(schema) {
  const defaults = {};
  schema.forEach(prop => {
    defaults[prop.name] = prop.default;
  });
  return defaults;
}

export default class BaseComponent {
  static canAdd = true;

  static canRemove = true;

  constructor(node, object) {
    this.name = this.constructor.componentName;
    this.schema = this.constructor.schema;
    this.props = {};
    this.propValidation = {};
    this.shouldSave = false;
    Object.defineProperty(this, "_object", { enumerable: false, value: object === undefined ? node : object });
  }

  getProperty(propertyName) {
    return this.props[propertyName];
  }

  // updateProperty is intentionally async here since subclasses may want to await.
  async updateProperty(propertyName, value) {
    this.props[propertyName] = value;
  }

  serialize(basePath) {
    const clonedProps = Object.assign({}, this.props);

    for (const { name, type } of this.schema) {
      if (type === types.file) {
        clonedProps[name] = absoluteToRelativeURL(basePath, clonedProps[name]);
      }
    }

    return clonedProps;
  }

  static getComponent(node) {
    if (!node.userData._components) return null;

    return node.userData._components.find(component => component.name === this.componentName);
  }

  static _propsFromObject() {
    return {};
  }

  static async _getOrCreateComponent(node, props, object) {
    props = { ...getDefaultsFromSchema(this.schema), ...this._propsFromObject(node), ...props };
    if (!node.userData._components) {
      node.userData._components = [];
    }

    let component = this.getComponent(node);
    if (!component || !(component instanceof this)) {
      component = new this(node, object);
      node.userData._components.push(component);
    }

    if (object && object instanceof THREE.Object3D) {
      object.userData._dontShowInHierarchy = true;
      object.userData._inflated = true;
      object.userData._dontExport = true;
    }

    const propertyUpdatePromises = [];
    for (const key in props) {
      if (props.hasOwnProperty(key)) {
        propertyUpdatePromises.push(component.updateProperty(key, props[key]));
      }
    }
    await Promise.all(propertyUpdatePromises);

    return component;
  }

  // inflate is intentionally async here since subclasses may want to await.
  static async inflate(node, props) {
    return this._getOrCreateComponent(node, props);
  }

  static deflate(node) {
    const components = node.userData._components;
    const componentIndex = components.findIndex(component => component.name === this.componentName);
    const component = components[componentIndex];
    if (component._object) {
      component._object.parent.remove(component._object);
    }
    components.splice(componentIndex, 1);
  }
}
