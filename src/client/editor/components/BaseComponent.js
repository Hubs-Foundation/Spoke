import { getDefaultsFromSchema } from "./utils";

export default class BaseComponent {
  static canAdd = true;

  static canRemove = true;

  constructor(node, object) {
    this.name = this.constructor.componentName;
    this.schema = this.constructor.schema;
    this.props = {};
    this.shouldSave = false;
    Object.defineProperty(this, "_object", { enumerable: false, value: object === undefined ? node : object });
  }

  getProperty(propertyName) {
    return this.props[propertyName];
  }

  updateProperty(propertyName, value) {
    this.props[propertyName] = value;
  }

  updateResourceValidation(target, value) {
    const resourcesValidation = !this._object.resourcesValidation ? {} : this._object.resourcesValidation;
    resourcesValidation[target] = value;
    //this.updateProperty("_resourcesValidation", resourcesValidation);
    this._object.resourcesValidation = resourcesValidation;
  }

  static getComponent(node) {
    if (!node.userData._components) return null;

    return node.userData._components.find(component => component.name === this.componentName);
  }

  static _propsFromObject() {
    return {};
  }

  static _getOrCreateComponent(node, props, object) {
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

    for (const key in props) {
      if (props.hasOwnProperty(key)) {
        component.updateProperty(key, props[key]);
      }
    }

    return component;
  }

  static inflate(node, props) {
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
