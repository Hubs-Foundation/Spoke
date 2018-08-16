export default function absoluteToRelativeURL(from, to) {
  if (to === null) return null;

  if (from === to) return to;

  const fromURL = new URL(from, window.location);
  const toURL = new URL(to, window.location);

  if (fromURL.host === toURL.host) {
    const relativeParts = [];
    const fromParts = fromURL.pathname.split("/");
    const toParts = toURL.pathname.split("/");

    while (fromParts.length > 0 && toParts.length > 0 && fromParts[0] === toParts[0]) {
      fromParts.shift();
      toParts.shift();
    }

    if (fromParts.length > 1) {
      for (let j = 0; j < fromParts.length - 1; j++) {
        relativeParts.push("..");
      }
    }

    for (let k = 0; k < toParts.length; k++) {
      relativeParts.push(toParts[k]);
    }

    const relativePath = relativeParts.join("/");

    if (relativePath.startsWith("../")) {
      return relativePath;
    }

    return "./" + relativePath;
  }

  return to;
}
