export default function isEmptyObject(object) {
  for (const key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      return false;
    }
  }

  return true;
}
