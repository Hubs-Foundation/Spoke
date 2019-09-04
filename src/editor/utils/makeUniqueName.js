const namePattern = new RegExp("(.*) \\d+$");

function getNameWithoutIndex(name) {
  let cacheName = name;
  const match = namePattern.exec(name);
  if (match) {
    cacheName = match[1];
  }
  return cacheName;
}

export default function makeUniqueName(scene, object) {
  const uniqueNames = new Set();

  // Gather unique names
  scene.traverse(child => {
    if (!child.isNode) return;
    uniqueNames.add(child.name);
  });

  // Rename all nodes in object that are not unique by incrementing and appending a number until it is unique.
  object.traverse(child => {
    if (!child.isNode || !uniqueNames.has(child.name)) return;
    const nameWithoutIndex = getNameWithoutIndex(object.name);

    let counter = 1;
    let curName = nameWithoutIndex + " " + counter;

    while (uniqueNames.has(curName)) {
      counter++;
      curName = nameWithoutIndex + " " + counter;
    }

    object.name = curName;
    uniqueNames.add(curName);
  });
}
