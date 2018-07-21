export function last(arr) {
  if (!arr || !arr.length) return null;
  return arr[arr.length - 1];
}

export function nodesToTree(nodes) {
  if (!nodes) {
    return;
  }

  nodes.forEach((node, i) => {
    if (!node.userData) {
      createTreePath(node, 0, i, nodes);
    }
    if (node.userData._visited) {
      return;
    }
    createTreePath(node, 0, i, nodes);
  });

  return nodes;
}

function createTreePath(node, layer, index, nodes) {
  if (!node.userData) {
    node.userData = {};
  }
  node.userData._visited = true;
  if (node.userData._path) {
    node.userData._path.push(index);
  } else {
    node.userData._path = [0, 0];
  }

  if (node.children) {
    node.children.forEach((index, i) => {
      const child = nodes[index];
      if (!child.userData) {
        child.userData = {};
      }
      child.userData._path = node.userData._path.slice(0);
      createTreePath(child, layer + 1, i, nodes);
    });
  }
}
