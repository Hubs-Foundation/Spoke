import THREE from "../../vendor/three";
import EditorNodeMixin from "./EditorNodeMixin";
import { setStaticMode, StaticModes, isStatic } from "../StaticMode";
import sortEntities from "../utils/sortEntities";
import getNodeWithName from "../utils/getNodeWithName";
import MeshCombinationGroup from "../MeshCombinationGroup";
import GroupNode from "./GroupNode";

export default class SceneNode extends EditorNodeMixin(THREE.Scene) {
  static nodeName = "Scene";

  static hideTransform = true;

  static async deserialize(editor, json) {
    const scene = new SceneNode(editor);

    // Needed so that editor.scene is set correctly when used in nodes deserialize methods.
    editor.scene = scene;

    const { root, metadata, entities } = json;

    scene.name = root;
    scene.metadata = metadata;

    const sortedEntities = sortEntities(entities);

    for (const entityName of sortedEntities) {
      const entity = entities[entityName];

      let EntityNodeConstructor;

      for (const NodeConstructor of editor.nodeTypes) {
        if (NodeConstructor.shouldDeserialize(entity)) {
          EntityNodeConstructor = NodeConstructor;
          break;
        }
      }

      if (!EntityNodeConstructor) {
        throw new Error(`No node constructor found for entity "${entityName}"`);
      }

      const parent = getNodeWithName(scene, entity.parent);

      if (!parent) {
        throw new Error(`Node "${entityName}" specifies parent "${entity.parent}", but was not found.`);
      }

      const node = await EntityNodeConstructor.deserialize(editor, entity);
      node.name = entityName;
      node.onChange();

      parent.children.splice(entity.index, 0, node);
      node.parent = parent;
    }

    return scene;
  }

  constructor(editor) {
    super(editor);
    this.url = null;
    this.metadata = {};
    this._environmentMap = null;
    setStaticMode(this, StaticModes.Static);
  }

  get environmentMap() {
    return this._environmentMap;
  }

  updateEnvironmentMap(environmentMap) {
    this._environmentMap = environmentMap;

    this.traverse(object => {
      if (object.material && object.material.isMeshStandardMaterial) {
        object.material.envMap = environmentMap;
        object.material.needsUpdate = true;
      }
    });
  }

  copy(source, recursive) {
    super.copy(source, recursive);

    this.url = source.url;
    this.metadata = source.metadata;
    this._environmentMap = source._environmentMap;

    return this;
  }

  serialize(sceneUri) {
    const sceneJson = {
      root: this.name,
      metadata: this.metadata,
      entities: {}
    };

    this.traverse(child => {
      if (!child.isNode || child === this) {
        return;
      }

      const entityJson = child.serialize(sceneUri);
      entityJson.parent = child.parent.name;

      let index = 0;

      for (const sibling of child.parent.children) {
        if (sibling === child) {
          break;
        } else if (sibling.isNode) {
          index++;
        }
      }

      entityJson.index = index;
      sceneJson.entities[child.name] = entityJson;
    });

    return sceneJson;
  }

  prepareForExport() {
    this.children = this.children.filter(c => c.isNode);

    const nodeList = [];

    this.traverse(child => {
      if (child.isNode && child !== this) {
        nodeList.push(child);
      }
    });

    for (const node of nodeList) {
      node.prepareForExport();
    }
  }

  async combineMeshes() {
    await MeshCombinationGroup.combineMeshes(this);
  }

  removeUnusedObjects() {
    this.computeAndSetStaticModes();

    function hasExtrasOrExtensions(object) {
      const userData = object.userData;
      for (const key in userData) {
        if (userData.hasOwnProperty(key)) {
          return true;
        }
      }
      return false;
    }

    function _removeUnusedObjects(object) {
      let canBeRemoved = !!object.parent;

      for (const child of object.children.slice(0)) {
        if (!_removeUnusedObjects(child)) {
          canBeRemoved = false;
        }
      }

      const shouldRemove =
        canBeRemoved &&
        (object.constructor === THREE.Object3D ||
          object.constructor === THREE.Scene ||
          object.constructor === THREE.Group ||
          object.constructor === GroupNode) &&
        object.children.length === 0 &&
        isStatic(object) &&
        !hasExtrasOrExtensions(object);

      if (canBeRemoved && shouldRemove) {
        object.parent.remove(object);
        return true;
      }
      return false;
    }

    _removeUnusedObjects(this);
  }

  getAnimationClips() {
    const animations = [];

    this.traverse(child => {
      if (child.isNode && child.type === "Model") {
        const activeClip = child.activeClip;

        if (activeClip) {
          animations.push(activeClip);
        }
      }
    });

    return animations;
  }
}
