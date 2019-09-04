export default function traverseEarlyOut(object, cb) {
  let result = cb(object);

  if (result !== false) {
    const children = object.children;

    for (let i = 0; i < children.length; i++) {
      result = traverseEarlyOut(children[i], cb);

      if (result === false) {
        break;
      }
    }
  }

  return result;
}
