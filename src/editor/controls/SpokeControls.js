import { Spoke, SpokeMapping } from "./input-mappings";
import THREE from "../../vendor/three";
import SpokeTransformControls from "./SpokeTransformControls";
import getIntersectingNode from "../utils/getIntersectingNode";

export default class SpokeControls {
  constructor(camera, editor, inputManager, flyControls) {
    this.camera = camera;
    this.editor = editor;
    this.inputManager = inputManager;
    this.flyControls = flyControls;
    this.enabled = false;
    this.normalMatrix = new THREE.Matrix3();
    this.vector = new THREE.Vector3();
    this.delta = new THREE.Vector3();
    this.center = new THREE.Vector3();
    this.spherical = new THREE.Spherical();
    this.panSpeed = 0.002;
    this.zoomSpeed = 0.1;
    this.orbitSpeed = 5;
    this.lookSensitivity = 5;
    this.selectSensitivity = 0.001;
    this.boostSpeed = 4;
    this.moveSpeed = 4;
    this.initialLookSensitivity = flyControls.lookSensitivity;
    this.initialBoostSpeed = flyControls.boostSpeed;
    this.initialMoveSpeed = flyControls.moveSpeed;
    this.distance = 0;
    this.maxFocusDistance = 1000;
    this.raycaster = new THREE.Raycaster();
    this.scene = null;
    this.box = new THREE.Box3();
    this.sphere = new THREE.Sphere();
    this.transformControls = new SpokeTransformControls(camera);
    this.objectPositionOnDown = null;
    this.objectRotationOnDown = null;
    this.objectScaleOnDown = null;
    this.snapEnabled = false;
    this.translationSnap = 1;
    this.rotationSnap = Math.PI / 4;
    this.currentSpace = "world";
    this.updateSnapSettings();

    this.selectStartPosition = new THREE.Vector2();
    this.selectEndPosition = new THREE.Vector2();
  }

  onSceneSet(scene) {
    this.scene = scene;
    scene.add(this.transformControls);
  }

  enable() {
    this.enabled = true;
    this.inputManager.enableInputMapping(Spoke, SpokeMapping);
  }

  disable() {
    this.enabled = false;
    this.inputManager.disableInputMapping(Spoke);
  }

