import EventEmitter from "eventemitter3";
import { Spoke, SpokeMapping } from "./input-mappings";
import {
  Matrix3,
  Vector2,
  Vector3,
  Spherical,
  Box3,
  Raycaster,
  Sphere,
  Ray,
  Plane,
  Quaternion,
  Math as _Math
} from "three";
import getIntersectingNode from "../utils/getIntersectingNode";
import { TransformSpace } from "../Editor";
import TransformGizmo from "../objects/TransformGizmo";

export const SnapMode = {
  Disabled: "Disabled",
  Grid: "Grid"
};

export const TransformPivot = {
  Selection: "Selection",
  Center: "Center"
};

export const TransformMode = {
  Disabled: "Disabled",
  Translate: "Translate",
  Rotate: "Rotate",
  Scale: "Scale"
};

export const TransformAxis = {
  X: "X",
  Y: "Y",
  Z: "Z",
  XY: "XY",
  YZ: "YZ",
  XZ: "XZ",
  XYZ: "XYZ"
};

export const TransformAxisConstraints = {
  X: new Vector3(1, 0, 0),
  Y: new Vector3(0, 1, 0),
  Z: new Vector3(0, 0, 1),
  XY: new Vector3(1, 1, 0),
  YZ: new Vector3(0, 1, 1),
  XZ: new Vector3(1, 0, 1),
  XYZ: new Vector3(1, 1, 1)
};

const viewDirection = new Vector3();

export default class SpokeControls extends EventEmitter {
  constructor(camera, editor, inputManager, flyControls) {
    super();

    this.camera = camera;
    this.editor = editor;
    this.inputManager = inputManager;
    this.flyControls = flyControls;
    this.enabled = false;
    this.normalMatrix = new Matrix3();
    this.vector = new Vector3();
    this.delta = new Vector3();
    this.center = new Vector3();
    this.spherical = new Spherical();
    this.panSpeed = 1;
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
    this.raycaster = new Raycaster();
    this.raycasterResults = [];
    this.scene = null;
    this.box = new Box3();
    this.sphere = new Sphere();

    this.transformGizmo = new TransformGizmo();

    this.transformMode = TransformMode.Translate;
    this.transformSpace = TransformSpace.World;
    this.transformPivot = TransformPivot.Selection;
    this.transformAxis = null;

    this.snapMode = SnapMode.Disabled;
    this.translationSnap = 1;
    this.rotationSnap = 90;
    this.scaleSnap = 0.1;

    this.selectionBoundingBox = new Box3();
    this.selectStartPosition = new Vector2();
    this.selectEndPosition = new Vector2();

    this.inverseGizmoQuaternion = new Quaternion();
    this.dragOffset = new Vector3();
    this.transformRay = new Ray();
    this.transformPlane = new Plane();
    this.planeIntersection = new Vector3();
    this.planeNormal = new Vector3();
    this.translationVector = new Vector3();
    this.initRotationDragVector = new Vector3();
    this.prevRotationAngle = 0;
    this.curRotationDragVector = new Vector3();
    this.normalizedInitRotationDragVector = new Vector3();
    this.normalizedCurRotationDragVector = new Vector3();

    this.initDragVector = new Vector3();
    this.dragVector = new Vector3();
    this.deltaDragVector = new Vector3();
    this.prevScale = new Vector3();
    this.curScale = new Vector3();
    this.scaleVector = new Vector3();

    this.dragging = false;
    this.selectionChanged = true;
    this.transformPropertyChanged = true;
    this.transformModeChanged = true;
    this.transformPivotChanged = true;
    this.transformSpaceChanged = true;

    this.editor.addListener("selectionChanged", this.onSelectionChanged);
    this.editor.addListener("objectsChanged", this.onObjectsChanged);
  }

  onSceneSet = scene => {
    this.scene = scene;
    this.scene.add(this.transformGizmo);
  };

  onSelectionChanged = () => {
    this.selectionChanged = true;
  };

  onObjectsChanged = (_objects, property) => {
    if (property === "position" || property === "rotation" || property === "scale" || property === "matrix") {
      this.transformPropertyChanged = true;
    }
  };

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

