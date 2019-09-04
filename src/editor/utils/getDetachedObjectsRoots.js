import traverseEarlyOut from "./traverseEarlyOut";

export default function getDetachedObjectRoots(objects, target = []) {
  // Initially all objects are candidates
  for (let i = 0; i < objects.length; i++) {
    target.push(objects[i]);
  }

  // For each object check if it is an ancestor of any of the other objects.
  // If so reject that object and remove it from the candidate array.
  for (let i = 0; i < objects.length; i++) {
    const object = objects[i];

    let validCandidate = true;

    for (let j = 0; j < target.length; j++) {
      const otherObject = target[j];

      if (otherObject === object) {
        continue;
      }

      if (!traverseEarlyOut(otherObject, o => o !== object)) {
        validCandidate = false;
        break;
      }
    }

    if (!validCandidate) {
      const index = target.indexOf(object);

      if (index === -1) {
        throw new Error("Object not found");
      }

      target.splice(index, 1);
    }
  }

  return target;
}
