export default async function asyncTraverse(object, callback) {
  await callback(object);

  for (const child of object.children) {
    await asyncTraverse(child, callback);
  }
}
