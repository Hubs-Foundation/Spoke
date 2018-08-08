import signals from "signals";

import THREE from "../vendor/three";
import History from "./History";
import Viewport from "./Viewport";
import RemoveObjectCommand from "./commands/RemoveObjectCommand";
import AddObjectCommand from "./commands/AddObjectCommand";
import { Components } from "./components";
import SceneReferenceComponent from "./components/SceneReferenceComponent";
import { loadScene, loadSerializedScene, serializeScene, exportScene } from "./SceneLoader";
import { last } from "../utils";
import { textureCache, gltfCache } from "./caches";
import ConflictHandler from "./ConflictHandler";

/**
 * @author mrdoob / http://mrdoob.com/
 */
export default class Editor {
  constructor() {
    this.DEFAULT_CAMERA = new THREE.PerspectiveCamera(50, 1, 0.01, 1000);
    this.DEFAULT_CAMERA.name = "Camera";
    this.DEFAULT_CAMERA.position.set(0, 5, 10);
    this.DEFAULT_CAMERA.lookAt(new THREE.Vector3());

    const Signal = signals.Signal;

    this.signals = {
      openScene: new Signal(),
      popScene: new Signal(),
      extendScene: new Signal(),

      savingStarted: new Signal(),
      savingFinished: new Signal(),

      deleteSelectedObject: new Signal(),

      transformChanged: new Signal(),
      transformModeChanged: new Signal(),
      snapToggled: new Signal(),
      spaceChanged: new Signal(),
      viewportInitialized: new Signal(),

      sceneGraphChanged: new Signal(),
      sceneSet: new Signal(),
      sceneModified: new Signal(),

      geometryChanged: new Signal(),

      objectSelected: new Signal(),
      objectFocused: new Signal(),

      objectAdded: new Signal(),
      objectChanged: new Signal(),
      objectRemoved: new Signal(),

      helperAdded: new Signal(),
      helperRemoved: new Signal(),

      windowResize: new Signal(),

      historyChanged: new Signal(),

      fileChanged: new Signal(),

      sceneErrorOccurred: new Signal()
    };

    this.history = new History(this);

    this.camera = this.DEFAULT_CAMERA.clone();

    this.openFile = null;

    this.scenes = [];
    const initialSceneInfo = {
      uri: null,
      scene: new THREE.Scene(),
      helperScene: new THREE.Scene(),
      helpers: {},
      objects: [],
      modified: false
    };
    initialSceneInfo.scene.name = "Scene";
    this.scenes.push(initialSceneInfo);

    this.scene = initialSceneInfo.scene;
    this.sceneInfo = initialSceneInfo;
    this.helperScene = initialSceneInfo.helperScene;
    this.helpers = initialSceneInfo.helpers;
    this.objects = initialSceneInfo.objects;

    this._prefabBeingEdited = null;

    this._ignoreSceneModification = false;
    this.signals.sceneGraphChanged.add(() => {
      if (this._ignoreSceneModification) return;
      this.sceneInfo.modified = true;
      this.signals.sceneModified.dispatch();
    });
    this.signals.objectChanged.add(() => {
      if (this._ignoreSceneModification) return;
      this.sceneInfo.modified = true;
      this.signals.sceneModified.dispatch();
    });

    // TODO: Support multiple viewports
    this.viewports = [];

    this.selected = null;

    this.components = new Map();
    for (const componentClass of Components) {
      this.registerComponent(componentClass);
    }

    // Map from URI -> Set of Object3Ds
    this.fileDependencies = new Map();

    this._conflictHandler = new ConflictHandler();
    this.scene.userData._conflictHandler = this._conflictHandler;
    this.ignoreNextSceneFileChange = false;
    this.signals.fileChanged.add(this.onFileChanged);

    this._resetDefaultLights();
  }

  createViewport(canvas) {
    const viewport = new Viewport(this, canvas);
    this.viewports.push(viewport);
    return viewport;
  }

