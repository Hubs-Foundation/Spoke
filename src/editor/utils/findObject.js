import traverseEarlyOut from "./traverseEarlyOut";

export default function findObject(object, callback) {
  let result;

  traverseEarlyOut(object, child => {
    if (callback(child)) {
      result = child;
      return false;
    }
  });

  return result;
}