    if (input.get(Spoke.enableFlyMode)) {
      this.flyControls.enable();
      this.initialLookSensitivity = this.flyControls.lookSensitivity;
      this.initialMoveSpeed = this.flyControls.moveSpeed;
      this.initialBoostSpeed = this.flyControls.boostSpeed;
      this.flyControls.lookSensitivity = this.lookSensitivity;
      this.flyControls.moveSpeed = this.moveSpeed;
      this.flyControls.boostSpeed = this.boostSpeed;
      this.distance = this.camera.position.distanceTo(this.center);
      this.emit("flyModeChanged");
    } else if (input.get(Spoke.disableFlyMode)) {
      this.flyControls.disable();
      this.flyControls.lookSensitivity = this.initialLookSensitivity;
      this.flyControls.boostSpeed = this.initialBoostSpeed;
      this.flyControls.moveSpeed = this.initialMoveSpeed;
      this.center.addVectors(
        this.camera.position,
        this.vector.set(0, 0, -this.distance).applyMatrix3(this.normalMatrix.getNormalMatrix(this.camera.matrix))
      );
      this.emit("flyModeChanged");
    }

    const flying = input.get(Spoke.flying);

    const shift = input.get(Spoke.shift);

    const selectStart = input.get(Spoke.selectStart) && !flying;

    const selected = this.editor.selected;
    const selectedTransformRoots = this.editor.selectedTransformRoots;

    const modifier = input.get(Spoke.modifier);

    if (this.transformModeChanged) {
      this.transformGizmo.setTransformMode(this.transformMode);
    }

    if (selectedTransformRoots.length > 0 && this.transformMode !== TransformMode.Disabled) {
      const lastSelectedObject = selected[selected.length - 1];

      if (
        this.selectionChanged ||
        this.transformModeChanged ||
        this.transformPivotChanged ||
        this.transformPropertyChanged
      ) {
        if (this.transformPivot === TransformPivot.Center) {
          this.selectionBoundingBox.makeEmpty();

          for (let i = 0; i < selectedTransformRoots.length; i++) {
            this.selectionBoundingBox.expandByObject(selectedTransformRoots[i]);
          }

          this.selectionBoundingBox.getCenter(this.transformGizmo.position);
        } else {
          lastSelectedObject.getWorldPosition(this.transformGizmo.position);
        }
      }

      if (
        this.selectionChanged ||
        this.transformModeChanged ||
        this.transformSpaceChanged ||
        this.transformPropertyChanged
      ) {
        if (this.transformSpace === TransformSpace.LocalSelection) {
          lastSelectedObject.getWorldQuaternion(this.transformGizmo.quaternion);
        } else {
          this.transformGizmo.rotation.set(0, 0, 0);
        }

        this.inverseGizmoQuaternion.copy(this.transformGizmo.quaternion).inverse();
      }

      if ((this.transformModeChanged || this.transformSpaceChanged) && this.transformMode === TransformMode.Scale) {
        this.transformGizmo.setLocalScaleHandlesVisible(this.transformSpace !== TransformSpace.World);
      }

      this.transformGizmo.visible = true;
    } else {
      this.transformGizmo.visible = false;
    }

    this.selectionChanged = false;
    this.transformModeChanged = false;
    this.transformPivotChanged = false;
    this.transformSpaceChanged = false;

    if (selectStart) {
      const selectStartPosition = input.get(Spoke.selectStartPosition);
      this.selectStartPosition.copy(selectStartPosition);

      this.raycaster.setFromCamera(selectStartPosition, this.camera);

      if (this.transformMode !== TransformMode.Disabled) {
        this.transformAxis = this.transformGizmo.selectAxisWithRaycaster(this.raycaster);

        if (this.transformAxis) {
          const axisInfo = this.transformGizmo.selectedAxis.axisInfo;
          this.planeNormal
            .copy(axisInfo.planeNormal)
            .applyQuaternion(this.transformGizmo.quaternion)
            .normalize();
          this.transformPlane.setFromNormalAndCoplanarPoint(this.planeNormal, this.transformGizmo.position);
          this.dragging = true;
        }
      }
    }

