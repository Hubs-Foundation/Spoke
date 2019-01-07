import signals from "signals";
import uuid from "uuid/v4";
import THREE from "../vendor/three";
import History from "./History";
import Viewport from "./Viewport";

import AddObjectCommand from "./commands/AddObjectCommand";
import MoveObjectCommand from "./commands/MoveObjectCommand";
import RemoveObjectCommand from "./commands/RemoveObjectCommand";
import SetNameCommand from "./commands/SetNameCommand";
import SetPositionCommand from "./commands/SetPositionCommand";
import SetRotationCommand from "./commands/SetRotationCommand";
import SetScaleCommand from "./commands/SetScaleCommand";
import SetObjectPropertyCommand from "./commands/SetObjectPropertyCommand";

import TextureCache from "./caches/TextureCache";
import GLTFCache from "./caches/GLTFCache";

import getNameWithoutIndex from "./utils/getNameWithoutIndex";

import SceneNode from "./nodes/SceneNode";
import GroundPlaneNode from "./nodes/GroundPlaneNode";
import AmbientLightNode from "./nodes/AmbientLightNode";
import DirectionalLightNode from "./nodes/DirectionalLightNode";
import SpawnPointNode from "./nodes/SpawnPointNode";
import SkyboxNode from "./nodes/SkyboxNode";
import FloorPlanNode from "./nodes/FloorPlanNode";

export default class Editor {
  constructor(project) {
    this.project = project;

    this.scene = new SceneNode(this);
    this.sceneModified = false;
    this.sceneUri = null;

    this.camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.2, 8000);
    this.audioListener = new THREE.AudioListener();
    this.camera.add(this.audioListener);
    this.camera.layers.enable(1);
    this.camera.name = "Camera";

    this.duplicateNameCounters = new Map();

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

      historyChanged: new Signal(),

