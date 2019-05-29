import signals from "signals";
import THREE from "../vendor/three";
import History from "./History";
import Viewport from "./Viewport";

import AddObjectCommand from "./commands/AddObjectCommand";
import MoveObjectCommand from "./commands/MoveObjectCommand";
import RemoveObjectCommand from "./commands/RemoveObjectCommand";
import SetPositionCommand from "./commands/SetPositionCommand";
import SetRotationCommand from "./commands/SetRotationCommand";
import SetScaleCommand from "./commands/SetScaleCommand";
import SetObjectPropertyCommand from "./commands/SetObjectPropertyCommand";
import MultiCmdsCommand from "./commands/MultiCmdsCommand";

import TextureCache from "./caches/TextureCache";
import GLTFCache from "./caches/GLTFCache";

import SceneNode from "./nodes/SceneNode";
import FloorPlanNode from "./nodes/FloorPlanNode";

import LoadingCube from "./objects/LoadingCube";

import makeUniqueName from "./utils/makeUniqueName";
import eventToMessage from "./utils/eventToMessage";
import cloneObject3D from "./utils/cloneObject3D";
import isEmptyObject from "./utils/isEmptyObject";
import { loadEnvironmentMap } from "./utils/EnvironmentMap";
import { generateImageFileThumbnail, generateVideoFileThumbnail } from "./utils/thumbnails";
import getIntersectingNode from "./utils/getIntersectingNode";
import SkyboxNode from "./nodes/SkyboxNode";

export default class Editor {
  constructor(api) {
    this.api = api;
    this.projectId = null;

    this.scene = new SceneNode(this);
    this.sceneModified = false;
    this.sceneLoaded = false;

    this.nodes = [];
    this.nodesByType = {};

    this.camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.2, 8000);
    this.audioListener = new THREE.AudioListener();
    this.camera.add(this.audioListener);
    this.camera.layers.enable(3);
    this.camera.name = "Camera";

    // TODO: Support multiple viewports
    this.viewport = null;
    this.selected = null;

    this.nodeTypes = new Set();
    this.nodeEditors = new Map();

    this.textureCache = new TextureCache();
    this.gltfCache = new GLTFCache(this.textureCache);

    const Signal = signals.Signal;

    this.signals = {
      deleteSelectedObject: new Signal(),

      propertyChanged: new Signal(),
      transformModeChanged: new Signal(),
      snapToggled: new Signal(),
      spaceChanged: new Signal(),
      viewportInitialized: new Signal(),

      sceneGraphChanged: new Signal(),
      sceneSet: new Signal(),
      sceneModified: new Signal(),

      objectSelected: new Signal(),

      objectAdded: new Signal(),
      objectChanged: new Signal(),
      objectRemoved: new Signal(),

      editorError: new Signal(),

      windowResize: new Signal(),

      historyChanged: new Signal(),

      saveProject: new Signal()
    };

    this._ignoreSceneModification = false;
    this.ignoreNextSceneFileChange = false;
    this.signals.sceneGraphChanged.add(this.onSceneGraphChanged);
    this.signals.objectChanged.add(this.onObjectChanged);
    this.signals.objectSelected.add(this.onObjectSelected);

    this.history = new History(this);

