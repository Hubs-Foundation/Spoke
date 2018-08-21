export function getUrlDirname(url) {
  const { pathname } = new URL(url, window.location);

  let lastSlashIndex = pathname.lastIndexOf("/");

  if (lastSlashIndex === -1) {
    lastSlashIndex = 0;
  }

  if (pathname.indexOf(".", lastSlashIndex) === -1 && lastSlashIndex !== pathname.length - 1) {
    return pathname;
  }

  return pathname.substring(0, lastSlashIndex);
}

export function getUrlBasename(url) {
  let pathname = new URL(url, window.location).pathname;

  if (pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }

  let lastSlashIndex = pathname.lastIndexOf("/");

  if (lastSlashIndex === -1) {
    lastSlashIndex = 0;
  }

  return pathname.substring(lastSlashIndex + 1);
}

export function getUrlFilename(url) {
  const basename = getUrlBasename(url);

  const lastPeriodIndex = basename.lastIndexOf(".");

  if (lastPeriodIndex === -1) {
    return basename;
  }

  return basename.substring(0, lastPeriodIndex);
}

export function getUrlExtname(url) {
  const basename = getUrlBasename(url);

  const lastPeriodIndex = basename.lastIndexOf(".");

  if (lastPeriodIndex === -1) {
    return null;
  }

  return basename.substring(lastPeriodIndex);
}
