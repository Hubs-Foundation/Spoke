const THREE = require("three");
window.THREE = THREE;
require("three/examples/js/controls/EditorControls");
require("three/examples/js/controls/TransformControls");
require("three/examples/js/exporters/GLTFExporter");
require("three/examples/js/loaders/GLTFLoader");
require("./Sky");

export default THREE;
