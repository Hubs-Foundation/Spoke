const namePattern = new RegExp("(.*) \\d+$");

function getNameWithoutIndex(name) {
  let cacheName = name;
  const match = namePattern.exec(name);
  if (match) {
    cacheName = match[1];
  }
  return cacheName;
}

function isDuplicateName(scene, name) {
  let foundDuplicate = false;
  scene.traverse(object => {
    if (foundDuplicate) return;
    foundDuplicate = object.isNode && object.name === name;
  });
  return foundDuplicate;
}

export default function makeUniqueName(scene, object) {
  const nameWithoutIndex = getNameWithoutIndex(object.name);

  if (isDuplicateName(scene, nameWithoutIndex)) {
    let counter = 1;
    let curName = nameWithoutIndex + " " + counter;

    while (isDuplicateName(scene, curName)) {
      counter++;
      curName = nameWithoutIndex + " " + counter;
    }

    object.name = curName;
  }
}
