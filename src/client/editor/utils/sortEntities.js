export default function sortEntities(entitiesObj) {
  // Sort entities by insertion order
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
