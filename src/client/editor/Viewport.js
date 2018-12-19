import THREE from "../vendor/three";
import SetPositionCommand from "./commands/SetPositionCommand";
import SetRotationCommand from "./commands/SetRotationCommand";
import SetScaleCommand from "./commands/SetScaleCommand";
import GridHelper from "./helpers/GridHelper";
import SpokeTransformControls from "./controls/SpokeTransformControls";
import resizeShadowCameraFrustum from "./utils/resizeShadowCameraFrustum";

/**
 * @author mrdoob / http://mrdoob.com/
 */

function getCanvasBlob(canvas) {
  if (canvas.msToBlob) {
    return Promise.resolve(canvas.msToBlob());
  } else {
    return new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", 0.9));
  }
}

export default class Viewport {
  constructor(editor, canvas) {
    this._editor = editor;
    this._canvas = canvas;
    const signals = editor.signals;

    function makeRenderer(width, height, canvas) {
      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        preserveDrawingBuffer: true
      });

      renderer.gammaOutput = true;
      renderer.gammaFactor = 2.2;
      renderer.physicallyCorrectLights = true;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.autoClear = false;
      renderer.autoUpdateScene = false;
      renderer.setSize(width, height);
      return renderer;
    }

    const renderer = makeRenderer(canvas.parentElement.offsetWidth, canvas.parentElement.offsetHeight, canvas);
    renderer.setPixelRatio(window.devicePixelRatio);
    this._renderer = renderer;

    this._screenshotRenderer = makeRenderer(1920, 1080);

    editor.scene.background = new THREE.Color(0xaaaaaa);

    const camera = editor.camera;
    this._camera = camera;

    const grid = new GridHelper();
    editor.scene.add(grid);

    const box = new THREE.Box3();

    const selectionBox = new THREE.BoxHelper();
    selectionBox.material.depthTest = false;
    selectionBox.material.transparent = true;
    selectionBox.visible = false;
    editor.scene.add(selectionBox);

    let objectPositionOnDown = null;
    let objectRotationOnDown = null;
    let objectScaleOnDown = null;

    this._skipRender = false;
    const render = () => {
      if (!this._skipRender) {
        editor.scene.updateMatrixWorld();

        editor.scene.traverse(node => {
          if (node.isDirectionalLight) {
            resizeShadowCameraFrustum(node, editor.scene);
          }
        });

        renderer.render(editor.scene, camera);
        signals.sceneRendered.dispatch(renderer, editor.scene);
      }

      requestAnimationFrame(render);
    };

    requestAnimationFrame(render);

    this._transformControls = new SpokeTransformControls(camera, canvas);
    this._transformControls.addEventListener("change", () => {
      const object = this._transformControls.object;

      if (object !== undefined) {
        selectionBox.setFromObject(object);
        signals.transformChanged.dispatch(object);
      }
    });

    this.snapEnabled = true;
    this.snapValues = {
      translationSnap: 1,
      rotationSnap: Math.PI / 4
    };
    this.currentSpace = "world";
    this.updateSnapSettings();

    editor.scene.add(this._transformControls);

    // object picking

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // events

    function getIntersectingNode(point, scene) {
      mouse.set(point.x * 2 - 1, -(point.y * 2) + 1);

      raycaster.setFromCamera(mouse, camera);

      const results = raycaster.intersectObject(scene, true);

      if (results.length > 0) {
        for (const { object } of results) {
          let curObject = object;

          while (curObject) {
            if (curObject.isNode) {
              break;
            }

            curObject = curObject.parent;
          }

          if (curObject && curObject !== editor.scene) {
            return curObject;
          }
        }
      }

      return null;
    }

    const onDownPosition = new THREE.Vector2();
    const onUpPosition = new THREE.Vector2();
    const onDoubleClickPosition = new THREE.Vector2();

    function getMousePosition(dom, x, y) {
      const rect = dom.getBoundingClientRect();
      return [(x - rect.left) / rect.width, (y - rect.top) / rect.height];
    }

    function handleClick() {
      if (onDownPosition.distanceTo(onUpPosition) === 0) {
        const node = getIntersectingNode(onUpPosition, editor.scene);

        if (node) {
          editor.select(node);
        } else {
          editor.deselect();
        }
      }
    }

    function onMouseUp(event) {
      const array = getMousePosition(canvas, event.clientX, event.clientY);
      onUpPosition.fromArray(array);

      handleClick();

      document.removeEventListener("mouseup", onMouseUp, false);
    }

    function onMouseDown(event) {
      event.preventDefault();

      canvas.focus();

      const array = getMousePosition(canvas, event.clientX, event.clientY);
      onDownPosition.fromArray(array);

      document.addEventListener("mouseup", onMouseUp, false);
    }

    function onTouchEnd(event) {
      const touch = event.changedTouches[0];

      const array = getMousePosition(canvas, touch.clientX, touch.clientY);
      onUpPosition.fromArray(array);

      handleClick();

      document.removeEventListener("touchend", onTouchEnd, false);
    }

    function onTouchStart(event) {
      const touch = event.changedTouches[0];

      const array = getMousePosition(canvas, touch.clientX, touch.clientY);
      onDownPosition.fromArray(array);

      document.addEventListener("touchend", onTouchEnd, false);
    }

    function onDoubleClick(event) {
      const array = getMousePosition(canvas, event.clientX, event.clientY);
      onDoubleClickPosition.fromArray(array);

      const node = getIntersectingNode(onDoubleClickPosition, editor.scene);

      if (node) {
        editor.focus(node);
      }
    }

    canvas.addEventListener("mousedown", onMouseDown, false);
    canvas.addEventListener("touchstart", onTouchStart, false);
    canvas.addEventListener("dblclick", onDoubleClick, false);

    // controls need to be added *after* main logic,
    // otherwise controls.enabled doesn't work.

    const controls = new THREE.EditorControls(camera, canvas);
    controls.zoomSpeed = 0.02;

    this._transformControls.addEventListener("mouseDown", () => {
      const object = this._transformControls.object;

      objectPositionOnDown = object.position.clone();
      objectRotationOnDown = object.rotation.clone();
      objectScaleOnDown = object.scale.clone();

      controls.enabled = false;
    });
    this._transformControls.addEventListener("mouseUp", () => {
      const object = this._transformControls.object;

      if (object !== undefined) {
        switch (this._transformControls.getMode()) {
          case "translate":
            if (!objectPositionOnDown.equals(object.position)) {
              editor.execute(new SetPositionCommand(object, object.position, objectPositionOnDown));
            }

            break;

          case "rotate":
            if (!objectRotationOnDown.equals(object.rotation)) {
              editor.execute(new SetRotationCommand(object, object.rotation, objectRotationOnDown));
            }

            break;

          case "scale":
            if (!objectScaleOnDown.equals(object.scale)) {
              editor.execute(new SetScaleCommand(object, object.scale, objectScaleOnDown));
            }

            break;
        }
      }

      controls.enabled = true;
    });

    // signals

    signals.transformModeChanged.add(mode => {
      this._transformControls.setMode(mode);
    });

    signals.snapToggled.add(this.toggleSnap);
    signals.snapValueChanged.add(this.setSnapValue);

    signals.spaceChanged.add(this.toggleSpace);

    signals.sceneSet.add(() => {
      this._screenshotRenderer.dispose();
      renderer.dispose();
      controls.center.set(0, 0, 0);
      editor.scene.add(grid);
      editor.scene.add(selectionBox);
      editor.scene.add(this._transformControls);
      editor.scene.background = new THREE.Color(0xaaaaaa);
    });

    signals.objectSelected.add(object => {
      selectionBox.visible = false;
      this._transformControls.detach();

      if (
        object !== null &&
        object !== editor.scene &&
        object !== camera &&
        !(object.constructor && object.constructor.hideTransform)
      ) {
        box.setFromObject(object);

        if (box.isEmpty() === false) {
          selectionBox.setFromObject(object);
          selectionBox.visible = true;
        }

        this._transformControls.attach(object);
      }
    });

    signals.objectFocused.add(function(object) {
      controls.focus(object);
    });

    signals.objectChanged.add(object => {
      if (editor.selected === object) {
        box.setFromObject(object);
        selectionBox.visible = !box.isEmpty();
        selectionBox.setFromObject(object);
      }

      if (object instanceof THREE.PerspectiveCamera) {
        object.updateProjectionMatrix();
      }
    });

    signals.windowResize.add(function() {
      camera.aspect = canvas.parentElement.offsetWidth / canvas.parentElement.offsetHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(canvas.parentElement.offsetWidth, canvas.parentElement.offsetHeight);
    });

    signals.viewportInitialized.dispatch(this);
  }

  takeScreenshot = async () => {
    const { _screenshotRenderer: renderer, _camera: camera } = this;

    this._skipRender = true;
    const prevAspect = camera.aspect;
    camera.aspect = 1920 / 1080;
    camera.updateProjectionMatrix();

    camera.layers.disable(1);
    renderer.render(this._editor.scene, camera);
    camera.layers.enable(1);

    camera.updateMatrixWorld();
    const cameraTransform = camera.matrixWorld.clone();

    const blob = await getCanvasBlob(renderer.domElement);

    camera.aspect = prevAspect;
    camera.updateProjectionMatrix();
    this._skipRender = false;

    return { blob, cameraTransform };
  };

  toggleSnap = () => {
    this.snapEnabled = !this.snapEnabled;
    this.updateSnapSettings();
  };

  toggleSpace = () => {
    this.currentSpace = this.currentSpace === "world" ? "local" : "world";
    this._transformControls.setSpace(this.currentSpace);
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
    this._transformControls.setTranslationSnap(this.snapEnabled ? this.snapValues.translationSnap : null);
    this._transformControls.setRotationSnap(this.snapEnabled ? this.snapValues.rotationSnap : null);
  }
}