  onFileChanged = uri => {
    textureCache.evict(uri);
    gltfCache.evict(uri);
    if (uri === this.sceneInfo.uri && this.ignoreNextSceneFileChange) {
      this.ignoreNextSceneFileChange = false;
      return;
    }

    const dependencies = this.fileDependencies.get(uri);

    if (dependencies) {
      for (const dependency of dependencies) {
        if (this.getComponent(dependency, SceneReferenceComponent.componentName)) {
          this._loadSceneReference(uri, dependency);
        } else {
          this._reloadScene();
        }
      }
    }
  };

  //

  popScene() {
    const poppedURI = this.sceneInfo.uri;

    this.deselect();

    this.scenes.pop();

    this.sceneInfo = last(this.scenes);
    this.scene = this.sceneInfo.scene;
    this._conflictHandler = this.scene.userData._conflictHandler;
    this.helperScene = this.sceneInfo.helperScene;
    this.helpers = this.sceneInfo.helpers;
    this.objects = this.sceneInfo.objects;

    if (poppedURI) {
      const sceneRefComponentName = SceneReferenceComponent.componentName;
      const previousURI = this.getComponentProperty(this._prefabBeingEdited, sceneRefComponentName, "src");
      this.updateComponentProperty(this._prefabBeingEdited, sceneRefComponentName, "src", poppedURI);
      if (previousURI.endsWith(".gltf")) {
        const name = last(poppedURI.split("/"));
        const displayName = this._conflictHandler.addToDuplicateNameCounters(name);
        this._prefabBeingEdited.name = displayName;
      }
    }

    this._prefabBeingEdited = null;

    this.signals.sceneSet.dispatch();
  }

  setSceneURI(uri) {
    this.sceneInfo.uri = uri;
  }

  editScenePrefab(object, uri) {
    this._prefabBeingEdited = object;
    this._loadScene(uri);
  }

  _deleteSceneDependencies() {
    const prevDependencies = this.fileDependencies.get(this.sceneInfo.uri);
    if (prevDependencies) {
      prevDependencies.delete(this.scene);
    }
  }

  _resetHelpers() {
    // Have to set these objects before loading the scene since Viewport will manipulate them
    // as it receives signals while the scene is loading.
    this.helperScene = new THREE.Scene();
    this.helpers = {};
    this.objects = [];
  }

  _clearCaches() {
    textureCache.disposeAndClear();
    gltfCache.disposeAndClear();
  }

  _setSceneInfo(scene, uri) {
    this.sceneInfo = {
      uri: uri,
      scene: scene,
      modified: false,
      helperScene: this.helperScene,
      helpers: this.helpers,
      objects: this.objects
    };
  }

  loadNewScene() {
    this.deselect();

    this._deleteSceneDependencies();

    this._resetHelpers();

    this._clearCaches();

    const scene = new THREE.Scene();
    scene.name = "Scene";

    this._setSceneInfo(scene, null);
    this.scenes = [this.sceneInfo];

    this._setScene(scene);

    this.signals.sceneModified.dispatch();

    return scene;
  }

  openRootScene(uri) {
    this.scenes = [];
    this._clearCaches();
    this._ignoreSceneModification = true;
    const scene = this._loadScene(uri).then(scene => {
      this._ignoreSceneModification = false;
      return scene;
    });
    return scene;
  }

  _setScene(scene) {
    this.scene = scene;
    this._resetDefaultLights();
    if (this.scene.userData && this.scene.userData._conflictHandler) {
      this._conflictHandler = this.scene.userData._conflictHandler;
    } else if (!this._conflictHandler) {
      this._conflictHandler = new ConflictHandler();
    }
    this.scene.traverse(object => {
      this.signals.objectAdded.dispatch(object);
    });

    this.signals.sceneSet.dispatch();
  }

