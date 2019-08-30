import EventEmitter from "eventemitter3";
import {
  Matrix4,
  Vector2,
  Vector3,
  Quaternion,
  PropertyBinding,
  PerspectiveCamera,
  AudioListener,
  Raycaster,
  Clock,
  Color
} from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import History from "./History";
import Renderer from "./renderer/Renderer";

import SceneNode from "./nodes/SceneNode";
import FloorPlanNode from "./nodes/FloorPlanNode";

import LoadingCube from "./objects/LoadingCube";
import TransformGizmo from "./objects/TransformGizmo";
import SpokeInfiniteGridHelper from "./helpers/SpokeInfiniteGridHelper";

import GLTFCache from "./caches/GLTFCache";
import TextureCache from "./caches/TextureCache";

import getDetachedObjectsRoots from "./utils/getDetachedObjectsRoots";
import { loadEnvironmentMap } from "./utils/EnvironmentMap";
import makeUniqueName from "./utils/makeUniqueName";
import eventToMessage from "./utils/eventToMessage";
import cloneObject3D from "./utils/cloneObject3D";
import isEmptyObject from "./utils/isEmptyObject";
import getIntersectingNode from "./utils/getIntersectingNode";
import { generateImageFileThumbnail, generateVideoFileThumbnail } from "./utils/thumbnails";
import resizeShadowCameraFrustum from "./utils/resizeShadowCameraFrustum";

import InputManager from "./controls/InputManager";
import FlyControls from "./controls/FlyControls";
import SpokeControls from "./controls/SpokeControls";
import PlayModeControls from "./controls/PlayModeControls";

import AddMultipleObjectsCommand from "./commands/AddMultipleObjectsCommand";
import AddObjectCommand from "./commands/AddObjectCommand";
import DeselectCommand from "./commands/DeselectCommand";
import DeselectMultipleCommand from "./commands/DeselectMultipleCommand";
import DuplicateCommand from "./commands/DuplicateCommand";
import DuplicateMultipleCommand from "./commands/DuplicateMultipleCommand";
import RemoveMultipleObjectsCommand from "./commands/RemoveMultipleObjectsCommand";
import RemoveObjectCommand from "./commands/RemoveObjectCommand";
import ReparentCommand from "./commands/ReparentCommand";
import ReparentMultipleCommand from "./commands/ReparentMultipleCommand";
import RotateAroundCommand from "./commands/RotateAroundCommand";
import RotateAroundMultipleCommand from "./commands/RotateAroundMultipleCommand";
import RotateOnAxisCommand from "./commands/RotateOnAxisCommand";
import RotateOnAxisMultipleCommand from "./commands/RotateOnAxisMultipleCommand";
import ScaleCommand from "./commands/ScaleCommand";
import ScaleMultipleCommand from "./commands/ScaleMultipleCommand";
import SelectCommand from "./commands/SelectCommand";
import SelectMultipleCommand from "./commands/SelectMultipleCommand";
import SetPositionCommand from "./commands/SetPositionCommand";
import SetPositionMultipleCommand from "./commands/SetPositionMultipleCommand";
import SetPropertiesCommand from "./commands/SetPropertiesCommand";
import SetPropertiesMultipleCommand from "./commands/SetPropertiesMultipleCommand";
import SetPropertyCommand from "./commands/SetPropertyCommand";
import SetPropertyMultipleCommand from "./commands/SetPropertyMultipleCommand";
import SetRotationCommand from "./commands/SetRotationCommand";
import SetRotationMultipleCommand from "./commands/SetRotationMultipleCommand";
import SetScaleCommand from "./commands/SetScaleCommand";
import SetScaleMultipleCommand from "./commands/SetScaleMultipleCommand";
import SetSelectionCommand from "./commands/SetSelectionCommand";
import TranslateCommand from "./commands/TranslateCommand";
import TranslateMultipleCommand from "./commands/TranslateMultipleCommand";

const tempMatrix1 = new Matrix4();
const tempMatrix2 = new Matrix4();
const tempMatrix3 = new Matrix4();
const tempMatrix4 = new Matrix4();
const tempMatrix5 = new Matrix4();
const tempQuaternion1 = new Quaternion();
const tempQuaternion2 = new Quaternion();
const tempVector1 = new Vector3();

export const TransformSpace = {
  World: "World",
  Local: "Local",
  LocalSelection: "LocalSelection" // The local space of the last selected object
  // TODO: Viewport, Cursor?
};

let resolveRenderer;
let rejectRenderer;
const rendererPromise = new Promise((resolve, reject) => {
  resolveRenderer = resolve;
  rejectRenderer = reject;
});

export default class Editor extends EventEmitter {
  constructor(api) {
    super();
    this.api = api;
    this.projectId = null;

    this.selected = [];
    this.selectedTransformRoots = [];

    this.history = new History();

    this.renderer = null;
    this.inputManager = null;
    this.spokeControls = null;
    this.flyControls = null;
    this.playModeControls = null;

    this.nodeTypes = new Set();
    this.nodeEditors = new Map();

    this.textureCache = new TextureCache();
    this.gltfCache = new GLTFCache(this.textureCache);

    this.scene = new SceneNode(this);
    this.sceneModified = false;
    this.sceneLoaded = false;

    this.camera = new PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.2, 8000);
    this.audioListener = new AudioListener();
    this.camera.add(this.audioListener);
    this.camera.layers.enable(1);
    this.camera.name = "Camera";

