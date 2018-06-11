export default function getFileNameFromURI(uri) {
  const matches = uri.match(/\/([^\\/?#]+)[^\\/]*$/);

  if (matches.length > 1) {
    return matches[1].split(".")[0];
  }
  return null;
}
