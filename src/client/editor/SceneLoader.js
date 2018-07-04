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

function addChildAtIndex(parent, child, index) {
  parent.children.splice(index, 0, child);
  child.parent = parent;
}

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

export async function loadSerializedScene(sceneDef, baseURL, components, isRoot = true) {
  let scene;

  const { inherits, root, entities } = sceneDef;

  if (inherits) {
    const inheritedSceneURL = new URL(inherits, baseURL);
    // eslint-disable-next-line
    scene = await loadScene(inheritedSceneURL.href, components, false);

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
    const sortedEntities = sortEntities(entities);

    for (const entityName of sortedEntities) {
      const entity = entities[entityName];

      let entityObj = scene.getObjectByName(entityName);

      if (entityObj === undefined) {
        entityObj = new THREE.Object3D();
        entityObj.name = entityName;
      }

      if (entity.parent) {
        const parentObject = scene.getObjectByName(entity.parent);
        addChildAtIndex(parentObject, entityObj, entity.index);
        entityObj.userData._saveParent = true;
      }

      let componentsToSave;

      if (isRoot) {
        componentsToSave = [];
      }

      for (const componentName in entity.components) {
        const component = entity.components[componentName];

        if (components[componentName] === undefined) {
          entityObj.userData[componentName] = component;
        } else {
          components[componentName].inflate(entityObj, component);
        }

        if (isRoot) {
          componentsToSave.push(componentName);
        }
      }

      if (isRoot) {
        entityObj.userData._componentsToSave = componentsToSave;
      }
    }
  }

  return scene;
}

export async function loadScene(url, components, isRoot = true) {
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

    return scene;
  }

  const sceneResponse = await fetch(url);
  const sceneDef = await sceneResponse.json();

  scene = await loadSerializedScene(sceneDef, url, components, isRoot);

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
    const componentsToSave = entityObject.userData._componentsToSave;

    if (Array.isArray(componentsToSave)) {
      const entityDef = {};
      const entityComponents = {};

      for (const componentName of componentsToSave) {
        const componentData = entityObject.userData[componentName];

        if (componentData === undefined) {
          console.warn(
            `serializeScene: Object3d named "${
              entityObject.name
            }" includes "${componentName}" in userData._componentsToSave but userData.${componentName} is undefined.`
          );
          continue;
        }

        if (typeof componentData.toJSON === "function") {
          entityComponents[componentName] = componentData.serialize(scenePath);
        } else {
          entityComponents[componentName] = componentData;
        }
      }

      if (componentsToSave.length > 0) {
        entityDef.components = entityComponents;
      }

      if (entityObject.userData._saveParent) {
        entityDef.parent = entityObject.parent.name;

        const index = entityObject.parent.children.indexOf(entityObject);

        if (index === -1) {
          throw new Error("Entity not found in parent.");
        }

        entityDef.index = index;
      }

      entities[entityObject.name] = entityDef;
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