    this.grid = new SpokeInfiniteGridHelper();

    this.nodes = [this.scene];

    this.raycaster = new Raycaster();
    // Center at 0, 0
    this.centerScreenSpace = new Vector2();
    this.clock = new Clock();
    this.disableUpdate = false;
    this.initialized = false;
  }

  registerNode(nodeConstructor, nodeEditor) {
    this.nodeTypes.add(nodeConstructor);
    this.nodeEditors.set(nodeConstructor, nodeEditor);
  }

  getNodeEditor(node) {
    return this.nodeEditors.get(node.constructor);
  }

  async init() {
    const tasks = [rendererPromise, loadEnvironmentMap(), LoadingCube.load(), TransformGizmo.load()];

    for (const NodeConstructor of this.nodeTypes) {
      tasks.push(NodeConstructor.load());
    }

    await Promise.all(tasks);

    this.inputManager = new InputManager(this.renderer.canvas);
    this.flyControls = new FlyControls(this.camera, this.inputManager);
    this.spokeControls = new SpokeControls(this.camera, this, this.inputManager, this.flyControls);
    this.playModeControls = new PlayModeControls(this.inputManager, this.spokeControls, this.flyControls);
    this.spokeControls.enable();

    this.rafId = requestAnimationFrame(this.update);

    this.initialized = true;

    this.emit("initialized");
  }

  initializeRenderer(canvas) {
    try {
      this.renderer = new Renderer(this, canvas);
      resolveRenderer();
    } catch (error) {
      rejectRenderer(error);
    }
  }

  clearCaches() {
    this.textureCache.disposeAndClear();
    this.gltfCache.disposeAndClear();
  }

  async loadProject(json, onProgress) {
    this.clearCaches();

    this.removeObject(this.scene);

    const scene = await SceneNode.loadProject(this, json, onProgress);

    this.sceneLoaded = true;
    this.scene = scene;
    this.sceneUrl = null;

    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(new Vector3());
    this.scene.add(this.camera);

    this.scene.add(this.grid);

    this.spokeControls.center.set(0, 0, 0);
    this.spokeControls.onSceneSet(scene);
    scene.background = new Color(0xaaaaaa);

    this.addObject(this.scene);

    this.deselectAll();

    this.history.clear();

    this.renderer.onSceneSet();

    this.sceneModified = false;

    this.scene.traverse(node => {
      if (node.isNode) {
        node.onRendererChanged();
      }
    });

    this.emit("sceneGraphChanged");

    return scene;
  }

  async exportScene(signal) {
    const scene = this.scene;

    const floorPlanNode = scene.findNodeByType(FloorPlanNode);

    if (floorPlanNode) {
      await floorPlanNode.generate(signal);
    }

    const clonedScene = cloneObject3D(scene, true);
    const animations = clonedScene.getAnimationClips();

    for (const clip of animations) {
      for (const track of clip.tracks) {
        const { nodeName: uuid } = PropertyBinding.parseTrackName(track.name);

        const object = clonedScene.getObjectByProperty("uuid", uuid);

        if (!object) {
          const originalSceneObject = scene.getObjectByProperty("uuid", uuid);

          if (originalSceneObject) {
            console.log(`Couldn't find object with uuid: "${uuid}" in cloned scene but was found in original scene!`);
          } else {
            console.log(`Couldn't find object with uuid: "${uuid}" in cloned or original scene!`);
          }
        }
      }
    }

    const exportContext = { animations };

    // Add a preview camera to the exported GLB if there is a transform in the metadata.
    const previewCamera = this.camera.clone();
    previewCamera.name = "scene-preview-camera";
    previewCamera.userData.gltfExtensions = {
      MOZ_hubs_components: {
        "scene-preview-camera": {}
      }
    };
    clonedScene.add(previewCamera);

    clonedScene.prepareForExport(exportContext);
    await clonedScene.combineMeshes();
    clonedScene.removeUnusedObjects();

    const exporter = new GLTFExporter();
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
          includeCustomExtensions: true,
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
      version: 3
    };

    json.asset.generator = `Mozilla Spoke ${process.env.BUILD_VERSION}`;

    return await new Promise((resolve, reject) => {
      exporter.createGLBBlob(chunks, resolve, e => {
        reject(new Error(`Error creating glb blob. ${eventToMessage(e)}`));
      });
    });
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

    if (this.spokeControls.snapEnabled) {
      const translationSnap = this.spokeControls.translationSnap;

      target.set(
        Math.round(target.x / translationSnap) * translationSnap,
        Math.round(target.y / translationSnap) * translationSnap,
        Math.round(target.z / translationSnap) * translationSnap
      );
    }
  }

  async takeScreenshot(width, height) {
    return this.renderer.takeScreenshot(width, height);
  }

  async generateFileThumbnail(file, width, height) {
    const url = URL.createObjectURL(file);

    let blob;

    if (file.name.toLowerCase().endsWith(".glb")) {
      const gltf = await new Promise((resolve, reject) => new GLTFLoader().load(url, resolve, undefined, reject));
      blob = await this.renderer.generateThumbnail(gltf.scene, width, height);
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
    this.deselectAll();
    this.camera.layers.disable(1);
    this.playModeControls.enable();
    this.scene.traverse(node => {
      if (node.isNode) {
        node.onPlay();
      }
    });
  }

  leavePlayMode() {
    this.playing = false;
    this.camera.layers.enable(1);
    this.playModeControls.disable();
    this.scene.traverse(node => {
      if (node.isNode) {
        node.onPause();
      }
    });
  }

  update = () => {
    if (!this.disableUpdate) {
      const delta = this.clock.getDelta();
      const time = this.clock.getElapsedTime();
      this.scene.updateMatrixWorld();
      this.inputManager.update(delta, time);

      this.scene.traverse(node => {
        if (node.isDirectionalLight) {
          resizeShadowCameraFrustum(node, this.scene);
        }

        if (node.isNode) {
          node.onUpdate(delta, time);
        }
      });
      this.flyControls.update(delta);
      this.spokeControls.update(delta);

      this.renderer.update();
      this.inputManager.reset();
    }

    this.rafId = requestAnimationFrame(this.update);
  };

  onResize = () => {
    this.inputManager.onResize();
    this.renderer.onResize();
  };

  undo() {
    this.history.undo();
  }

  redo() {
    this.history.redo();
  }

  select(object, useHistory = true, emitEvent = true, updateTransformRoots = true) {
    if (this.selected.indexOf(object) !== -1) {
      return this.selected;
    }

    if (useHistory) {
      return this.history.execute(new SelectCommand(this, object));
    }

    this.selected.push(object);

    if (object.isNode) {
      object.onSelect();
    }

    if (updateTransformRoots) {
      this.updateTransformRoots();
    }

    if (emitEvent) {
      this.emit("selectionChanged");
    }

    return this.selected;
  }

  selectMultiple(objects, useHistory = true, emitEvent = true, updateTransformRoots = true) {
    let selectionChanged = false;

    for (let i = 0; i < objects.length; i++) {
      if (this.selected.indexOf(objects[i]) === -1) {
        selectionChanged = true;
        break;
      }
    }

    if (!selectionChanged) {
      return this.selected;
    }

    if (useHistory) {
      return this.history.execute(new SelectMultipleCommand(this, objects));
    }

    for (let i = 0; i < objects.length; i++) {
      this.select(objects[i], false, false, false);
    }

    if (emitEvent) {
      this.emit("selectionChanged");
    }

    if (updateTransformRoots) {
      this.updateTransformRoots();
    }

    return this.selected;
  }

  selectAll(useHistory = true, emitEvent = true, updateTransformRoots = true) {
    return this.setSelection(this.nodes, useHistory, emitEvent, updateTransformRoots);
  }

  deselect(object, useHistory = true, emitEvent = true, updateTransformRoots = true) {
    const index = this.selected.indexOf(object);

    if (index === -1) {
      return this.selected;
    }

    if (useHistory) {
      return this.history.execute(new DeselectCommand(this, object));
    }

    this.selected.splice(index, 1);

    if (object.isNode) {
      object.onDeselect();
    }

    if (emitEvent) {
      this.emit("selectionChanged");
    }

    if (updateTransformRoots) {
      this.updateTransformRoots();
    }

    return this.selected;
  }

  deselectMultiple(objects, useHistory = true, emitEvent = true, updateTransformRoots = true) {
    let selectionChanged = false;

    for (let i = 0; i < objects.length; i++) {
      if (this.selected.indexOf(objects[i]) !== -1) {
        selectionChanged = true;
        break;
      }
    }

    if (!selectionChanged) {
      return this.selected;
    }

    if (useHistory) {
      return this.history.execute(new DeselectMultipleCommand(this, objects));
    }

    for (let i = 0; i < objects.length; i++) {
      this.deselect(objects[i], false, false, false);
    }

    if (emitEvent) {
      this.emit("selectionChanged");
    }

    if (updateTransformRoots) {
      this.updateTransformRoots();
    }

    return this.selected;
  }

  deselectAll(useHistory = true, emitEvent = true, updateTransformRoots = true) {
    return this.setSelection([], useHistory, emitEvent, updateTransformRoots);
  }

  toggleSelection(object, useHistory = true, emitEvent = true, updateTransformRoots = true) {
    if (this.selected.indexOf(object) !== -1) {
      return this.deselect(object, useHistory, emitEvent, updateTransformRoots);
    } else {
      return this.select(object, useHistory, emitEvent, updateTransformRoots);
    }
  }

  setSelection(objects, useHistory = true, emitEvent = true, updateTransformRoots = true) {
    if (objects.length === this.selected.length) {
      let equalSelection = true;

      for (let i = 0; i < objects.length; i++) {
        // TODO: Should selection order matter?
        if (this.selected[i] !== objects[i]) {
          equalSelection = false;
          break;
        }
      }

      if (equalSelection) {
        return this.selected;
      }
    }

    if (useHistory) {
      return this.history.execute(new SetSelectionCommand(this, objects));
    }

    const prevSelected = this.selected.slice(0);

    for (let i = this.selected.length - 1; i >= 0; i--) {
      const object = this.selected.pop();

      if (object.isNode && objects.indexOf(object) === -1) {
        object.onDeselect();
      }
    }

    for (let i = 0; i < objects.length; i++) {
      const object = objects[i];

      this.selected.push(object);

      if (object.isNode && prevSelected.indexOf(object) === -1) {
        object.onSelect();
      }
    }

    if (emitEvent) {
      this.emit("selectionChanged");
    }

    if (updateTransformRoots) {
      this.updateTransformRoots();
    }

    return this.selected;
  }

  addObject(object, parent, before, useHistory = true, emitEvent = true, selectObject = true) {
    // TODO: Add makeUniqueName option
    if (useHistory) {
      return this.history.execute(new AddObjectCommand(this, object, parent, before));
    }

    object.saveParent = true;

    if (parent !== undefined) {
      if (before !== undefined) {
        const index = parent.children.indexOf(before);

        if (index === -1) {
          throw new Error("addObject: before object not found");
        }

        parent.children.splice(index, 0, object);
        object.parent = parent;
      } else {
        parent.add(object);
      }
    } else if (object !== this.scene) {
      this.scene.add(object);
    }

    object.traverse(child => {
      if (child.isNode) {
        child.onAdd();
        this.nodes.push(child);
      }
    });

    object.updateMatrixWorld(true);

    if (selectObject) {
      this.setSelection([object], false, emitEvent);
    }

    if (emitEvent) {
      this.emit("sceneGraphChanged");
    }

    return object;
  }

  addMultipleObjects(objects, parent, before, useHistory = true, emitEvent = true, selectObjects = true) {
    if (useHistory) {
      return this.history.execute(new AddMultipleObjectsCommand(this, objects, parent, before));
    }

    const rootObjects = getDetachedObjectsRoots(objects);

    for (let i = 0; i < rootObjects.length; i++) {
      this.addObject(rootObjects[i], parent, before, false, false, false);
    }

    if (selectObjects) {
      this.setSelection(objects, false, emitEvent);
    }

    if (emitEvent) {
      this.emit("sceneGraphChanged");
    }

    return rootObjects;
  }

  _addMultipleObjectsWithParentsAndBefores(objects, parents, befores, oldNodes, emitEvent = true) {
    // Only use the roots of the objects array so that we don't add objects multiple times
    const rootObjects = getDetachedObjectsRoots(objects);

    // Add objects in reverse order so that befores are added first
    for (let i = rootObjects.length - 1; i >= 0; i--) {
      const rootObject = rootObjects[i];
      const rootIndex = objects.indexOf(rootObject);
      this.addObject(rootObject, parents[rootIndex], befores[rootIndex], false, false, false);
    }

    // Nodes are now out of order. Restore the old nodes list.
    this.nodes.length = 0;

    for (let i = 0; i < oldNodes.length; i++) {
      this.nodes.push(oldNodes[i]);
    }

    if (emitEvent) {
      this.emit("sceneGraphChanged");
    }
  }

  removeObject(object, useHistory = true, emitEvent = true, deselectObject = true) {
    if (useHistory) {
      return this.history.execute(new RemoveObjectCommand(this, object));
    }

    if (object.parent === null) return null; // avoid deleting the camera or scene

    object.traverse(child => {
      if (child.isNode) {
        child.onRemove();
        const index = this.nodes.indexOf(child);

        if (index === -1) {
          throw new Error(
            "removeObject: node not found. This is due to removing a node that is no longer in the scene."
          );
        }

        this.nodes.splice(index, 1);
      }
    });

    object.parent.remove(object);

    if (deselectObject) {
      this.deselect(object, false, emitEvent);
    }

    if (emitEvent) {
      this.emit("sceneGraphChanged");
    }

    return object;
  }

  removeMultipleObjects(objects, useHistory = true, emitEvent = true, deselectObjects = true) {
    if (useHistory) {
      return this.history.execute(new RemoveMultipleObjectsCommand(this, objects));
    }

    const transformRoots = this.getTransformRoots(objects);

    for (let i = 0; i < transformRoots.length; i++) {
      this.removeObject(transformRoots[i], false, false, false);
    }

    if (deselectObjects) {
      this.deselectMultiple(objects, false, emitEvent);
    }

    if (emitEvent) {
      this.emit("sceneGraphChanged");
    }

    return transformRoots;
  }

  removeSelectedObjects(useHistory = true, emitEvent = true, deselectObjects = true) {
    return this.removeMultipleObjects(this.selected, useHistory, emitEvent, deselectObjects);
  }

  duplicate(object, parent, before, useHistory = true, emitEvent = true, selectObject = true) {
    if (useHistory) {
      return this.history.execute(new DuplicateCommand(this, object, parent, before));
    }

    if (!object.constructor.canAddNode(this)) {
      return;
    }

    const clonedObject = object.clone();

    clonedObject.traverse(o => {
      if (o.isNode) {
        makeUniqueName(this.scene, o);
      }
    });

    this.addObject(clonedObject, parent, before, false, false, false);

    if (selectObject) {
      this.setSelection([clonedObject], false, true, false);
    }

    this.updateTransformRoots();

    if (emitEvent) {
      this.emit("sceneGraphChanged");
    }

    return clonedObject;
  }

  duplicateMultiple(objects, parent, before, useHistory = true, emitEvent = true, selectObjects = true) {
    if (useHistory) {
      return this.history.execute(new DuplicateMultipleCommand(this, objects, parent, before));
    }

    const validNodes = objects.filter(object => object.constructor.canAddNode(this));
    const duplicatedRoots = getDetachedObjectsRoots(validNodes).map(object => object.clone());

    for (let i = 0; i < duplicatedRoots.length; i++) {
      duplicatedRoots[i].traverse(o => {
        if (o.isNode) {
          makeUniqueName(this.scene, o);
        }
      });
    }

    this.addMultipleObjects(duplicatedRoots, parent, before, false, false, false);

    if (selectObjects) {
      this.setSelection(duplicatedRoots, false, true, false);
    }

    this.updateTransformRoots();

    if (emitEvent) {
      this.emit("sceneGraphChanged");
    }

    return duplicatedRoots;
  }

  duplicateSelected(parent, before, useHistory = true, emitEvent = true, selectObject = true) {
    this.duplicateMultiple(this.selected, parent, before, useHistory, emitEvent, selectObject);
  }

  reparent(object, newParent, newBefore, useHistory = true, emitEvent = true, selectObject = true) {
    if (!object.parent) {
      throw new Error("Object has no parent. Reparent only works on objects that are currently in the scene.");
    }

    if (!newParent) {
      throw new Error("editor.reparent: newParent is undefined");
    }

    if (useHistory) {
      return this.history.execute(new ReparentCommand(this, object, newParent, newBefore));
    }

    if (newParent !== object.parent) {
      // Maintain world position when reparenting.
      newParent.updateMatrixWorld();

      tempMatrix1.getInverse(newParent.matrixWorld);

      object.parent.updateMatrixWorld();
      tempMatrix1.multiply(object.parent.matrixWorld);

      object.applyMatrix(tempMatrix1);

      object.updateWorldMatrix(false, false);
    }

    const objectIndex = object.parent.children.indexOf(object);
    object.parent.children.splice(objectIndex, 1);

    if (newBefore) {
      const newObjectIndex = newParent.children.indexOf(newBefore);
      newParent.children.splice(newObjectIndex, 0, object);
    } else {
      newParent.children.push(object);
    }

    object.parent = newParent;

    object.updateMatrixWorld(true);

    if (selectObject) {
      this.setSelection([object], false, emitEvent, false);
    }

    this.updateTransformRoots();

    if (emitEvent) {
      this.emit("sceneGraphChanged");
    }

    return object;
  }

  reparentMultiple(objects, newParent, newBefore, useHistory = true, emitEvent = true, selectObjects = true) {
    if (useHistory) {
      return this.history.execute(new ReparentMultipleCommand(this, objects, newParent, newBefore));
    }

    for (let i = 0; i < objects.length; i++) {
      this.reparent(objects[i], newParent, newBefore, false, false, false);
    }

    if (selectObjects) {
      this.setSelection(objects, false, emitEvent, false);
    }

    this.updateTransformRoots();

    if (emitEvent) {
      this.emit("sceneGraphChanged");
    }

    return objects;
  }

  reparentSelected(newParent, newBefore, useHistory = true, emitEvent = true, selectObjects = true) {
    return this.reparentMultiple(this.selected, newParent, newBefore, useHistory, emitEvent, selectObjects);
  }

  setPosition(object, position, space = TransformSpace.World, useHistory = true, emitEvent = true) {
    if (useHistory) {
      return this.history.execute(new SetPositionCommand(this, object, position, space));
    }

    if (space === TransformSpace.Local) {
      object.position.copy(position);
    } else {
      object.updateMatrixWorld(); // Update parent world matrices

      tempVector1.copy(position);

      let spaceMatrix;

      if (space === TransformSpace.World) {
        spaceMatrix = object.parent.matrixWorld;
      } else if (space === TransformSpace.LocalSelection) {
        if (this.selected.length > 0) {
          const lastSelectedObject = this.selected[this.selected.length - 1];
          lastSelectedObject.updateMatrixWorld();
          spaceMatrix = lastSelectedObject.parent.matrixWorld;
        } else {
          spaceMatrix = tempMatrix1.identity();
        }
      } else {
        spaceMatrix = space;
      }

      tempMatrix1.getInverse(spaceMatrix);
      tempVector1.applyMatrix4(tempMatrix1);
      object.position.copy(tempVector1);
    }

    object.updateMatrixWorld(true);

    object.onChange("position");

    if (emitEvent) {
      this.emit("objectsChanged", [object], "position");
    }

    return object;
  }

  setPositionMultiple(objects, position, space = TransformSpace.World, useHistory = true, emitEvent = true) {
    if (useHistory) {
      return this.history.execute(new SetPositionMultipleCommand(this, objects, position, space));
    }

    if (space === TransformSpace.LocalSelection) {
      if (this.selected.length > 0) {
        const lastSelectedObject = this.selected[this.selected.length - 1];
        lastSelectedObject.updateMatrixWorld();
        space = lastSelectedObject.parent.matrixWorld;
      } else {
        space = tempMatrix1.identity();
      }
    }

    for (let i = 0; i < objects.length; i++) {
      this.setPosition(objects[i], position, space, false, false);
    }

    if (emitEvent) {
      this.emit("objectsChanged", objects, "position");
    }

    return objects;
  }

  setPositionSelected(position, space = TransformSpace.World, useHistory = true, emitEvent = true) {
    return this.setPositionMultiple(this.selectedTransformRoots, position, space, useHistory, emitEvent);
  }

  translate(object, translation, space = TransformSpace.World, useHistory = true, emitEvent = true) {
    if (useHistory) {
      return this.history.execute(new TranslateCommand(this, object, translation, space));
    }

    if (space === TransformSpace.Local) {
      object.position.add(translation);
    } else {
      object.updateMatrixWorld(); // Update parent world matrices
      tempVector1.setFromMatrixPosition(object.matrixWorld);
      tempVector1.add(translation);

      let spaceMatrix;

      if (space === TransformSpace.World) {
        spaceMatrix = object.parent.matrixWorld;
      } else if (space === TransformSpace.LocalSelection) {
        if (this.selected.length > 0) {
          const lastSelectedObject = this.selected[this.selected.length - 1];
          lastSelectedObject.updateMatrixWorld();
          spaceMatrix = lastSelectedObject.parent.matrixWorld;
        } else {
          spaceMatrix = tempMatrix1.identity();
        }
      } else {
        spaceMatrix = space;
      }

      tempMatrix1.getInverse(spaceMatrix);
      tempVector1.applyMatrix4(tempMatrix1);
      object.position.copy(tempVector1);
    }

    object.updateMatrixWorld(true);

    object.onChange("position");

    if (emitEvent) {
      this.emit("objectsChanged", [object], "position");
    }

    return object;
  }

  translateMultiple(objects, translation, space = TransformSpace.World, useHistory = true, emitEvent = true) {
    if (useHistory) {
      return this.history.execute(new TranslateMultipleCommand(this, objects, translation, space));
    }

    if (space === TransformSpace.LocalSelection) {
      if (this.selected.length > 0) {
        const lastSelectedObject = this.selected[this.selected.length - 1];
        lastSelectedObject.updateMatrixWorld();
        space = lastSelectedObject.parent.matrixWorld;
      } else {
        space = tempMatrix1.identity();
      }
    }

    for (let i = 0; i < objects.length; i++) {
      this.translate(objects[i], translation, space, false, false);
    }

    if (emitEvent) {
      this.emit("objectsChanged", objects, "position");
    }

    return objects;
  }

  translateSelected(translation, space = TransformSpace.World, useHistory = true, emitEvent = true) {
    return this.translateMultiple(this.selectedTransformRoots, translation, space, useHistory, emitEvent);
  }

  setRotation(object, rotation, space = TransformSpace.World, useHistory = true, emitEvent = true) {
    if (useHistory) {
      return this.history.execute(new SetRotationCommand(this, object, rotation, space));
    }

    if (space === TransformSpace.Local) {
      object.rotation.copy(rotation);
    } else {
      object.updateMatrixWorld(); // Update parent world matrices

      let spaceMatrix;

      if (space === TransformSpace.World) {
        spaceMatrix = object.parent.matrixWorld;
      } else if (space === TransformSpace.LocalSelection) {
        if (this.selected.length > 0) {
          const lastSelectedObject = this.selected[this.selected.length - 1];
          lastSelectedObject.updateMatrixWorld();
          spaceMatrix = lastSelectedObject.parent.matrixWorld;
        } else {
          spaceMatrix = tempMatrix1.identity();
        }
      } else {
        spaceMatrix = space;
      }

      const newWorldQuaternion = tempQuaternion1.setFromEuler(rotation);
      const inverseParentWorldQuaternion = tempQuaternion2.setFromRotationMatrix(spaceMatrix).inverse();
      const newLocalQuaternion = inverseParentWorldQuaternion.multiply(newWorldQuaternion);
      object.quaternion.copy(newLocalQuaternion);
    }

    object.updateMatrixWorld(true);

    object.onChange("rotation");

    if (emitEvent) {
      this.emit("objectsChanged", [object], "rotation");
    }

    return object;
  }

  setRotationMultiple(objects, rotation, space = TransformSpace.World, useHistory = true, emitEvent = true) {
    if (useHistory) {
      return this.history.execute(new SetRotationMultipleCommand(this, objects, rotation, space));
    }

    if (space === TransformSpace.LocalSelection) {
      if (this.selected.length > 0) {
        const lastSelectedObject = this.selected[this.selected.length - 1];
        lastSelectedObject.updateMatrixWorld();
        space = lastSelectedObject.parent.matrixWorld;
      } else {
        space = tempMatrix1.identity();
      }
    }

    for (let i = 0; i < objects.length; i++) {
      this.setRotation(objects[i], rotation, space, false, false);
    }

    if (emitEvent) {
      this.emit("objectsChanged", objects, "rotation");
    }

    return objects;
  }

  setRotationSelected(rotation, space = TransformSpace.World, useHistory = true, emitEvent = true) {
    return this.setRotationMultiple(this.selectedTransformRoots, rotation, space, useHistory, emitEvent);
  }

  rotateOnAxis(object, axis, angle, space = TransformSpace.World, useHistory = true, emitEvent = true) {
    if (useHistory) {
      return this.history.execute(new RotateOnAxisCommand(this, object, axis, angle, space));
    }

    if (space === TransformSpace.Local) {
      object.rotateOnAxis(axis, angle);
    } else if (space === TransformSpace.World) {
      object.rotateOnWorldAxis(axis, angle);
    } else {
      object.updateMatrixWorld(); // Update parent world matrices

      let spaceMatrix;

      if (space === TransformSpace.LocalSelection) {
        if (this.selected.length > 0) {
          const lastSelectedObject = this.selected[this.selected.length - 1];
          lastSelectedObject.updateMatrixWorld();
          space = lastSelectedObject.parent.matrixWorld;
        } else {
          space = tempMatrix1.identity();
        }
      } else {
        spaceMatrix = space;
      }

      tempMatrix1.getInverse(spaceMatrix);
      tempVector1.copy(axis).applyMatrix4(tempMatrix1);

      object.rotateOnAxis(tempVector1, angle);
    }

    object.updateMatrixWorld(true);

    object.onChange("position");

    if (emitEvent) {
      this.emit("objectsChanged", [object], "position");
    }

    return object;
  }

  rotateOnAxisMultiple(objects, axis, angle, space = TransformSpace.World, useHistory = true, emitEvent = true) {
    if (useHistory) {
      return this.history.execute(new RotateOnAxisMultipleCommand(this, objects, axis, angle, space));
    }

    if (space === TransformSpace.LocalSelection) {
      if (this.selected.length > 0) {
        const lastSelectedObject = this.selected[this.selected.length - 1];
        lastSelectedObject.updateMatrixWorld();
        space = lastSelectedObject.parent.matrixWorld;
      } else {
        space = tempMatrix1.identity();
      }
    }

    for (let i = 0; i < objects.length; i++) {
      this.rotateOnAxis(objects[i], axis, angle, space, false, false);
    }

    if (emitEvent) {
      this.emit("objectsChanged", objects, "rotation");
    }

    return objects;
  }

  rotateOnAxisSelected(axis, angle, space = TransformSpace.World, useHistory = true, emitEvent = true) {
    return this.rotateOnAxisMultiple(this.selectedTransformRoots, axis, angle, space, useHistory, emitEvent);
  }

  rotateAround(object, pivot, axis, angle, useHistory = true, emitEvent = true) {
    if (useHistory) {
      return this.history.execute(new RotateAroundCommand(this, object, pivot, axis, angle));
    }

    object.updateMatrixWorld();

    const matrixWorld = tempMatrix1.copy(object.matrixWorld);
    const inverseParentMatrixWorld = tempMatrix2.getInverse(object.parent.matrixWorld);

    const pivotToOriginMatrix = tempMatrix3.makeTranslation(-pivot.x, -pivot.y, -pivot.z);
    const originToPivotMatrix = tempMatrix4.makeTranslation(pivot.x, pivot.y, pivot.z);

    const rotationMatrix = tempMatrix5.makeRotationAxis(axis, angle);

    matrixWorld
      .premultiply(pivotToOriginMatrix)
      .premultiply(rotationMatrix)
      .premultiply(originToPivotMatrix)
      .premultiply(inverseParentMatrixWorld)
      .decompose(object.position, object.quaternion, object.scale);

    object.updateMatrixWorld();

    if (emitEvent) {
      this.emit("objectsChanged", [object], "matrix");
    }

    return object;
  }

  rotateAroundMultiple(objects, pivot, axis, angle, useHistory = true, emitEvent = true) {
    if (useHistory) {
      return this.history.execute(new RotateAroundMultipleCommand(this, objects, pivot, axis, angle));
    }

    for (let i = 0; i < objects.length; i++) {
      this.rotateAround(objects[i], pivot, axis, angle, false, false);
    }

    if (emitEvent) {
      this.emit("objectsChanged", objects, "matrix");
    }

    return objects;
  }

  rotateAroundSelected(pivot, axis, angle, useHistory = true, emitEvent = true) {
    return this.rotateAroundMultiple(this.selectedTransformRoots, pivot, axis, angle, useHistory, emitEvent);
  }

  scale(object, scale, space = TransformSpace.World, useHistory = true, emitEvent = true) {
    if (useHistory) {
      return this.history.execute(new ScaleCommand(this, object, scale, space));
    }

    if (space === TransformSpace.World && (scale.x !== scale.y || scale.x !== scale.z || scale.y !== scale.z)) {
      console.warn("Scaling an object in world space with a non-uniform scale is not supported");
    }

    object.scale.multiply(scale);

    object.updateMatrixWorld(true);

    object.onChange("scale");

    if (emitEvent) {
      this.emit("objectsChanged", [object], "scale");
    }

    return object;
  }

  scaleMultiple(objects, scale, space = TransformSpace.World, useHistory = true, emitEvent = true) {
    if (useHistory) {
      return this.history.execute(new ScaleMultipleCommand(this, objects, scale, space));
    }

    for (let i = 0; i < objects.length; i++) {
      this.scale(objects[i], scale, space, false, false);
    }

    if (emitEvent) {
      this.emit("objectsChanged", objects, "scale");
    }

    return objects;
  }

  scaleSelected(scale, space = TransformSpace.World, useHistory = true, emitEvent = true) {
    return this.scaleMultiple(this.selectedTransformRoots, scale, space, useHistory, emitEvent);
  }

  setScale(object, scale, space = TransformSpace.World, useHistory = true, emitEvent = true) {
    if (useHistory) {
      return this.history.execute(new SetScaleCommand(this, object, scale, space));
    }

    if (space === TransformSpace.Local) {
      object.scale.copy(scale);
    } else {
      object.updateMatrixWorld(); // Update parent world matrices

      tempVector1.copy(scale);

      let spaceMatrix;

      if (space === TransformSpace.World) {
        spaceMatrix = object.parent.matrixWorld;
      } else if (space === TransformSpace.LocalSelection) {
        if (this.selected.length > 0) {
          const lastSelectedObject = this.selected[this.selected.length - 1];
          lastSelectedObject.updateMatrixWorld();
          spaceMatrix = lastSelectedObject.parent.matrixWorld;
        } else {
          spaceMatrix = tempMatrix1.identity();
        }
      } else {
        spaceMatrix = space;
      }

      tempMatrix1.getInverse(spaceMatrix);
      tempVector1.applyMatrix4(tempMatrix1);
      object.scale.copy(tempVector1);
    }

    object.updateMatrixWorld(true);

    object.onChange("scale");

    if (emitEvent) {
      this.emit("objectsChanged", [object], "scale");
    }

    return object;
  }

  setScaleMultiple(objects, scale, space = TransformSpace.World, useHistory = true, emitEvent = true) {
    if (useHistory) {
      return this.history.execute(new SetScaleMultipleCommand(this, objects, scale, space));
    }

    if (space === TransformSpace.LocalSelection) {
      if (this.selected.length > 0) {
        const lastSelectedObject = this.selected[this.selected.length - 1];
        lastSelectedObject.updateMatrixWorld();
        space = lastSelectedObject.parent.matrixWorld;
      } else {
        space = tempMatrix1.identity();
      }
    }

    for (let i = 0; i < objects.length; i++) {
      this.setScale(objects[i], scale, space, false, false);
    }

    if (emitEvent) {
      this.emit("objectsChanged", objects, "scale");
    }

    return objects;
  }

  setScaleSelected(scale, space = TransformSpace.World, useHistory = true, emitEvent = true) {
    return this.setScaleMultiple(this.selectedTransformRoots, scale, space, useHistory, emitEvent);
  }

  setProperty(object, propertyName, value, useHistory = true, emitEvent = true) {
    if (useHistory) {
      return this.history.execute(new SetPropertyCommand(this, object, propertyName, value));
    }

    if (value && value.copy) {
      object[propertyName].copy(value);
    } else {
      object[propertyName] = value;
    }

    if (emitEvent) {
      this.emit("objectsChanged", [object], propertyName);
    }

    return object;
  }

  setPropertyMultiple(objects, propertyName, value, useHistory = true, emitEvent = true) {
    if (useHistory) {
      return this.history.execute(new SetPropertyMultipleCommand(this, objects, propertyName, value));
    }

    for (let i = 0; i < objects.length; i++) {
      this.setProperty(objects[i], propertyName, value, false, false);
    }

    if (emitEvent) {
      this.emit("objectsChanged", objects, "rotation");
    }

    return objects;
  }

  setPropertySelected(propertyName, value, useHistory = true, emitEvent = true) {
    return this.setPropertyMultiple(this.selectedTransformRoots, propertyName, value, useHistory, emitEvent);
  }

  setProperties(object, properties, useHistory = true, emitEvent = true) {
    if (useHistory) {
      return this.history.execute(new SetPropertiesCommand(this, object, properties));
    }

    for (const propertyName in properties) {
      const value = properties[propertyName];

      if (value && value.copy) {
        object[propertyName].copy(value);
      } else {
        object[propertyName] = value;
      }
    }

    if (emitEvent) {
      this.emit("objectsChanged", [object]);
    }

    return object;
  }

  setPropertiesMultiple(objects, properties, useHistory = true, emitEvent = true) {
    if (useHistory) {
      return this.history.execute(new SetPropertiesMultipleCommand(this, objects, properties));
    }

    for (let i = 0; i < objects.length; i++) {
      this.setProperties(objects[i], properties, false, false);
    }

    if (emitEvent) {
      this.emit("objectsChanged", objects);
    }

    return objects;
  }

  setPropertiesSelected(properties, useHistory = true, emitEvent = true) {
    return this.setPropertyMultiple(this.selectedTransformRoots, properties, useHistory, emitEvent);
  }

  getTransformRoots(objects, target = []) {
    // Recursively find the transformable nodes in the tree with the lowest depth
    const traverse = curObject => {
      if (objects.indexOf(curObject) !== -1) {
        target.push(curObject);
        return;
      }

      const children = curObject.children;

      for (let i = 0; i < children.length; i++) {
        const child = children[i];

        if (child.isNode) {
          traverse(child);
        }
      }
    };

    traverse(this.scene);

    return target;
  }

  updateTransformRoots() {
    this.selectedTransformRoots.length = 0;
    this.getTransformRoots(this.selected, this.selectedTransformRoots);
  }
}
