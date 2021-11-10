import { Math as _Math } from "three";

const combineComponents = ["gltf-model", "kit-piece"];

const Migrations = {
  // Migrate v1 spoke scene to v2
  "1_2": json => {
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
  },

  "2_3": json => {
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
  },

  "3_4": json => {
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
  },

  "4_5": json => {
    json.version = 5;

    for (const entityId in json.entities) {
      if (!Object.prototype.hasOwnProperty.call(json.entities, entityId)) continue;

      const entity = json.entities[entityId];

      if (!entity.components) {
        continue;
      }

      const animationComponent = entity.components.find(c => c.name === "loop-animation");

      if (animationComponent) {
        // Prior to V5 animation clips were stored in activeClipIndex as an integer
        const { activeClipIndex } = animationComponent.props;
        delete animationComponent.props.activeClipIndex;
        // In V5+ activeClipIndices stores an array of integers. It may be undefined if migrating from a legacy scene where the
        // clip property stores the animation clip name. We can't migrate this here so we do it in ModelNode and KitPieceNode.
        animationComponent.props.activeClipIndices = activeClipIndex !== undefined ? [activeClipIndex] : [];
      }

      const hasCombineComponent = entity.components.find(c => combineComponents.indexOf(c.name) !== -1);

      if (hasCombineComponent) {
        entity.components.push({
          name: "combine",
          props: {}
        });
      }
    }

    return json;
  },

  "5_6": json => {
    json.version = 6;

    for (const entityId in json.entities) {
      if (!Object.prototype.hasOwnProperty.call(json.entities, entityId)) continue;

      const entity = json.entities[entityId];

      if (!entity.components) {
        continue;
      }

      const audioComponent = entity.components.find(c => c.name === "audio");

      if (audioComponent) {
        // Prior to V6 audio parameters where part of the audio node, now they have been refactored to the audio-params component
        entity.components.push({
          name: "audio-params",
          props: {
            audioType: audioComponent.props["audioType"],
            gain: audioComponent.props["volume"],
            distanceModel: audioComponent.props["distanceModel"],
            rolloffFactor: audioComponent.props["rolloffFactor"],
            refDistance: audioComponent.props["refDistance"],
            maxDistance: audioComponent.props["maxDistance"],
            coneInnerAngle: audioComponent.props["coneInnerAngle"],
            coneOuterAngle: audioComponent.props["coneOuterAngle"],
            coneOuterGain: audioComponent.props["coneOuterGain"]
          }
        });

        delete audioComponent.props["audioType"];
        delete audioComponent.props["volume"];
        delete audioComponent.props["distanceModel"];
        delete audioComponent.props["rolloffFactor"];
        delete audioComponent.props["refDistance"];
        delete audioComponent.props["maxDistance"];
        delete audioComponent.props["coneInnerAngle"];
        delete audioComponent.props["coneOuterAngle"];
        delete audioComponent.props["coneOuterGain"];
      }

      const videoComponent = entity.components.find(c => c.name === "video");

      if (videoComponent) {
        // Prior to V6 audio parameters where part of the audio node, now they have been refactored to the audio-params component
        entity.components.push({
          name: "audio-params",
          props: {
            audioType: videoComponent.props["audioType"],
            gain: videoComponent.props["volume"],
            distanceModel: videoComponent.props["distanceModel"],
            rolloffFactor: videoComponent.props["rolloffFactor"],
            refDistance: videoComponent.props["refDistance"],
            maxDistance: videoComponent.props["maxDistance"],
            coneInnerAngle: videoComponent.props["coneInnerAngle"],
            coneOuterAngle: videoComponent.props["coneOuterAngle"],
            coneOuterGain: videoComponent.props["coneOuterGain"]
          }
        });

        delete videoComponent.props["audioType"];
        delete videoComponent.props["gain"];
        delete videoComponent.props["distanceModel"];
        delete videoComponent.props["rolloffFactor"];
        delete videoComponent.props["refDistance"];
        delete videoComponent.props["maxDistance"];
        delete videoComponent.props["coneInnerAngle"];
        delete videoComponent.props["coneOuterAngle"];
        delete videoComponent.props["coneOuterGain"];
      }
    }

    return json;
  },

  "6_7": json => {
    json.version = 7;

    for (const entityId in json.entities) {
      if (!Object.prototype.hasOwnProperty.call(json.entities, entityId)) continue;

      const entity = json.entities[entityId];

      if (!entity.components) {
        continue;
      }

      const audioParamsComponent = entity.components.find(c => c.name === "audio-params");
      if (audioParamsComponent) {
        // Prior to V6 we didn't have dirty params so we need to enable all properties
        // to make sure that the old settings are applied.
        let editorSettingsComponent = entity.components.find(c => c.name === "editor-settings");
        if (!editorSettingsComponent) {
          editorSettingsComponent = {
            name: "editor-settings",
            props: {
              enabled: true
            }
          };
          entity.components.push(editorSettingsComponent);
        }
        editorSettingsComponent.props["modifiedProperties"] = {
          "audio-params": {
            audioType: true,
            gain: true,
            distanceModel: true,
            rolloffFactor: true,
            refDistance: true,
            maxDistance: true,
            coneInnerAngle: true,
            coneOuterAngle: true,
            coneOuterGain: true
          }
        };
      }

      const audioSettingsComponent = entity.components.find(c => c.name === "audio-settings");
      if (audioSettingsComponent) {
        const overriden = audioSettingsComponent.props && audioSettingsComponent.props.overrideAudioSettings;
        // Prior to V6 we didn't have dirty params so we need to enable all properties
        // to make sure that the old settings are applied.
        if (overriden) {
          let editorSettingsComponent = entity.components.find(c => c.name === "editor-settings");
          if (!editorSettingsComponent) {
            editorSettingsComponent = {
              name: "editor-settings",
              props: {
                enabled: true
              }
            };
            entity.components.push(editorSettingsComponent);
          }
          editorSettingsComponent.props["modifiedProperties"] = {
            scene: {
              avatarDistanceModel: true,
              avatarRolloffFactor: true,
              avatarRefDistance: true,
              avatarMaxDistance: true,
              mediaVolume: true,
              mediaDistanceModel: true,
              mediaRolloffFactor: true,
              mediaRefDistance: true,
              mediaMaxDistance: true,
              mediaConeInnerAngle: true,
              mediaConeOuterAngle: true,
              mediaConeOuterGain: true
            }
          };
        }
      }
    }

    return json;
  },

  "7_8": json => {
    json.version = 8;

    const updateModifiedProps = oldProps => {
      const compKeys = Object.keys(oldProps["modifiedProperties"]);
      compKeys.forEach(compKey => {
        const newModifiedProps = [];
        const propKeys = Object.keys(oldProps["modifiedProperties"][compKey]);
        propKeys.forEach(propKey => {
          if (oldProps["modifiedProperties"][compKey][propKey] === true) {
            newModifiedProps.push(propKey);
          }
        });
        oldProps["modifiedProperties"][compKey] = newModifiedProps;
      });
    };

    for (const entityId in json.entities) {
      if (!Object.prototype.hasOwnProperty.call(json.entities, entityId)) continue;

      const entity = json.entities[entityId];

      if (!entity.components) {
        continue;
      }

      const audioParamsComponent = entity.components.find(c => c.name === "audio-params");
      if (audioParamsComponent) {
        // Migrate old modified params object to an array
        const editorSettingsComponent = entity.components.find(c => c.name === "editor-settings");
        const modifiedProps = editorSettingsComponent.props["modifiedProperties"];
        if (modifiedProps) {
          updateModifiedProps(editorSettingsComponent.props);
        }
      }

      const audioSettingsComponent = entity.components.find(c => c.name === "audio-settings");
      if (audioSettingsComponent) {
        const overriden = audioSettingsComponent.props && audioSettingsComponent.props.overrideAudioSettings;
        // Migrate old modified params object to an array
        if (overriden) {
          const editorSettingsComponent = entity.components.find(c => c.name === "editor-settings");
          if (editorSettingsComponent) {
            const modifiedProps = editorSettingsComponent.props["modifiedProperties"];
            if (modifiedProps) {
              updateModifiedProps(editorSettingsComponent.props);
            }
          }
        }
      }
    }

    return json;
  },

  "8_9": json => {
    json.version = 9;

    const updateEnabledProps = props => {
      const modifiedProps = props.modifiedProperties;
      if (modifiedProps) {
        const enabledProps = props.enabledProperties || {};
        const compKeys = Object.keys(modifiedProps);
        compKeys.forEach(compKey => {
          if (!enabledProps[compKey]) {
            enabledProps[compKey] = [];
          }
          modifiedProps[compKey].forEach(propKey => {
            enabledProps[compKey].push(propKey);
          });
        });
        props.enabledProperties = enabledProps;
      }
    };

    for (const entityId in json.entities) {
      if (!Object.prototype.hasOwnProperty.call(json.entities, entityId)) continue;

      const entity = json.entities[entityId];

      if (!entity.components) {
        continue;
      }

      const audioParamsComponent = entity.components.find(c => c.name === "audio-params");
      if (audioParamsComponent) {
        // Add modified object props to the enabled array
        const editorSettingsComponent = entity.components.find(c => c.name === "editor-settings");
        updateEnabledProps(editorSettingsComponent.props);
      }

      const audioSettingsComponent = entity.components.find(c => c.name === "audio-settings");
      if (audioSettingsComponent) {
        const overriden = audioSettingsComponent.props && audioSettingsComponent.props.overrideAudioSettings;
        // Add modified object props to the enabled array
        if (overriden) {
          const editorSettingsComponent = entity.components.find(c => c.name === "editor-settings");
          if (editorSettingsComponent) {
            updateEnabledProps(editorSettingsComponent.props);
          }
        }
      }
    }

    return json;
  }
};

export default function MigrateScene(json, toVersion) {
  const version = json.version !== undefined ? json.version : 1;
  for (let i = version; i < toVersion; i++) {
    json = Migrations[`${i}_${i + 1}`](json);
  }
  return json;
}
