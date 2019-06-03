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

export default function EditorNodeMixin(Object3DClass) {
  return class extends Object3DClass {
    static nodeName = "Unknown Node";

    static disableTransform = false;

    static ignoreRaycast = false;

    // Used for props like src that have side effects that we don't want to happen in the constructor
    static initialElementProps = {};

    static canAddNode(_editor) {
      return true;
    }

    static async load() {
      return Promise.resolve();
    }

    static shouldDeserialize(entityJson) {
      return !!entityJson.components.find(c => c.name === this.legacyComponentName);
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
          node.visible = visibleComponent.props.visible;
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
      this.isCollapsed = false;
      this.disableTransform = this.constructor.disableTransform;
      this.ignoreRaycast = this.constructor.ignoreRaycast;

      this.staticMode = StaticModes.Inherits;
      this.originalStaticMode = null;
      this.saveParent = false;
      this.loadingCube = null;
    }

    clone(recursive) {
      return new this.constructor(this.editor).copy(this, recursive);
    }

    copy(source, recursive) {
      if (recursive) {
        this.remove(this.loadingCube);
      }

      super.copy(source, recursive);

      if (recursive) {
        const loadingCubeIndex = source.children.findIndex(child => child === source.loadingCube);

        if (loadingCubeIndex !== -1) {
          this.loadingCube = this.children[loadingCubeIndex];
        }
      }

      return this;
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
              visible: this.visible
            }
          }
        ]
      };

      if (components) {
        for (const componentName in components) {
          const serializedProps = {};
          const componentProps = components[componentName];

          for (const propName in componentProps) {
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
        const value = props[key];

        if (value instanceof Color) {
          componentProps[key] = serializeColor(value);
        } else {
          componentProps[key] = value;
        }
      }

      this.userData.gltfExtensions.MOZ_hubs_components[name] = props;
    }

    replaceObject(replacementObject) {
      replacementObject = replacementObject || new Object3D().copy(this, false);

      replacementObject.uuid = this.uuid;

      if (this.userData.gltfExtensions && this.userData.gltfExtensions.MOZ_hubs_components) {
        replacementObject.userData.gltfExtensions.MOZ_hubs_components = this.userData.gltfExtensions.MOZ_hubs_components;
      }

      this.parent.add(replacementObject);
      this.parent.remove(this);
    }

    gltfIndexForUUID(nodeUUID) {
      return { __gltfIndexForUUID: nodeUUID };
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
    }

    hideLoadingCube() {
      if (this.loadingCube) {
        this.remove(this.loadingCube);
        this.loadingCube = null;
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

    findNodeByType(nodeType) {
      if (this.constructor === nodeType) {
        return this;
      }

      for (const child of this.children) {
        if (child.isNode) {
          const result = child.findNodeByType(nodeType);

          if (result) {
            return result;
          }
        }
      }

      return null;
    }

    getNodesByType(nodeType) {
      const nodes = [];

      if (this.constructor === nodeType) {
        nodes.push(this);
      }

      for (const child of this.children) {
        if (child.isNode) {
          const results = child.getNodesByType(nodeType);

          for (const result of results) {
            nodes.push(result);
          }
        }
      }

      return nodes;
    }
  };
}
