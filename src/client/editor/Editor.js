import signals from "signals";

import THREE from "./three";
import History from "./History";
import Viewport from "./Viewport";
import RemoveObjectCommand from "./commands/RemoveObjectCommand";
import AddObjectCommand from "./commands/AddObjectCommand";
import AddComponentCommand from "./commands/AddComponentCommand";
import SetValueCommand from "./commands/SetValueCommand";
import RemoveComponentCommand from "./commands/RemoveComponentCommand";
import SetComponentPropertyCommand from "./commands/SetComponentPropertyCommand";
import MoveObjectCommand from "./commands/MoveObjectCommand";
import {
  isStatic,
  setStaticMode,
  StaticModes,
  getStaticMode,
  computeStaticMode,
  computeAndSetStaticModes,
  getOriginalStaticMode,
  setOriginalStaticMode
} from "./StaticMode";
import { Components } from "./components";
import { types } from "./components/utils";
import SceneReferenceComponent from "./components/SceneReferenceComponent";
import SaveableComponent from "./components/SaveableComponent";
import { last } from "../utils";
import { textureCache, gltfCache } from "./caches";
import ConflictHandler from "./ConflictHandler";
import ConflictError from "./ConflictError";
import SpokeDirectionalLightHelper from "./helpers/SpokeDirectionalLightHelper";
import SpokeHemisphereLightHelper from "./helpers/SpokeHemisphereLightHelper";
import absoluteToRelativeURL from "./utils/absoluteToRelativeURL";
import StandardMaterialComponent from "../editor/components/StandardMaterialComponent";
import ShadowComponent from "./components/ShadowComponent";
import shallowEquals from "./utils/shallowEquals";
import addChildAtIndex from "./utils/addChildAtIndex";
import SceneLoaderError from "./SceneLoaderError";
import sortEntities from "./utils/sortEntities";
import GLTFModelComponent from "./components/GLTFModelComponent";

/**
 * @author mrdoob / http://mrdoob.com/
 */
export default class Editor {
  constructor(project) {
    this.project = project;

    this.DEFAULT_CAMERA = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.005, 10000);
    this.DEFAULT_CAMERA.name = "Camera";
    this.DEFAULT_CAMERA.position.set(0, 5, 10);
    this.DEFAULT_CAMERA.lookAt(new THREE.Vector3());

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

      objectSelected: new Signal(),
      objectFocused: new Signal(),

      objectAdded: new Signal(),
      objectChanged: new Signal(),
      objectRemoved: new Signal(),

      helperAdded: new Signal(),
      helperRemoved: new Signal(),

      windowResize: new Signal(),

      historyChanged: new Signal(),

