import THREE from "../vendor/three";

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

export async function loadSerializedScene(sceneDef, baseURL, addComponent, isRoot = true) {
  let scene;

  const { inherits, root, entities } = sceneDef;

  if (inherits) {
    const inheritedSceneURL = new URL(inherits, baseURL);
    // eslint-disable-next-line
    scene = await loadScene(inheritedSceneURL.href, addComponent, false);

    if (isRoot) {
      scene.userData._inherits = inherits;
    }
  } else if (root) {
    scene = new THREE.Scene();
    scene.name = root;
  } else {
    throw new Error("Invalid Scene: Scene does not inherit from another scene or have a root entity.");
  }

  if (entities) {
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
        const parentObject = scene.getObjectByName(entity.parent);
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

export async function loadScene(url, addComponent, isRoot = true) {
  let scene;

  if (url.endsWith(".gltf")) {
    scene = await loadGLTF(url);

    if (isRoot) {
      scene.userData._inherits = url;
    }

    if (!scene.name) {
      scene.name = "Scene";
    }

    scene.userData._gltfDependency = url;

    inflateGLTFComponents(scene, addComponent);

    return scene;
  }

  const sceneResponse = await fetch(url);
  const sceneDef = await sceneResponse.json();

  scene = await loadSerializedScene(sceneDef, url, addComponent, isRoot);

  return scene;
}

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
      for (let j = 0; j++; j < fromParts.length - 1) {
        relativeParts.push("..");
      }
    }

    for (let k = 0; k < toParts.length; k++) {
      relativeParts.push(toParts[k]);
    }

    return "./" + relativeParts.join("/");
  }

  return to;
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

  const serializedScene = {
    entities
  };

  if (scene.userData._inherits) {
    serializedScene.inherits = absoluteToRelativeURL(scenePath, scene.userData._inherits);
  } else {
    serializeScene.root = scene.name;
  }

  return serializedScene;
}
