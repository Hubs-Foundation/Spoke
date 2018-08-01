export const StaticMode = {
  Static: "static",
  Dynamic: "dynamic",
  Inherits: "inherits"
};

export const StaticModeValues = Object.values(StaticMode);

export function setOriginalStaticMode(node, mode) {
  node.userData._originalStaticMode = mode;
}

export function getOriginalStaticMode(node) {
  return node.userData._originalStaticMode;
}

export function setStaticMode(node, mode) {
  node.userData._staticMode = mode;
}

export function getStaticMode(node) {
  return node.userData._staticMode;
}

export function isInherits(node) {
  const staticMode = getStaticMode(node);
  return staticMode === StaticMode.Inherits || staticMode === undefined;
}

export function isStatic(node) {
  return getStaticMode(node) === StaticMode.Static;
}

export function isDynamic(node) {
  return getStaticMode(node) === StaticMode.Dynamic;
}

export function computeStaticMode(node) {
  let cur = node;

  while (cur) {
    if (isInherits(cur)) {
      cur = cur.parent;
    } else {
      return getStaticMode(cur);
    }
  }

  return StaticMode.Dynamic;
}

export function computeAndSetStaticModes(node) {
  node.traverse(curNode => {
    const staticMode = computeStaticMode(curNode);
    setStaticMode(curNode, staticMode);
  });
}
