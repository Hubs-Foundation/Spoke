import THREE from "../vendor/three";
import { Components } from "./components";
import SceneReferenceComponent from "./components/SceneReferenceComponent";
import SaveableComponent from "./components/SaveableComponent";
import ConflictHandler from "./ConflictHandler";

export function absoluteToRelativeURL(from, to) {
  if (from === to) {
    return to;
  }

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
  return new Promise((resolve, reject) => {
    new THREE.GLTFLoader().load(
      url,
      ({ scene }) => {
        if (scene === undefined) {
          return reject(`Error loading: ${url}. glTF file has no default scene.`);
        }

        resolve(scene);
      },
      undefined,
      e => {
        console.error(e);
        reject(e);
      }
    );
  });
}

function addComponentData(node, componentNames) {
  if (!node.extras) return;
  if (node.extras._components && node.extras._components.length > 0) {
    for (const component of node.extras._components) {
      if (componentNames.includes(component.name)) {
        if (node.extras.components === undefined) {
          node.extras.components = {};
        }

        node.extras.components[component.name] = component.props;
      }
    }
    delete node.extras._components;
  }
}

function removeEditorData(node) {
  if (node.extras) {
    for (const key in node.extras) {
      console.log(key);
      if (key.startsWith("_")) {
        delete node.extras[key];
      }
    }

    if (Object.keys(node.extras).length === 0) {
      delete node.extras;
    }
  }
}

export async function exportScene(scene) {
  // TODO: export animations
  const chunks = await new Promise((resolve, reject) => {
    new THREE.GLTFExporter().parseChunks(scene, resolve, reject, {
      mode: "gltf",
      onlyVisible: false
    });
  });

  const buffers = chunks.json.buffers;

  if (buffers && buffers.length > 0 && buffers[0].uri === undefined) {
    buffers[0].uri = scene.name + ".bin";
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

  const componentNames = Components.filter(c => !c.dontExportProps).map(component => component.componentName);

  for (const scene of chunks.json.scenes) {
    addComponentData(scene, componentNames);
  }

  for (const node of chunks.json.nodes) {
    addComponentData(node, componentNames);
  }

  // Remove editor data.
  for (const scene of chunks.json.scenes) {
    removeEditorData(scene);
  }

  for (const node of chunks.json.nodes) {
    removeEditorData(node);
  }

  return chunks;
}

function inflateGLTFComponents(scene, addComponent) {
  scene.traverse(object => {
    const extensions = object.userData.gltfExtensions;
    if (extensions !== undefined) {
      for (const extensionName in extensions) {
        addComponent(object, extensionName, extensions[extensionName], true);
      }
    }

    if (object instanceof THREE.Mesh && object.material instanceof THREE.MeshStandardMaterial) {
      addComponent(object, "standard-material", undefined, true);
    }
  });
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
    const inheritedSceneURL = new URL(inherits, absoluteBaseURL);
    scene = await loadScene(inheritedSceneURL.href, addComponent, false, ancestors);

    if (ancestors) {
      ancestors.push(inherits);
    }
    if (isRoot) {
      scene.userData._inherits = inherits;
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
    scene.userData._conflictHandler.updateAllDuplicateStatus(scene);
  }

  if (entities) {
    // Convert any relative URLs in the scene to absolute URLs so that other code does not need to know about the scene path.
    resolveRelativeURLs(entities, absoluteBaseURL.href);

    // Sort entities by insertion order (uses parent and index to determine order).
    const sortedEntities = sortEntities(entities);

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
            const resp = await fetch(componentDef.src);
            const json = await resp.json();
            const component = addComponent(entityObj, componentDef.name, json, !isRoot);
            component.src = componentDef.src;
          } else {
            addComponent(entityObj, componentDef.name, props, !isRoot);
          }
        }
      }
    }
  }

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
    scene.userData._conflictHandler.updateAllDuplicateStatus(scene);
    inflateGLTFComponents(scene, addComponent);

    return scene;
  }

  const sceneResponse = await fetch(url);
  const sceneDef = await sceneResponse.json();

  if (isRoot) {
    ancestors = [];
  }

  scene = await loadSerializedScene(sceneDef, uri, addComponent, isRoot, ancestors);

  scene.userData._ancestors = ancestors;

  return scene;
}

export function serializeScene(scene, scenePath) {
  const entities = {};

  scene.traverse(entityObject => {
    let parent;
    let index;
    let components;

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

          if (component instanceof SaveableComponent) {
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

    const saveEntity = entityObject.userData._saveEntity;

    if (parent !== undefined || components !== undefined || saveEntity) {
      entities[entityObject.name] = {
        parent,
        index,
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
