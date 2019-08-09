import {
  WebGLRenderer,
  PCFSoftShadowMap,
  Vector2,
  Color,
  Clock,
  Scene,
  AmbientLight,
  DirectionalLight,
  PerspectiveCamera,
  Box3,
  Vector3
} from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import SpokeInfiniteGridHelper from "./helpers/SpokeInfiniteGridHelper";
import resizeShadowCameraFrustum from "./utils/resizeShadowCameraFrustum";
import OutlinePass from "./renderer/OutlinePass";
import { environmentMap } from "./utils/EnvironmentMap";
import { traverseMaterials } from "./utils/materials";
import { getCanvasBlob } from "./utils/thumbnails";
import InputManager from "./controls/InputManager";
import FlyControls from "./controls/FlyControls";
import SpokeControls from "./controls/SpokeControls";
import PlayModeControls from "./controls/PlayModeControls";

/**
 * @author mrdoob / http://mrdoob.com/
 */

export default class Viewport {
  constructor(editor, canvas) {
    this.editor = editor;
    this.canvas = canvas;
    const signals = editor.signals;

    function makeRenderer(width, height, options = {}) {
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
      renderer.setSize(width, height);
      return renderer;
    }

    this.selectedObjects = [];

    const renderer = makeRenderer(canvas.parentElement.offsetWidth, canvas.parentElement.offsetHeight, { canvas });
    renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer = renderer;

    const effectComposer = (this.effectComposer = new EffectComposer(renderer));
    const renderPass = (this.renderPass = new RenderPass(editor.scene, editor.camera));
    effectComposer.addPass(renderPass);
    const outlinePass = (this.outlinePass = new OutlinePass(
      new Vector2(canvas.parentElement.offsetWidth, canvas.parentElement.offsetHeight),
      editor.scene,
      editor.camera,
      this.selectedObjects
    ));
    outlinePass.edgeColor = new Color("#006EFF");
    outlinePass.renderToScreen = true;
    effectComposer.addPass(outlinePass);

    this.screenshotRenderer = makeRenderer(1920, 1080);
    this.thumbnailRenderer = makeRenderer(512, 512, { alpha: true });

    editor.scene.background = new Color(0xaaaaaa);

    const camera = editor.camera;
    this.camera = camera;

    const grid = (this.grid = new SpokeInfiniteGridHelper());
    editor.scene.add(grid);

    this.inputManager = new InputManager(canvas);
    this.flyControls = new FlyControls(camera, this.inputManager);
    this.spokeControls = new SpokeControls(camera, editor, this.inputManager, this.flyControls);
    this.playModeControls = new PlayModeControls(this.inputManager, this.spokeControls, this.flyControls);
    this.spokeControls.enable();

    this.skipRender = false;

    this.clock = new Clock();

    const render = () => {
      if (!this.skipRender) {
        const delta = this.clock.getDelta();
        const time = this.clock.getElapsedTime();
        editor.scene.updateMatrixWorld();
        this.inputManager.update(delta, time);

        editor.scene.traverse(node => {
          if (node.isDirectionalLight) {
            resizeShadowCameraFrustum(node, editor.scene);
          }

          if (node.isNode) {
            node.onUpdate(delta, time);
          }
        });
        this.flyControls.update(delta);
        this.spokeControls.update(delta);

        if (editor.selected) {
          this.selectedObjects[0] = editor.selected;
        } else if (this.selectedObjects.length === 1) {
          this.selectedObjects.pop();
        }

        effectComposer.render();
        this.inputManager.reset();
      }

      this.rafId = requestAnimationFrame(render);
    };

    this.rafId = requestAnimationFrame(render);

    // signals
    signals.sceneSet.add(this.onSceneSet);
    signals.windowResize.add(this.onWindowResized);

    this.onWindowResized();
  }

  onSceneSet = () => {
    const renderer = this.renderer;
    this.screenshotRenderer.dispose();
    renderer.dispose();
    this.renderPass.scene = this.editor.scene;
    this.renderPass.camera = this.editor.camera;
    this.outlinePass.renderScene = this.editor.scene;
    this.outlinePass.renderCamera = this.editor.camera;
    this.spokeControls.center.set(0, 0, 0);
    this.editor.scene.add(this.grid);
    this.spokeControls.onSceneSet(this.editor.scene);
    this.editor.scene.background = new Color(0xaaaaaa);
  };

  onWindowResized = () => {
    const camera = this.camera;
    const canvas = this.canvas;

    this.inputManager.onResize();

    camera.aspect = canvas.parentElement.offsetWidth / canvas.parentElement.offsetHeight;
    camera.updateProjectionMatrix();

    this.renderer.setSize(canvas.parentElement.offsetWidth, canvas.parentElement.offsetHeight);
    this.effectComposer.setSize(canvas.parentElement.offsetWidth, canvas.parentElement.offsetHeight);
  };

  takeScreenshot = async (width = 1920, height = 1080) => {
    const { screenshotRenderer, camera } = this;

    const originalRenderer = this.renderer;
    this.renderer = screenshotRenderer;

    this.skipRender = true;
    const prevAspect = camera.aspect;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    camera.layers.disable(1);

    screenshotRenderer.setSize(width, height, true);

    screenshotRenderer.render(this.editor.scene, camera);

    this.editor.scene.traverse(child => {
      if (child.isNode) {
        child.onRendererChanged();
      }
    });

    screenshotRenderer.render(this.editor.scene, camera);

    camera.layers.enable(1);

    camera.updateMatrixWorld();
    const cameraTransform = camera.matrixWorld.clone();

    const blob = await getCanvasBlob(screenshotRenderer.domElement);

    camera.aspect = prevAspect;
    camera.updateProjectionMatrix();
    this.skipRender = false;

    this.renderer = originalRenderer;

    this.editor.scene.traverse(child => {
      if (child.isNode) {
        child.onRendererChanged();
      }
    });

    return { blob, cameraTransform };
  };

  generateThumbnail = async (object, width = 256, height = 256) => {
    const scene = new Scene();
    scene.add(object);

    const light1 = new AmbientLight(0xffffff, 0.3);
    scene.add(light1);

    const light2 = new DirectionalLight(0xffffff, 0.8 * Math.PI);
    light2.position.set(0.5, 0, 0.866);
    scene.add(light2);

    const camera = new PerspectiveCamera();
    scene.add(camera);

    traverseMaterials(object, material => {
      if (material.isMeshStandardMaterial || material.isGLTFSpecularGlossinessMaterial) {
        material.envMap = environmentMap;
        material.needsUpdate = true;
      }
    });

    object.updateMatrixWorld();

    const box = new Box3().setFromObject(object);
    const size = box.getSize(new Vector3()).length();
    const center = box.getCenter(new Vector3());

    object.position.x += object.position.x - center.x;
    object.position.y += object.position.y - center.y;
    object.position.z += object.position.z - center.z;

    camera.near = size / 100;
    camera.far = size * 100;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    camera.position.copy(center);
    camera.position.x += size;
    camera.position.y += size / 2;
    camera.position.z += size;
    camera.lookAt(center);

    camera.layers.disable(1);

    this.thumbnailRenderer.setSize(width, height, true);
    this.thumbnailRenderer.render(scene, camera);

    const blob = await getCanvasBlob(this.thumbnailRenderer.domElement);

    return blob;
  };

  dispose() {
    const signals = this.editor.signals;
    signals.sceneSet.remove(this.onSceneSet);
    signals.windowResize.remove(this.onWindowResized);
    cancelAnimationFrame(this.rafId);
  }
}
