const THREE = require("three");

window.THREE = THREE;

require("three/examples/js/utils/BufferGeometryUtils");
require("three/examples/js/exporters/GLTFExporter");
require("three/examples/js/loaders/GLTFLoader");
require("three/examples/js/shaders/CopyShader");
require("three/examples/js/postprocessing/EffectComposer");
require("three/examples/js/postprocessing/ShaderPass");
require("three/examples/js/postprocessing/RenderPass");
require("three/examples/js/pmrem/PMREMGenerator");
require("three/examples/js/pmrem/PMREMCubeUVPacker");

export default THREE;
