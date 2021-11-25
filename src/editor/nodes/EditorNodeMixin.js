import {
  StaticModes,
  computeStaticMode,
  computeAndSetStaticModes,
  isDynamic,
  isInherits,
  isStatic
} from "../StaticMode";
import { Color, Object3D } from "three";
import serializeColor from "../utils/serializeColor";
import LoadingCube from "../objects/LoadingCube";
import ErrorIcon from "../objects/ErrorIcon";
import traverseFilteredSubtrees from "../utils/traverseFilteredSubtrees";

function updateObjectArrayProperty(property, value) {
  if (value) {
    const compKeys = Object.keys(value);
    compKeys.forEach(compKey => {
      const enabledProps = new Set(property[compKey]);
      const propKeys = Object.keys(value[compKey]);
      propKeys.forEach(propKey => {
        if (value[compKey][propKey] === true) {
          enabledProps.add(propKey);
        } else {
          enabledProps.delete(propKey);
        }
      });
      property[compKey] = Array.from(enabledProps);
    });
  }
}

export default function EditorNodeMixin(Object3DClass) {
  return class extends Object3DClass {
    static nodeName = "Unknown Node";

    static disableTransform = false;

    static useMultiplePlacementMode = false;

    static ignoreRaycast = false;

    // Used for props like src that have side effects that we don't want to happen in the constructor
    static initialElementProps = {};

    static hideInElementsPanel = false;

    static optionalProperties = {};

    static canAddNode(_editor) {
      return true;
    }

    static async load() {
      return Promise.resolve();
    }

    static shouldDeserialize(entityJson) {
      return !!entityJson.components.find(c => c.name === this.componentName);
    }

    static async deserialize(editor, json) {
      const node = new this(editor);

      node.name = json.name;

      if (json.components) {
        const transformComponent = json.components.find(c => c.name === "transform");

        if (transformComponent) {
          const { position, rotation, scale } = transformComponent.props;
          node.position.set(position.x, position.y, position.z);
          node.rotation.set(rotation.x, rotation.y, rotation.z);
          node.scale.set(scale.x, scale.y, scale.z);
        }

        const visibleComponent = json.components.find(c => c.name === "visible");

        if (visibleComponent) {
          node._visible = visibleComponent.props.visible;
        }

        const editorSettingsComponent = json.components.find(c => c.name === "editor-settings");

        if (editorSettingsComponent) {
          node.enabled = editorSettingsComponent.props.enabled;
          node._modifiedProperties =
            editorSettingsComponent.props.modifiedProperties === undefined
              ? {}
              : JSON.parse(JSON.stringify(editorSettingsComponent.props.modifiedProperties));
          node._enabledProperties =
            editorSettingsComponent.props.enabledProperties === undefined
              ? {}
              : JSON.parse(JSON.stringify(editorSettingsComponent.props.enabledProperties));
        }
      }

      return node;
    }

    constructor(editor, ...args) {
      super(...args);

      this.editor = editor;
      this.nodeName = this.constructor.nodeName;
      this.name = this.constructor.nodeName;
      this.isNode = true;
      this.disableTransform = this.constructor.disableTransform;
      this.useMultiplePlacementMode = this.constructor.useMultiplePlacementMode;
      this.ignoreRaycast = this.constructor.ignoreRaycast;

      this.staticMode = StaticModes.Inherits;
      this.originalStaticMode = null;
      this.enabled = true;
      this._visible = true;
      this.saveParent = false;
      this.loadingCube = null;
      this.errorIcon = null;
      this.issues = [];
      this._modifiedProperties = {};
      this._enabledProperties = {};
    }

    clone(recursive) {
      return new this.constructor(this.editor).copy(this, recursive);
    }

    copy(source, recursive = true) {
      if (recursive) {
        this.remove(this.loadingCube);
        this.remove(this.errorIcon);
      }

      super.copy(source, recursive);

      if (recursive) {
        const loadingCubeIndex = source.children.findIndex(child => child === source.loadingCube);

        if (loadingCubeIndex !== -1) {
          this.loadingCube = this.children[loadingCubeIndex];
        }

        const errorIconIndex = source.children.findIndex(child => child === source.errorIcon);

        if (errorIconIndex !== -1) {
          this.errorIcon = this.children[errorIconIndex];
        }
      }

      this.issues = source.issues.slice();
      this._visible = source._visible;
      this.enabled = source.enabled;
      this._modifiedProperties =
        source._modifiedProperties === undefined ? {} : JSON.parse(JSON.stringify(source._modifiedProperties));
      this._enabledProperties =
        source._enabledProperties === undefined ? {} : JSON.parse(JSON.stringify(source._enabledProperties));

      return this;
    }

    get visible() {
      return this.enabled && this._visible;
    }

    set visible(value) {
      this._visible = value;
    }

    onPlay() {}

    onUpdate(dt) {
      if (this.loadingCube) {
        this.loadingCube.update(dt);
      }
    }

    onPause() {}

    onAdd() {}

    onChange() {}

    onRemove() {}

    onSelect() {}

    onDeselect() {}

    onRendererChanged() {}

    serialize(components) {
      const entityJson = {
        name: this.name,
        components: [
          {
            name: "transform",
            props: {
              position: {
                x: this.position.x,
                y: this.position.y,
                z: this.position.z
              },
              rotation: {
                x: this.rotation.x,
                y: this.rotation.y,
                z: this.rotation.z
              },
              scale: {
                x: this.scale.x,
                y: this.scale.y,
                z: this.scale.z
              }
            }
          },
          {
            name: "visible",
            props: {
              visible: this._visible
            }
          },
          {
            name: "editor-settings",
            props: {
              enabled: this.enabled,
              modifiedProperties:
                this._modifiedProperties === undefined ? {} : JSON.parse(JSON.stringify(this._modifiedProperties)),
              enabledProperties:
                this._enabledProperties === undefined ? {} : JSON.parse(JSON.stringify(this._enabledProperties))
            }
          }
        ]
      };

      if (components) {
        for (const componentName in components) {
          if (!Object.prototype.hasOwnProperty.call(components, componentName)) continue;

          const serializedProps = {};
          const componentProps = components[componentName];

          for (const propName in componentProps) {
            if (!Object.prototype.hasOwnProperty.call(componentProps, propName)) continue;

            const propValue = componentProps[propName];

            if (propValue instanceof Color) {
              serializedProps[propName] = serializeColor(propValue);
            } else {
              serializedProps[propName] = propValue;
            }
          }

          entityJson.components.push({
            name: componentName,
            props: serializedProps
          });
        }
      }

      return entityJson;
    }

    prepareForExport() {
      this.userData.MOZ_spoke_uuid = this.uuid;

      if (!this.visible) {
        this.addGLTFComponent("visible", {
          visible: this.visible
        });
      }
    }

    /**
     * Adds a GLTF component
     * @param {String} name The component name to be replaced
     * @param {Object} props The component properties to be set
     * @param {boolean} params Parameters object
     * @param {{THREE.Object3D} params.node The target Object3D element
     */
    addGLTFComponent(name, props) {
      if (!this.userData.gltfExtensions) {
        this.userData.gltfExtensions = {};
      }

      if (!this.userData.gltfExtensions.MOZ_hubs_components) {
        this.userData.gltfExtensions.MOZ_hubs_components = {};
      }

      if (props !== undefined && typeof props !== "object") {
        throw new Error("glTF component props must be an object or undefined");
      }

      const componentProps = {};

      for (const key in props) {
        if (!Object.prototype.hasOwnProperty.call(props, key)) continue;

        const value = props[key];

        if (value instanceof Color) {
          componentProps[key] = serializeColor(value);
        } else {
          componentProps[key] = value;
        }
      }

      this.userData.gltfExtensions.MOZ_hubs_components[name] = componentProps;
    }

    replaceObject(replacementObject) {
      replacementObject = replacementObject || new Object3D().copy(this, false);

      replacementObject.uuid = this.uuid;

      if (this.userData.gltfExtensions && this.userData.gltfExtensions.MOZ_hubs_components) {
        replacementObject.userData.gltfExtensions.MOZ_hubs_components = this.userData.gltfExtensions.MOZ_hubs_components;
      }

      for (const child of this.children) {
        if (child.isNode) {
          replacementObject.children.push(child);
          child.parent = replacementObject;
        }
      }

      this.parent.add(replacementObject);
      this.parent.remove(this);
    }

    gltfIndexForUUID(nodeUUID) {
      return { __gltfIndexForUUID: nodeUUID };
    }

    getObjectByUUID(uuid) {
      return this.getObjectByProperty("uuid", uuid);
    }

    computeStaticMode() {
      return computeStaticMode(this);
    }

    computeAndSetStaticModes() {
      return computeAndSetStaticModes(this);
    }

    computeAndSetVisible() {
      this.traverse(object => {
        if (object.parent && !object.parent.visible) {
          object.visible = false;
        }
      });
    }

    showLoadingCube() {
      if (!this.loadingCube) {
        this.loadingCube = new LoadingCube();
        this.add(this.loadingCube);
      }

      const worldScale = this.getWorldScale(this.loadingCube.scale);

      if (worldScale.x === 0 || worldScale.y === 0 || worldScale.z === 0) {
        this.loadingCube.scale.set(1, 1, 1);
      } else {
        this.loadingCube.scale.set(1 / worldScale.x, 1 / worldScale.y, 1 / worldScale.z);
      }
    }

    hideLoadingCube() {
      if (this.loadingCube) {
        this.remove(this.loadingCube);
        this.loadingCube = null;
      }
    }

    showErrorIcon() {
      if (!this.errorIcon) {
        this.errorIcon = new ErrorIcon();
        this.add(this.errorIcon);
      }

      const worldScale = this.getWorldScale(this.errorIcon.scale);

      if (worldScale.x === 0 || worldScale.y === 0 || worldScale.z === 0) {
        this.errorIcon.scale.set(1, 1, 1);
      } else {
        this.errorIcon.scale.set(1 / worldScale.x, 1 / worldScale.y, 1 / worldScale.z);
      }
    }

    hideErrorIcon() {
      if (this.errorIcon) {
        this.remove(this.errorIcon);
        this.errorIcon = null;
      }
    }

    isInherits() {
      return isInherits(this);
    }

    isStatic() {
      return isStatic(this);
    }

    isDynamic() {
      return isDynamic(this);
    }

    findNodeByType(nodeType, includeDisabled = true) {
      let node = null;

      traverseFilteredSubtrees(this, child => {
        if (node) {
          return false;
        }

        if (!child.isNode) {
          return;
        }

        if (!child.enabled && !includeDisabled) {
          return false;
        }

        if (child.constructor === nodeType) {
          node = child;
        }
      });

      return node;
    }

    getNodesByType(nodeType, includeDisabled = true) {
      const nodes = [];

      traverseFilteredSubtrees(this, child => {
        if (!child.isNode) {
          return;
        }

        if (!child.enabled && !includeDisabled) {
          return false;
        }

        if (child.constructor === nodeType) {
          nodes.push(this);
        }
      });

      return nodes;
    }

    // Used for calculating stats for the Performance Check Dialog
    getRuntimeResourcesForStats() {
      // return { textures: [], materials: [], meshes: [], lights: [] };
    }

    // Returns the node's attribution information by default just the name
    // This should be overriding by nodes that can provide a more specific info (ie. models based on GLTF)
    getAttribution() {
      return {
        title: this.name.replace(/\.[^/.]+$/, "")
      };
    }

    // Updates attribution information. The meta information from the API is consider the most authoritative source
    // That info then would be updated with node's source information if exists.
    updateAttribution() {
      const attribution = this.getAttribution();
      this.attribution = this.attribution || {};
      if (this.meta) {
        Object.assign(
          this.attribution,
          this.meta.author ? { author: this.meta.author ? this.meta.author.replace(/ \(http.+\)/, "") : "" } : null,
          this.meta.name ? { title: this.meta.name } : this.name ? { title: this.name.replace(/\.[^/.]+$/, "") } : null,
          this.meta.author && this.meta.name && this._canonicalUrl ? { url: this._canonicalUrl } : null
        );
      }
      // Replace the attribute keys only if they don't exist otherwise
      // we give preference to the info coming from the API source over the GLTF asset
      Object.keys(this.attribution).forEach(key => {
        if (!this.attribution[key] || this.attribution[key] == null) {
          this.attribution[key] = attribution[key];
        }
      });
      // If the GLTF attribution info has keys that are missing form the API source, we add them
      for (const key in attribution) {
        if (!Object.prototype.hasOwnProperty.call(this.attribution, key)) {
          if (key === "author") {
            this.attribution[key] = attribution[key] ? attribution[key].replace(/ \(http.+\)/, "") : "";
          } else {
            this.attribution[key] = attribution[key];
          }
        }
      }
    }

    enabledPropertyExportValue(componentName, propName) {
      if (this._enabledProperties[componentName]) {
        return this._enabledProperties[componentName].includes(propName) ? this[propName] : undefined;
      }
      return undefined;
    }

    modifiedPropertyExportValue(componentName, propName) {
      if (this._modifiedProperties[componentName]) {
        return this._modifiedProperties[componentName].includes(propName) ? this[propName] : undefined;
      }
      return undefined;
    }

    exportPropertyValue(componentName, propName) {
      if (this.constructor.optionalProperties[componentName]) {
        if (this.constructor.optionalProperties[componentName].includes(propName)) {
          return this.enabledPropertyExportValue(componentName, propName);
        } else {
          return this.modifiedPropertyExportValue(componentName, propName);
        }
      } else {
        return this.modifiedPropertyExportValue(componentName, propName);
      }
    }

    set modifiedProperties(object) {
      updateObjectArrayProperty(this._modifiedProperties, object);
    }

    get modifiedProperties() {
      return this._modifiedProperties;
    }

    set enabledProperties(object) {
      updateObjectArrayProperty(this._enabledProperties, object);
    }

    get enabledProperties() {
      return this._enabledProperties;
    }
  };
}
