export default function getNodeWithUUID(object, uuid) {
  let node = null;

  // TODO: Don't traverse the whole tree. Return early if found.
  object.traverse(child => {
    if (!node && child.isNode && child.uuid === uuid) {
      node = child;
    }
  });

  return node;
}
