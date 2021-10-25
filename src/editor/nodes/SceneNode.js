import { Math as _Math, Scene, Group, Object3D, Fog, FogExp2, Color } from "three";
import EditorNodeMixin from "./EditorNodeMixin";
import { setStaticMode, StaticModes, isStatic } from "../StaticMode";
import sortEntities from "../utils/sortEntities";
import MeshCombinationGroup from "../MeshCombinationGroup";
import GroupNode from "./GroupNode";
import getNodeWithUUID from "../utils/getNodeWithUUID";
import serializeColor from "../utils/serializeColor";
import { AvatarAudioDefaults, MediaAudioDefaults } from "../objects/AudioParams";
import traverseFilteredSubtrees from "../utils/traverseFilteredSubtrees";
import MigrateScene from "./SceneMigration";

export const FogType = {
  Disabled: "disabled",
  Linear: "linear",
  Exponential: "exponential"
};

const JSON_VERSION = 9;

export default class SceneNode extends EditorNodeMixin(Scene) {
  static nodeName = "Scene";

  static disableTransform = true;

  static canAddNode() {
    return false;
  }

  static async loadProject(editor, json) {
    json = MigrateScene(json, JSON_VERSION);

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
    this.avatarDistanceModel = AvatarAudioDefaults.distanceModel;
    this.avatarRolloffFactor = AvatarAudioDefaults.rolloffFactor;
    this.avatarRefDistance = AvatarAudioDefaults.refDistance;
    this.avatarMaxDistance = AvatarAudioDefaults.maxDistance;
    this.mediaVolume = MediaAudioDefaults.gain;
    this.mediaDistanceModel = MediaAudioDefaults.distanceModel;
    this.mediaRolloffFactor = MediaAudioDefaults.rolloffFactor;
    this.mediaRefDistance = MediaAudioDefaults.refDistance;
    this.mediaMaxDistance = MediaAudioDefaults.maxDistance;
    this.mediaConeInnerAngle = MediaAudioDefaults.coneInnerAngle;
    this.mediaConeOuterAngle = MediaAudioDefaults.coneOuterAngle;
    this.mediaConeOuterGain = MediaAudioDefaults.coneOuterGain;
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
      version: JSON_VERSION,
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
            },
            {
              name: "editor-settings",
              props: {
                enabled: true,
                modifiedProperties: this.modifiedProperties
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
      if (node.enabled) {
        node.prepareForExport(ctx);
      } else {
        node.parent.remove(node);
      }
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
      const avatarDistanceModel = this.exportPropertyValue("scene", "avatarDistanceModel");
      const avatarRolloffFactor = this.exportPropertyValue("scene", "avatarRolloffFactor");
      const avatarRefDistance = this.exportPropertyValue("scene", "avatarRefDistance");
      const avatarMaxDistance = this.exportPropertyValue("scene", "avatarMaxDistance");
      const mediaVolume = this.exportPropertyValue("scene", "mediaVolume");
      const mediaDistanceModel = this.exportPropertyValue("scene", "mediaDistanceModel");
      const mediaRolloffFactor = this.exportPropertyValue("scene", "mediaRolloffFactor");
      const mediaRefDistance = this.exportPropertyValue("scene", "mediaRefDistance");
      const mediaMaxDistance = this.exportPropertyValue("scene", "mediaMaxDistance");
      const mediaConeInnerAngle = this.exportPropertyValue("scene", "mediaConeInnerAngle");
      const mediaConeOuterAngle = this.exportPropertyValue("scene", "mediaConeOuterAngle");
      const mediaConeOuterGain = this.exportPropertyValue("scene", "mediaConeOuterGain");
      this.addGLTFComponent("audio-settings", {
        ...(avatarDistanceModel && { avatarDistanceModel }),
        ...(avatarRolloffFactor && { avatarRolloffFactor }),
        ...(avatarRefDistance && { avatarRefDistance }),
        ...(avatarMaxDistance && { avatarMaxDistance }),
        ...(mediaVolume && { mediaVolume }),
        ...(mediaDistanceModel && { mediaDistanceModel }),
        ...(mediaRolloffFactor && { mediaRolloffFactor }),
        ...(mediaRefDistance && { mediaRefDistance }),
        ...(mediaMaxDistance && { mediaMaxDistance }),
        ...(mediaConeInnerAngle && { mediaConeInnerAngle }),
        ...(mediaConeOuterAngle && { mediaConeOuterAngle }),
        ...(mediaConeOuterGain && { mediaConeOuterGain })
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

    traverseFilteredSubtrees(this, child => {
      if (!child.isNode) {
        return;
      }

      if (!child.enabled) {
        return false;
      }

      if (child.type === "Model") {
        animations.push(...child.clips);
      }
    });

    return animations;
  }

  getContentAttributions() {
    const contentAttributions = [];
    const seenAttributions = new Set();

    traverseFilteredSubtrees(this, obj => {
      if (!obj.isNode) {
        return;
      }

      if (!obj.enabled) {
        return false;
      }

      const attribution = obj.attribution;

      if (!attribution) return;

      const url = attribution.url && attribution.url.trim();
      const title = attribution.title && attribution.title.trim();
      const author = attribution.author && attribution.author.trim();

      if (!url && !title && !author) return;

      const attributionKey = url || `${title}_${author}`;
      if (seenAttributions.has(attributionKey)) return;
      seenAttributions.add(attributionKey);
      contentAttributions.push(attribution);
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
