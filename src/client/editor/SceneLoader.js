import THREE from "../vendor/three";
import { Components } from "./components";
import SceneReferenceComponent from "./components/SceneReferenceComponent";
import ConflictHandler from "./ConflictHandler";
import StandardMaterialComponent from "../editor/components/StandardMaterialComponent";
import ShadowComponent from "./components/ShadowComponent";
import SceneLoaderError from "./SceneLoaderError";
import ConflictError from "./ConflictError";
import {
  computeAndSetStaticModes,
  isStatic,
  getStaticMode,
  setStaticMode,
  getOriginalStaticMode,
  setOriginalStaticMode
} from "./StaticMode";
import { gltfCache } from "./caches";
import DirectionalLightComponent from "./components/DirectionalLightComponent";
import AmbientLightComponent from "./components/AmbientLightComponent";

const defaultLightComponentNames = [DirectionalLightComponent.componentName, AmbientLightComponent.componentName];

export function absoluteToRelativeURL(from, to) {
  if (from === to) return to;

  const fromURL = new URL(from, window.location);
  const toURL = new URL(to, window.location);

  if (fromURL.host === toURL.host) {
    const relativeParts = [];
    const fromParts = fromURL.pathname.split("/");
    const toParts = toURL.pathname.split("/");

    while (fromParts.length > 0 && toParts.length > 0 && fromParts[0] === toParts[0]) {
      fromParts.shift();
      toParts.shift();
    }

    if (fromParts.length > 1) {
      for (let j = 0; j < fromParts.length - 1; j++) {
        relativeParts.push("..");
      }
    }

    for (let k = 0; k < toParts.length; k++) {
      relativeParts.push(toParts[k]);
    }

    const relativePath = relativeParts.join("/");

    if (relativePath.startsWith("../")) {
      return relativePath;
    }

    return "./" + relativePath;
  }

  return to;
}

function loadGLTF(url) {
  return gltfCache
    .get(url)
    .then(({ scene }) => {
      if (scene === undefined) {
        throw new Error(`Error loading: ${url}. glTF file has no default scene.`);
      }
      return scene;
    })
    .catch(e => {
      console.error(e);
      throw new SceneLoaderError("Error loading GLTF", url, "damaged", e);
    });
}

function shallowEquals(objA, objB) {
  for (const key in objA) {
    if (objA[key] !== objB[key]) {
      return false;
    }
  }

  return true;
}

function hasExtrasOrExtensions(obj) {
  const userData = obj.userData;

  for (const key in userData) {
    if (userData.hasOwnProperty(key) && !key.startsWith("_")) {
      return true;
    }
  }

  return false;
}

