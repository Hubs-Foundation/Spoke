import signals from "signals";
import { Socket } from "phoenix";
import uuid from "uuid/v4";

import THREE from "./three";
import History from "./History";
import Viewport from "./Viewport";

import AddObjectCommand from "./commands/AddObjectCommand";
import MoveObjectCommand from "./commands/MoveObjectCommand";
import RemoveObjectCommand from "./commands/RemoveObjectCommand";
import SetNameCommand from "./commands/SetNameCommand";
import SetPositionCommand from "./commands/SetPositionCommand";
import SetRotationCommand from "./commands/SetRotationCommand";
import SetScaleCommand from "./commands/SetScaleCommand";

import { StaticModes } from "./StaticMode";
// import MeshCombinationGroup from "./MeshCombinationGroup";
// import { generateNavMesh } from "../utils/navmesh";
import { getUrlFilename } from "../utils/url-path";
import { textureCache, gltfCache } from "./caches";

import ConflictHandler from "./ConflictHandler";
import ConflictError from "./ConflictError";
import SceneLoaderError from "./SceneLoaderError";

import absoluteToRelativeURL from "./utils/absoluteToRelativeURL";
import addChildAtIndex from "./utils/addChildAtIndex";
import sortEntities from "./utils/sortEntities";
// import cloneObject3D from "./utils/cloneObject3D";
import ModelNode from "./nodes/ModelNode";
import DefaultNodeEditor from "../ui/node-editors/DefaultNodeEditor";
import SceneNode from "./nodes/SceneNode";
import SetObjectPropertyCommand from "./commands/SetObjectPropertyCommand";

export default class Editor {
  constructor(project) {
    this.project = project;

    this.DEFAULT_CAMERA = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.2, 8000);
    this.DEFAULT_CAMERA.layers.enable(1);
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

    this.project.addListener("change", path => {
      this.signals.fileChanged.dispatch(path);
    });

    this.history = new History(this);

    this.camera = this.DEFAULT_CAMERA.clone();

    this.openFile = null;

    this.scenes = [];
    const initialSceneInfo = {
      uri: null,
      scene: new SceneNode(),
      modified: false
    };
    this.scenes.push(initialSceneInfo);

    this.scene = initialSceneInfo.scene;
    this.sceneInfo = initialSceneInfo;

    this._ignoreSceneModification = false;
    this.signals.sceneGraphChanged.add(() => {
      if (this._ignoreSceneModification) return;
      this.sceneInfo.modified = true;
      this.sceneInfo.isDefaultScene = false;
      this.signals.sceneModified.dispatch();
    });
    this.signals.objectChanged.add(() => {
      if (this._ignoreSceneModification) return;
      this.sceneInfo.modified = true;
      this.sceneInfo.isDefaultScene = false;
      this.signals.sceneModified.dispatch();
    });
    // this.signals.objectSelected.add((obj, prev) => {
    //   // TODO: Add onSelected/onUnselected hooks
    // });

    // TODO: Support multiple viewports
    this.viewports = [];
    this.selected = null;

    this.nodeTypes = new Set();
    this.nodeEditors = new Map();

    this._conflictHandler = new ConflictHandler();
    this.scene.userData._conflictHandler = this._conflictHandler;
    this.ignoreNextSceneFileChange = false;
    this.signals.fileChanged.add(this.onFileChanged);

    this.StaticModes = StaticModes;
    this.loadNewScene();

