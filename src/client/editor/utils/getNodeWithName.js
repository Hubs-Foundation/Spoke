export default function getNodeWithName(object, name) {
  let node = null;

  // TODO: Don't traverse the whole tree. Return early if found.
  object.traverse(child => {
    if (!node && child.isNode && child.name === name) {
      node = child;
    }
  });

  return node;
}
