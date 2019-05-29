export default function traverseVisible(object, callback) {
  if (object.visible) {
    callback(object);

    const children = object.children;

    for (let i = 0; i < children.length; i++) {
      traverseVisible(children[i], callback);
    }
  }
}