  _resetDefaultLights() {
    let hasDirectionalLight = false;
    let hasAmbientLight = false;

    let defaultAmbientLight = this.scene.getObjectByName("_defaultAmbientLight");
    let defaultDirectionalLight = this.scene.getObjectByName("_defaultDirectionalLight");

    this.scene.traverse(node => {
      if (node.type === "AmbientLight" || node.type === "HemisphereLight") {
        hasAmbientLight = true;
      }

      if (node.type === "DirectionalLight" || node.type === "PointLight" || node.type === "SpotLight") {
        hasDirectionalLight = true;
      }
    });

    if (!hasAmbientLight && !defaultAmbientLight) {
      defaultAmbientLight = new THREE.AmbientLight();
      defaultAmbientLight.name = "_defaultAmbientLight";
      defaultAmbientLight.userData._dontExport = true;
      defaultAmbientLight.userData._dontShowInHierarchy = true;
      this.scene.add(defaultAmbientLight);
    } else if (hasAmbientLight && defaultAmbientLight) {
      this.scene.remove(defaultAmbientLight);
    }

    if (!hasDirectionalLight && !defaultDirectionalLight) {
      defaultDirectionalLight = new THREE.DirectionalLight();
      defaultDirectionalLight.name = "_defaultDirectionalLight";
      defaultDirectionalLight.userData._dontExport = true;
      defaultDirectionalLight.userData._dontShowInHierarchy = true;
      defaultDirectionalLight.position.set(5, 10, 7.5);
      this.scene.add(defaultDirectionalLight);
    } else if (hasDirectionalLight && defaultDirectionalLight) {
      this.scene.remove(defaultDirectionalLight);
    }
  }

  sceneModified() {
    return this.sceneInfo.modified;
  }

  _addDependency(uri, obj) {
    const uriDependencies = this.fileDependencies.get(uri) || new Set();
    uriDependencies.add(obj);
    this.fileDependencies.set(uri, uriDependencies);
  }

  async _loadScene(uri) {
    this.deselect();

    this._deleteSceneDependencies();

    this._resetHelpers();

    const scene = await loadScene(uri, this.addComponent, true);
    this._conflictHandler = scene.userData._conflictHandler;

    this._setSceneInfo(scene, uri);
    this.scenes.push(this.sceneInfo);

    this._setScene(scene);

    this._addDependency(uri, scene);

    this.signals.sceneModified.dispatch();

    return scene;
  }

  async _loadSceneReference(uri, parent) {
    this._removeSceneRefDependency(parent);

    const scene = await loadScene(uri, this.addComponent, false);
    scene.userData._dontShowInHierarchy = true;
    scene.userData._sceneReference = uri;

    const conflictHandler = scene.userData._conflictHandler;
    if (conflictHandler.getDuplicateStatus()) {
      // auto resolve scene conflicts
      conflictHandler.resolveConflicts(scene);
    }

    scene.traverse(child => {
      Object.defineProperty(child.userData, "_selectionRoot", { value: parent, configurable: true, enumerable: false });
    });

    this.signals.objectAdded.dispatch(scene);

    parent.add(scene);
    const modified = this.sceneInfo.modified;
    this.signals.sceneGraphChanged.dispatch();
    this.sceneInfo.modified = modified;
    this.signals.sceneModified.dispatch();

    this._addDependency(uri, parent);

    return scene;
  }

  _removeSceneRefDependency(object) {
    const sceneRefComponent = this.getComponent(object, SceneReferenceComponent.componentName);

    if (sceneRefComponent) {
      const dependencies = this.fileDependencies.get(sceneRefComponent.getProperty("src"));

      if (dependencies) {
        dependencies.delete(object);
      }
    }
  }

  async _reloadScene() {
    this._resetHelpers();

    const sceneURI = this.sceneInfo.uri;
    const sceneDef = serializeScene(this.scene, sceneURI);
    const scene = await loadSerializedScene(sceneDef, sceneURI, this.addComponent, true);

    const sceneInfo = this.scenes.find(sceneInfo => sceneInfo.uri === sceneURI);
    sceneInfo.scene = scene;

    this._setScene(scene);

    return scene;
  }

  serializeScene(sceneURI) {
    return serializeScene(this.scene, sceneURI || this.sceneInfo.uri);
  }

  exportScene() {
    return exportScene(this.scene);
  }

  async extendScene(inheritedURI) {
    const extendSceneDef = {
      entities: {},
      inherits: inheritedURI
    };

    this.deselect();
    this._deleteSceneDependencies();
    this._resetHelpers();
    this._clearCaches();

    const ancestors = [];
    const scene = await loadSerializedScene(extendSceneDef, inheritedURI, this.addComponent, true, ancestors);

    this._setSceneInfo(scene, null);
    this.scenes = [this.sceneInfo];
    this._setScene(scene);
    this._addDependency(inheritedURI, scene);

    this.signals.sceneModified.dispatch();

    return scene;
  }
  //

