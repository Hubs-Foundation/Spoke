export default function sortEntities(entitiesObj) {
  // Sort entities by insertion order
  const sortedEntityIds = [];
  let entitiesToSort = [];

  // First add entities without parents
  for (const entityId in entitiesObj) {
    if (!Object.prototype.hasOwnProperty.call(entitiesObj, entityId)) continue;

    const entity = entitiesObj[entityId];

    if (!entity.parent || !entitiesObj[entity.parent]) {
      sortedEntityIds.push(entityId);
    } else {
      entitiesToSort.push(entityId);
    }
  }

  // Then group all entities by their parent
  const entitiesByParent = {};

  for (const entityId of entitiesToSort) {
    const entity = entitiesObj[entityId];

    if (!entitiesByParent[entity.parent]) {
      entitiesByParent[entity.parent] = [];
    }

    entitiesByParent[entity.parent].push(entityId);
  }

  // Then sort child entities by their index
  for (const parentName in entitiesByParent) {
    if (!Object.prototype.hasOwnProperty.call(entitiesByParent, parentName)) continue;

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

    children.forEach(childName => sortedEntityIds.push(childName));

    for (const childName of children) {
      addEntities(childName);
    }
  }

  // Clone sortedEntityIds so we can iterate over the initial entities and modify the array
  entitiesToSort = sortedEntityIds.concat();

  // Then recursively iterate over the child entities.
  for (const entityId of entitiesToSort) {
    addEntities(entityId);
  }

  return sortedEntityIds;
}