    this.raycaster = new THREE.Raycaster();
    // Center at 0, 0
    this.centerScreenSpace = new THREE.Vector2();
  }

  onSceneGraphChanged = () => {
    if (this._ignoreSceneModification) return;
    this.sceneModified = true;
    this.signals.sceneModified.dispatch();
  };

  onObjectChanged = object => {
    if (this._ignoreSceneModification) return;
    this.sceneModified = true;
    this.signals.sceneModified.dispatch();
    object.onChange();
  };

  onObjectSelected = (obj, prev) => {
    if (prev && prev.isNode) {
      prev.onDeselect();
    }

    if (obj && obj.isNode) {
      obj.onSelect();
    }
  };

  async init() {
    const tasks = [];

    if (!this.viewport) {
      tasks.push(
        new Promise(resolve => {
          let initialized = null;
          initialized = () => {
            this.signals.viewportInitialized.remove(initialized);
            resolve();
          };
          this.signals.viewportInitialized.add(initialized);
        })
      );
    }

    tasks.push(loadEnvironmentMap());
    tasks.push(LoadingCube.load());

    for (const NodeConstructor of this.nodeTypes) {
      tasks.push(NodeConstructor.load());
    }

    await Promise.all(tasks);
  }

  initializeViewport(canvas) {
    this.viewport = new Viewport(this, canvas);
    this.signals.viewportInitialized.dispatch(this.viewport);
  }

  clearCaches() {
    this.textureCache.disposeAndClear();
    this.gltfCache.disposeAndClear();
  }

  async loadProject(json, onProgress) {
    this.clearCaches();

    const scene = await SceneNode.loadProject(this, json, onProgress);

    this.setScene(scene);

    this.scene.traverse(node => {
      if (node.isNode) {
        node.onRendererChanged();
      }
    });

    return scene;
  }

  setScene(scene) {
    this.scene.traverse(child => {
      if (child.isNode) {
        child.onRemove();
        this.onNodeRemoved(child);
      }
    });

    this.sceneLoaded = true;
    this.scene = scene;
    this.sceneUrl = null;

    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(new THREE.Vector3());
    this.scene.add(this.camera);

    this.history.clear();
    this.deselect();

    this.scene.traverse(child => {
      if (child.isNode) {
        child.onAdd();
        this.onNodeAdded(child);
      }
    });

    this.signals.sceneSet.dispatch();
    this.signals.sceneGraphChanged.dispatch();
    this.sceneModified = false;
  }

  async exportScene(signal) {
    const scene = this.scene;

    const floorPlanNode = scene.findNodeByType(FloorPlanNode);

    if (floorPlanNode) {
      await floorPlanNode.generate(signal);
    }

    const clonedScene = cloneObject3D(scene, true);

    clonedScene.prepareForExport();
    await clonedScene.combineMeshes();
    clonedScene.removeUnusedObjects();

    // Add a preview camera to the exported GLB if there is a transform in the metadata.
    const previewCamera = this.camera.clone();
    previewCamera.name = "scene-preview-camera";
    clonedScene.add(previewCamera);

    const animations = clonedScene.getAnimationClips();

    const exporter = new THREE.GLTFExporter();
    // TODO: export animations
    const chunks = await new Promise((resolve, reject) => {
      exporter.parseChunks(
        clonedScene,
        resolve,
        e => {
          reject(new Error(`Error exporting scene. ${eventToMessage(e)}`));
        },
        {
          mode: "glb",
          onlyVisible: false,
          animations
        }
      );
    });

    const json = chunks.json;

    // De-duplicate images.
    const imageDefs = json.images;
    if (imageDefs && imageDefs.length > 0) {
      // Map containing imageProp -> newIndex
      const uniqueImageProps = new Map();
      // Map containing oldIndex -> newIndex
      const imageIndexMap = new Map();
      // Array containing unique imageDefs
      const uniqueImageDefs = [];
      // Array containing unique image blobs
      const uniqueImages = [];
      for (const [index, imageDef] of imageDefs.entries()) {
        const imageProp = imageDef.uri === undefined ? imageDef.bufferView : imageDef.uri;
        let newIndex = uniqueImageProps.get(imageProp);
        if (newIndex === undefined) {
          newIndex = uniqueImageDefs.push(imageDef) - 1;
          uniqueImageProps.set(imageProp, newIndex);
          uniqueImages.push(chunks.images[index]);
        }
        imageIndexMap.set(index, newIndex);
      }
      json.images = uniqueImageDefs;
      chunks.images = uniqueImages;
      for (const textureDef of json.textures) {
        textureDef.source = imageIndexMap.get(textureDef.source);
      }
    }

    const nodeDefs = json.nodes;
    if (nodeDefs) {
      const uuidToIndexMap = {};

      for (let i = 0; i < nodeDefs.length; i++) {
        const nodeDef = nodeDefs[i];

        if (nodeDef.extras && nodeDef.extras.MOZ_spoke_uuid) {
          uuidToIndexMap[nodeDef.extras.MOZ_spoke_uuid] = i;
          delete nodeDef.extras.MOZ_spoke_uuid;

          if (isEmptyObject(nodeDef.extras)) {
            delete nodeDef.extras;
          }
        }
      }

      for (const nodeDef of nodeDefs) {
        if (nodeDef.extensions && nodeDef.extensions.MOZ_hubs_components) {
          const components = nodeDef.extensions.MOZ_hubs_components;
          for (const componentName in components) {
            const component = components[componentName];

            for (const propertyName in component) {
              const property = component[propertyName];

              if (property !== null && typeof property === "object" && property.hasOwnProperty("__gltfIndexForUUID")) {
                component[propertyName] = uuidToIndexMap[property.__gltfIndexForUUID];
              }
            }
          }
        }
      }
    }

    if (!json.extensions) {
      json.extensions = {};
    }

    json.extensions.MOZ_hubs_components = {
      version: 2
    };

    json.asset.generator = `Mozilla Spoke ${process.env.BUILD_VERSION}`;

    return await new Promise((resolve, reject) => {
      exporter.createGLBBlob(chunks, resolve, e => {
        reject(new Error(`Error creating glb blob. ${eventToMessage(e)}`));
      });
    });
  }

  async optimizeScene() {
    const scene = this.scene;

    const abortController = new AbortController();

    const floorPlanNode = scene.findNodeByType(FloorPlanNode);

    if (floorPlanNode) {
      await floorPlanNode.generate(abortController.signal);
    }

    const clonedScene = cloneObject3D(scene, true);
    clonedScene.prepareForExport();
    await clonedScene.combineMeshes();
    clonedScene.removeUnusedObjects();
    clonedScene.add(new SkyboxNode(this));
    this.setScene(clonedScene);
  }

  getSpawnPosition(target) {
    this.raycaster.setFromCamera(this.centerScreenSpace, this.camera);
    const results = this.raycaster.intersectObject(this.scene, true);
    const result = getIntersectingNode(results, this.scene);

    if (result && result.distance < 1000) {
      target.copy(result.point);
    } else {
      this.raycaster.ray.at(20, target);
    }

    if (this.viewport.spokeControls.snapEnabled) {
      const translationSnap = this.viewport.spokeControls.translationSnap;

      target.set(
        Math.round(target.x / translationSnap) * translationSnap,
        Math.round(target.y / translationSnap) * translationSnap,
        Math.round(target.z / translationSnap) * translationSnap
      );
    }
  }

  addObject(object, parent) {
    this.execute(new AddObjectCommand(object, parent));
  }

  _addObject(object, parent, index) {
    object.saveParent = true;

    if (parent !== undefined) {
      if (index !== undefined) {
        parent.children.splice(index, 0, object);
        object.parent = parent;
      } else {
        parent.add(object);
      }
    } else {
      this.scene.add(object);
    }

    object.traverse(child => {
      if (child.isNode) {
        child.onAdd();
        this.onNodeAdded(child);
      }
    });
  }

  moveObject(object, parent, before) {
    this.execute(new MoveObjectCommand(object, parent, before));
  }

  removeObject(object) {
    if (object.parent === null) return; // avoid deleting the camera or scene

    if (object === this.selected) {
      this.deselect();
    }

    object.traverse(child => {
      if (child.isNode) {
        child.onRemove();
        this.onNodeRemoved(child);
      }
    });

    object.parent.remove(object);
  }

  onNodeAdded(node) {
    this.nodes.push(node);
    this.nodesByType[node.nodeName].push(node);
  }

  onNodeRemoved(node) {
    const nodeIndex = this.nodes.findIndex(n => n === node);
    if (nodeIndex !== -1) {
      this.nodes.splice(nodeIndex, 1);
    }

    const nodeByType = this.nodesByType[node.nodeName];
    const nodeByTypeIndex = nodeByType.findIndex(n => n === node);
    if (nodeByTypeIndex !== -1) {
      nodeByType.splice(nodeByTypeIndex, 1);
    }
  }

  setTransformMode(mode) {
    this.signals.transformModeChanged.dispatch(mode);
  }

  registerNode(nodeConstructor, nodeEditor) {
    this.nodeTypes.add(nodeConstructor);
    this.nodeEditors.set(nodeConstructor, nodeEditor);
    this.nodesByType[nodeConstructor.nodeName] = [];
  }

  getNodeEditor(node) {
    return this.nodeEditors.get(node.constructor);
  }

  _getSetNodePropertyCommand(node, propertyName, value, oldValue) {
    switch (propertyName) {
      case "position":
        return new SetPositionCommand(node, value, oldValue);
      case "rotation":
        return new SetRotationCommand(node, value, oldValue);
      case "scale":
        return new SetScaleCommand(node, value, oldValue);
      default:
        return new SetObjectPropertyCommand(node, propertyName, value);
    }
  }

  setNodeProperty(node, propertyName, value, oldValue) {
    const command = this._getSetNodePropertyCommand(node, propertyName, value, oldValue);
    this.execute(command);
    node.onChange();
  }

  setNodeProperties(node, properties) {
    const commands = Object.entries(properties).map(([key, value]) =>
      this._getSetNodePropertyCommand(node, key, value)
    );
    const multiCmd = new MultiCmdsCommand(commands);
    this.execute(multiCmd);
    node.onChange();
  }

  getNodeHierarchy() {
    const scene = this.scene;

    const buildNode = object => {
      const collapsed = object.isCollapsed;

      const node = {
        object,
        collapsed
      };

      if (object.children.length !== 0) {
        node.children = object.children.filter(child => child.isNode).map(child => buildNode(child));
      }

      return node;
    };

    return buildNode(scene);
  }

  select(newSelection) {
    if (this.selected === newSelection) return;
    const previousSelection = this.selected;

    this.selected = newSelection;

    this.signals.objectSelected.dispatch(newSelection, previousSelection);
  }

  selectById(id) {
    if (id === this.scene.id) {
      this.select(this.scene);
      return;
    }

    if (id === this.camera.id) {
      this.select(this.camera);
      return;
    }

    this.select(this.scene.getObjectById(id, true));
  }

  selectByUuid(uuid) {
    const scope = this;

    this.scene.traverse(function(child) {
      if (child.uuid === uuid) {
        scope.select(child);
      }
    });
  }

  deselect() {
    this.select(null);
  }

  focus(object) {
    if (object === this.scene) {
      return;
    }

    this.viewport.spokeControls.focus(object);
  }

  focusSelection() {
    if (this.selected == null) return;
    this.focus(this.selected);
  }

  focusById(id) {
    this.focus(this.scene.getObjectById(id, true));
  }

  deleteObject(object) {
    if (object === this.scene) {
      return;
    }

    this.execute(new RemoveObjectCommand(object));
  }

  deleteSelectedObject() {
    if (this.selected && this.selected.parent) {
      this.deleteObject(this.selected);
      return true;
    }
    return false;
  }

  duplicateObject(object) {
    if (!object.constructor.canAddNode(this)) {
      return;
    }

    const clone = object.clone();

    makeUniqueName(this.scene, clone);

    this.execute(new AddObjectCommand(clone, object.parent));
  }

  duplicateSelectedObject() {
    if (this.selected && this.selected.parent) {
      this.duplicateObject(this.selected);
      return true;
    }
    return false;
  }

  objectByUuid(uuid) {
    return this.scene.getObjectByProperty("uuid", uuid, true);
  }

  execute(cmd, optionalName) {
    this.history.execute(cmd, optionalName);
  }

  undo() {
    this.history.undo();
  }

  redo() {
    this.history.redo();
  }

  async takeScreenshot(width, height) {
    return this.viewport.takeScreenshot(width, height);
  }

  async generateFileThumbnail(file, width, height) {
    const url = URL.createObjectURL(file);

    let blob;

    if (file.name.toLowerCase().endsWith(".glb")) {
      const gltf = await new Promise((resolve, reject) => new THREE.GLTFLoader().load(url, resolve, undefined, reject));
      blob = await this.viewport.generateThumbnail(gltf.scene, width, height);
    } else if ([".png", ".jpg", ".jpeg", ".gif", ".webp"].some(ext => file.name.toLowerCase().endsWith(ext))) {
      blob = await generateImageFileThumbnail(file);
    } else if (file.name.toLowerCase().endsWith(".mp4")) {
      blob = await generateVideoFileThumbnail(file);
    }

    URL.revokeObjectURL(url);

    if (!blob) {
      throw new Error(`Unsupported file type for file: "${file.name}". File must be an image, video, or glb model.`);
    }

    return blob;
  }

  enterPlayMode() {
    this.playing = true;
    this.deselect();
    this.camera.layers.disable(3);
    this.viewport.playModeControls.enable();
    this.scene.traverse(node => {
      if (node.isNode) {
        node.onPlay();
      }
    });
  }

  leavePlayMode() {
    this.playing = false;
    this.camera.layers.enable(3);
    this.viewport.playModeControls.disable();
    this.scene.traverse(node => {
      if (node.isNode) {
        node.onPause();
      }
    });
  }
}