    const selectEnd = input.get(Spoke.selectEnd) === 1;

    if (this.dragging) {
      // Set up the transformRay
      const cursorPosition = input.get(Spoke.cursorPosition);
      this.transformRay.origin.setFromMatrixPosition(this.camera.matrixWorld);
      this.transformRay.direction
        .set(cursorPosition.x, cursorPosition.y, 0.5)
        .unproject(this.camera)
        .sub(this.transformRay.origin);
      this.transformRay.intersectPlane(this.transformPlane, this.planeIntersection);

      if (selectStart) {
        this.dragOffset.subVectors(this.transformGizmo.position, this.planeIntersection);
      }

      this.planeIntersection.add(this.dragOffset);

      const constraint = TransformAxisConstraints[this.transformAxis];

      if (this.transformMode === TransformMode.Translate) {
        this.translationVector
          .subVectors(this.planeIntersection, this.transformGizmo.position)
          .applyQuaternion(this.inverseGizmoQuaternion)
          .multiply(constraint);

        if (this.shouldSnap(modifier)) {
          this.translationVector
            .divideScalar(this.translationSnap)
            .round()
            .multiplyScalar(this.translationSnap);
        }

        this.translationVector.applyQuaternion(this.transformGizmo.quaternion);

        this.editor.translateSelected(this.translationVector, this.transformSpace);
        this.transformGizmo.position.add(this.translationVector);
      } else if (this.transformMode === TransformMode.Rotate) {
        if (selectStart) {
          this.initRotationDragVector
            .subVectors(this.planeIntersection, this.dragOffset)
            .sub(this.transformGizmo.position);
          this.prevRotationAngle = 0;
        }

        this.curRotationDragVector
          .subVectors(this.planeIntersection, this.dragOffset)
          .sub(this.transformGizmo.position);
        this.normalizedInitRotationDragVector.copy(this.initRotationDragVector).normalize();
        this.normalizedCurRotationDragVector.copy(this.curRotationDragVector).normalize();

        let rotationAngle = this.curRotationDragVector.angleTo(this.initRotationDragVector);

        rotationAngle *=
          this.normalizedInitRotationDragVector.cross(this.normalizedCurRotationDragVector).dot(this.planeNormal) > 0
            ? 1
            : -1;

        if (this.shouldSnap(modifier)) {
          const rotationSnapAngle = _Math.DEG2RAD * this.rotationSnap;
          rotationAngle = Math.round(rotationAngle / rotationSnapAngle) * rotationSnapAngle;
        }

        const relativeRotationAngle = rotationAngle - this.prevRotationAngle;

        this.prevRotationAngle = rotationAngle;

        this.editor.rotateAroundSelected(this.transformGizmo.position, this.planeNormal, relativeRotationAngle);

        const selectedAxisInfo = this.transformGizmo.selectedAxis.axisInfo;

        if (selectStart) {
          selectedAxisInfo.startMarker.visible = true;
          selectedAxisInfo.endMarker.visible = true;

          if (this.transformSpace !== TransformSpace.World) {
            const startMarkerLocal = selectedAxisInfo.startMarkerLocal;
            startMarkerLocal.position.copy(this.transformGizmo.position);
            startMarkerLocal.quaternion.copy(this.transformGizmo.quaternion);
            startMarkerLocal.scale.copy(this.transformGizmo.scale);
            this.scene.add(startMarkerLocal);
          }
        }

        if (this.transformSpace === TransformSpace.World) {
          selectedAxisInfo.rotationTarget.rotateOnAxis(selectedAxisInfo.planeNormal, relativeRotationAngle);
        } else {
          this.transformGizmo.rotateOnAxis(selectedAxisInfo.planeNormal, relativeRotationAngle);
        }

        if (selectEnd) {
          selectedAxisInfo.startMarker.visible = false;
          selectedAxisInfo.endMarker.visible = false;
          selectedAxisInfo.rotationTarget.rotation.set(0, 0, 0);

          if (this.transformSpace !== TransformSpace.World) {
            const startMarkerLocal = selectedAxisInfo.startMarkerLocal;
            this.scene.remove(startMarkerLocal);
          }
        }
      } else if (this.transformMode === TransformMode.Scale) {
        this.dragVector
          .copy(this.planeIntersection)
          .applyQuaternion(this.inverseGizmoQuaternion)
          .multiply(constraint);

        if (selectStart) {
          this.initDragVector.copy(this.dragVector);
          this.prevScale.set(1, 1, 1);
        }

        this.deltaDragVector.subVectors(this.dragVector, this.initDragVector);
        this.deltaDragVector.multiply(constraint);

        let scaleFactor;

        if (this.transformAxis === TransformAxis.XYZ) {
          scaleFactor =
            1 +
            this.camera
              .getWorldDirection(viewDirection)
              .applyQuaternion(this.transformGizmo.quaternion)
              .dot(this.deltaDragVector);
        } else {
          scaleFactor = 1 + constraint.dot(this.deltaDragVector);
        }

        this.curScale.set(
          constraint.x === 0 ? 1 : scaleFactor,
          constraint.y === 0 ? 1 : scaleFactor,
          constraint.z === 0 ? 1 : scaleFactor
        );

        if (this.shouldSnap(modifier)) {
          this.curScale
            .divideScalar(this.scaleSnap)
            .round()
            .multiplyScalar(this.scaleSnap);
        }

        this.curScale.set(
          this.curScale.x <= 0 ? Number.EPSILON : this.curScale.x,
          this.curScale.y <= 0 ? Number.EPSILON : this.curScale.y,
          this.curScale.z <= 0 ? Number.EPSILON : this.curScale.z
        );

        this.scaleVector.copy(this.curScale).divide(this.prevScale);
        this.prevScale.copy(this.curScale);
        this.editor.scaleSelected(this.scaleVector, this.transformSpace, selectEnd);
      }
    }

