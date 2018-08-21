import THREE from "./three";
import SetPositionCommand from "./commands/SetPositionCommand";
import SetRotationCommand from "./commands/SetRotationCommand";
import SetScaleCommand from "./commands/SetScaleCommand";

/**
 * @author mrdoob / http://mrdoob.com/
 */

export default class Viewport {
  constructor(editor, canvas) {
    const signals = editor.signals;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true
    });

    renderer.gammaOutput = true;
    renderer.gammaFactor = 2.2;
    renderer.physicallyCorrectLights = true;
    renderer.shadowMap.enabled = true;
    renderer.autoClear = false;
    renderer.autoUpdateScene = false;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvas.parentElement.offsetWidth, canvas.parentElement.offsetHeight);

    editor.scene.background = new THREE.Color(0xaaaaaa);

    const camera = editor.camera;

    // helpers

    const grid = new THREE.GridHelper(30, 30, 0x444444, 0x888888);
    editor.helperScene.add(grid);

    const array = grid.geometry.attributes.color.array;

    for (let i = 0; i < array.length; i += 60) {
      for (let j = 0; j < 12; j++) {
        array[i + j] = 0.26;
      }
    }

    //

    const box = new THREE.Box3();

    const selectionBox = new THREE.BoxHelper();
    selectionBox.material.depthTest = false;
    selectionBox.material.transparent = true;
    selectionBox.visible = false;
    editor.helperScene.add(selectionBox);

    let objectPositionOnDown = null;
    let objectRotationOnDown = null;
    let objectScaleOnDown = null;

    function render() {
      editor.helperScene.updateMatrixWorld();
      editor.scene.updateMatrixWorld();

      renderer.render(editor.scene, camera);
      renderer.render(editor.helperScene, camera);

      requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

    this._transformControls = new THREE.TransformControls(camera, canvas);
    this._transformControls.addEventListener("change", () => {
      const object = this._transformControls.object;

      if (object !== undefined) {
        selectionBox.setFromObject(object);

        const helper = editor.helpers[object.id];

        if (helper !== undefined) {
          helper.update();
        }

        signals.transformChanged.dispatch(object);
      }
    });

    this.snapEnabled = false;
    this.snapTempValues = {
      translationSnap: 1,
      rotationSnap: Math.PI / 4
    };
    this.toggleSnap(true);

    editor.helperScene.add(this._transformControls);

    // object picking

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // events

    function getIntersects(point, scene) {
      mouse.set(point.x * 2 - 1, -(point.y * 2) + 1);

      raycaster.setFromCamera(mouse, camera);

      return raycaster.intersectObject(scene, true);
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
        const results = getIntersects(onUpPosition, editor.scene);

        let selection = null;

        for (const { object } of results) {
          if (object.userData._selectionRoot !== undefined) {
            selection = object.userData._selectionRoot;
            break;
          } else {
            editor.select(object);
            break;
          }
        }

        editor.select(selection);
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

      const intersects = getIntersects(onDoubleClickPosition, editor.scene);

      if (intersects.length > 0) {
        const intersect = intersects[0];

        signals.objectFocused.dispatch(intersect.object);
      }
    }

    canvas.addEventListener("mousedown", onMouseDown, false);
    canvas.addEventListener("touchstart", onTouchStart, false);
    canvas.addEventListener("dblclick", onDoubleClick, false);

    // controls need to be added *after* main logic,
    // otherwise controls.enabled doesn't work.

    const controls = new THREE.EditorControls(camera, canvas);

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

    signals.spaceChanged.add(space => {
      this._transformControls.setSpace(space);
    });

    signals.sceneSet.add(() => {
      renderer.dispose();
      editor.helperScene.add(grid);
      editor.helperScene.add(selectionBox);
      editor.helperScene.add(this._transformControls);
      editor.scene.background = new THREE.Color(0xaaaaaa);
    });

    signals.objectSelected.add(object => {
      selectionBox.visible = false;
      this._transformControls.detach();

      if (object !== null && object !== editor.scene && object !== camera) {
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

    signals.geometryChanged.add(function(object) {
      if (object !== undefined) {
        selectionBox.setFromObject(object);
      }
    });

    signals.objectChanged.add(object => {
      if (editor.selected === object) {
        selectionBox.setFromObject(object);
      }

      if (object instanceof THREE.PerspectiveCamera) {
        object.updateProjectionMatrix();
      }

      if (editor.helpers[object.id] !== undefined) {
        editor.helpers[object.id].update();
      }
    });

    signals.windowResize.add(function() {
      editor.DEFAULT_CAMERA.aspect = canvas.parentElement.offsetWidth / canvas.parentElement.offsetHeight;
      editor.DEFAULT_CAMERA.updateProjectionMatrix();

      camera.aspect = canvas.parentElement.offsetWidth / canvas.parentElement.offsetHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(canvas.parentElement.offsetWidth, canvas.parentElement.offsetHeight);
    });

    signals.viewportInitialized.dispatch(this);
  }

  toggleSnap = enabled => {
    this.snapEnabled = enabled;
    this._transformControls.setTranslationSnap(enabled ? this.snapTempValues.translationSnap : null);
    this._transformControls.setRotationSnap(enabled ? this.snapTempValues.rotationSnap : null);
  };

  setSnapValue = ({ type, value }) => {
    switch (type) {
      case "translate":
        this.snapTempValues.translationSnap = value;
        break;
      case "rotate":
        this.snapTempValues.rotationSnap = value;
        break;
      case "scale":
        this._transformControls.setSize(this.snapEnabled ? value : 1);
        break;
      default:
        break;
    }
  };
}
