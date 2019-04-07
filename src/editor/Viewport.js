import THREE from "../vendor/three";
import SetPositionCommand from "./commands/SetPositionCommand";
import SetRotationCommand from "./commands/SetRotationCommand";
import SetScaleCommand from "./commands/SetScaleCommand";
import GridHelper from "./helpers/GridHelper";
import SpokeTransformControls from "./controls/SpokeTransformControls";
import resizeShadowCameraFrustum from "./utils/resizeShadowCameraFrustum";
import OutlinePass from "./renderer/OutlinePass";
import { environmentMap } from "./utils/EnvironmentMap";
import { traverseMaterials } from "./utils/materials";
import { getCanvasBlob } from "./utils/thumbnails";
import InputManager from "./controls/InputManager";
import FlyControls from "./controls/FlyControls";

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
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.setSize(width, height);
      return renderer;
    }

    const renderer = makeRenderer(canvas.parentElement.offsetWidth, canvas.parentElement.offsetHeight, { canvas });
    renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer = renderer;

    this.selectedObjects = [];

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

    this.objectPositionOnDown = null;
    this.objectRotationOnDown = null;
    this.objectScaleOnDown = null;

    this.inputManager = new InputManager(canvas);
    this.flyControls = new FlyControls(camera, this.inputManager);

    this.skipRender = false;

    this.clock = new THREE.Clock();

    const render = () => {
      if (!this.skipRender) {
        const delta = this.clock.getDelta();
        editor.scene.updateMatrixWorld();
        this.inputManager.update();

        editor.scene.traverse(node => {
          if (node.isDirectionalLight) {
            resizeShadowCameraFrustum(node, editor.scene);
          }

          if (node.isNode) {
            node.onUpdate(delta);
          }
        });
        this.transformControls.update();
        this.flyControls.update(delta);
        effectComposer.render();
        signals.sceneRendered.dispatch(renderer, editor.scene);
        this.inputManager.reset();
      }

      this.rafId = requestAnimationFrame(render);
    };

    this.rafId = requestAnimationFrame(render);

    this.transformControls = new SpokeTransformControls(camera, canvas);
    this.transformControls.addEventListener("change", this.onTransformControlsChanged);

    this.snapEnabled = true;
    this.snapValues = {
      translationSnap: 1,
      rotationSnap: Math.PI / 4
    };
    this.currentSpace = "world";
    this.updateSnapSettings();

    editor.scene.add(this.transformControls);

    // object picking

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // events

    this.onDownPosition = new THREE.Vector2();
    this.onUpPosition = new THREE.Vector2();
    this.onDoubleClickPosition = new THREE.Vector2();

    canvas.addEventListener("mousedown", this.onCanvasMouseDown, false);
    canvas.addEventListener("touchstart", this.onCanvasTouchStart, false);
    canvas.addEventListener("dblclick", this.onCanvasDoubleClick, false);

    // controls need to be added *after* main logic,
    // otherwise controls.enabled doesn't work.

    const controls = new THREE.EditorControls(camera, canvas);
    controls.zoomSpeed = 0.02;
    this.controls = controls;

    this.transformControls.addEventListener("mouseDown", this.onTransformMouseDown);
    this.transformControls.addEventListener("mouseUp", this.onTransformMouseUp);

    // signals

    signals.transformModeChanged.add(this.onTransformModeChanged);
    signals.snapToggled.add(this.toggleSnap);
    signals.snapValueChanged.add(this.setSnapValue);
    signals.spaceChanged.add(this.toggleSpace);
    signals.sceneSet.add(this.onSceneSet);
    signals.objectSelected.add(this.onObjectSelected);
    signals.objectFocused.add(this.onObjectFocused);
    signals.objectChanged.add(this.onObjectChanged);
    signals.windowResize.add(this.onWindowResized);
  }

  getIntersectingNode(point, scene) {
    this.mouse.set(point.x * 2 - 1, -(point.y * 2) + 1);

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const results = this.raycaster.intersectObject(scene, true);

    if (results.length > 0) {
      for (const { object } of results) {
        let curObject = object;

        while (curObject) {
          if (curObject.isNode) {
            break;
          }

          curObject = curObject.parent;
        }

        if (curObject && curObject !== this.editor.scene) {
          return curObject;
        }
      }
    }

    return null;
  }

  getMousePosition(dom, x, y) {
    const rect = dom.getBoundingClientRect();
    return [(x - rect.left) / rect.width, (y - rect.top) / rect.height];
  }

  handleClick() {
    if (this.onDownPosition.distanceTo(this.onUpPosition) === 0) {
      const node = this.getIntersectingNode(this.onUpPosition, this.editor.scene);

      if (node) {
        this.editor.select(node);
      } else {
        this.editor.deselect();
      }
    }
  }

  onTransformControlsChanged = () => {
    const object = this.transformControls.object;

    if (object !== undefined) {
      this.editor.signals.transformChanged.dispatch(object);
    }
  };

  onCanvasMouseDown = event => {
    event.preventDefault();

    if (this.editor.playing) return;

    this.canvas.focus();

    const array = this.getMousePosition(this.canvas, event.clientX, event.clientY);
    this.onDownPosition.fromArray(array);

    document.addEventListener("mouseup", this.onCanvasMouseUp, false);
  };

  onCanvasMouseUp = event => {
    if (this.editor.playing) return;

    const array = this.getMousePosition(this.canvas, event.clientX, event.clientY);
    this.onUpPosition.fromArray(array);

    this.handleClick();

    document.removeEventListener("mouseup", this.onCanvasMouseUp, false);
  };

  onCanvasTouchStart = event => {
    if (this.editor.playing) return;

    const touch = event.changedTouches[0];

    const array = this.getMousePosition(this.canvas, touch.clientX, touch.clientY);
    this.onDownPosition.fromArray(array);

    document.addEventListener("touchend", this.onCanvasTouchEnd, false);
  };

  onCanvasTouchEnd = event => {
    if (this.editor.playing) return;

    const touch = event.changedTouches[0];

    const array = this.getMousePosition(this.canvas, touch.clientX, touch.clientY);
    this.onUpPosition.fromArray(array);

    this.handleClick();

    document.removeEventListener("touchend", this.onCanvasTouchEnd, false);
  };

  onCanvasDoubleClick = event => {
    if (this.editor.playing) return;

    const array = this.getMousePosition(this.canvas, event.clientX, event.clientY);
    this.onDoubleClickPosition.fromArray(array);

    const node = this.getIntersectingNode(this.onDoubleClickPosition, this.editor.scene);

    if (node) {
      this.editor.focus(node);
    }
  };

  onTransformMouseDown = () => {
    const object = this.transformControls.object;

    this.objectPositionOnDown = object.position.clone();
    this.objectRotationOnDown = object.rotation.clone();
    this.objectScaleOnDown = object.scale.clone();

    this.controls.enabled = false;
  };

  onTransformMouseUp = () => {
    const object = this.transformControls.object;

    if (object !== undefined) {
      switch (this.transformControls.getMode()) {
        case "translate":
          if (!this.objectPositionOnDown.equals(object.position)) {
            this.editor.execute(new SetPositionCommand(object, object.position, this.objectPositionOnDown));
          }

          break;

        case "rotate":
          if (!this.objectRotationOnDown.equals(object.rotation)) {
            this.editor.execute(new SetRotationCommand(object, object.rotation, this.objectRotationOnDown));
          }

          break;

        case "scale":
          if (!this.objectScaleOnDown.equals(object.scale)) {
            this.editor.execute(new SetScaleCommand(object, object.scale, this.objectScaleOnDown));
          }

          break;
      }
    }

    this.controls.enabled = true;
  };

  onTransformModeChanged = mode => {
    this.transformControls.setMode(mode);
  };

  onSceneSet = () => {
    const renderer = this.renderer;
    this.screenshotRenderer.dispose();
    renderer.dispose();
    this.renderPass.scene = this.editor.scene;
    this.renderPass.camera = this.editor.camera;
    this.outlinePass.renderScene = this.editor.scene;
    this.outlinePass.renderCamera = this.editor.camera;
    this.controls.center.set(0, 0, 0);
    this.editor.scene.add(this.grid);
    this.editor.scene.add(this.transformControls);
    this.editor.scene.background = new THREE.Color(0xaaaaaa);
  };

  onObjectSelected = object => {
    if (this.editor.playing) return;

    this.transformControls.detach();

    if (
      object !== null &&
      object !== this.editor.scene &&
      object !== this.camera &&
      !(object.constructor && object.constructor.hideTransform)
    ) {
      this.transformControls.attach(object);
    }

    const selectedObject = this.transformControls.object;

    if (selectedObject) {
      this.selectedObjects[0] = selectedObject;
    } else {
      while (this.selectedObjects.length) {
        this.selectedObjects.pop();
      }
    }
  };

  onObjectFocused = object => {
    if (this.editor.playing) return;
    this.controls.focus(object);
  };

  onObjectChanged = object => {
    if (object instanceof THREE.PerspectiveCamera) {
      object.updateProjectionMatrix();
    }
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

    this.thumbnailRenderer.setSize(width, height, true);
    this.thumbnailRenderer.render(scene, camera);

    const blob = await getCanvasBlob(this.thumbnailRenderer.domElement);

    return blob;
  };

  toggleSnap = () => {
    this.snapEnabled = !this.snapEnabled;
    this.updateSnapSettings();
  };

  toggleSpace = () => {
    this.currentSpace = this.currentSpace === "world" ? "local" : "world";
    this.transformControls.setSpace(this.currentSpace);
  };

  setSnapValue = ({ type, value }) => {
    switch (type) {
      case "translate":
        this.snapValues.translationSnap = value;
        break;
      case "rotate":
        this.snapValues.rotationSnap = value;
        break;
      default:
        break;
    }

    this.updateSnapSettings();
  };

  updateSnapSettings() {
    this.transformControls.setTranslationSnap(this.snapEnabled ? this.snapValues.translationSnap : null);
    this.transformControls.setRotationSnap(this.snapEnabled ? this.snapValues.rotationSnap : null);
  }

  dispose() {
    const { canvas, transformControls, editor } = this;
    const signals = editor.signals;
    canvas.removeEventListener("mousedown", this.onCanvasMouseDown, false);
    canvas.removeEventListener("touchstart", this.onCanvasTouchStart, false);
    canvas.removeEventListener("dblclick", this.onCanvasDoubleClick, false);
    transformControls.removeEventListener("change", this.onTransformControlsChanged);
    transformControls.removeEventListener("mouseDown", this.onTransformMouseDown);
    transformControls.removeEventListener("mouseUp", this.onTransformMouseUp);
    signals.transformModeChanged.remove(this.onTransformModeChanged);
    signals.snapToggled.remove(this.toggleSnap);
    signals.snapValueChanged.remove(this.setSnapValue);
    signals.spaceChanged.remove(this.toggleSpace);
    signals.sceneSet.remove(this.onSceneSet);
    signals.objectSelected.remove(this.onObjectSelected);
    signals.objectFocused.remove(this.onObjectFocused);
    signals.objectChanged.remove(this.onObjectChanged);
    signals.windowResize.remove(this.onWindowResized);
    cancelAnimationFrame(this.rafId);
  }
}