    if (selectEnd) {
      const selectEndPosition = input.get(Spoke.selectEndPosition);

      if (this.selectStartPosition.distanceTo(selectEndPosition) < this.selectSensitivity) {
        const result = this.raycastNode(selectEndPosition);

        if (result) {
          if (shift) {
            this.editor.toggleSelection(result.node);
          } else {
            this.editor.setSelection([result.node]);
          }
        } else if (!shift) {
          this.editor.deselectAll();
        }
      }

      this.transformGizmo.deselectAxis();
      this.dragging = false;
    }

    this.transformPropertyChanged = false;

    if (flying) {
      this.updateTransformGizmoScale();
      return;
    }

    const selecting = input.get(Spoke.selecting);

    const orbiting = selecting && !this.dragging;

    const zoomDelta = input.get(Spoke.zoomDelta);

    const cursorDeltaX = input.get(Spoke.cursorDeltaX);
    const cursorDeltaY = input.get(Spoke.cursorDeltaY);

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
        this.focus([result.node]);
      }
    } else if (input.get(Spoke.panning)) {
      const camera = this.camera;
      const delta = this.delta;
      const center = this.center;

      const distance = camera.position.distanceTo(center);

      delta
        .set(cursorDeltaX, -cursorDeltaY, 0)
        .multiplyScalar(distance * this.panSpeed)
        .applyMatrix3(this.normalMatrix.getNormalMatrix(this.camera.matrix));

      camera.position.add(delta);
      center.add(delta);
    } else if (orbiting) {
      const camera = this.camera;
      const center = this.center;
      const vector = this.vector;
      const spherical = this.spherical;

      vector.copy(camera.position).sub(center);

      spherical.setFromVector3(vector);

      spherical.theta += cursorDeltaX * this.orbitSpeed;
      spherical.phi += cursorDeltaY * this.orbitSpeed;

      spherical.makeSafe();

      vector.setFromSpherical(spherical);

      camera.position.copy(center).add(vector);

      camera.lookAt(center);
    }

    if (input.get(Spoke.focusSelection)) {
      this.focus(this.editor.selected);
    } else if (input.get(Spoke.setTranslateMode)) {
      this.setTransformMode(TransformMode.Translate);
    } else if (input.get(Spoke.setRotateMode)) {
      this.setTransformMode(TransformMode.Rotate);
    } else if (input.get(Spoke.setScaleMode)) {
      this.setTransformMode(TransformMode.Scale);
    } else if (input.get(Spoke.toggleSnapMode)) {
      this.toggleSnapMode();
    } else if (input.get(Spoke.toggleTransformPivot)) {
      this.toggleTransformPivot();
    } else if (input.get(Spoke.toggleTransformSpace)) {
      this.toggleTransformSpace();
    } else if (input.get(Spoke.undo)) {
      this.editor.undo();
    } else if (input.get(Spoke.redo)) {
      this.editor.redo();
    } else if (input.get(Spoke.duplicateSelected)) {
      this.editor.duplicateSelected();
    } else if (input.get(Spoke.deleteSelected)) {
      this.editor.removeSelectedObjects();
    } else if (input.get(Spoke.saveProject)) {
      // TODO: Move save to Project class
      this.editor.emit("saveProject");
    } else if (input.get(Spoke.deselect)) {
      this.editor.deselectAll();
    }

    this.updateTransformGizmoScale();
  }

  raycastNode(coords) {
    this.raycaster.setFromCamera(coords, this.camera);
    this.raycasterResults.length = 0;
    this.raycaster.intersectObject(this.scene, true, this.raycasterResults);
    return getIntersectingNode(this.raycasterResults, this.scene);
  }

  focus(objects) {
    const box = this.box;
    const center = this.center;
    const delta = this.delta;
    const camera = this.camera;

    let distance = 0;

    if (objects.length === 0) {
      center.set(0, 0, 0);
      distance = 10;
    } else {
      box.makeEmpty();

      for (const object of objects) {
        box.expandByObject(object);
      }

      if (box.isEmpty() === false) {
        box.getCenter(center);
        distance = box.getBoundingSphere(this.sphere).radius;
      } else {
        // Focusing on an Group, AmbientLight, etc
        center.setFromMatrixPosition(objects[0].matrixWorld);
        distance = 0.1;
      }
    }

    delta.set(0, 0, 1);
    delta.applyQuaternion(camera.quaternion);
    delta.multiplyScalar(Math.min(distance, this.maxFocusDistance) * 4);

    camera.position.copy(center).add(delta);
  }

  updateTransformGizmoScale() {
    const eyeDistance = this.transformGizmo.position.distanceTo(this.camera.position);
    this.transformGizmo.scale.set(1, 1, 1).multiplyScalar(eyeDistance / 5);
  }

  setTransformMode(mode) {
    this.transformMode = mode;
    this.transformModeChanged = true;
    this.emit("transformModeChanged", mode);
  }

  setTransformSpace(transformSpace) {
    this.transformSpace = transformSpace;
    this.transformSpaceChanged = true;
    this.emit("transformSpaceChanged");
  }

  toggleTransformSpace() {
    this.setTransformSpace(
      this.transformSpace === TransformSpace.World ? TransformSpace.LocalSelection : TransformSpace.World
    );
  }

  setTransformPivot(pivot) {
    this.transformPivot = pivot;
    this.transformPivotChanged = true;
    this.emit("transformPivotChanged");
  }

  toggleTransformPivot() {
    this.setTransformPivot(
      this.transformPivot === TransformPivot.Center ? TransformPivot.Selection : TransformPivot.Center
    );
  }

  setSnapMode(snapMode) {
    this.snapMode = snapMode;
    this.emit("snapSettingsChanged");
  }

  toggleSnapMode() {
    this.setSnapMode(this.snapMode === SnapMode.Disabled ? SnapMode.Grid : SnapMode.Disabled);
  }

  shouldSnap(invertSnap = false) {
    return (this.snapMode === SnapMode.Grid) === !invertSnap;
  }

  setTranslationSnap(value) {
    this.translationSnap = value;
    this.emit("snapSettingsChanged");
  }

  setScaleSnap(value) {
    this.scaleSnap = value;
    this.emit("snapSettingsChanged");
  }

  setRotationSnap(value) {
    this.rotationSnap = value;
    this.emit("snapSettingsChanged");
  }
}
