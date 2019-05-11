// Modified version of Don McCurdy's AnimationUtils.clone
// https://github.com/mrdoob/three.js/pull/14494

function parallelTraverse(a, b, callback) {
  callback(a, b);

  for (let i = 0; i < a.children.length; i++) {
    parallelTraverse(a.children[i], b.children[i], callback);
  }
}

export default function cloneObject3D(source, preserveUUIDs) {
  const cloneLookup = new Map();

  const clone = source.clone();

  parallelTraverse(source, clone, function(sourceNode, clonedNode) {
    cloneLookup.set(sourceNode, clonedNode);
  });

  source.traverse(function(curNode) {
    const clonedNode = cloneLookup.get(curNode);

    if (!clonedNode) {
      return;
    }

    if (curNode.animations) {
      clonedNode.animations = curNode.animations;
    }

    if (preserveUUIDs) {
      clonedNode.uuid = curNode.uuid;
    }

    if (!curNode.isSkinnedMesh) return;

    const sourceBones = curNode.skeleton.bones;

    clonedNode.skeleton = curNode.skeleton.clone();

    clonedNode.skeleton.bones = sourceBones.map(function(sourceBone) {
      if (!cloneLookup.has(sourceBone)) {
        throw new Error("Required bones are not descendants of the given object.");
      }

      return cloneLookup.get(sourceBone);
    });

    clonedNode.bind(clonedNode.skeleton, curNode.bindMatrix);
  });

  return clone;
}
