import { PropertyBinding, AnimationClip } from "three";

// Modified version of Don McCurdy's AnimationUtils.clone
// https://github.com/mrdoob/three.js/pull/14494

function parallelTraverse(a, b, callback) {
  callback(a, b);

  for (let i = 0; i < a.children.length; i++) {
    parallelTraverse(a.children[i], b.children[i], callback);
  }
}

// Supports the following PropertyBinding path formats:
// uuid.propertyName
// uuid.propertyName[propertyIndex]
// uuid.objectName[objectIndex].propertyName[propertyIndex]
// Does not support property bindings that use object3D names or parent nodes
function cloneKeyframeTrack(sourceKeyframeTrack, cloneUUIDLookup) {
  const { nodeName: uuid, objectName, objectIndex, propertyName, propertyIndex } = PropertyBinding.parseTrackName(
    sourceKeyframeTrack.name
  );

  let path = "";

  if (uuid !== undefined) {
    const clonedUUID = cloneUUIDLookup.get(uuid);

    if (clonedUUID === undefined) {
      throw new Error(`Error cloning model. Could not find KeyframeTrack target with uuid: "${uuid}"`);
    }

    path += clonedUUID;
  }

  if (objectName !== undefined) {
    path += "." + objectName;
  }

  if (objectIndex !== undefined) {
    path += "[" + objectIndex + "]";
  }

  if (propertyName !== undefined) {
    path += "." + propertyName;
  }

  if (propertyIndex !== undefined) {
    path += "[" + propertyIndex + "]";
  }

  const clonedKeyframeTrack = sourceKeyframeTrack.clone();
  clonedKeyframeTrack.name = path;

  return clonedKeyframeTrack;
}

function cloneAnimationClip(sourceAnimationClip, cloneUUIDLookup) {
  const clonedTracks = sourceAnimationClip.tracks.map(keyframeTrack =>
    cloneKeyframeTrack(keyframeTrack, cloneUUIDLookup)
  );
  return new AnimationClip(sourceAnimationClip.name, sourceAnimationClip.duration, clonedTracks);
}

export default function cloneObject3D(source, preserveUUIDs) {
  const cloneLookup = new Map();
  const cloneUUIDLookup = new Map();

  const clone = source.clone();

  parallelTraverse(source, clone, (sourceNode, clonedNode) => {
    cloneLookup.set(sourceNode, clonedNode);
  });

  source.traverse(sourceNode => {
    const clonedNode = cloneLookup.get(sourceNode);

    if (!clonedNode) {
      throw new Error(
        `Couldn't find the cloned node for ${sourceNode.nodeName || sourceNode.type} "${sourceNode.name}"`
      );
    }

    if (preserveUUIDs) {
      clonedNode.uuid = sourceNode.uuid;
    }

    cloneUUIDLookup.set(sourceNode.uuid, clonedNode.uuid);
  });

  source.traverse(sourceNode => {
    const clonedNode = cloneLookup.get(sourceNode);

    if (!clonedNode) {
      return;
    }

    if (sourceNode.animations) {
      clonedNode.animations = sourceNode.animations.map(animationClip =>
        cloneAnimationClip(animationClip, cloneUUIDLookup)
      );
    }

    if (sourceNode.isMesh && sourceNode.geometry.boundsTree) {
      clonedNode.geometry.boundsTree = sourceNode.geometry.boundsTree;
    }

    if (!sourceNode.isSkinnedMesh) return;

    const sourceBones = sourceNode.skeleton.bones;

    clonedNode.skeleton = sourceNode.skeleton.clone();

    clonedNode.skeleton.bones = sourceBones.map(sourceBone => {
      if (!cloneLookup.has(sourceBone)) {
        throw new Error("Required bones are not descendants of the given object.");
      }

      return cloneLookup.get(sourceBone);
    });

    clonedNode.bind(clonedNode.skeleton, sourceNode.bindMatrix);
  });

  return clone;
}