  update() {
    if (!this.enabled) return;

    const input = this.inputManager;
    const transformControls = this.transformControls;

    if (input.get(Spoke.enableFlyMode)) {
      this.flyControls.enable();
      this.initialLookSensitivity = this.flyControls.lookSensitivity;
      this.initialMoveSpeed = this.flyControls.moveSpeed;
      this.initialBoostSpeed = this.flyControls.boostSpeed;
      this.flyControls.lookSensitivity = this.lookSensitivity;
      this.flyControls.moveSpeed = this.moveSpeed;
      this.flyControls.boostSpeed = this.boostSpeed;
      this.distance = this.camera.position.distanceTo(this.center);
    } else if (input.get(Spoke.disableFlyMode)) {
      this.flyControls.disable();
      this.flyControls.lookSensitivity = this.initialLookSensitivity;
      this.flyControls.boostSpeed = this.initialBoostSpeed;
      this.flyControls.moveSpeed = this.initialMoveSpeed;
      this.center.addVectors(
        this.camera.position,
        this.vector.set(0, 0, -this.distance).applyMatrix3(this.normalMatrix.getNormalMatrix(this.camera.matrix))
      );
    }

    const cursorPosition = input.get(Spoke.cursorPosition);

    if (input.get(Spoke.flying)) {
      this.raycaster.setFromCamera(cursorPosition, this.camera);
      transformControls.update(this.raycaster, false, false, false);
      return;
    }

    const selectStart = input.get(Spoke.selectStart);

    if (selectStart) {
      const selectStartPosition = input.get(Spoke.selectStartPosition);
      this.selectStartPosition.copy(selectStartPosition);
    }

    const selectEnd = input.get(Spoke.selectEnd);

    if (selectEnd && !transformControls.dragging) {
      const selectEndPosition = input.get(Spoke.selectEndPosition);

      if (this.selectStartPosition.distanceTo(selectEndPosition) < this.selectSensitivity) {
        const result = this.raycastNode(selectEndPosition);

        if (result) {
          this.editor.select(result.node);
        } else {
          this.editor.deselect();
        }
      }
    }

    const selecting = input.get(Spoke.selecting);

    // Update Transform Controls selection
    const editorSelection = this.editor.selected;

    if (editorSelection !== transformControls.object) {
      if (
        editorSelection !== null &&
        editorSelection !== this.editor.scene &&
        editorSelection !== this.camera &&
        !(editorSelection.constructor && editorSelection.constructor.disableTransform)
      ) {
        transformControls.object = editorSelection;
      } else {
        transformControls.object = null;
      }
    }

    const transformObject = transformControls.object;

    const invertSnap = input.get(Spoke.invertSnap);

    this.raycaster.setFromCamera(cursorPosition, this.camera);

    transformControls.update(this.raycaster, selectStart, selectEnd, this.snapEnabled == !invertSnap);

    const orbiting = selecting && !transformControls.dragging;

    const zoomDelta = input.get(Spoke.zoomDelta);

    if (zoomDelta !== 0) {
      const camera = this.camera;
      const delta = this.delta;
      const center = this.center;

      delta.set(0, 0, zoomDelta);

      const distance = camera.position.distanceTo(center);

      delta.multiplyScalar(distance * this.zoomSpeed);

      if (delta.length() > distance) return;

      delta.applyMatrix3(this.normalMatrix.getNormalMatrix(camera.matrix));

      camera.position.add(delta);
    } else if (input.get(Spoke.focus)) {
      const result = this.raycastNode(input.get(Spoke.focusPosition));

      if (result) {
        this.focus(result.node);
      }
    } else if (input.get(Spoke.panning)) {
      const camera = this.camera;
      const delta = this.delta;
      const center = this.center;

      const dx = input.get(Spoke.cursorDeltaX);
      const dy = input.get(Spoke.cursorDeltaY);

      const distance = camera.position.distanceTo(center);

      delta
        .set(-dx, dy, 0)
        .multiplyScalar(distance * this.panSpeed)
        .applyMatrix3(this.normalMatrix.getNormalMatrix(this.camera.matrix));

      camera.position.add(delta);
      center.add(delta);
    } else if (orbiting) {
      const camera = this.camera;
      const center = this.center;
      const vector = this.vector;
      const spherical = this.spherical;

      const dx = input.get(Spoke.cursorDeltaX);
      const dy = input.get(Spoke.cursorDeltaY);

      vector.copy(camera.position).sub(center);

      spherical.setFromVector3(vector);

      spherical.theta += dx * this.orbitSpeed;
      spherical.phi += dy * this.orbitSpeed;

      spherical.makeSafe();

      vector.setFromSpherical(spherical);

      camera.position.copy(center).add(vector);

      camera.lookAt(center);
    } else if (transformControls.dragging || transformControls.endDrag) {
      switch (transformControls.mode) {
        case "translate":
          if (!transformControls.positionStart.equals(transformObject.position)) {
            this.editor.setNodeProperty(
              transformObject,
              "position",
              transformObject.position,
              transformControls.positionStart
            );
          }
          break;
        case "rotate":
          if (!transformControls.rotationStart.equals(transformObject.rotation)) {
            this.editor.setNodeProperty(
              transformObject,
              "rotation",
              transformObject.rotation,
              transformControls.rotationStart
            );
          }
          break;
        case "scale":
          if (!transformControls.scaleStart.equals(transformObject.scale)) {
            this.editor.setNodeProperty(transformObject, "scale", transformObject.scale, transformControls.scaleStart);
          }
          break;
      }
      return;
    }

    if (input.get(Spoke.focusSelection)) {
      this.focus(this.editor.selected);
    } else if (input.get(Spoke.setTranslateMode)) {
      this.setTransformControlsMode("translate");
    } else if (input.get(Spoke.setRotateMode)) {
      this.setTransformControlsMode("rotate");
    } else if (input.get(Spoke.setScaleMode)) {
      this.setTransformControlsMode("scale");
    } else if (input.get(Spoke.toggleSnapMode)) {
      this.toggleSnapMode();
    } else if (input.get(Spoke.toggleRotationSpace)) {
      this.toggleRotationSpace();
    } else if (input.get(Spoke.undo)) {
      this.editor.undo();
    } else if (input.get(Spoke.redo)) {
      this.editor.redo();
    } else if (input.get(Spoke.duplicateSelected)) {
      this.editor.duplicateSelectedObject();
    } else if (input.get(Spoke.deleteSelected)) {
      this.editor.deleteSelectedObject();
    } else if (input.get(Spoke.saveProject)) {
      this.editor.signals.saveProject.dispatch();
    }
  }

  raycastNode(coords) {
    this.raycaster.setFromCamera(coords, this.camera);
    const results = this.raycaster.intersectObject(this.scene, true);
    return getIntersectingNode(results, this.scene);
  }

  focus(object) {
    const box = this.box;
    const center = this.center;
    const delta = this.delta;
    const camera = this.camera;

    let distance = 0;

    if (!object) {
      center.set(0, 0, 0);
      distance = 10;
    } else {
      box.setFromObject(object);

      if (box.isEmpty() === false) {
        box.getCenter(center);
        distance = box.getBoundingSphere(this.sphere).radius;
      } else {
        // Focusing on an Group, AmbientLight, etc
        center.setFromMatrixPosition(object.matrixWorld);
        distance = 0.1;
      }
    }

    delta.set(0, 0, 1);
    delta.applyQuaternion(camera.quaternion);
    delta.multiplyScalar(Math.min(distance, this.maxFocusDistance) * 4);

    camera.position.copy(center).add(delta);
  }

  setTransformControlsMode(mode) {
    this.transformControls.mode = mode;
    this.editor.signals.transformModeChanged.dispatch(mode);
  }

  toggleSnapMode() {
    this.snapEnabled = !this.snapEnabled;
    this.updateSnapSettings();
    this.editor.signals.snapToggled.dispatch(this.snapEnabled);
  }

  updateSnapSettings() {
    this.transformControls.translationSnap = this.translationSnap;
    this.transformControls.rotationSnap = this.rotationSnap;
  }

  setTranslationSnapValue(value) {
    this.translationSnap = value;
    this.transformControls.translationSnap = this.translationSnap;
  }

  setRotationSnapValue(value) {
    this.rotationSnap = value;
    this.transformControls.rotationSnap = this.rotationSnap;
  }

  toggleRotationSpace() {
    this.currentSpace = this.currentSpace === "world" ? "local" : "world";
    this.transformControls.space = this.currentSpace;
    this.editor.signals.spaceChanged.dispatch(this.currentSpace);
  }
}
