export const FILE_PROTOCOL = "file";

export function uriToPath(path) {
  return path.replace(FILE_PROTOCOL + "://", "");
}

export function pathToUri(path) {
  return FILE_PROTOCOL + "://" + path;
}
