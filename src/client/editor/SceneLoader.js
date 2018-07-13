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

function postProcessGLTF(scene, sceneURI, gltf) {
  const { json } = gltf;

  const buffers = json.buffers;

  if (buffers && buffers.length > 0 && buffers[0].uri === undefined) {
    buffers[0].uri = scene.name + ".bin";
  }

  const absoluteSceneURI = new URL(sceneURI, window.location).href;

  if (Array.isArray(json.images)) {
    for (const image of json.images) {
      image.uri = absoluteToRelativeURL(absoluteSceneURI, image.uri);
    }
  }

  const componentNames = Components.map(component => component.componentName);

  for (const node of gltf.json.nodes) {
    if (!node.extras) continue;
    if (!node.extensions) {
      node.extensions = [];
    }
    for (const component of node.extras._components) {
      if (componentNames.includes(component.name)) {
        node.extensions.push(component);
      }
    }
    delete node.extras._components;
  }

  return gltf;
}

export function exportScene(scene, sceneURI) {
  return new Promise(resolve => {
    new THREE.GLTFExporter().parseParts(scene, resolve, {
      embedImages: false,
      onlyVisible: false
    });
  }).then(gltf => postProcessGLTF(scene, sceneURI, gltf));
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

export async function loadSerializedScene(sceneDef, baseURL, addComponent, isRoot = true, ancestors) {
  let scene;

  const { inherits, root, entities } = sceneDef;

  if (inherits) {
    const absoluteBaseURL = new URL(baseURL, window.location);
    const inheritedSceneURL = new URL(inherits, absoluteBaseURL);
    // eslint-disable-next-line no-use-before-define
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
  let duplicateList = {};
  // check duplicate names
  scene.traverse(child => {
    const name = child.name;
    if (name in duplicateList) {
      duplicateList[name]++;
    } else {
      duplicateList[name] = 1;
    }
  });
  // update children duplicate status
  scene.traverse(child => {
    child.duplicate = duplicateList[child.name] > 1;
    child.isDuplicateRoot = child.duplicate;
  });
  // update scene conflict info
  scene.traverse(child => {
    if (child.duplicate) {
      scene.conflicts.duplicate = true;
    }
  });

  if (entities) {
    // Convert any relative URLs in the scene to absolute URLs so that other code does not need to know about the scene path.
    resolveRelativeURLs(entities, baseURL);

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

export async function loadScene(url, addComponent, isRoot = true, ancestors) {
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

  if (isRoot) {
    ancestors = [];
  }

  scene = await loadSerializedScene(sceneDef, url, addComponent, isRoot, ancestors);

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