  addObject(object, parent) {
    this.addComponent(object, "transform");

    object.userData._saveParent = true;

    object.traverse(child => {
      child.name = this._conflictHandler.addToDuplicateNameCounters(child.name);
      this.addHelper(child, object);
    });

    if (parent !== undefined) {
      parent.add(object);
    } else {
      this.scene.add(object);
    }

    this.signals.objectAdded.dispatch(object);
    this.signals.sceneGraphChanged.dispatch();
  }

  moveObject(object, parent, before) {
    if (parent === undefined) {
      parent = this.scene;
    }

    parent.add(object);

    // sort children array

    if (before !== undefined) {
      const index = parent.children.indexOf(before);
      parent.children.splice(index, 0, object);
      parent.children.pop();
    }

    this.signals.sceneGraphChanged.dispatch();
  }

  removeObject(object) {
    if (object.parent === null) return; // avoid deleting the camera or scene

    object.traverse(child => {
      this.removeHelper(child);
      this._removeSceneRefDependency(child);
    });

    this.signals.objectRemoved.dispatch(object);
    this.signals.sceneGraphChanged.dispatch();
  }

  //

  addHelper = (function() {
    const geometry = new THREE.SphereBufferGeometry(2, 4, 2);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000, visible: false });

    return function(object, selectionRoot) {
      if (this.helpers[selectionRoot.id]) return;
      let helper;

      if (object instanceof THREE.Camera) {
        helper = new THREE.CameraHelper(object, 1);
      } else if (object instanceof THREE.PointLight) {
        helper = new THREE.PointLightHelper(object, 1);
      } else if (object instanceof THREE.DirectionalLight) {
        helper = new THREE.DirectionalLightHelper(object, 1);
      } else if (object instanceof THREE.SpotLight) {
        helper = new THREE.SpotLightHelper(object, 1);
      } else if (object instanceof THREE.HemisphereLight) {
        helper = new THREE.HemisphereLightHelper(object, 1);
      } else if (object instanceof THREE.SkinnedMesh) {
        helper = new THREE.SkeletonHelper(object);
      } else {
        // no helper for this object type
        return;
      }

      const picker = new THREE.Mesh(geometry, material);
      picker.name = "picker";
      picker.userData._selectionRoot = selectionRoot;
      helper.add(picker);

      this.helperScene.add(helper);
      this.helpers[selectionRoot.id] = helper;

      this.signals.helperAdded.dispatch(helper);
    };
  })();

  removeHelper(object) {
    if (this.helpers[object.id] !== undefined) {
      const helper = this.helpers[object.id];
      helper.parent.remove(helper);

      delete this.helpers[object.id];

      this.signals.helperRemoved.dispatch(helper);
    }
  }

  //

  registerComponent(componentClass) {
    const { componentName } = componentClass;

    if (this.components.has(componentName)) {
      throw new Error(`${componentName} already registered`);
    }

    this.components.set(componentName, componentClass);
  }

  addComponent = async (object, componentName, props, skipSave) => {
    try {
      const componentClass = this.components.get(componentName);
      let component;

      if (componentClass) {
        if (componentClass.type === "light") {
          this._resetDefaultLights();
        }

        if (componentName === SceneReferenceComponent.componentName && props && props.src) {
          if (props.src === this.sceneInfo.uri) {
            throw new Error("Cannot add circular scene reference");
          }

          component = await this.components.get(componentName).inflate(object, props);

          await this._loadSceneReference(props.src, object)
            .then(() => {
              if (component.propValidation.src !== true) {
                component.propValidation.src = true;
                this.signals.objectChanged.dispatch(object);
              }
            })
            .catch(e => {
              console.error("Failed to loadSceneReference", e);
              if (component.propValidation.src !== false) {
                component.propValidation.src = false;
                this.signals.objectChanged.dispatch(object);
              }
            });
        } else {
          component = await this.components.get(componentName).inflate(object, props);
        }
      } else {
        component = {
          name: componentName,
          props
        };

        if (object.userData._components === undefined) {
          object.userData._components = [];
        }

        object.userData._components.push(component);
      }

      component.shouldSave = !skipSave;

      object.traverse(child => {
        this.addHelper(child, object);
      });

      return component;
    } catch (e) {
      console.error("Error adding component", e);
      throw e;
    }
  };

  removeComponent(object, componentName) {
    const componentClass = this.components.get(componentName);

    if (componentClass) {
      if (componentClass.type === "light") {
        this._resetDefaultLights();
      }

      if (componentName === SceneReferenceComponent.componentName) {
        this._removeSceneRefDependency(object);
      }

      componentClass.deflate(object);
    } else {
      if (object.userData._components === undefined) {
        return;
      }

      const index = object.userData._components.findIndex(({ name }) => name === componentName);
      if (index === -1) {
        throw new Error(`Component "${componentName}" does not exist on ${object}`);
      }
      object.userData._components.splice(index, 1);
    }
  }

  getComponent(object, componentName) {
    if (this.components.has(componentName)) {
      return this.components.get(componentName).getComponent(object);
    } else {
      return object.userData._components.find(({ name }) => name === componentName);
    }
  }

  getComponentProperty(object, componentName, propertyName) {
    if (this.components.has(componentName)) {
      return this.getComponent(object, componentName).getProperty(propertyName);
    } else {
      return this.getComponent(object, componentName)[propertyName];
    }
  }

  _removeChildren(object) {
    const currentChildren = object.children.slice(0);
    this.signals.sceneGraphChanged.active = false;
    for (const child of currentChildren) {
      this.removeObject(child);
    }
    this.signals.sceneGraphChanged.active = true;
    this.signals.sceneGraphChanged.dispatch();
  }

  updateComponentProperty(object, componentName, propertyName, value) {
    const component = this.getComponent(object, componentName);

    if (this.components.has(componentName)) {
      if (componentName === SceneReferenceComponent.componentName && propertyName === "src") {
        component.updateProperty(propertyName, value);
        this._removeChildren(object);
        this._loadSceneReference(component.props.src, object)
          .then(() => {
            this.deselect();
            this.select(object);
            if (component.propValidation.src !== true) {
              component.propValidation.src = true;
              this.signals.objectChanged.dispatch(object);
            }
          })
          .catch(() => {
            if (component.propValidation.src !== false) {
              component.propValidation.src = false;
              this.signals.objectChanged.dispatch(object);
            }
          });
      } else {
        component.updateProperty(propertyName, value).then(() => {
          this.signals.objectChanged.dispatch(object);
        });
      }
    } else {
      component[propertyName] = value;
    }
  }

  //

  getObjectMaterial(object, slot) {
    let material = object.material;

    if (Array.isArray(material)) {
      material = material[slot];
    }

    return material;
  }

  setObjectMaterial(object, slot, newMaterial) {
    if (Array.isArray(object.material)) {
      object.material[slot] = newMaterial;
    } else {
      object.material = newMaterial;
    }
  }

  //

  select(object) {
    if (this.selected === object) return;

    this.selected = object;

    this.signals.objectSelected.dispatch(object);
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
    this.signals.objectFocused.dispatch(object);
  }

  focusById(id) {
    this.focus(this.scene.getObjectById(id, true));
  }

  deleteObject(object) {
    this.execute(new RemoveObjectCommand(object));
    this._conflictHandler.updateDuplicateNameCounters(this.scene);
  }

  deleteSelectedObject() {
    if (this.selected && this.selected.parent) {
      this.deleteObject(this.selected);
      return true;
    }
    return false;
  }

  _cloneAndInflate(object, root) {
    const clone = object.clone(false);
    if (object.userData._components) {
      clone.userData._components = [];

      for (const component of object.userData._components) {
        this.addComponent(clone, component.name, component.props);
      }
    }
    if (!root) root = clone;
    for (const child of object.children) {
      if (child.userData._inflated) continue;
      const childClone = this._cloneAndInflate(child, root);
      clone.add(childClone);
      Object.defineProperty(childClone.userData, "_selectionRoot", {
        value: root,
        configurable: true,
        enumerable: false
      });
    }
    return clone;
  }

  duplicateObject(object) {
    const clone = this._cloneAndInflate(object);
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
}
