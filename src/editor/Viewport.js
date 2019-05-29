import THREE from "../vendor/three";
import GridHelper from "./helpers/GridHelper";
import resizeShadowCameraFrustum from "./utils/resizeShadowCameraFrustum";
import OutlinePass from "./renderer/OutlinePass";
import { environmentMap } from "./utils/EnvironmentMap";
import { traverseMaterials } from "./utils/materials";
import { getCanvasBlob } from "./utils/thumbnails";
import InputManager from "./controls/InputManager";
import FlyControls from "./controls/FlyControls";
import SpokeControls from "./controls/SpokeControls";
import PlayModeControls from "./controls/PlayModeControls";
import { quality } from "./utils/queryparams";
import DirectionalLightNode from "./nodes/DirectionalLightNode";

/**
 * @author mrdoob / http://mrdoob.com/
 */

export default class Viewport {
  constructor(editor, canvas) {
    this.editor = editor;
    this.canvas = canvas;
    const signals = editor.signals;

    function makeRenderer(width, height, options = {}) {
      const renderer = new THREE.WebGLRenderer({
        ...options,
        antialias: true,
        preserveDrawingBuffer: true
      });

      renderer.gammaOutput = true;
      renderer.gammaFactor = 2.2;
      renderer.physicallyCorrectLights = true;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.autoUpdate = false;
      renderer.shadowMap.needsUpdate = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.setSize(width, height);
      return renderer;
    }

    this.shadowsNeedUpdate = true;

    this.selectedObjects = [];

    const renderer = makeRenderer(canvas.parentElement.offsetWidth, canvas.parentElement.offsetHeight, { canvas });
    renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer = renderer;

    const effectComposer = (this.effectComposer = new THREE.EffectComposer(renderer));
    const renderPass = (this.renderPass = new THREE.RenderPass(editor.scene, editor.camera));
    effectComposer.addPass(renderPass);
    const outlinePass = (this.outlinePass = new OutlinePass(
      new THREE.Vector2(canvas.parentElement.offsetWidth, canvas.parentElement.offsetHeight),
      editor.scene,
      editor.camera,
      this.selectedObjects
    ));
    outlinePass.edgeColor = new THREE.Color("#006EFF");
    outlinePass.renderToScreen = true;
    effectComposer.addPass(outlinePass);

    this.screenshotRenderer = makeRenderer(1920, 1080);
    this.thumbnailRenderer = makeRenderer(512, 512, { alpha: true });

    editor.scene.background = new THREE.Color(0xaaaaaa);

    const camera = editor.camera;
    this.camera = camera;

    const grid = (this.grid = new GridHelper());
    editor.scene.add(grid);

    this.inputManager = new InputManager(canvas);
    this.flyControls = new FlyControls(camera, this.inputManager);
    this.spokeControls = new SpokeControls(camera, editor, this.inputManager, this.flyControls);
    this.playModeControls = new PlayModeControls(this.inputManager, this.spokeControls, this.flyControls);
    this.spokeControls.enable();

    this.skipRender = false;

    this.clock = new THREE.Clock();

    const render = () => {
      if (!this.skipRender) {
        const delta = this.clock.getDelta();
        const time = this.clock.getElapsedTime();

        this.inputManager.update(delta, time);
        this.flyControls.update(delta);
        this.spokeControls.update(delta);

        if (this.shadowsNeedUpdate) {
          const directionalLightNodes = editor.nodesByType[DirectionalLightNode.nodeName];

          for (let i = 0; i < directionalLightNodes.length; i++) {
            resizeShadowCameraFrustum(directionalLightNodes[i], editor.scene);
          }
        }

        const nodes = editor.nodes;

        for (let i = 0; i < nodes.length; i++) {
          nodes[i].onUpdate(delta, time);
        }

        if (editor.selected) {
          this.selectedObjects[0] = editor.selected;
        } else if (this.selectedObjects.length === 1) {
          this.selectedObjects.pop();
        }

        renderer.shadowMap.needsUpdate = this.shadowsNeedUpdate;

        if (quality === "high") {
          effectComposer.render(delta);
        } else {
          // EffectComposer introduces extra overhead with the CopyPass
          // Use the normal renderer in non-high quality mode for now.
          this.renderer.render(this.editor.scene, this.camera);
        }

        this.inputManager.reset();
        this.shadowsNeedUpdate = false;
      }

      this.rafId = requestAnimationFrame(render);
    };

    this.rafId = requestAnimationFrame(render);

    // signals
    signals.sceneSet.add(this.onSceneSet);
    signals.windowResize.add(this.onWindowResized);
    signals.propertyChanged.add(this.onPropertyChanged);
    signals.sceneGraphChanged.add(this.onSceneGraphChanged);

    this.onWindowResized();
  }

  onSceneGraphChanged = () => {
    this.shadowsNeedUpdate = true;
  };

  onPropertyChanged = (propertyName, node) => {
    if (
      ((propertyName === "position" || propertyName === "rotation" || propertyName === "scale") &&
        (node.castShadow || node.receiveShadow)) ||
      propertyName === "castShadow" ||
      propertyName === "receiveShadow"
    ) {
      this.shadowsNeedUpdate = true;
    }
  };

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
    this.editor.scene.background = new THREE.Color(0xaaaaaa);

    requestAnimationFrame(() => {
      this.shadowsNeedUpdate = true;
    });
  };

  onWindowResized = () => {
    const camera = this.camera;
    const canvas = this.canvas;

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
    const scene = new THREE.Scene();
    scene.add(object);

    const light1 = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(light1);

    const light2 = new THREE.DirectionalLight(0xffffff, 0.8 * Math.PI);
    light2.position.set(0.5, 0, 0.866);
    scene.add(light2);

    const camera = new THREE.PerspectiveCamera();
    scene.add(camera);

    traverseMaterials(object, material => {
      if (material.isMeshStandardMaterial || material.isGLTFSpecularGlossinessMaterial) {
        material.envMap = environmentMap;
        material.needsUpdate = true;
      }
    });

    object.updateMatrixWorld();

    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3()).length();
    const center = box.getCenter(new THREE.Vector3());

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
