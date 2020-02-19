export default function keysEqual(a, b) {
  let aKeyCount = 0;
  let bKeyCount = 0;

  for (const key in a) {
    if (!Object.prototype.hasOwnProperty.call(a, key)) continue;

    aKeyCount++;

    if (!Object.prototype.hasOwnProperty.call(b, key)) {
      return false;
    }
  }

  for (const _bKey in b) {
    if (!Object.prototype.hasOwnProperty.call(b, _bKey)) continue;
    bKeyCount++;
  }

  return aKeyCount === bKeyCount;
}