      fileChanged: new Signal()
    };

    this.project.addListener("change", path => {
      this.signals.fileChanged.dispatch(path);
    });

    this.history = new History(this);

    this.camera = this.DEFAULT_CAMERA.clone();

    this.openFile = null;

    this.scenes = [];
    const initialSceneInfo = {
      uri: null,
      scene: new THREE.Scene(),
      helperScene: new THREE.Scene(),
      helpers: {},
      modified: false
    };
    initialSceneInfo.scene.name = "Scene";
    this.scenes.push(initialSceneInfo);

    this.scene = initialSceneInfo.scene;
    this.sceneInfo = initialSceneInfo;
    this.helperScene = initialSceneInfo.helperScene;
    this.helpers = initialSceneInfo.helpers;

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

    this.ComponentPropTypes = types;
    this.StaticModes = StaticModes;
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

    if (poppedURI) {
      const sceneRefComponentName = SceneReferenceComponent.componentName;
      const previousURI = this.getComponentProperty(this._prefabBeingEdited, sceneRefComponentName, "src");
      this.updateComponentProperty(this._prefabBeingEdited, sceneRefComponentName, "src", poppedURI);
      if (previousURI.endsWith(".gltf") || previousURI.endsWith(".glb")) {
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

  async editScenePrefab(object, uri) {
    this._prefabBeingEdited = object;
    const scene = await this._loadSceneFromURL(uri);
    return scene;
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
      helpers: this.helpers
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

  async openScene(uri) {
    this.scenes = [];
    this._clearCaches();
    this._ignoreSceneModification = true;

    const scene = await this._loadSceneFromURL(uri);
    this._ignoreSceneModification = false;

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

  async createPrefabFromGLTF(gltfUrl, destUrl) {
    // Load glTF and throw errors if there are conflicts
    await this._loadGLTF(gltfUrl);

    const prefabDef = {
      entities: {},
      inherits: gltfUrl
    };

    await this.project.writeJSON(destUrl, prefabDef);
  }

  async fixConflictError(error) {
    if (error.type === "import") {
      const originalGLTF = await this.project.readJSON(error.uri);

      if (originalGLTF.nodes) {
        error.handler.updateNodeNames(originalGLTF.nodes);
        await this.project.writeJSON(error.uri, originalGLTF);
      }

      return true;
    }
  }

  async _loadSceneFromURL(uri) {
    this.deselect();

    this._deleteSceneDependencies();

    this._resetHelpers();

    const scene = await this._loadScene(uri, true);
    this._conflictHandler = scene.userData._conflictHandler;

    this._setSceneInfo(scene, uri);
    this.scenes.push(this.sceneInfo);

    this._setScene(scene);

    this._addDependency(uri, scene);

    this.signals.sceneModified.dispatch();

    return scene;
  }

  async _loadGLTF(url) {
    const { scene } = await gltfCache.get(url);

    if (scene === undefined) {
      throw new Error(`Error loading: ${url}. glTF file has no default scene.`);
    }

    if (!scene.name) {
      scene.name = "Scene";
    }

    return scene;
  }

  async _loadScene(uri, isRoot = true, ancestors) {
    let scene;

    const url = new URL(uri, window.location).href;

    if (url.endsWith(".gltf") || url.endsWith(".glb")) {
      scene = await this._loadGLTF(url);

      if (isRoot) {
        scene.userData._inherits = url;
      }

      // Inflate components
      const addComponentPromises = [];

      scene.traverse(async object => {
        const extensions = object.userData.gltfExtensions;
        if (extensions !== undefined) {
          for (const extensionName in extensions) {
            addComponentPromises.push(this._addComponent(object, extensionName, extensions[extensionName], true));
          }
        }

        if (object instanceof THREE.Mesh) {
          addComponentPromises.push(this._addComponent(object, "mesh", null, true));

          const shadowProps = object.userData.components
            ? object.userData.components.shadow
            : { castShadow: true, receiveShadow: true };
          addComponentPromises.push(this._addComponent(object, "shadow", shadowProps, true));

          if (object.material instanceof THREE.MeshStandardMaterial) {
            addComponentPromises.push(this._addComponent(object, "standard-material", null, true));
          }
        }
      });

      await Promise.all(addComponentPromises);

      return scene;
    }

    const sceneResponse = await fetch(url);
    if (!sceneResponse.ok) {
      const error = new SceneLoaderError("Error loading .scene", url, "damaged", null);
      throw error;
    }
    const sceneDef = await sceneResponse.json();

    if (isRoot) {
      ancestors = [];
    }

    scene = await this._loadSerializedScene(sceneDef, uri, isRoot, ancestors);

    scene.userData._ancestors = ancestors;

    return scene;
  }

  _resolveFileProps(component, props, basePath) {
    const clonedProps = Object.assign({}, props);

    for (const { name, type } of component.schema) {
      if (type === types.file && clonedProps[name]) {
        clonedProps[name] = new URL(clonedProps[name], basePath).href;
      }
    }

    return clonedProps;
  }

  async _loadSerializedScene(sceneDef, baseURI, isRoot = true, ancestors) {
    let scene;

    const { inherits, root, entities } = sceneDef;

    const absoluteBaseURL = new URL(baseURI, window.location);
    if (inherits) {
      const inheritedSceneURL = new URL(inherits, absoluteBaseURL).href;
      scene = await this._loadScene(inheritedSceneURL, false, ancestors);

      if (ancestors) {
        ancestors.push(inheritedSceneURL);
      }
      if (isRoot) {
        scene.userData._inherits = inheritedSceneURL;
      }
    } else if (root) {
      scene = new THREE.Scene();
      scene.name = root;
    } else {
      throw new Error("Invalid Scene: Scene does not inherit from another scene or have a root entity.");
    }

    // init scene conflict status
    if (!scene.userData._conflictHandler) {
      scene.userData._conflictHandler = new ConflictHandler();
      scene.userData._conflictHandler.findDuplicates(scene, 0, 0);
    }

    if (entities) {
      // Sort entities by insertion order (uses parent and index to determine order).
      const sortedEntities = sortEntities(entities);

      const entityComponentPromises = [];
      for (const entityName of sortedEntities) {
        const entity = entities[entityName];

        // Find or create the entity's Object3D
        let entityObj = scene.getObjectByName(entityName);

        if (entityObj === undefined) {
          entityObj = new THREE.Object3D();
          entityObj.name = entityName;
        }

        // Entities defined in the root scene should be saved.
        if (isRoot) {
          entityObj.userData._saveEntity = true;
        }

        // Attach the entity to its parent.
        // An entity doesn't have a parent defined if the entity is loaded in an inherited scene.
        if (entity.parent) {
          let parentObject = scene.getObjectByName(entity.parent);
          if (!parentObject) {
            // parent node got renamed or deleted
            parentObject = new THREE.Object3D();
            parentObject.name = entity.parent;
            parentObject.userData._isMissingRoot = true;
            parentObject.userData._missing = true;
            scene.userData._conflictHandler.setMissingStatus(true);
            scene.add(parentObject);
          } else {
            if (!parentObject.userData._missing) {
              parentObject.userData._isMissingRoot = false;
              parentObject.userData._missing = false;
            }
          }

          entityObj.userData._missing = parentObject.userData._missing;
          entityObj.userData._duplicate = parentObject.userData._duplicate;
          addChildAtIndex(parentObject, entityObj, entity.index);
          // Parents defined in the root scene should be saved.
          if (isRoot) {
            entityObj.userData._saveParent = true;
          }
        }

        // Inflate the entity's components.
        if (Array.isArray(entity.components)) {
          for (const componentDef of entity.components) {
            if (componentDef.src) {
              // Process SaveableComponent
              componentDef.src = new URL(componentDef.src, absoluteBaseURL.href).href;
              const resp = await fetch(componentDef.src);
              let json = {};
              if (resp.ok) {
                json = await resp.json();
              }

              const props = this._resolveFileProps(this.components.get(componentDef.name), json, componentDef.src);

              entityComponentPromises.push(
                this._addComponent(entityObj, componentDef.name, props, !isRoot).then(component => {
                  component.src = componentDef.src;
                  component.srcIsValid = resp.ok;
                })
              );
            } else {
              const props = this._resolveFileProps(
                this.components.get(componentDef.name),
                componentDef.props,
                absoluteBaseURL.href
              );

              entityComponentPromises.push(this._addComponent(entityObj, componentDef.name, props, !isRoot));
            }
          }
        }

        if (entity.staticMode !== undefined) {
          setStaticMode(entityObj, entity.staticMode);

          if (isRoot) {
            setOriginalStaticMode(entityObj, entity.staticMode);
          }
        }
      }
      await Promise.all(entityComponentPromises);
    }
    scene.userData._conflictHandler.findDuplicates(scene, 0, 0);
    return scene;
  }

  async _loadSceneReference(uri, parent) {
    this._removeSceneRefDependency(parent);

    const scene = await this._loadScene(uri, false);
    scene.userData._dontShowInHierarchy = true;
    scene.userData._sceneReference = uri;

    const conflictHandler = scene.userData._conflictHandler;
    if (conflictHandler.getDuplicateStatus()) {
      // auto resolve scene conflicts
      conflictHandler.resolveConflicts(scene);
    }

    scene.traverse(child => {
      child.userData._dontSerialize = true;
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
    const sceneDef = this._serializeScene(this.scene, sceneURI);
    const scene = await this._loadSerializedScene(sceneDef, sceneURI, true);

    const sceneInfo = this.scenes.find(sceneInfo => sceneInfo.uri === sceneURI);
    sceneInfo.scene = scene;

    this._setScene(scene);

    return scene;
  }

  async saveScene(sceneURI) {
    const serializedScene = this._serializeScene(this.scene, sceneURI || this.sceneInfo.uri);

    this.ignoreNextSceneFileChange = true;

    await this.project.writeJSON(sceneURI, serializedScene);

    const sceneUserData = this.scene.userData;

    // If the previous URI was a gltf, update the ancestors, since we are now dealing with a .scene file.
    if (this.sceneInfo.uri && (this.sceneInfo.uri.endsWith(".gltf") || this.sceneInfo.uri.endsWith(".glb"))) {
      sceneUserData._ancestors = [this.sceneInfo.uri];
    }

    this.setSceneURI(sceneURI);

    this.signals.sceneGraphChanged.dispatch();

    this.sceneInfo.modified = false;
  }

  _serializeScene(scene, scenePath) {
    const entities = {};

    scene.traverse(entityObject => {
      let parent;
      let index;
      let components;
      let staticMode;

      if (entityObject.userData._dontSerialize) {
        return;
      }

      // Serialize the parent and index if _saveParent is set.
      if (entityObject.userData._saveParent) {
        parent = entityObject.parent.name;

        const parentIndex = entityObject.parent.children.indexOf(entityObject);

        if (parentIndex === -1) {
          throw new Error("Entity not found in parent.");
        }

        index = parentIndex;
      }

      // Serialize all components with shouldSave set.
      const entityComponents = entityObject.userData._components;

      if (Array.isArray(entityComponents)) {
        for (const component of entityComponents) {
          if (component.shouldSave) {
            if (components === undefined) {
              components = [];
            }

            if (component.src) {
              // Serialize SaveableComponent
              const src = absoluteToRelativeURL(scenePath, component.src);

              components.push({
                name: component.name,
                src
              });
            } else if (component.serialize) {
              const props = component.serialize(scenePath);

              components.push({
                name: component.name,
                props
              });
            }
          }
        }
      }

      const curStaticMode = getStaticMode(entityObject);
      const originalStaticMode = getOriginalStaticMode(entityObject);

      if (curStaticMode !== originalStaticMode) {
        staticMode = curStaticMode;
      }

      const saveEntity = entityObject.userData._saveEntity;

      if (parent !== undefined || components !== undefined || staticMode !== undefined || saveEntity) {
        entities[entityObject.name] = {
          parent,
          index,
          staticMode,
          components
        };
      }
    });

    const serializedScene = {
      entities
    };

    if (scene.userData._inherits) {
      serializedScene.inherits = absoluteToRelativeURL(scenePath, scene.userData._inherits);
    } else {
      serializedScene.root = scene.name;
    }

    return serializedScene;
  }

  async exportScene(outputPath) {
    const scene = this.scene;
    const clonedScene = scene.clone();

    computeAndSetStaticModes(clonedScene);

    const meshesToCombine = [];

    // First pass at scene optimization.
    clonedScene.traverse(object => {
      // Mark objects with meshes for merging
      const curShadowComponent = ShadowComponent.getComponent(object);
      const curMaterialComponent = StandardMaterialComponent.getComponent(object);

      if (isStatic(object) && curShadowComponent && curMaterialComponent) {
        let foundMaterial = false;

        for (const { shadowComponent, materialComponent, meshes } of meshesToCombine) {
          if (
            shallowEquals(materialComponent.props, curMaterialComponent.props) &&
            shallowEquals(shadowComponent.props, curShadowComponent.props)
          ) {
            meshes.push(object);
            foundMaterial = true;
            break;
          }
        }

        if (!foundMaterial) {
          meshesToCombine.push({
            shadowComponent: curShadowComponent,
            materialComponent: curMaterialComponent,
            meshes: [object]
          });
        }
      }

      // Remove objects marked as _dontExport
      for (const child of object.children) {
        if (child.userData._dontExport) {
          object.remove(child);
          return;
        }
      }
    });

    // Combine meshes and add to scene.
    for (const { meshes } of meshesToCombine) {
      if (meshes.length > 1) {
        const bufferGeometries = [];

        for (const mesh of meshes) {
          // Clone buffer geometry in case it is re-used across meshes with different materials.
          const clonedBufferGeometry = mesh.geometry.clone();
          clonedBufferGeometry.applyMatrix(mesh.matrixWorld);
          bufferGeometries.push(clonedBufferGeometry);
        }

        const originalMesh = meshes[0];

        const combinedGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries(bufferGeometries);
        delete combinedGeometry.userData.mergedUserData;
        const combinedMesh = new THREE.Mesh(combinedGeometry, originalMesh.material);
        combinedMesh.name = "CombinedMesh";
        combinedMesh.receiveShadow = originalMesh.receiveShadow;
        combinedMesh.castShadow = originalMesh.castShadow;

        clonedScene.add(combinedMesh);

        for (const mesh of meshes) {
          const meshIndex = mesh.parent.children.indexOf(mesh);
          const parent = mesh.parent;
          mesh.parent.remove(mesh);
          const replacementObj = new THREE.Object3D();
          replacementObj.copy(mesh);
          replacementObj.children = mesh.children;

          addChildAtIndex(parent, replacementObj, meshIndex);
        }
      }
    }

    const componentsToExport = Components.filter(c => !c.dontExportProps).map(component => component.componentName);

    // Second pass at scene optimization.
    clonedScene.traverse(object => {
      const userData = object.userData;

      // Move component data to userData.components
      if (userData._components) {
        for (const component of userData._components) {
          if (componentsToExport.includes(component.name)) {
            if (userData.components === undefined) {
              userData.components = {};
            }

            userData.components[component.name] = component.props;
          }
        }
      }

      // Add shadow component to meshes with non-default values.
      if (object.isMesh && (object.castShadow || object.receiveShadow)) {
        if (!object.userData.components) {
          object.userData.components = {};
        }

        object.userData.components.shadow = {
          castShadow: object.castShadow,
          receiveShadow: object.receiveShadow
        };
      }
    });

    function hasExtrasOrExtensions(object) {
      const userData = object.userData;

      for (const key in userData) {
        if (userData.hasOwnProperty(key) && !key.startsWith("_")) {
          return true;
        }
      }

      return false;
    }

    function removeUnusedObjects(object) {
      let canBeRemoved = !!object.parent;

      for (const child of object.children.slice(0)) {
        if (!removeUnusedObjects(child)) {
          canBeRemoved = false;
        }
      }

      const shouldRemove =
        canBeRemoved &&
        (object.constructor === THREE.Object3D || object.constructor === THREE.Scene) &&
        object.children.length === 0 &&
        isStatic(object) &&
        !hasExtrasOrExtensions(object);

      if (canBeRemoved && shouldRemove) {
        object.parent.remove(object);
        return true;
      }

      return false;
    }

    removeUnusedObjects(clonedScene);

    clonedScene.traverse(({ userData }) => {
      // Remove editor data.
      for (const key in userData) {
        if (userData.hasOwnProperty(key) && key.startsWith("_")) {
          delete userData[key];
        }
      }
    });

    // TODO: export animations
    const chunks = await new Promise((resolve, reject) => {
      new THREE.GLTFExporter().parseChunks(clonedScene, resolve, reject, {
        mode: "gltf",
        onlyVisible: false
      });
    });

    const bufferDefs = chunks.json.buffers;

    if (bufferDefs && bufferDefs.length > 0 && bufferDefs[0].uri === undefined) {
      bufferDefs[0].uri = clonedScene.name + ".bin";
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
    const scene = await this._loadSerializedScene(extendSceneDef, inheritedURI, true, ancestors);

    this._setSceneInfo(scene, null);
    this.scenes = [this.sceneInfo];
    this._setScene(scene);
    this._addDependency(inheritedURI, scene);

    this.signals.sceneModified.dispatch();

    return scene;
  }
  //

  addSceneReferenceNode(name, url) {
    if (url === this.sceneInfo.uri) {
      throw new Error("Scene cannot be added to itself.");
    }

    const object = new THREE.Object3D();
    object.name = name;
    setStaticMode(object, StaticModes.Static);
    this.addObject(object);
    this._addComponent(object, "scene-reference", { src: url });
    this.select(object);
  }

  addGLTFModelNode(name, url) {
    const object = new THREE.Object3D();
    object.name = name;
    setStaticMode(object, StaticModes.Static);
    this.addObject(object);
    this._addComponent(object, "gltf-model", { src: url });
    this.select(object);
  }

  createNode(name, parent) {
    const object = new THREE.Object3D();
    object.name = name;
    this.execute(new AddObjectCommand(object, parent));
  }

  addObject(object, parent) {
    this._addComponent(object, "transform");

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
    this.execute(new MoveObjectCommand(object, parent, before));
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
        helper = new SpokeDirectionalLightHelper(object, 1);
      } else if (object instanceof THREE.SpotLight) {
        helper = new THREE.SpotLightHelper(object, 1);
      } else if (object instanceof THREE.HemisphereLight) {
        helper = new SpokeHemisphereLightHelper(object, 1);
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

  addComponent(object, componentName) {
    this.execute(new AddComponentCommand(object, componentName));
  }

  async updateGLTFModelComponent(object) {
    const component = GLTFModelComponent.getComponent(object);

    try {
      const scene = await this._loadGLTF(component.props.src);

      scene.traverse(child => {
        child.userData._dontSerialize = true;
        this.setHidden(child, true);
        Object.defineProperty(child.userData, "_selectionRoot", {
          value: object,
          configurable: true,
          enumerable: false
        });
      });

      if (component._object) {
        object.remove(component._object);
      }

      object.add(scene);
      component._object = scene;
    } catch (e) {
      console.error("Failed to load glTF", e);

      if (component.propValidation.src !== false) {
        component.propValidation.src = false;
        this.signals.objectChanged.dispatch(object);
      }
    }
  }

  _addComponent = async (object, componentName, props, skipSave) => {
    try {
      const componentClass = this.components.get(componentName);
      let component;

      if (componentClass) {
        if (componentClass.type === "light") {
          this._resetDefaultLights();
        }

        if (componentName === GLTFModelComponent.componentName && props && props.src) {
          component = await this.components.get(componentName).inflate(object, props);
          await this.updateGLTFModelComponent(object);
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
    this.execute(new RemoveComponentCommand(object, componentName));
  }

  _removeComponent(object, componentName) {
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
    this.signals.objectChanged.dispatch(object);
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

  setComponentProperty(object, componentName, propertyName, value) {
    this.execute(new SetComponentPropertyCommand(object, componentName, propertyName, value));

    const component = this.getComponent(object, componentName);

    if (component instanceof SaveableComponent) {
      component.modified = true;
    }
  }

  updateComponentProperty(object, componentName, propertyName, value) {
    const component = this.getComponent(object, componentName);

    if (this.components.has(componentName)) {
      if (componentName === GLTFModelComponent.componentName && propertyName === "src") {
        component.updateProperty(propertyName, value);
        this.updateGLTFModelComponent(object);
      }

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

  async loadComponent(object, componentName, src) {
    const component = this.getComponent(object, componentName);
    component.src = src;
    component.srcIsValid = true;
    component.shouldSave = true;
    component.modified = false;

    const absoluteAssetURL = new URL(component.src, window.location).href;
    let props = await this.project.readJSON(component.src);
    props = this._resolveFileProps(component, props, absoluteAssetURL);

    await component.constructor.inflate(object, props);
    this.signals.objectChanged.dispatch(object);
  }

  async saveComponent(object, componentName) {
    const component = this.getComponent(object, componentName);
    const props = component.serialize(component.src);
    await this.project.writeJSON(component.src, props);
    component.modified = false;
    this.signals.objectChanged.dispatch(object);
  }

  async saveComponentAs(object, componentName, src) {
    const component = this.getComponent(object, componentName);
    component.src = src;
    component.srcIsValid = true;
    component.shouldSave = true;
    await this.project.writeJSON(component.src, component.props);
    component.modified = false;
    this.signals.objectChanged.dispatch(object);
  }

  setTransformMode(mode) {
    this.signals.transformModeChanged.dispatch(mode);
  }

  setStaticMode(object, mode) {
    setStaticMode(object, mode);
    this.signals.objectChanged.dispatch(object);
  }

  getStaticMode(object) {
    return getStaticMode(object);
  }

  computeStaticMode(object) {
    return computeStaticMode(object);
  }

  setObjectName(object, value) {
    const handler = this._conflictHandler;

    if (handler.isUniqueObjectName(value)) {
      object.name = value;
      handler.addToDuplicateNameCounters(value);
      this.execute(new SetValueCommand(object, "name", value));
    } else {
      this.signals.objectChanged.dispatch(object);
      throw new ConflictError("rename error", "rename", this.sceneInfo.uri, handler);
    }
  }

  setHidden(object, value) {
    return (object.userData._dontShowInHierarchy = value);
  }

  isHidden(object) {
    return !!object.userData._dontShowInHierarchy;
  }

  setCollapsed(object, value) {
    return (object.userData._collapsed = value);
  }

  isCollapsed(object) {
    return !!object.userData._collapsed;
  }

  getNodeHierarchy() {
    const scene = this.scene;
    const handler = scene.userData._conflictHandler;

    if (handler) {
      const list = handler.checkResolvedMissingRoot(scene);

      for (const item of list) {
        this.removeObject(item);
      }

      handler.updateNodesMissingStatus(scene);
      handler.updateNodesDuplicateStatus(scene);
    }

    const buildNode = object => {
      const collapsed = this.isCollapsed(object);

      const node = {
        object,
        collapsed
      };

      if (object.children.length !== 0) {
        node.children = object.children.filter(child => !this.isHidden(child)).map(child => buildNode(child));
      }

      return node;
    };

    return buildNode(scene);
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
        this._addComponent(clone, component.name, component.props);
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
