export default function shallowEquals(objA, objB) {
  for (const key in objA) {
    if (objA[key] !== objB[key]) {
      return false;
    }
  }

  return true;
}
