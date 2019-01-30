import THREE from "../../vendor/three";
import EditorNodeMixin from "./EditorNodeMixin";
import { setStaticMode, StaticModes, isStatic } from "../StaticMode";
import sortEntities from "../utils/sortEntities";
import MeshCombinationGroup from "../MeshCombinationGroup";
import GroupNode from "./GroupNode";
import getNodeWithUUID from "../utils/getNodeWithUUID";

// Migrate v1 spoke scene to v2
function migrateV1ToV2(json) {
  const { root, metadata, entities } = json;

  // Generate UUIDs for all existing entity names.
  const rootUUID = THREE.Math.generateUUID();
  const nameToUUID = { [root]: rootUUID };
  for (const name in entities) {
    nameToUUID[name] = THREE.Math.generateUUID();
  }

  // Replace names with uuids in entities and add the name property.
  const newEntities = { [rootUUID]: { name: root } };
  for (const [name, entity] of Object.entries(entities)) {
    const uuid = nameToUUID[name];
    newEntities[uuid] = Object.assign({}, entity, {
      name,
      parent: nameToUUID[entity.parent]
    });
  }

  return {
    version: 2,
    root: nameToUUID[root],
    entities: newEntities,
    metadata
  };
}

function migrateV2ToV3(json) {
  json.version = 3;

  for (const entityId in json.entities) {
    const entity = json.entities[entityId];

    if (!entity.components) {
      continue;
    }

    entity.components.push({
      name: "visible",
      props: {
        value: true
      }
    });

    const modelComponent = entity.components.find(c => c.name === "gltf-model");

    if (modelComponent && modelComponent.props.includeInFloorPlan) {
      entity.components.push({
        name: "collidable",
        props: {}
      });

      entity.components.push({
        name: "walkable",
        props: {}
      });
    }

    const groundPlaneComponent = entity.components.find(c => c.name === "ground-plane");

    if (groundPlaneComponent) {
      entity.components.push({
        name: "walkable",
        props: {}
      });
    }
  }

  return json;
}

export default class SceneNode extends EditorNodeMixin(THREE.Scene) {
  static nodeName = "Scene";

  static hideTransform = true;

  static async loadScene(editor, json) {
    if (!json.version) {
      json = migrateV1ToV2(json);
    }

    if (json.version === 2) {
      json = migrateV2ToV3(json);
    }

    const { root, metadata, entities } = json;

    let scene = null;

    const sortedEntities = sortEntities(entities);

    for (const entityId of sortedEntities) {
      const entity = entities[entityId];

      let EntityNodeConstructor;

      for (const NodeConstructor of editor.nodeTypes) {
        if (NodeConstructor.shouldDeserialize(entity)) {
          EntityNodeConstructor = NodeConstructor;
          break;
        }
      }

      if (!EntityNodeConstructor) {
        throw new Error(`No node constructor found for entity "${entity.name}"`);
      }

      const node = await EntityNodeConstructor.deserialize(editor, entity);
      node.uuid = entityId;

      if (entity.parent) {
        const parent = getNodeWithUUID(scene, entity.parent);

        if (!parent) {
          throw new Error(
            `Node "${entity.name}" with uuid "${entity.uuid}" specifies parent "${entity.parent}", but was not found.`
          );
        }

        parent.children.splice(entity.index, 0, node);
        node.parent = parent;
      } else if (entityId === root) {
        scene = node;
        scene.metadata = metadata;
        // Needed so that editor.scene is set correctly when used in nodes deserialize methods.
        editor.scene = scene;
      } else {
        throw new Error(`Node "${entity.name}" with uuid "${entity.uuid}" does not specify a parent.`);
      }

      node.onChange();
    }

    return scene;
  }

  static shouldDeserialize(entityJson) {
    return entityJson.parent === undefined;
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

  serialize() {
    const sceneJson = {
      version: 3,
      root: this.uuid,
      metadata: this.metadata,
      entities: {
        [this.uuid]: {
          name: this.name
        }
      }
    };

    this.traverse(child => {
      if (!child.isNode || child === this) {
        return;
      }

      const entityJson = child.serialize();
      entityJson.parent = child.parent.uuid;

      let index = 0;

      for (const sibling of child.parent.children) {
        if (sibling === child) {
          break;
        } else if (sibling.isNode) {
          index++;
        }
      }

      entityJson.index = index;
      sceneJson.entities[child.uuid] = entityJson;
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
