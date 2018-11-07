const namePattern = new RegExp("(.*) \\d+$");

export default function getNameWithoutIndex(name) {
  let cacheName = name;
  const match = namePattern.exec(name);
  if (match) {
    cacheName = match[1];
  }
  return cacheName;
}