    this.updateInfo = null;
  }

  async init() {
    const tasks = [this.retrieveUpdateInfo()];

    for (const NodeConstructor of this.nodeTypes) {
      tasks.push(NodeConstructor.load());
    }

    await Promise.all(tasks);
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
  };

  //

  setSceneURI(uri) {
    this.sceneInfo.uri = uri;
  }

  _clearCaches() {
    textureCache.disposeAndClear();
    gltfCache.disposeAndClear();
  }

  _setSceneInfo(scene, uri) {
    this.sceneInfo = {
      uri: uri,
      scene: scene,
      modified: false
    };
  }

  async loadNewScene() {
    this._clearCaches();

    const scene = new SceneNode();
    scene.name = "Untitled";

    this._conflictHandler = null;

    this._setSceneInfo(scene, null);
    this.sceneInfo.isDefaultScene = true;
    this.scenes = [this.sceneInfo];

    this._setScene(scene);

    this.signals.sceneModified.dispatch();

    this.history.clear();
    this.deselect();

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

  sceneModified() {
    return this.sceneInfo.modified;
  }

  sceneIsDefault() {
    return !!this.sceneInfo.isDefaultScene;
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

    const scene = await this._loadScene(uri, true);
    this._conflictHandler = scene.userData._conflictHandler;

    this._setSceneInfo(scene, uri);
    this.scenes.push(this.sceneInfo);

    this._setScene(scene);

    this.signals.sceneModified.dispatch();

    return scene;
  }

  async loadGLTF(url) {
    const gltf = await gltfCache.get(url);

    if (gltf.scene === undefined) {
      throw new Error(`Error loading: ${url}. glTF file has no default scene.`);
    }

    if (!gltf.scene.name) {
      gltf.scen.name = "Scene";
    }

    return gltf;
  }

  async _loadScene(uri, isRoot = true, ancestors) {
    let scene;

    const url = new URL(uri, window.location).href;

    if (url.endsWith(".gltf") || url.endsWith(".glb")) {
      const gltf = await this.loadGLTF(url);
      scene = gltf.scene;

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
      const error = new SceneLoaderError("Error loading .spoke file", url, "damaged", null);
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

  async _loadSerializedScene(sceneDef, baseURI, isRoot = true, ancestors) {
    let scene;

    const { metadata, inherits, root, entities } = sceneDef;

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
      scene = new SceneNode();
      scene.name = root;
    } else {
      throw new Error("Invalid Scene: Scene does not inherit from another scene or have a root entity.");
    }

    if (metadata) {
      scene.userData._metadata = metadata;
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
          entityObj.staticMode = entity.staticMode;

          if (isRoot) {
            entityObj.originalStaticMode = entity.staticMode;
          }
        }
      }
      await Promise.all(entityComponentPromises);
    }
    scene.userData._conflictHandler.findDuplicates(scene, 0, 0);
    return scene;
  }

  async _reloadScene() {
    const sceneURI = this.sceneInfo.uri;
    const sceneDef = this._serializeScene(this.scene, sceneURI);
    const scene = await this._loadSerializedScene(sceneDef, sceneURI, true);

    const sceneInfo = this.scenes.find(sceneInfo => sceneInfo.uri === sceneURI);
    sceneInfo.scene = scene;

    this._setScene(scene);

    return scene;
  }

  async saveScene(sceneURI) {
    let newSceneName = decodeURIComponent(getUrlFilename(sceneURI));

    // Edge case: we may already have an object in the scene with this name. Our
    // code assumes all objects in the scene have unique names (including the scene itself)
    // so add a suffix.

    while (this.scene.getObjectByName(newSceneName)) {
      newSceneName += " Scene";
    }

    this.scene.name = newSceneName;

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

    this.signals.sceneModified.dispatch();
  }

  _serializeScene(scene, scenePath, skipMetadata = false) {
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

      const curStaticMode = entityObject.staticMode;
      const originalStaticMode = entityObject.originalStaticMode;

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

    const serializedScene = { entities };

    if (!skipMetadata) {
      serializedScene.metadata = this.getSceneMetadata();
    }

    if (scene.userData._inherits) {
      serializedScene.inherits = absoluteToRelativeURL(scenePath, scene.userData._inherits);
    } else {
      serializedScene.root = scene.name;
    }

    return serializedScene;
  }

  // async generateNavMesh() {
  //   const currentNavMeshNode = this.findFirstWithComponent("nav-mesh");

  //   if (currentNavMeshNode) {
  //     const src = this.getComponentProperty(currentNavMeshNode, "gltf-model", "src");
  //     await this.project.remove(src);
  //     this.removeObject(currentNavMeshNode);
  //   }

  //   const geometries = [];

  //   this.scene.traverse(node => {
  //     if (!node.isMesh) return;
  //     if (!node.userData._includeInFloorPlan) return;
  //     if (node.userData._dontExport) return;

  //     let geometry = node.geometry;
  //     let attributes = geometry.attributes;

  //     if (!geometry.isBufferGeometry) {
  //       geometry = new THREE.BufferGeometry().fromGeometry(geometry);
  //       attributes = geometry.attributes;
  //     }

  //     if (!attributes.position || attributes.position.itemSize !== 3) return;

  //     if (geometry.index) geometry = geometry.toNonIndexed();

  //     const cloneGeometry = new THREE.BufferGeometry();
  //     cloneGeometry.addAttribute("position", geometry.attributes.position.clone());
  //     cloneGeometry.applyMatrix(node.matrixWorld);
  //     geometry = cloneGeometry;

  //     geometries.push(geometry);
  //   });

  //   const finalGeos = [];
  //   let heightfield;

  //   if (geometries.length) {
  //     const geometry = THREE.BufferGeometryUtils.mergeBufferGeometries(geometries);

  //     const flippedGeometry = geometry.clone();

  //     const positions = flippedGeometry.attributes.position.array;
  //     for (let i = 0; i < positions.length; i += 9) {
  //       const x0 = positions[i];
  //       const y0 = positions[i + 1];
  //       const z0 = positions[i + 2];
  //       const offset = 6;
  //       positions[i] = positions[i + offset];
  //       positions[i + 1] = positions[i + offset + 1];
  //       positions[i + 2] = positions[i + offset + 2];
  //       positions[i + offset] = x0;
  //       positions[i + offset + 1] = y0;
  //       positions[i + offset + 2] = z0;
  //     }

  //     const finalGeo = THREE.BufferGeometryUtils.mergeBufferGeometries([geometry, flippedGeometry]);

  //     const position = finalGeo.attributes.position.array;
  //     const index = new Int32Array(position.length / 3);
  //     for (let i = 0; i < index.length; i++) {
  //       index[i] = i;
  //     }

  //     const box = new THREE.Box3().setFromBufferAttribute(finalGeo.attributes.position);
  //     const size = new THREE.Vector3();
  //     box.getSize(size);
  //     if (Math.max(size.x, size.y, size.z) > 2000) {
  //       throw new Error(
  //         `Scene is too large (${size.x.toFixed(3)} x ${size.y.toFixed(3)} x ${size.z.toFixed(3)}) ` +
  //           `to generate a floor plan.\n` +
  //           `You can un-check the "Include in Floor Plan" checkbox on models to exclude them from the floor plan.`
  //       );
  //     }
  //     const area = size.x * size.z;
  //     // Tuned to produce cell sizes from ~0.5 to ~1.5 for areas from ~200 to ~350,000.
  //     const cellSize = Math.pow(area, 1 / 3) / 50;
  //     const { navPosition, navIndex } = generateNavMesh(position, index, cellSize);

  //     const navGeo = new THREE.BufferGeometry();
  //     navGeo.setIndex(navIndex);
  //     navGeo.addAttribute("position", new THREE.Float32BufferAttribute(navPosition, 3));

  //     heightfield = await HeightfieldComponent.generateHeightfield(new THREE.Mesh(navGeo));

  //     finalGeos.push(navGeo);
  //   }

  //   const groundPlaneNode = this.findFirstWithComponent("ground-plane");
  //   if (groundPlaneNode) {
  //     if (!this.findFirstWithComponent("box-collider", groundPlaneNode)) {
  //       const groundPlaneCollider = new THREE.Object3D();
  //       groundPlaneCollider.userData._dontShowInHierarchy = true;
  //       groundPlaneCollider.scale.set(4000, 0.01, 4000);
  //       this._addComponent(groundPlaneCollider, "box-collider", {}, true);
  //       groundPlaneNode.add(groundPlaneCollider);
  //     }
  //     const groundPlaneMesh = groundPlaneNode.getObjectByProperty("type", "Mesh");
  //     const origGroundPlaneGeo = groundPlaneMesh.geometry;
  //     const groundPlaneGeo = new THREE.BufferGeometry();
  //     groundPlaneGeo.setIndex(origGroundPlaneGeo.index);
  //     groundPlaneGeo.addAttribute("position", origGroundPlaneGeo.attributes.position.clone());
  //     groundPlaneGeo.applyMatrix(groundPlaneMesh.matrixWorld);
  //     finalGeos.push(groundPlaneGeo);
  //   }

  //   if (finalGeos.length === 0) return;

  //   const finalNavGeo =
  //     finalGeos.length === 1 ? finalGeos[0] : THREE.BufferGeometryUtils.mergeBufferGeometries(finalGeos);

  //   const navMesh = new THREE.Mesh(finalNavGeo, new THREE.MeshLambertMaterial({ color: 0x0000ff }));

  //   const exporter = new THREE.GLTFExporter();
  //   const glb = await new Promise((resolve, reject) => exporter.parse(navMesh, resolve, reject, { mode: "glb" }));
  //   const path = await this.project.writeGeneratedBlob(`${navMesh.uuid}.glb`, glb);

  //   const navNode = new THREE.Object3D();
  //   navNode.name = "Floor Plan";
  //   navNode.position.y = 0.005;
  //   this._addComponent(navNode, "nav-mesh");
  //   this._addComponent(navNode, "visible", { visible: false });
  //   await this._addComponent(navNode, "gltf-model", { src: path });
  //   if (heightfield) {
  //     await this._addComponent(navNode, "heightfield", heightfield);
  //   }
  //   this.addObject(navNode);
  // }

  async exportScene(/* outputPath, glb */) {
    // const scene = this.scene;
    // const clonedScene = cloneObject3D(scene);
    // // Add a preview camera to the exported GLB if there is a transform in the metadata.
    // const { previewCameraTransform } = this.getSceneMetadata();
    // if (previewCameraTransform) {
    //   const previewCamera = this.DEFAULT_CAMERA.clone();
    //   previewCamera.name = "scene-preview-camera";
    //   previewCamera.applyMatrix(previewCameraTransform);
    //   clonedScene.add(previewCamera);
    // }
    // clonedScene.traverse(object => {
    //   // Remove objects marked as _dontExport
    //   for (const child of object.children) {
    //     if (child.userData._dontExport) {
    //       object.remove(child);
    //       return;
    //     }
    //   }
    // });
    // await MeshCombinationGroup.combineMeshes(clonedScene);
    // const animations = [];
    // clonedScene.traverse(object => {
    //   const gltfModelComponent = GLTFModelComponent.getComponent(object);
    //   const loopAnimationComponent = LoopAnimationComponent.getComponent(object);
    //   if (gltfModelComponent && loopAnimationComponent) {
    //     const gltfRoot = object.children.find(node => node.type === "Scene");
    //     const clipName = loopAnimationComponent.props.clip;
    //     if (gltfRoot && clipName !== null) {
    //       const animation = gltfRoot.animations.find(a => a.name === clipName);
    //       if (animation) {
    //         animations.push(animation);
    //       } else {
    //         throw new Error(`Animation for clip "${clipName}" not found.`);
    //       }
    //     } else if (loopAnimationComponent) {
    //       const index = object.userData._components.findIndex(
    //         ({ name }) => name === LoopAnimationComponent.componentName
    //       );
    //       object.userData._components.splice(index, 1);
    //     }
    //   }
    // });
    // const componentsToExport = Components.filter(c => !c.dontExportProps).map(component => component.componentName);
    // function ensureHubsComponents(userData) {
    //   if (userData.gltfExtensions === undefined) {
    //     userData.gltfExtensions = {};
    //   }
    //   if (userData.gltfExtensions.HUBS_components === undefined) {
    //     userData.gltfExtensions.HUBS_components = {};
    //   }
    // }
    // // Second pass at scene optimization.
    // clonedScene.traverse(object => {
    //   const userData = object.userData;
    //   // Move component data to userData.extensions.HUBS_components
    //   if (userData._components) {
    //     for (const component of userData._components) {
    //       if (componentsToExport.includes(component.name)) {
    //         ensureHubsComponents(userData);
    //         userData.gltfExtensions.HUBS_components[component.name] = component.props;
    //       }
    //     }
    //   }
    //   // Add shadow component to meshes with non-default values.
    //   if (object.isMesh && (object.castShadow || object.receiveShadow)) {
    //     ensureHubsComponents(object.userData);
    //     object.userData.gltfExtensions.HUBS_components.shadow = {
    //       castShadow: object.castShadow,
    //       receiveShadow: object.receiveShadow
    //     };
    //   }
    // });
    // function hasExtrasOrExtensions(object) {
    //   const userData = object.userData;
    //   for (const key in userData) {
    //     if (userData.hasOwnProperty(key) && !key.startsWith("_")) {
    //       return true;
    //     }
    //   }
    //   return false;
    // }
    // function removeUnusedObjects(object) {
    //   let canBeRemoved = !!object.parent;
    //   for (const child of object.children.slice(0)) {
    //     if (!removeUnusedObjects(child)) {
    //       canBeRemoved = false;
    //     }
    //   }
    //   const shouldRemove =
    //     canBeRemoved &&
    //     (object.constructor === THREE.Object3D || object.constructor === THREE.Scene) &&
    //     object.children.length === 0 &&
    //     isStatic(object) &&
    //     !hasExtrasOrExtensions(object);
    //   if (canBeRemoved && shouldRemove) {
    //     object.parent.remove(object);
    //     return true;
    //   }
    //   return false;
    // }
    // removeUnusedObjects(clonedScene);
    // clonedScene.traverse(({ userData }) => {
    //   // Remove editor data.
    //   for (const key in userData) {
    //     if (userData.hasOwnProperty(key) && key.startsWith("_")) {
    //       delete userData[key];
    //     }
    //   }
    // });
    // const exporter = new THREE.GLTFExporter();
    // // TODO: export animations
    // const chunks = await new Promise((resolve, reject) => {
    //   exporter.parseChunks(clonedScene, resolve, reject, {
    //     mode: glb ? "glb" : "gltf",
    //     onlyVisible: false,
    //     animations
    //   });
    // });
    // if (!glb) {
    //   const bufferDefs = chunks.json.buffers;
    //   if (bufferDefs && bufferDefs.length > 0 && bufferDefs[0].uri === undefined) {
    //     bufferDefs[0].uri = clonedScene.name + ".bin";
    //   }
    // }
    // // De-duplicate images.
    // const imageDefs = chunks.json.images;
    // if (imageDefs && imageDefs.length > 0) {
    //   // Map containing imageProp -> newIndex
    //   const uniqueImageProps = new Map();
    //   // Map containing oldIndex -> newIndex
    //   const imageIndexMap = new Map();
    //   // Array containing unique imageDefs
    //   const uniqueImageDefs = [];
    //   // Array containing unique image blobs
    //   const uniqueImages = [];
    //   for (const [index, imageDef] of imageDefs.entries()) {
    //     const imageProp = imageDef.uri === undefined ? imageDef.bufferView : imageDef.uri;
    //     let newIndex = uniqueImageProps.get(imageProp);
    //     if (newIndex === undefined) {
    //       newIndex = uniqueImageDefs.push(imageDef) - 1;
    //       uniqueImageProps.set(imageProp, newIndex);
    //       uniqueImages.push(chunks.images[index]);
    //     }
    //     imageIndexMap.set(index, newIndex);
    //   }
    //   chunks.json.images = uniqueImageDefs;
    //   chunks.images = uniqueImages;
    //   for (const textureDef of chunks.json.textures) {
    //     textureDef.source = imageIndexMap.get(textureDef.source);
    //   }
    // }
    // if (glb) {
    //   return await new Promise((resolve, reject) => exporter.createGLBBlob(chunks, resolve, reject));
    // } else {
    //   // Export current editor scene using THREE.GLTFExporter
    //   const { json, buffers, images } = chunks;
    //   // Ensure the output directory exists
    //   await this.project.mkdir(outputPath);
    //   // Write the .gltf file
    //   const gltfPath = outputPath + "/" + scene.name + ".gltf";
    //   await this.project.writeJSON(gltfPath, json);
    //   // Write .bin files
    //   for (const [index, buffer] of buffers.entries()) {
    //     if (buffer !== undefined) {
    //       const bufferName = json.buffers[index].uri;
    //       await this.project.writeBlob(outputPath + "/" + bufferName, buffer);
    //     }
    //   }
    //   // Write image files
    //   for (const [index, image] of images.entries()) {
    //     if (image !== undefined) {
    //       const imageName = json.images[index].uri;
    //       await this.project.writeBlob(outputPath + "/" + imageName, image);
    //     }
    //   }
    // }
  }

  async addGLTFModelNode(name, uri, originUri) {
    const attribution = await this.project.getImportAttribution(uri);
    const node = new ModelNode();
    node.name = name;
    await node.loadGLTF(this, uri);
    node.attribution = attribution;
    node.origin = originUri;
    this.addObject(node);
    this.select(node);
  }

  async importGLTFIntoModelNode(url) {
    const { uri: importedUri, name } = await this.project.import(url);
    await this.addGLTFModelNode(name || "Model", importedUri, url);
  }

  addObject(object, parent) {
    object.saveParent = true;

    object.traverse(child => (child.name = this._conflictHandler.addToDuplicateNameCounters(child, child.name)));

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

    if (object === this.selected) {
      this.deselect();
    }

    object.parent.remove(object);
    this._conflictHandler.removeFromDuplicateNameCounters(object, object.name);

    this.signals.objectRemoved.dispatch(object);
    this.signals.sceneGraphChanged.dispatch();
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

  clearSceneMetadata() {
    delete this.scene.userData._metadata;
  }

  setSceneMetadata(newMetadata) {
    const existingMetadata = this.scene.userData._metadata || {};
    this.scene.userData._metadata = Object.assign(existingMetadata, newMetadata);
  }

  getSceneMetadata() {
    return this.scene.userData._metadata || {};
  }

  setTransformMode(mode) {
    this.signals.transformModeChanged.dispatch(mode);
  }

  setObjectName(object, value) {
    const handler = this._conflictHandler;
    if (handler.isUniqueObjectName(value)) {
      const prevName = object.name;
      handler.addToDuplicateNameCounters(object, value);
      object.name = value;
      handler.removeFromDuplicateNameCounters(object, prevName);
    } else {
      this.signals.objectChanged.dispatch(object);
      throw new ConflictError("rename error", "rename", this.sceneInfo.uri, handler);
    }
  }

  registerNode(nodeConstructor, nodeEditor) {
    this.nodeTypes.add(nodeConstructor);
    this.nodeEditors.set(nodeConstructor, nodeEditor);
  }

  getNodeEditor(node) {
    return this.nodeEditors.get(node.constructor) || DefaultNodeEditor;
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

    const objectName = object.name;
    this.execute(new RemoveObjectCommand(object));
    this._conflictHandler.removeFromDuplicateNameCounters(object, objectName);
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

  getSceneAttribution() {
    const attributions = new Set();
    this.scene.traverse(obj => {
      if (!(obj.isNode && obj.type === "Model")) return;
      const attribution = obj.attribution;
      if (!attribution) return;
      attributions.add(attribution);
    });
    return Array.from(attributions).join("\n");
  }

  async takeScreenshot() {
    return this.viewports[0].takeScreenshot();
  }

  async publishScene(sceneId, screenshotBlob, attribution, onPublishProgress) {
    onPublishProgress("generating floor plan");

    await this.generateNavMesh();

    await this.project.mkdir(this.project.getAbsoluteURI("generated"));

    const { name, creatorAttribution, description, allowRemixing, allowPromotion } = this.getSceneMetadata();
    if (creatorAttribution && creatorAttribution.trim().length) {
      attribution = `by ${creatorAttribution}.` + "\n" + attribution;
    }

    onPublishProgress("exporting scene");

    const glbUri = this.project.getAbsoluteURI(`generated/${uuid()}.glb`);
    const glbBlob = await this.exportScene(null, true);
    const size = glbBlob.size / 1024 / 1024;
    if (size > 100) {
      throw new Error(`Scene is too large (${size.toFixed(2)}MB) to publish.`);
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
    const serializedScene = this._serializeScene(this.scene, sceneFileUri, true);
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
      attribution,
      allowRemixing,
      allowPromotion
    });

    onPublishProgress("");

    return { sceneUrl: res.url, sceneId: res.sceneId };
  }

  async _debugVerifyAuth(url) {
    const params = new URLSearchParams(url);
    const topic = params.get("auth_topic");
    const token = params.get("auth_token");
    const reticulumServer = process.env.RETICULUM_SERVER;
    const socketUrl = `wss://${reticulumServer}/socket`;
    const socket = new Socket(socketUrl, { params: { session_id: uuid() } });
    socket.connect();
    const channel = socket.channel(topic);
    await new Promise((resolve, reject) =>
      channel
        .join()
        .receive("ok", resolve)
        .receive("error", reject)
    );
    channel.push("auth_verified", { token });
  }

  async startAuthentication(email) {
    const reticulumServer = process.env.RETICULUM_SERVER;
    const socketUrl = `wss://${reticulumServer}/socket`;
    const socket = new Socket(socketUrl, { params: { session_id: uuid() } });
    socket.connect();
    const channel = socket.channel(`auth:${uuid()}`);
    await new Promise((resolve, reject) =>
      channel
        .join()
        .receive("ok", resolve)
        .receive("error", reject)
    );

    const authComplete = new Promise(resolve =>
      channel.on("auth_credentials", async ({ credentials }) => {
        await fetch("/api/credentials", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ credentials })
        });
        resolve();
      })
    );

    channel.push("auth_request", { email, origin: "spoke" });

    return { authComplete };
  }

  async authenticated() {
    return await fetch("/api/authenticated").then(r => r.ok);
  }

  /*
   * Stores user info on disk.
   * userInfo can be a partial object.
   */
  async setUserInfo(userInfo) {
    return await fetch("/api/user_info", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(userInfo)
    });
  }

  async getUserInfo() {
    return fetch("/api/user_info").then(r => r.json());
  }

  async retrieveUpdateInfo() {
    this.updateInfo = await fetch("/api/update_info").then(r => r.json());
  }
}
