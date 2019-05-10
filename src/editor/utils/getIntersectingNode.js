export default function getIntersectingNode(results, scene) {
  if (results.length > 0) {
    for (const result of results) {
      let curObject = result.object;

      while (curObject) {
        if (curObject.isNode) {
          break;
        }

        curObject = curObject.parent;
      }

      if (curObject && curObject !== scene && !curObject.ignoreRaycast) {
        result.node = curObject;
        return result;
      }
    }
  }

  return null;
}
