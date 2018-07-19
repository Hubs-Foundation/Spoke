import THREE from "../vendor/three";
import { Components } from "./components";
import SceneReferenceComponent from "./components/SceneReferenceComponent";

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

  const componentNames = Components.map(component => component.componentName);

  for (const node of chunks.json.nodes) {
    if (!node.extras) continue;
    if (!node.extensions) {
      node.extensions = {};
    }
    if (node.extras._components) {
      for (const component of node.extras._components) {
        if (componentNames.includes(component.name)) {
          node.extensions[component.name] = component;
        }
      }
      delete node.extras._components;
    }
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
  scene.userData._conflicts = {
    missing: false,
    duplicate: false
  };
  const duplicateList = {};
  // check duplicate names
  // update children duplicate status
  const findDuplicates = (node, layer, index) => {
    if (node.userData._path) {
      node.userData._path.push(index);
    } else {
      node.userData._path = [0];
    }

    // count the name and save to the list
    const name = node.name;
    duplicateList[name] = name in duplicateList ? duplicateList[name] + 1 : 1;
    if (duplicateList[name] > 1) {
      scene.userData._conflicts.duplicate = true;
    }

    if (node.children) {
      node.children.forEach((child, i) => {
        child.userData._path = node.userData._path.slice(0);
        findDuplicates(child, layer + 1, i);
      });
    }
  };
  findDuplicates(scene, 0, 0);

  scene.traverse(child => {
    child.userData._duplicate = duplicateList[child.name] > 1;
    child.userData._isDuplicateRoot = child.userData._duplicate;
  });

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
          scene.userData._conflicts.missing = true;
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
          addComponent(entityObj, componentDef.name, componentDef.props, !isRoot);
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

          components.push({
            name: component.name,
            props: component.props
          });
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
