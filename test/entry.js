const { JSDOM } = require("jsdom");

const jsdom = new JSDOM("<!doctype html><html><body></body></html>");
const { window } = jsdom;

function copyProps(src, target) {
  Object.defineProperties(target, {
    ...Object.getOwnPropertyDescriptors(src),
    ...Object.getOwnPropertyDescriptors(target)
  });
}

global.window = window;
global.document = window.document;
global.navigator = {
  userAgent: "node.js"
};
global.requestAnimationFrame = function(callback) {
  return setTimeout(callback, 0);
};
global.cancelAnimationFrame = function(id) {
  clearTimeout(id);
};
copyProps(window, global);
window.Number = global.Number;

const { AudioContext, AudioNode } = require("standardized-audio-context-mock");
window.AudioContext = AudioContext;
AudioContext.prototype.createPanner = () => {
  return new AudioNode({
    context: new AudioContext()
  });
};

function warnSkipAsset(mod) {
  console.warn(`Skip loading Webpack Asset "${mod.filename}" in file: "${mod.parent.filename}"`);
  mod.exports = "https://example.com";
  return mod;
}

[".css", ".scss", ".jpg", ".png", ".glb", ".gltf", ".mp4", ".webm", ".spoke", ".wasm"].forEach(extension => {
  require.extensions[extension] = warnSkipAsset;
});

require.extensions[".worker.js"] = mod => {
  console.warn(`Skip loading WebWorker "${mod.filename}" in file: "${mod.parent.filename}"`);
  mod.exports = function() {};
  return mod;
};
