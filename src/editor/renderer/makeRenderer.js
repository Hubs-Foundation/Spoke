import { WebGLRenderer, PCFSoftShadowMap } from "three";

export default function makeRenderer(width, height, { canvas, ...rest } = {}) {
  if (!canvas) {
    canvas = document.createElement("canvas");
  }

  let context;

  try {
    context = canvas.getContext("webgl2", { antialias: true });
  } catch (error) {
    context = canvas.getContext("webgl", { antialias: true });
  }

  const renderer = new WebGLRenderer({
    ...rest,
    canvas,
    context,
    antialias: true,
    preserveDrawingBuffer: true
  });

  renderer.gammaOutput = true;
  renderer.gammaFactor = 2.2;
  renderer.physicallyCorrectLights = true;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.setSize(width, height, false);
  return renderer;
}
