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
import GroundPlaneNode from "./nodes/GroundPlaneNode";
import DirectionalLightNode from "./nodes/DirectionalLightNode";
import SpawnPointNode from "./nodes/SpawnPointNode";
import SkyboxNode from "./nodes/SkyboxNode";
import FloorPlanNode from "./nodes/FloorPlanNode";

import makeUniqueName from "./utils/makeUniqueName";
import eventToMessage from "./utils/eventToMessage";
import cloneObject3D from "./utils/cloneObject3D";
import isEmptyObject from "./utils/isEmptyObject";

export default class Editor {
  constructor(api) {
    this.api = api;

    this.scene = new SceneNode(this);
    this.sceneModified = false;

    this.camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.2, 8000);
    this.audioListener = new THREE.AudioListener();
    this.camera.add(this.audioListener);
    this.camera.layers.enable(1);
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

      transformChanged: new Signal(),
      transformModeChanged: new Signal(),
      snapToggled: new Signal(),
      snapValueChanged: new Signal(),
      spaceChanged: new Signal(),
      viewportInitialized: new Signal(),

      sceneGraphChanged: new Signal(),
      sceneSet: new Signal(),
      sceneModified: new Signal(),
      sceneRendered: new Signal(),

      objectSelected: new Signal(),
      objectFocused: new Signal(),

      objectAdded: new Signal(),
      objectChanged: new Signal(),
      objectRemoved: new Signal(),

      editorError: new Signal(),

      windowResize: new Signal(),

      historyChanged: new Signal()
    };

    this._ignoreSceneModification = false;
    this.ignoreNextSceneFileChange = false;
    this.signals.sceneGraphChanged.add(this.onSceneGraphChanged);
    this.signals.objectChanged.add(this.onObjectChanged);
    this.signals.objectSelected.add(this.onObjectSelected);

    this.history = new History(this);
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

  async loadNewScene() {
    this.clearCaches();

    const scene = new SceneNode(this);
    scene.name = "Untitled";
    this.setScene(scene);

    this._addObject(new SkyboxNode(this));
    const directionalLight = new DirectionalLightNode(this);
    directionalLight.position.set(-1, 3, 0);
    directionalLight.rotation.set(Math.PI * 0.5, Math.PI * (0.5 / 3.0), -Math.PI * 0.5);
    this._addObject(directionalLight);
    this._addObject(new SpawnPointNode(this));
    this._addObject(new GroundPlaneNode(this));
    this._addObject(new FloorPlanNode(this));

    this.scene.traverse(node => {
      if (node.isNode) {
        node.onRendererChanged();
      }
    });

    this.signals.sceneGraphChanged.dispatch();
    this.sceneModified = true;
    this.signals.sceneModified.dispatch();

    return scene;
  }

  async loadProject(json) {
    this.clearCaches();

    const scene = await SceneNode.loadProject(this, json);

    this.setScene(scene);

    this.scene.traverse(node => {
      if (node.isNode) {
        node.onRendererChanged();
      }
    });

    return scene;
  }

  setScene(scene) {
    this.scene = scene;

    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(new THREE.Vector3());
    this.scene.add(this.camera);

    this.history.clear();
    this.deselect();
    this.signals.sceneSet.dispatch();
    this.signals.sceneGraphChanged.dispatch();
    this.sceneModified = false;
  }

  async exportScene() {
    const scene = this.scene;

    const floorPlanNode = scene.findNodeByType(FloorPlanNode);

    if (floorPlanNode) {
      await floorPlanNode.generate();
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

    // De-duplicate images.
    const imageDefs = chunks.json.images;
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
      chunks.json.images = uniqueImageDefs;
      chunks.images = uniqueImages;
      for (const textureDef of chunks.json.textures) {
        textureDef.source = imageIndexMap.get(textureDef.source);
      }
    }

    const nodeDefs = chunks.json.nodes;
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
        if (nodeDef.extensions && nodeDef.extensions.HUBS_components) {
          const components = nodeDef.extensions.HUBS_components;
          for (const componentName in components) {
            const component = components[componentName];

            for (const propertyName in component) {
              const property = component[propertyName];

              if (typeof property === "object" && property.__gltfIndexForUUID) {
                component[propertyName] = uuidToIndexMap[property.__gltfIndexForUUID];
              }
            }
          }
        }
      }
    }

    return await new Promise((resolve, reject) => {
      exporter.createGLBBlob(chunks, resolve, e => {
        reject(new Error(`Error creating glb blob. ${eventToMessage(e)}`));
      });
    });
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
      }
    });

    object.parent.remove(object);
  }

  setTransformMode(mode) {
    this.signals.transformModeChanged.dispatch(mode);
  }

  registerNode(nodeConstructor, nodeEditor) {
    this.nodeTypes.add(nodeConstructor);
    this.nodeEditors.set(nodeConstructor, nodeEditor);
  }

  getNodeEditor(node) {
    return this.nodeEditors.get(node.constructor);
  }

  _getSetNodePropertyCommand(node, propertyName, value) {
    switch (propertyName) {
      case "position":
        return new SetPositionCommand(node, value);
      case "rotation":
        return new SetRotationCommand(node, value);
      case "scale":
        return new SetScaleCommand(node, value);
      default:
        return new SetObjectPropertyCommand(node, propertyName, value);
    }
  }

  setNodeProperty(node, propertyName, value) {
    const command = this._getSetNodePropertyCommand(node, propertyName, value);
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

    this.signals.objectFocused.dispatch(object);
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
    if (object === this.scene) {
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

  async takeScreenshot() {
    this.deselect();
    return this.viewport.takeScreenshot();
  }
}