function removeEditorData(scene) {
  scene.traverse(({ userData }) => {
    // Remove editor data.
    for (const key in userData) {
      if (userData.hasOwnProperty(key) && key.startsWith("_")) {
        delete userData[key];
      }
    }
  });
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

export async function exportScene(scene) {
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

  removeUnusedObjects(clonedScene);
  removeEditorData(clonedScene);

  // TODO: export animations
  const chunks = await new Promise((resolve, reject) => {
    new THREE.GLTFExporter().parseChunks(clonedScene, resolve, reject, {
      mode: "gltf",
      onlyVisible: false
    });
  });

  const buffers = chunks.json.buffers;

  if (buffers && buffers.length > 0 && buffers[0].uri === undefined) {
    buffers[0].uri = clonedScene.name + ".bin";
  }

  // De-duplicate images.

  const images = chunks.json.images;

  if (images && images.length > 0) {
    // Map containing imageProp -> newIndex
    const uniqueImageProps = new Map();
    // Map containing oldIndex -> newIndex
    const imageIndexMap = new Map();
    // Array containing unique imageDefs
    const uniqueImageDefs = [];
    // Array containing unique image blobs
    const uniqueImages = [];

    for (const [index, imageDef] of images.entries()) {
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

  return chunks;
}

async function inflateGLTFComponents(scene, addComponent) {
  const addComponentPromises = [];
  scene.traverse(async object => {
    const extensions = object.userData.gltfExtensions;
    if (extensions !== undefined) {
      for (const extensionName in extensions) {
        addComponentPromises.push(addComponent(object, extensionName, extensions[extensionName], true));
      }
    }

    if (object instanceof THREE.Mesh) {
      addComponentPromises.push(addComponent(object, "mesh", null, true));

      const shadowProps = object.userData.components ? object.userData.components.shadow : null;
      addComponentPromises.push(addComponent(object, "shadow", shadowProps, true));

      if (object.material instanceof THREE.MeshStandardMaterial) {
        addComponentPromises.push(addComponent(object, "standard-material", null, true));
      }
    }
  });
  await Promise.all(addComponentPromises);
}

function addChildAtIndex(parent, child, index) {
  parent.children.splice(index, 0, child);
  child.parent = parent;
}

// Sort entities by insertion order
function sortEntities(entitiesObj) {
  const sortedEntityNames = [];
  let entitiesToSort = [];

  // First add entities without parents
  for (const entityName in entitiesObj) {
    const entity = entitiesObj[entityName];

    if (!entity.parent || !entitiesObj[entity.parent]) {
      sortedEntityNames.push(entityName);
    } else {
      entitiesToSort.push(entityName);
    }
  }

  // Then group all entities by their parent
  const entitiesByParent = {};

  for (const entityName of entitiesToSort) {
    const entity = entitiesObj[entityName];

    if (!entitiesByParent[entity.parent]) {
      entitiesByParent[entity.parent] = [];
    }

    entitiesByParent[entity.parent].push(entityName);
  }

  // Then sort child entities by their index
  for (const parentName in entitiesByParent) {
    entitiesByParent[parentName].sort((a, b) => {
      const entityA = entitiesObj[a];
      const entityB = entitiesObj[b];

      return entityA.index - entityB.index;
    });
  }

  function addEntities(parentName) {
    const children = entitiesByParent[parentName];

    if (children === undefined) {
      return;
    }

    children.forEach(childName => sortedEntityNames.push(childName));

    for (const childName of children) {
      addEntities(childName);
    }
  }

  // Clone sortedEntityNames so we can iterate over the initial entities and modify the array
  entitiesToSort = sortedEntityNames.concat();

  // Then recursively iterate over the child entities.
  for (const entityName of entitiesToSort) {
    addEntities(entityName);
  }

  return sortedEntityNames;
}

function resolveRelativeURLs(entities, absoluteSceneURL) {
  for (const entityId in entities) {
    const entity = entities[entityId];
    const entityComponents = entity.components;

    if (entityComponents) {
      for (const component of entityComponents) {
        if (component.name === SceneReferenceComponent.componentName) {
          component.props.src = new URL(component.props.src, absoluteSceneURL).href;
        } else if (component.src) {
          // SaveableComponent
          component.src = new URL(component.src, absoluteSceneURL).href;
        }
      }
    }
  }
}

function convertAbsoluteURLs(entities, sceneURL) {
  for (const entityId in entities) {
    const entity = entities[entityId];
    const entityComponents = entity.components;

    if (entityComponents) {
      for (const component of entityComponents) {
        if (component.name === SceneReferenceComponent.componentName) {
          component.props.src = absoluteToRelativeURL(sceneURL, component.props.src);
        } else if (component.src) {
          // SaveableComponent
          component.src = absoluteToRelativeURL(sceneURL, component.src);
        }
      }
    }
  }
}

export async function loadSerializedScene(sceneDef, baseURI, addComponent, isRoot = true, ancestors) {
  let scene;

  const { inherits, root, entities } = sceneDef;

  const absoluteBaseURL = new URL(baseURI, window.location);
  if (inherits) {
    const inheritedSceneURL = new URL(inherits, absoluteBaseURL).href;
    scene = await loadScene(inheritedSceneURL, addComponent, false, ancestors);

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
    // Convert any relative URLs in the scene to absolute URLs so that other code does not need to know about the scene path.
    resolveRelativeURLs(entities, absoluteBaseURL.href);

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
          const { props } = componentDef;
          if (componentDef.src) {
            // Process SaveableComponent
            componentDef.src = componentDef.src;
            const resp = await fetch(componentDef.src);
            let json = {};
            if (resp.ok) {
              json = await resp.json();
            }
            entityComponentPromises.push(
              addComponent(entityObj, componentDef.name, json, !isRoot).then(component => {
                component.src = componentDef.src;
                component.srcIsValid = resp.ok;
              })
            );
          } else {
            entityComponentPromises.push(addComponent(entityObj, componentDef.name, props, !isRoot));
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

export async function loadScene(uri, addComponent, isRoot = true, ancestors) {
  let scene;

  const url = new URL(uri, window.location).href;

  if (url.endsWith(".gltf")) {
    scene = await loadGLTF(url);

    if (isRoot) {
      scene.userData._inherits = url;
    }

    if (!scene.name) {
      scene.name = "Scene";
    }

    scene.userData._conflictHandler = new ConflictHandler();
    scene.userData._conflictHandler.findDuplicates(scene, 0, 0);
    if (scene.userData._conflictHandler.getDuplicateStatus() || scene.userData._conflictHandler.getMissingStatus()) {
      const error = new ConflictError("gltf naming conflicts", "import", url, scene.userData._conflictHandler);
      throw error;
    }

    await inflateGLTFComponents(scene, addComponent);

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

  if (!isRoot) {
    // Remove default light components from a referenced scene root.
    const sceneRoot = sceneDef.root && sceneDef.entities[sceneDef.root];
    if (sceneRoot && sceneRoot.components) {
      sceneRoot.components = sceneRoot.components.filter(
        component => !defaultLightComponentNames.includes(component.name)
      );
    }
  }

  scene = await loadSerializedScene(sceneDef, uri, addComponent, isRoot, ancestors);

  scene.userData._ancestors = ancestors;

  return scene;
}

export function serializeScene(scene, scenePath) {
  scene = scene.clone();
  const entities = {};

  scene.traverse(entityObject => {
    let parent;
    let index;
    let components;
    let staticMode;

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
            components.push({
              name: component.name,
              src: component.src
            });
          } else {
            components.push({
              name: component.name,
              props: component.props
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

  convertAbsoluteURLs(entities, scenePath);

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
