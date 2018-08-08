import THREE from "../vendor/three";
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
    }

    this._transformControls = new THREE.TransformControls(camera, canvas);
    this._transformControls.addEventListener("change", () => {
      const object = this._transformControls.object;

      if (object !== undefined) {
        selectionBox.setFromObject(object);

        if (editor.helpers[object.id] !== undefined) {
          editor.helpers[object.id].update();
        }

        signals.transformChanged.dispatch(object);
      }

      render();
    });

    this.snapEnabled = false;
    this.toggleSnap(true);

    editor.helperScene.add(this._transformControls);

    // object picking

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // events

    function getIntersects(point, objects) {
      mouse.set(point.x * 2 - 1, -(point.y * 2) + 1);

      raycaster.setFromCamera(mouse, camera);

      return raycaster.intersectObjects(objects);
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
        const intersects = getIntersects(onUpPosition, editor.objects);

        if (intersects.length > 0) {
          const object = intersects[0].object;

          if (object.userData._selectionRoot !== undefined) {
            // helper
            editor.select(object.userData._selectionRoot);
          } else {
            editor.select(object);
          }
        } else {
          editor.select(null);
        }

        render();
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

      const intersects = getIntersects(onDoubleClickPosition, editor.objects);

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
    controls.addEventListener("change", () => {
      this._transformControls.update();
      signals.cameraChanged.dispatch(camera);
    });

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

    signals.spaceChanged.add(space => {
      this._transformControls.setSpace(space);
    });

    signals.sceneSet.add(() => {
      renderer.dispose();
      editor.helperScene.add(grid);
      editor.helperScene.add(selectionBox);
      editor.helperScene.add(this._transformControls);
      editor.scene.background = new THREE.Color(0xaaaaaa);
      render();
    });

    signals.sceneGraphChanged.add(function() {
      render();
    });

    signals.cameraChanged.add(function() {
      render();
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

      render();
    });

    signals.objectFocused.add(function(object) {
      controls.focus(object);
    });

    signals.geometryChanged.add(function(object) {
      if (object !== undefined) {
        selectionBox.setFromObject(object);
      }

      render();
    });

    signals.objectAdded.add(function(object) {
      object.traverse(function(child) {
        editor.objects.push(child);
      });
    });

    signals.objectChanged.add(object => {
      if (editor.selected === object) {
        selectionBox.setFromObject(object);
        this._transformControls.update();
      }

      if (object instanceof THREE.PerspectiveCamera) {
        object.updateProjectionMatrix();
      }

      if (editor.helpers[object.id] !== undefined) {
        editor.helpers[object.id].update();
      }

      render();
    });

    signals.objectRemoved.add(function(object) {
      editor.objects.splice(editor.objects.indexOf(object), 1);
      object.traverse(function(child) {
        editor.objects.splice(editor.objects.indexOf(child), 1);
      });
    });

    signals.helperAdded.add(function(object) {
      editor.objects.push(object.getObjectByName("picker"));
    });

    signals.helperRemoved.add(function(object) {
      editor.objects.splice(editor.objects.indexOf(object.getObjectByName("picker")), 1);
    });

    signals.materialChanged.add(function() {
      render();
    });

    // fog

    signals.sceneBackgroundChanged.add(function(backgroundColor) {
      editor.scene.background.setHex(backgroundColor);

      render();
    });

    let currentFogType = null;

    signals.sceneFogChanged.add(function(fogType, fogColor, fogNear, fogFar, fogDensity) {
      const scene = editor.scene;
      if (currentFogType !== fogType) {
        switch (fogType) {
          case "None":
            scene.fog = null;
            break;
          case "Fog":
            scene.fog = new THREE.Fog();
            break;
          case "FogExp2":
            scene.fog = new THREE.FogExp2();
            break;
        }

        currentFogType = fogType;
      }

      if (scene.fog instanceof THREE.Fog) {
        scene.fog.color.setHex(fogColor);
        scene.fog.near = fogNear;
        scene.fog.far = fogFar;
      } else if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.setHex(fogColor);
        scene.fog.density = fogDensity;
      }

      render();
    });

    //

    signals.windowResize.add(function() {
      // TODO: Move this out?

      editor.DEFAULT_CAMERA.aspect = canvas.parentElement.offsetWidth / canvas.parentElement.offsetHeight;
      editor.DEFAULT_CAMERA.updateProjectionMatrix();

      camera.aspect = canvas.parentElement.offsetWidth / canvas.parentElement.offsetHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(canvas.parentElement.offsetWidth, canvas.parentElement.offsetHeight);

      render();
    });

    signals.showGridChanged.add(function(showGrid) {
      grid.visible = showGrid;
      render();
    });

    signals.viewportInitialized.dispatch(this);
  }

  toggleSnap = enabled => {
    this.snapEnabled = enabled;
    this._transformControls.setTranslationSnap(enabled ? 1 : null);
    this._transformControls.setRotationSnap(enabled ? Math.PI / 4 : null);
  };
}
