import browserEnv from "browser-env";
// Initialize browser-env for unit tests
browserEnv();

function warnSkipAsset(mod) {
  console.warn(`Skip loading Webpack Asset "${mod.filename}" in file: "${mod.parent.filename}"`);
}

[".css", ".scss", ".jpg", ".png", ".glb", ".mp4", ".webm", ".spoke"].forEach(extension => {
  require.extensions[extension] = warnSkipAsset;
});
