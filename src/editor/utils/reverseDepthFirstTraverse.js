export default function reverseDepthFirstTraverse(object, cb) {
  cb(object);

  const children = object.children;

  for (let i = children.length - 1; i >= 0; i--) {
    reverseDepthFirstTraverse(children[i], cb);
  }
}
