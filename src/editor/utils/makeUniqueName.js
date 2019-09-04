import traverseEarlyOut from "../utils/traverseEarlyOut";

const namePattern = new RegExp("(.*) \\d+$");

function getNameWithoutIndex(name) {
  let cacheName = name;
  const match = namePattern.exec(name);
  if (match) {
    cacheName = match[1];
  }
  return cacheName;
}

function isDuplicateName(scene, additionalNames, name, withoutIndex) {
  const result = traverseEarlyOut(scene, object => {
    if (!object.isNode) return true;

    let objectName = object.name;

    if (withoutIndex) {
      objectName = getNameWithoutIndex(object.name);
    }

    const foundDuplicate = objectName === name || additionalNames.has(objectName);

    return !foundDuplicate;
  });

  return !result;
}

export default function makeUniqueName(scene, object) {
  const objectNames = new Map();

  object.traverse(child => {
    if (child.isNode) {
      const nameWithoutIndex = getNameWithoutIndex(object.name);

      if (isDuplicateName(scene, objectNames, nameWithoutIndex, true)) {
        let counter = 1;
        let curName = nameWithoutIndex + " " + counter;

        while (isDuplicateName(scene, objectNames, curName)) {
          counter++;
          curName = nameWithoutIndex + " " + counter;
        }

        object.name = curName;
      }

      objectNames.set(object.name);
    }
  });
}
