import { Math as _Math, Scene, Group, Object3D, Fog, FogExp2, Color } from "three";
import EditorNodeMixin from "./EditorNodeMixin";
import { setStaticMode, StaticModes, isStatic } from "../StaticMode";
import sortEntities from "../utils/sortEntities";
import MeshCombinationGroup from "../MeshCombinationGroup";
import GroupNode from "./GroupNode";
import getNodeWithUUID from "../utils/getNodeWithUUID";
import serializeColor from "../utils/serializeColor";
import { DistanceModelType } from "../objects/AudioSource";

// Migrate v1 spoke scene to v2
function migrateV1ToV2(json) {
  const { root, metadata, entities } = json;

  // Generate UUIDs for all existing entity names.
  const rootUUID = _Math.generateUUID();
  const nameToUUID = { [root]: rootUUID };
  for (const name in entities) {
    if (Object.prototype.hasOwnProperty.call(entities, name)) {
      nameToUUID[name] = _Math.generateUUID();
    }
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
    if (!Object.prototype.hasOwnProperty.call(json.entities, entityId)) continue;

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
    const navMeshComponent = entity.components.find(c => c.name === "nav-mesh");

    if (!navMeshComponent && modelComponent && modelComponent.props.includeInFloorPlan) {
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

    if (modelComponent && navMeshComponent) {
      entity.components = [
        {
          name: "floor-plan",
          props: {
            autoCellSize: true,
            cellSize: 1,
            cellHeight: 0.1,
            agentHeight: 1.0,
            agentRadius: 0.0001,
            agentMaxClimb: 0.5,
            agentMaxSlope: 45,
            regionMinSize: 4
          }
        }
      ];
    }
  }

  return json;
}

function migrateV3ToV4(json) {
  json.version = 4;

  for (const entityId in json.entities) {
    if (!Object.prototype.hasOwnProperty.call(json.entities, entityId)) continue;

    const entity = json.entities[entityId];

    if (!entity.components) {
      continue;
    }

    const visibleComponent = entity.components.find(c => c.name === "visible");

    if (visibleComponent) {
      if (visibleComponent.props.visible !== undefined) {
        continue;
      }

      if (visibleComponent.props.value !== undefined) {
        visibleComponent.props = {
          visible: visibleComponent.props.value
        };
      } else {
        visibleComponent.props = {
          visible: true
        };
      }
    }
  }

  return json;
}

export const FogType = {
  Disabled: "disabled",
  Linear: "linear",
  Exponential: "exponential"
};

export default class SceneNode extends EditorNodeMixin(Scene) {
  static nodeName = "Scene";

  static disableTransform = true;

  static canAddNode() {
    return false;
  }

  static async loadProject(editor, json) {
    if (!json.version) {
      json = migrateV1ToV2(json);
    }

    if (json.version === 2) {
      json = migrateV2ToV3(json);
    }

    if (json.version === 3) {
      json = migrateV3ToV4(json);
    }

    const { root, metadata, entities } = json;

    let scene = null;

    const dependencies = [];

    function loadAsync(promise) {
      dependencies.push(promise);
    }

    const errors = [];

    function onError(object, error) {
      errors.push(error);
    }

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

      const node = await EntityNodeConstructor.deserialize(editor, entity, loadAsync, onError);
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

    await Promise.all(dependencies);

    return [scene, errors];
  }

  static shouldDeserialize(entityJson) {
    return entityJson.parent === undefined;
  }

  static async deserialize(editor, json) {
    const node = await super.deserialize(editor, json);

    if (json.components) {
      const fog = json.components.find(c => c.name === "fog");

      if (fog) {
        const { type, color, density, near, far } = fog.props;
        node.fogType = type;
        node.fogColor.set(color);
        node.fogDensity = density;
        node.fogNearDistance = near;
        node.fogFarDistance = far;
      }

      const background = json.components.find(c => c.name === "background");

      if (background) {
        const { color } = background.props;
        node.background.set(color);
      }

      const audioSettings = json.components.find(c => c.name === "audio-settings");

      if (audioSettings) {
        const props = audioSettings.props;
        node.overrideAudioSettings = props.overrideAudioSettings;
        node.avatarDistanceModel = props.avatarDistanceModel;
        node.avatarRolloffFactor = props.avatarRolloffFactor;
        node.avatarRefDistance = props.avatarRefDistance;
        node.avatarMaxDistance = props.avatarMaxDistance;
        node.mediaVolume = props.mediaVolume;
        node.mediaDistanceModel = props.mediaDistanceModel;
        node.mediaRolloffFactor = props.mediaRolloffFactor;
        node.mediaRefDistance = props.mediaRefDistance;
        node.mediaMaxDistance = props.mediaMaxDistance;
        node.mediaConeInnerAngle = props.mediaConeInnerAngle;
        node.mediaConeOuterAngle = props.mediaConeOuterAngle;
        node.mediaConeOuterGain = props.mediaConeOuterGain;
      }
    }

    return node;
  }

  constructor(editor) {
    super(editor);
    this.url = null;
    this.metadata = {};
    this.background = new Color(0xaaaaaa);
    this._environmentMap = null;
    this._fogType = FogType.Disabled;
    this._fog = new Fog(0xffffff, 0.0025);
    this._fogExp2 = new FogExp2(0xffffff, 0.0025);
    this.fog = null;
    this.overrideAudioSettings = false;
    this.avatarDistanceModel = DistanceModelType.Inverse;
    this.avatarRolloffFactor = 2;
    this.avatarRefDistance = 1;
    this.avatarMaxDistance = 10000;
    this.mediaVolume = 0.5;
    this.mediaDistanceModel = DistanceModelType.Inverse;
    this.mediaRolloffFactor = 1;
    this.mediaRefDistance = 1;
    this.mediaMaxDistance = 10000;
    this.mediaConeInnerAngle = 360;
    this.mediaConeOuterAngle = 0;
    this.mediaConeOuterGain = 0;
    setStaticMode(this, StaticModes.Static);
  }

  get fogType() {
    return this._fogType;
  }

  set fogType(type) {
    this._fogType = type;

    switch (type) {
      case FogType.Linear:
        this.fog = this._fog;
        break;
      case FogType.Exponential:
        this.fog = this._fogExp2;
        break;
      default:
        this.fog = null;
        break;
    }
  }

  get fogColor() {
    if (this.fogType === FogType.Linear) {
      return this._fog.color;
    } else {
      return this._fogExp2.color;
    }
  }

  get fogDensity() {
    return this._fogExp2.density;
  }

  set fogDensity(value) {
    this._fogExp2.density = value;
  }

  get fogNearDistance() {
    return this._fog.near;
  }

  set fogNearDistance(value) {
    this._fog.near = value;
  }

  get fogFarDistance() {
    return this._fog.far;
  }

  set fogFarDistance(value) {
    this._fog.far = value;
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

  copy(source, recursive = true) {
    super.copy(source, recursive);

    this.url = source.url;
    this.metadata = source.metadata;
    this._environmentMap = source._environmentMap;
    this.fogType = source.fogType;
    this.fogColor.copy(source.fogColor);
    this.fogDensity = source.fogDensity;
    this.fogNearDistance = source.fogNearDistance;
    this.fogFarDistance = source.fogFarDistance;
    this.overrideAudioSettings = source.overrideAudioSettings;
    this.avatarDistanceModel = source.avatarDistanceModel;
    this.avatarRolloffFactor = source.avatarRolloffFactor;
    this.avatarRefDistance = source.avatarRefDistance;
    this.avatarMaxDistance = source.avatarMaxDistance;
    this.mediaVolume = source.mediaVolume;
    this.mediaDistanceModel = source.mediaDistanceModel;
    this.mediaRolloffFactor = source.mediaRolloffFactor;
    this.mediaRefDistance = source.mediaRefDistance;
    this.mediaMaxDistance = source.mediaMaxDistance;
    this.mediaConeInnerAngle = source.mediaConeInnerAngle;
    this.mediaConeOuterAngle = source.mediaConeOuterAngle;
    this.mediaConeOuterGain = source.mediaConeOuterGain;

    return this;
  }

  serialize() {
    const sceneJson = {
      version: 4,
      root: this.uuid,
      metadata: JSON.parse(JSON.stringify(this.metadata)),
      entities: {
        [this.uuid]: {
          name: this.name,
          components: [
            {
              name: "fog",
              props: {
                type: this.fogType,
                color: serializeColor(this.fogColor),
                near: this.fogNearDistance,
                far: this.fogFarDistance,
                density: this.fogDensity
              }
            },
            {
              name: "background",
              props: {
                color: serializeColor(this.background)
              }
            },
            {
              name: "audio-settings",
              props: {
                overrideAudioSettings: this.overrideAudioSettings,
                avatarDistanceModel: this.avatarDistanceModel,
                avatarRolloffFactor: this.avatarRolloffFactor,
                avatarRefDistance: this.avatarRefDistance,
                avatarMaxDistance: this.avatarMaxDistance,
                mediaVolume: this.mediaVolume,
                mediaDistanceModel: this.mediaDistanceModel,
                mediaRolloffFactor: this.mediaRolloffFactor,
                mediaRefDistance: this.mediaRefDistance,
                mediaMaxDistance: this.mediaMaxDistance,
                mediaConeInnerAngle: this.mediaConeInnerAngle,
                mediaConeOuterAngle: this.mediaConeOuterAngle,
                mediaConeOuterGain: this.mediaConeOuterGain
              }
            }
          ]
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

  prepareForExport(ctx) {
    this.children = this.children.filter(c => c.isNode);

    const nodeList = [];

    this.traverse(child => {
      if (child.isNode && child !== this) {
        nodeList.push(child);
      }
    });

    for (const node of nodeList) {
      node.prepareForExport(ctx);
    }

    this.addGLTFComponent("background", {
      color: this.background
    });

    if (this.fogType === FogType.Linear) {
      this.addGLTFComponent("fog", {
        type: this.fogType,
        color: serializeColor(this.fogColor),
        near: this.fogNearDistance,
        far: this.fogFarDistance
      });
    } else if (this.fogType === FogType.Exponential) {
      this.addGLTFComponent("fog", {
        type: this.fogType,
        color: serializeColor(this.fogColor),
        density: this.fogDensity
      });
    }

    if (this.overrideAudioSettings) {
      this.addGLTFComponent("audio-settings", {
        avatarDistanceModel: this.avatarDistanceModel,
        avatarRolloffFactor: this.avatarRolloffFactor,
        avatarRefDistance: this.avatarRefDistance,
        avatarMaxDistance: this.avatarMaxDistance,
        mediaVolume: this.mediaVolume,
        mediaDistanceModel: this.mediaDistanceModel,
        mediaRolloffFactor: this.mediaRolloffFactor,
        mediaRefDistance: this.mediaRefDistance,
        mediaMaxDistance: this.mediaMaxDistance,
        mediaConeInnerAngle: this.mediaConeInnerAngle,
        mediaConeOuterAngle: this.mediaConeOuterAngle,
        mediaConeOuterGain: this.mediaConeOuterGain
      });
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
        if (Object.prototype.hasOwnProperty.call(userData, key)) {
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
        (object.constructor === Object3D ||
          object.constructor === Scene ||
          object.constructor === Group ||
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
          animations.push(child.activeClip);
        }
      }
    });

    return animations;
  }

  getContentAttributions() {
    const contentAttributions = [];
    const seenAttributions = new Set();

    this.traverse(obj => {
      if (!(obj.isNode && obj.type === "Model")) return;
      const attribution = obj.attribution;

      if (!attribution) return;

      if (attribution) {
        const attributionKey = attribution.url || `${attribution.name}_${attribution.author}`;
        if (seenAttributions.has(attributionKey)) return;
        seenAttributions.add(attributionKey);
        contentAttributions.push(attribution);
      }
    });

    return contentAttributions;
  }

  clearMetadata() {
    this.metadata = {};
  }

  setMetadata(newMetadata) {
    const existingMetadata = this.metadata || {};
    this.metadata = Object.assign(existingMetadata, newMetadata);
  }
}
