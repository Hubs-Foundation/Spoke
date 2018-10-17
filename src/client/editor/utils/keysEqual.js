export default function keysEqual(a, b) {
  let aKeyCount = 0;
  let bKeyCount = 0;

  for (const key in a) {
    aKeyCount++;

    if (!b.hasOwnProperty(key)) {
      return false;
    }
  }

  for (const _bKey in b) {
    bKeyCount++;
  }

  return aKeyCount === bKeyCount;
}
