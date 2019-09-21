import { WebGLRenderer, PCFSoftShadowMap } from "three";

export default function makeRenderer(width, height, options = {}) {
  const renderer = new WebGLRenderer({
    ...options,
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
