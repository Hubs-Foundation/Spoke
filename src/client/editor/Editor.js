import signals from "signals";

import THREE from "../vendor/three";
import History from "./History";
import Viewport from "./Viewport";
import RemoveObjectCommand from "./commands/RemoveObjectCommand";
import AddObjectCommand from "./commands/AddObjectCommand";
import { Components } from "./components";
import SceneReferenceComponent from "./components/SceneReferenceComponent";
import { loadScene, loadSerializedScene, serializeScene } from "./SceneLoader";
import DirectionalLightComponent from "./components/DirectionalLightComponent";
import AmbientLightComponent from "./components/AmbientLightComponent";
import { last } from "../utils";

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

      editorCleared: new Signal(),

      savingStarted: new Signal(),
      savingFinished: new Signal(),

      deleteSelectedObject: new Signal(),

      transformChanged: new Signal(),
      transformModeChanged: new Signal(),
      snapToggled: new Signal(),
      spaceChanged: new Signal(),
      viewportInitialized: new Signal(),

      sceneBackgroundChanged: new Signal(),
      sceneFogChanged: new Signal(),
      sceneGraphChanged: new Signal(),
      sceneSet: new Signal(),

      cameraChanged: new Signal(),

      geometryChanged: new Signal(),

      objectSelected: new Signal(),
      objectFocused: new Signal(),

      objectAdded: new Signal(),
      objectChanged: new Signal(),
      objectRemoved: new Signal(),

      helperAdded: new Signal(),
      helperRemoved: new Signal(),

      materialChanged: new Signal(),

      windowResize: new Signal(),

      showGridChanged: new Signal(),
      historyChanged: new Signal(),

      fileChanged: new Signal()
    };

    this.history = new History(this);

    this.camera = this.DEFAULT_CAMERA.clone();

    this.openFile = null;

    this.scenes = [];

    const initialSceneInfo = {
      uri: null,
      obj: new THREE.Scene(),
      modified: false
    };
    initialSceneInfo.obj.name = "Scene";
    initialSceneInfo.obj.background = new THREE.Color(0xaaaaaa);
    this.scenes.push(initialSceneInfo);

    this.scene = initialSceneInfo.obj;

    this.signals.sceneGraphChanged.add(() => {
      last(this.scenes).modified = true;
    });

    this.sceneHelpers = new THREE.Scene();

    this.objects = [];
    this.geometries = {};
    this.materials = {};
    this.textures = {};

    // TODO: Support multiple viewports
    this.viewports = [];

    this.selected = null;
    this.helpers = {};

    this.components = new Map();

    for (const componentClass of Components) {
      this.registerComponent(componentClass);
    }

    this.fileDependencies = new Map();

    this.initNewScene();

    this.signals.fileChanged.add(this.onFileChanged);
  }

  createViewport(canvas) {
    const viewport = new Viewport(this, canvas);
    this.viewports.push(viewport);
    return viewport;
  }

  onWindowResize = () => {
    this.signals.windowResize.dispatch();
  };

  onFileChanged = url => {
    const dependencies = this.fileDependencies.get(url);

    if (dependencies) {
      for (const dependency of dependencies) {
        if (this.getComponent(dependency, SceneReferenceComponent.componentName)) {
          this.loadSceneReference(url, dependency);
        } else {
          this.reloadScene();
        }
      }
    }
  };

  //

  popScene() {
    this.scenes.pop();
    const { uri, obj } = last(this.scenes);
    this.setSceneURI(uri);
    this.setScene(obj);
  }

  setSceneURI(uri) {
    const sceneInfo = last(this.scenes);
    sceneInfo.uri = uri;
  }

  editScenePrefab(url) {
    this.loadScene(url);
  }

  openRootScene(url) {
    this.scenes = [];
    return this.loadScene(url);
  }

  setScene(scene) {
    this.scene = scene;
    this.signals.sceneSet.dispatch();
  }

  sceneModified() {
    return last(this.scenes).modified;
  }

  initNewScene() {
    this.addComponent(this.scene, AmbientLightComponent.componentName);
    this.addComponent(this.scene, DirectionalLightComponent.componentName);

    this.scene.traverse(child => {
      this.addHelper(child, this.scene);
    });
  }

  async loadScene(url) {
    // Remove existing gltf dependency
    const prevDependencies = this.fileDependencies.get(this.scene.userData._url);

    if (prevDependencies) {
      prevDependencies.delete(this.scene);
    }

    const scene = await loadScene(url, this.addComponent, true);

    this.scene.userData._url = url;
    this.scenes.push({ uri: url, obj: scene });
    this.setSceneURI(url);
    this.setScene(scene);

    // Add gltf dependency
    const gltfDependencies = this.fileDependencies.get(url) || new Set();
    gltfDependencies.add(this.scene);
    this.fileDependencies.set(url, gltfDependencies);

    return scene;
  }

  async loadSceneReference(url, parent) {
    this.removeSceneRefDependency(parent);

    const scene = await loadScene(url, this.addComponent, false);
    scene.userData._dontShowInHierarchy = true;
    scene.userData._sceneReference = url;

    scene.traverse(child => {
      Object.defineProperty(child.userData, "_selectionRoot", { value: parent, enumerable: false });
    });

    this.signals.objectAdded.dispatch(scene);

    parent.add(scene);
    this.signals.sceneGraphChanged.dispatch();

    // Add gltf dependency
    const gltfDependencies = this.fileDependencies.get(url) || new Set();
    gltfDependencies.add(parent);
    this.fileDependencies.set(url, gltfDependencies);

    return scene;
  }

  removeSceneRefDependency(object) {
    const sceneRefComponent = this.getComponent(object, SceneReferenceComponent.componentName);

    if (sceneRefComponent) {
      const dependencies = this.fileDependencies.get(sceneRefComponent.getProperty("src"));

      if (dependencies) {
        dependencies.delete(object);
      }
    }
  }

  async reloadScene() {
    const sceneURL = this.scene.userData._url;
    const sceneDef = serializeScene(this.scene, sceneURL);
    const scene = await loadSerializedScene(sceneDef, sceneURL, this.addComponent, true);

    this.setScene(scene);

    return scene;
  }

  serializeScene(sceneURL) {
    return serializeScene(this.scene, sceneURL || this.scene.userData._url);
  }

  //

  addObject(object, parent) {
    const scope = this;

    object.userData._saveParent = true;
    object.traverse(child => {
      if (child.geometry !== undefined) scope.addGeometry(child.geometry);
      if (child.material !== undefined) scope.addMaterial(child.material);

      scope.addHelper(child, object);
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

  nameObject(object, name) {
    object.name = name;
    this.signals.sceneGraphChanged.dispatch();
  }

  removeObject(object) {
    if (object.parent === null) return; // avoid deleting the camera or scene

    object.traverse(child => {
      this.removeHelper(child);
      this.removeSceneRefDependency(child);
    });

    object.parent.remove(object);

    this.signals.objectRemoved.dispatch(object);
    this.signals.sceneGraphChanged.dispatch();
  }

  addGeometry(geometry) {
    this.geometries[geometry.uuid] = geometry;
  }

  setGeometryName(geometry, name) {
    geometry.name = name;
    this.signals.sceneGraphChanged.dispatch();
  }

  addMaterial(material) {
    this.materials[material.uuid] = material;
  }

  setMaterialName(material, name) {
    material.name = name;
    this.signals.sceneGraphChanged.dispatch();
  }

  addTexture(texture) {
    this.textures[texture.uuid] = texture;
  }

  exportScene() {
    return new Promise((resolve, reject) => {
      try {
        const gltfExporter = new THREE.GLTFExporter();
        gltfExporter.parseParts(this.scene, resolve, {
          trs: true,
          embedImages: false
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  //

  addHelper = (function() {
    const geometry = new THREE.SphereBufferGeometry(2, 4, 2);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000, visible: false });

    return function(object, selectionRoot) {
      if (this.helpers[object.id]) return;
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

      this.sceneHelpers.add(helper);
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

  addComponent = (object, componentName, props, skipSave) => {
    let component;

    if (this.components.has(componentName)) {
      component = this.components.get(componentName).inflate(object, props);

      if (componentName === SceneReferenceComponent.componentName && props && props.src) {
        this.loadSceneReference(props.src, object);
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

    return component;
  };

  removeComponent(object, componentName) {
    if (this.components.has(componentName)) {
      if (componentName === SceneReferenceComponent.componentName) {
        this.removeSceneRefDependency(object);
      }

      this.components.get(componentName).deflate(object);
    } else {
      if (object.userData._components === undefined) {
        return;
      }

      const index = object.userData._components.findIndex(({ name }) => name === componentName);
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

  updateComponentProperty(object, componentName, propertyName, value) {
    const component = this.getComponent(object, componentName);

    let result;

    if (this.components.has(componentName)) {
      result = component.updateProperty(propertyName, value);

      if (componentName === SceneReferenceComponent.componentName && propertyName === "src") {
        this.loadSceneReference(value, object);
      }
    } else {
      result = component[propertyName] = value;
    }

    return result;
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
  }

  deleteSelectedObject() {
    this.deleteObject(this.selected);
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
      Object.defineProperty(childClone.userData, "_selectionRoot", { value: root, enumerable: false });
    }
    return clone;
  }

  duplicateObject(object) {
    const clone = this._cloneAndInflate(object);
    this.execute(new AddObjectCommand(clone, object.parent));
  }

  duplicateSelectedObject() {
    this.duplicateObject(this.selected);
  }

  clear() {
    this.history.clear();

    this.camera.copy(this.DEFAULT_CAMERA);
    this.scene.fog = null;

    this.scene.traverse(this.removeHelper.bind(this));

    const objects = this.scene.children;

    while (objects.length > 0) {
      this.removeObject(objects[0]);
    }

    this.geometries = {};
    this.materials = {};
    this.textures = {};

    this.deselect();

    this.signals.editorCleared.dispatch();
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
