import signals from "signals";
import last from "lodash.last";

import THREE from "../vendor/three";
import History from "./History";
import Storage from "./Storage";
import Viewport from "./Viewport";
import RemoveObjectCommand from "./commands/RemoveObjectCommand";
import AddObjectCommand from "./commands/AddObjectCommand";
import { loadScene } from "./SceneLoader";

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
      // script

      editScript: new Signal(),

      // player

      startPlayer: new Signal(),
      stopPlayer: new Signal(),

      // actions

      showModal: new Signal(),

      openScene: new Signal(),
      popScene: new Signal(),

      // notifications

      editorCleared: new Signal(),

      savingStarted: new Signal(),
      savingFinished: new Signal(),

      themeChanged: new Signal(),

      deleteSelectedObject: new Signal(),

      transformModeChanged: new Signal(),
      snapToggled: new Signal(),
      spaceChanged: new Signal(),
      viewportInitialized: new Signal(),
      rendererChanged: new Signal(),

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

      scriptAdded: new Signal(),
      scriptChanged: new Signal(),
      scriptRemoved: new Signal(),

      windowResize: new Signal(),

      showGridChanged: new Signal(),
      refreshSidebarObject3D: new Signal(),
      historyChanged: new Signal()
    };

    this.history = new History(this);
    this.storage = new Storage();

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

    this.object = {};
    this.geometries = {};
    this.materials = {};
    this.textures = {};
    this.scripts = {};

    this.selected = null;
    this.helpers = {};

    this.viewport = null;
  }

  onComponentsRegistered = () => {
    this.gltfComponents.get("directional-light").inflate(this.scene);
    this.scene.traverse(child => {
      this.addHelper(child, this.scene);
    });
  };

  onWindowResize = () => {
    this.signals.windowResize.dispatch();
  };

  setTheme(value) {
    document.getElementById("theme").href = value;

    this.signals.themeChanged.dispatch(value);
  }

  createRenderer(canvas) {
    this.canvas = canvas;

    const renderer = new THREE.WebGLRenderer({
      canvas
    });
    renderer.shadowMap.enabled = true;

    this.viewport = new Viewport(this);
    this.signals.viewportInitialized.dispatch(this.viewport);

    this.signals.rendererChanged.dispatch(renderer);
  }

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

  _loadAndSetScene(url) {
    return loadScene(url, this.gltfComponents, true).then(scene => {
      this.scenes.push({ uri: url, obj: scene });
      this.setScene(scene);
      return scene;
    });
  }

  editScenePrefab(url) {
    this._loadAndSetScene(url);
  }

  openRootScene(url) {
    this.scenes = [];
    return this._loadAndSetScene(url);
  }

  setScene(scene) {
    this.scene = scene;
    this.signals.sceneSet.dispatch();
  }

  sceneModified() {
    return last(this.scenes).modified;
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

    const scope = this;

    object.traverse(function(child) {
      scope.removeHelper(child);
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

  gltfComponents = new Map();

  registerGLTFComponent(componentClass) {
    const { componentName } = componentClass;
    if (this.gltfComponents.has(componentName)) {
      throw new Error(`${componentName} already registered`);
    }
    this.gltfComponents.set(componentName, componentClass);
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

  addScript(object, script) {
    if (this.scripts[object.uuid] === undefined) {
      this.scripts[object.uuid] = [];
    }

    this.scripts[object.uuid].push(script);

    this.signals.scriptAdded.dispatch(script);
  }

  removeScript(object, script) {
    if (this.scripts[object.uuid] === undefined) return;

    const index = this.scripts[object.uuid].indexOf(script);

    if (index !== -1) {
      this.scripts[object.uuid].splice(index, 1);
    }

    this.signals.scriptRemoved.dispatch(script);
  }

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
    if (clone.userData._gltfComponents) {
      const components = clone.userData._gltfComponents;
      clone.userData._gltfComponents = null;
      for (const component of components) {
        const componentClass = this.gltfComponents.get(component.name);
        if (componentClass) {
          componentClass.inflate(clone, component.props);
        }
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
    this.storage.clear();

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
    this.scripts = {};

    this.deselect();

    this.signals.editorCleared.dispatch();
  }

  //

  fromJSON(json) {
    const loader = new THREE.ObjectLoader();

    // backwards

    if (json.scene === undefined) {
      this.setScene(loader.parse(json));
      return;
    }

    const camera = loader.parse(json.camera);

    this.camera.copy(camera);
    this.camera.aspect = this.DEFAULT_CAMERA.aspect;
    this.camera.updateProjectionMatrix();

    this.history.fromJSON(json.history);
    this.scripts = json.scripts;

    this.setScene(loader.parse(json.scene));
  }

  toJSON() {
    // scripts clean up

    const scene = this.scene;
    const scripts = this.scripts;

    for (const key in scripts) {
      const script = scripts[key];

      if (script.length === 0 || scene.getObjectByProperty("uuid", key) === undefined) {
        delete scripts[key];
      }
    }

    //

    return {
      metadata: {},
      project: {
        gammaInput: this.config.getKey("project/renderer/gammaInput"),
        gammaOutput: this.config.getKey("project/renderer/gammaOutput"),
        shadows: this.config.getKey("project/renderer/shadows"),
        vr: this.config.getKey("project/vr")
      },
      camera: this.camera.toJSON(),
      scene: this.scene.toJSON(),
      scripts: this.scripts,
      history: this.history.toJSON()
    };
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
