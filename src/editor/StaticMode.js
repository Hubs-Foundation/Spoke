export const StaticModes = {
  Static: "static",
  Dynamic: "dynamic",
  Inherits: "inherits"
};

export function setOriginalStaticMode(node, mode) {
  node.originalStaticMode = mode;
}

export function getOriginalStaticMode(node) {
  return node.originalStaticMode;
}

export function setStaticMode(node, mode) {
  node.staticMode = mode;
}

export function getStaticMode(node) {
  return node.staticMode;
}

export function isInherits(node) {
  const staticMode = getStaticMode(node);
  return staticMode === StaticModes.Inherits || staticMode === undefined;
}

export function isStatic(node) {
  return getStaticMode(node) === StaticModes.Static;
}

export function isDynamic(node) {
  return getStaticMode(node) === StaticModes.Dynamic;
}

export function computeStaticMode(object) {
  let cur = object;

  while (cur) {
    if (cur.staticMode === StaticModes.Inherits || cur.staticMode === undefined) {
      cur = cur.parent;
    } else {
      return cur.staticMode;
    }
  }

  return StaticModes.Dynamic;
}

export function computeAndSetStaticModes(object) {
  object.traverse(curNode => {
    const staticMode = computeStaticMode(curNode);
    setStaticMode(curNode, staticMode);
  });
}
