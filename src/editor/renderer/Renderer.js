import { WebGLRenderer, PCFSoftShadowMap } from "three";

export default class Renderer {
  constructor(editor, canvas) {
    this.editor = editor;

    const renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      preserveDrawingBuffer: true
    });
    renderer.gammaOutput = true;
    renderer.gammaFactor = 2.2;
    renderer.physicallyCorrectLights = true;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    renderer.setSize(canvas.parentElement.offsetWidth, canvas.parentElement.offsetHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    this.canvas = canvas;
    this.renderer = renderer;

    this.camera = null;
    this.scene = null;
  }

  setScene(scene) {
    this.scene = scene;
  }

  setCamera(camera) {
    this.camera = camera;
  }

  onResize() {
    const width = this.canvas.parentElement.offsetWidth;
    const height = this.canvas.parentElement.offsetHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.effectComposer.setSize(width, height);
  }

  onUpdate() {}

  dispose() {}
}