      fileChanged: new Signal()
    };

    this._ignoreSceneModification = false;
    this.ignoreNextSceneFileChange = false;
    this.project.addListener("change", path => {
      this.signals.fileChanged.dispatch(path);
    });
    this.signals.fileChanged.add(this.onFileChanged);
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
    const tasks = [this.project.retrieveUpdateInfo()];

    for (const NodeConstructor of this.nodeTypes) {
      tasks.push(NodeConstructor.load());
    }

    await Promise.all(tasks);
  }

  initializeViewport(canvas) {
    this.viewport = new Viewport(this, canvas);
    this.signals.viewportInitialized.dispatch(this.viewport);
    this.loadNewScene();
  }

  onFileChanged = uri => {
    this.textureCache.evict(uri);
    this.gltfCache.evict(uri);
    if (uri === this.sceneUri && this.ignoreNextSceneFileChange) {
      this.ignoreNextSceneFileChange = false;
      return;
    }
  };

  clearCaches() {
    this.textureCache.disposeAndClear();
    this.gltfCache.disposeAndClear();
  }

  async loadNewScene() {
    this.clearCaches();
    this.sceneUri = null;

    const scene = new SceneNode(this);
    scene.name = "Untitled";
    this.setScene(scene);

    this._addObject(new SkyboxNode(this));
    this._addObject(new AmbientLightNode(this));
    const directionalLight = new DirectionalLightNode(this);
    directionalLight.position.set(-1, 3, 0);
    directionalLight.rotation.set(Math.PI * 0.5, Math.PI * (0.5 / 3.0), -Math.PI * 0.5);
    this._addObject(directionalLight);
    this._addObject(new SpawnPointNode(this));
    this._addObject(new GroundPlaneNode(this));

    this.signals.sceneGraphChanged.dispatch();
    this.sceneModified = true;
    this.signals.sceneModified.dispatch();

    return scene;
  }

  async openScene(uri) {
    this.clearCaches();

    const url = new URL(uri, window.location).href;

    const sceneResponse = await fetch(url);

    const json = await sceneResponse.json();

    this.sceneUri = url;

    const scene = await SceneNode.deserialize(this, json);

    this.setScene(scene);

    requestAnimationFrame(() => {
      this.scene.traverse(node => {
        node.onAfterFirstRender();
      });
    });

    return scene;
  }

  setScene(scene) {
    this.scene = scene;

    this.duplicateNameCounters.clear();
    this._addObjectToNameCounters(this.scene);

    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(new THREE.Vector3());
    this.scene.add(this.camera);

    this.history.clear();
    this.deselect();
    this.signals.sceneSet.dispatch();
    this.signals.sceneGraphChanged.dispatch();
    this.sceneModified = false;
  }

  async saveScene(sceneURI) {
    let newSceneName = decodeURIComponent(this.project.getUrlFilename(sceneURI));

    // Edge case: we may already have an object in the scene with this name. Our
    // code assumes all objects in the scene have unique names (including the scene itself)
    // so add a suffix.

    while (this.scene.getObjectByName(newSceneName)) {
      newSceneName += " Scene";
    }

    this.scene.name = newSceneName;

    const serializedScene = this.scene.serialize(sceneURI);

    this.ignoreNextSceneFileChange = true;

    await this.project.writeJSON(sceneURI, serializedScene);

    this.sceneUri = sceneURI;

    this.signals.sceneGraphChanged.dispatch();

    this.sceneModified = false;

    this.signals.sceneModified.dispatch();
  }

  async generateFloorPlan() {
    let floorPlan = this.scene.findNodeByType(FloorPlanNode);

    if (!floorPlan) {
      floorPlan = new FloorPlanNode(this);
      this.addObject(floorPlan);
    }

    const oldNavMeshPath = floorPlan.navMeshSrc;

    await floorPlan.generate(this.scene);

    if (floorPlan.navMesh) {
      const exporter = new THREE.GLTFExporter();
      const glb = await new Promise((resolve, reject) =>
        exporter.parse(floorPlan.navMesh, resolve, reject, { mode: "glb" })
      );
      const path = await this.project.writeGeneratedBlob(`${floorPlan.navMesh.uuid}.glb`, glb);
      floorPlan.navMeshSrc = path;
    }

    // Remove the old nav mesh file
    if (oldNavMeshPath) {
      await this.project.remove(oldNavMeshPath);
    }

    // Save the scene so we don't break the reference to the nav mesh in the spoke file
    if (this.sceneUri) {
      await this.saveScene(this.sceneUri);
    }
  }

  async exportScene(outputPath, glb) {
    const scene = this.scene;
    const clonedScene = scene.clone();

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
      exporter.parseChunks(clonedScene, resolve, reject, {
        mode: glb ? "glb" : "gltf",
        onlyVisible: false,
        animations
      });
    });
    if (!glb) {
      const bufferDefs = chunks.json.buffers;
      if (bufferDefs && bufferDefs.length > 0 && bufferDefs[0].uri === undefined) {
        bufferDefs[0].uri = clonedScene.name + ".bin";
      }
    }
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
    if (glb) {
      return await new Promise((resolve, reject) => exporter.createGLBBlob(chunks, resolve, reject));
    } else {
      // Export current editor scene using THREE.GLTFExporter
      const { json, buffers, images } = chunks;
      // Ensure the output directory exists
      await this.project.mkdir(outputPath);
      // Write the .gltf file
      const gltfPath = outputPath + "/" + scene.name + ".gltf";
      await this.project.writeJSON(gltfPath, json);
      // Write .bin files
      for (const [index, buffer] of buffers.entries()) {
        if (buffer !== undefined) {
          const bufferName = json.buffers[index].uri;
          await this.project.writeBlob(outputPath + "/" + bufferName, buffer);
        }
      }
      // Write image files
      for (const [index, image] of images.entries()) {
        if (image !== undefined) {
          const imageName = json.images[index].uri;
          await this.project.writeBlob(outputPath + "/" + imageName, image);
        }
      }
    }
  }

  addObject(object, parent) {
    this.execute(new AddObjectCommand(object, parent));
  }

  _addObjectToNameCounters(object) {
    object.traverse(child => {
      if (child.isNode) {
        const name = getNameWithoutIndex(child.name);
        const counter = this.duplicateNameCounters.get(name);
        let objectCount, nextSuffix, suffix;

        if (counter) {
          objectCount = counter.objectCount + 1;
          suffix = " " + counter.nextSuffix;
          nextSuffix = counter.nextSuffix + 1;
        } else {
          objectCount = 1;
          suffix = "";
          nextSuffix = 1;
        }

        this.duplicateNameCounters.set(name, { objectCount, nextSuffix });
        child.name = name + suffix;
      }
    });
  }

  _addObject(object, parent) {
    object.saveParent = true;

    this._addObjectToNameCounters(object);

    if (parent !== undefined) {
      parent.add(object);
    } else {
      this.scene.add(object);
    }
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
        const name = getNameWithoutIndex(object.name);
        const counter = this.duplicateNameCounters.get(name);

        if (counter) {
          const { objectCount, nextSuffix } = counter;

          if (objectCount <= 1) {
            this.duplicateNameCounters.delete(name);
          } else {
            this.duplicateNameCounters.set(name, { objectCount: objectCount - 1, nextSuffix });
          }
        }
      }
    });

    object.parent.remove(object);

    this.signals.objectRemoved.dispatch(object);
    this.signals.sceneGraphChanged.dispatch();
  }

  clearSceneMetadata() {
    this.scene.metadata = {};
  }

  setSceneMetadata(newMetadata) {
    const existingMetadata = this.scene.metadata || {};
    this.scene.metadata = Object.assign(existingMetadata, newMetadata);
  }

  getSceneMetadata() {
    return this.scene.metadata;
  }

  setTransformMode(mode) {
    this.signals.transformModeChanged.dispatch(mode);
  }

  setObjectName(object, name) {
    const prevName = getNameWithoutIndex(object.name);
    const prevCounter = this.duplicateNameCounters.get(prevName);

    if (prevCounter) {
      const prevObjectCount = prevCounter.objectCount;
      if (prevObjectCount <= 1) {
        this.duplicateNameCounters.delete(prevName);
      } else {
        this.duplicateNameCounters.set(prevName, {
          objectCount: prevCounter.objectCount - 1,
          nextSuffix: prevCounter.nextSuffix
        });
      }
    }

    const nextName = getNameWithoutIndex(name);
    const nextCounter = this.duplicateNameCounters.get(nextName);

    let objectCount, nextSuffix, suffix;

    if (nextCounter) {
      objectCount = nextCounter.objectCount + 1;
      suffix = " " + nextCounter.nextSuffix;
      nextSuffix = nextCounter.nextSuffix + 1;
    } else {
      objectCount = 1;
      suffix = "";
      nextSuffix = 1;
    }

    this.duplicateNameCounters.set(nextName, { objectCount, nextSuffix });

    object.name = nextName + suffix;

    this.signals.objectChanged.dispatch(object);
  }

  registerNode(nodeConstructor, nodeEditor) {
    this.nodeTypes.add(nodeConstructor);
    this.nodeEditors.set(nodeConstructor, nodeEditor);
  }

  getNodeEditor(node) {
    return this.nodeEditors.get(node.constructor);
  }

  setNodeProperty(node, propertyName, value) {
    let command;

    switch (propertyName) {
      case "name":
        command = new SetNameCommand(node, value);
        break;
      case "position":
        command = new SetPositionCommand(node, value);
        break;
      case "rotation":
        command = new SetRotationCommand(node, value);
        break;
      case "scale":
        command = new SetScaleCommand(node, value);
        break;
      default:
        command = new SetObjectPropertyCommand(node, propertyName, value);
        break;
    }

    this.execute(command);
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
    object.onRemove();
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

  getSceneContentAttributions() {
    const contentAttributions = [];
    const seenAttributions = new Set();

    this.scene.traverse(obj => {
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

  async takeScreenshot() {
    this.deselect();
    return this.viewport.takeScreenshot();
  }

  async publishScene(sceneId, screenshotBlob, contentAttributions, onPublishProgress) {
    onPublishProgress("generating floor plan");

    await this.generateFloorPlan();

    await this.project.mkdir(this.project.getAbsoluteURI("generated"));

    const { name, creatorAttribution, description, allowRemixing, allowPromotion } = this.getSceneMetadata();

    const attributions = {
      creator: creatorAttribution,
      content: contentAttributions
    };

    onPublishProgress("exporting scene");

    const glbUri = this.project.getAbsoluteURI(`generated/${uuid()}.glb`);
    const glbBlob = await this.exportScene(null, true);
    const size = glbBlob.size / 1024 / 1024;
    const maxSize = this.project.maxUploadSize;
    if (size > maxSize) {
      throw new Error(`Scene is too large (${size.toFixed(2)}MB) to publish. Maximum size is ${maxSize}MB.`);
    }

    onPublishProgress("uploading");

    const screenshotUri = this.project.getAbsoluteURI(`generated/${uuid()}.jpg`);
    await this.project.writeBlob(screenshotUri, screenshotBlob);
    const { id: screenshotId, token: screenshotToken } = await this.project.uploadAndDelete(screenshotUri);

    await this.project.writeBlob(glbUri, glbBlob);
    const { id: glbId, token: glbToken } = await this.project.uploadAndDelete(glbUri, uploadProgress => {
      onPublishProgress(`uploading ${Math.floor(uploadProgress * 100)}%`);
    });

    onPublishProgress("uploading");

    const sceneFileUri = this.project.getAbsoluteURI(`generated/${uuid()}.spoke`);
    const serializedScene = this.scene.serialize(sceneFileUri);
    await this.project.writeJSON(sceneFileUri, serializedScene);
    const { id: sceneFileId, token: sceneFileToken } = await this.project.uploadAndDelete(sceneFileUri);

    onPublishProgress(`${sceneId ? "updating" : "creating"} scene`);

    const res = await this.project.createOrUpdateScene({
      sceneId,
      screenshotId,
      screenshotToken,
      glbId,
      glbToken,
      sceneFileId,
      sceneFileToken,
      name,
      description,
      attributions,
      allowRemixing,
      allowPromotion
    });

    onPublishProgress("");

    return { sceneUrl: res.url, sceneId: res.sceneId };
  }
}
