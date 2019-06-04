import { Object3D, Vector3, Quaternion, Euler, PerspectiveCamera, OrthographicCamera } from "three";
import TransformControlsGizmo from "./TransformControlsGizmo";
import TransformControlsPlane from "./TransformControlsPlane";

/**
 * Ported from https://github.com/mrdoob/js/blob/dev/examples/js/controls/TransformControls.js
 */
export default class TransformControls extends Object3D {
  static isTransformControls = true;

  constructor(camera) {
    super();
    this.visible = false;
    this.camera = camera;
    this.object = undefined;
    this.enabled = true;
    this.axis = null;
    this.mode = "translate";
    this.translationSnap = null;
    this.rotationSnap = null;
    this.space = "world";
    this.size = 1;
    this.dragging = false;
    this.startDrag = false;
    this.endDrag = false;
    this.showX = true;
    this.showY = true;
    this.showZ = true;
    this.rotationSensitivity = 5;

    this.tempVector = new Vector3();
    this.tempVector2 = new Vector3();
    this.tempQuaternion = new Quaternion();
    this.unit = {
      X: new Vector3(1, 0, 0),
      Y: new Vector3(0, 1, 0),
      Z: new Vector3(0, 0, 1)
    };
    this.identityQuaternion = new Quaternion();
    this.alignVector = new Vector3();

    this.pointStart = new Vector3();
    this.pointEnd = new Vector3();
    this.rotationAxis = new Vector3();
    this.rotationAngle = 0;

    this.cameraPosition = new Vector3();
    this.cameraQuaternion = new Quaternion();
    this.cameraScale = new Vector3();

    this.parentPosition = new Vector3();
    this.parentQuaternion = new Quaternion();
    this.parentScale = new Vector3();

    this.worldPositionStart = new Vector3();
    this.worldQuaternionStart = new Quaternion();
    this.worldScaleStart = new Vector3();

    this.worldPosition = new Vector3();
    this.worldQuaternion = new Quaternion();
    this.worldScale = new Vector3();

    this.eye = new Vector3();

    this.positionStart = new Vector3();
    this.quaternionStart = new Quaternion();
    this.rotationStart = new Euler();
    this.scaleStart = new Vector3();

    this.gizmo = new TransformControlsGizmo(this);
    this.add(this.gizmo);

    this.plane = new TransformControlsPlane(this);
    this.add(this.plane);
  }

  update(raycaster, selectStart, selectEnd, snap) {
    if (!this.object) {
      this.visible = false;
      this.axis = null;
      this.dragging = false;
      this.startDrag = false;
      this.endDrag = false;
      return;
    }

    this.visible = true;

    // Hover
    if (!this.dragging) {
      const intersect = raycaster.intersectObjects(this.gizmo.picker[this.mode].children, true)[0] || false;

      if (intersect) {
        this.axis = intersect.object.name;
      } else {
        this.axis = null;
      }
    }

    // Start Drag
    if (selectStart && !this.dragging && this.axis !== null) {
      const planeIntersect = raycaster.intersectObjects([this.plane], true)[0] || false;

      if (planeIntersect) {
        let space = this.space;

        if (this.mode === "scale") {
          space = "local";
        } else if (this.axis === "E" || this.axis === "XYZE" || this.axis === "XYZ") {
          space = "world";
        }

        if (space === "local" && this.mode === "rotate") {
          const rotationSnap = this.rotationSnap;

          if (this.axis === "X" && rotationSnap)
            this.object.rotation.x = Math.round(this.object.rotation.x / rotationSnap) * rotationSnap;
          if (this.axis === "Y" && rotationSnap)
            this.object.rotation.y = Math.round(this.object.rotation.y / rotationSnap) * rotationSnap;
          if (this.axis === "Z" && rotationSnap)
            this.object.rotation.z = Math.round(this.object.rotation.z / rotationSnap) * rotationSnap;
        }

        this.object.updateMatrixWorld();
        this.object.parent.updateMatrixWorld();

        this.positionStart.copy(this.object.position);
        this.quaternionStart.copy(this.object.quaternion);
        this.rotationStart.copy(this.object.rotation);
        this.scaleStart.copy(this.object.scale);

        this.object.matrixWorld.decompose(this.worldPositionStart, this.worldQuaternionStart, this.worldScaleStart);

        this.pointStart.copy(planeIntersect.point).sub(this.worldPositionStart);

        if (space === "local") this.pointStart.applyQuaternion(this.worldQuaternionStart.clone().inverse());
      }

      this.dragging = true;
      this.startDrag = true;
    } else {
      this.startDrag = false;
    }

    // End Drag
    if (selectEnd && this.dragging) {
      this.dragging = false;
      this.axis = null;
      this.endDrag = true;
    } else {
      this.endDrag = false;
    }

    // Dragging
    if (this.dragging) {
      const axis = this.axis;
      const mode = this.mode;
      const object = this.object;
      let space = this.space;

      if (mode === "scale") {
        space = "local";
      } else if (axis === "E" || axis === "XYZE" || axis === "XYZ") {
        space = "world";
      }

      const planeIntersect = raycaster.intersectObjects([this.plane], true)[0] || false;

      if (planeIntersect === false) return;

      this.pointEnd.copy(planeIntersect.point).sub(this.worldPositionStart);

      if (space === "local") this.pointEnd.applyQuaternion(this.worldQuaternionStart.clone().inverse());

      if (mode === "translate") {
        if (axis.search("X") === -1) {
          this.pointEnd.x = this.pointStart.x;
        }
        if (axis.search("Y") === -1) {
          this.pointEnd.y = this.pointStart.y;
        }
        if (axis.search("Z") === -1) {
          this.pointEnd.z = this.pointStart.z;
        }

        // Apply translate

        if (space === "local") {
          object.position
            .copy(this.pointEnd)
            .sub(this.pointStart)
            .applyQuaternion(this.quaternionStart);
        } else {
          object.position.copy(this.pointEnd).sub(this.pointStart);
        }

        object.position.add(this.positionStart);

        // Apply translation snap

        if (snap) {
          if (space === "local") {
            object.position.applyQuaternion(this.tempQuaternion.copy(this.quaternionStart).inverse());

            if (axis.search("X") !== -1) {
              object.position.x = Math.round(object.position.x / this.translationSnap) * this.translationSnap;
            }

            if (axis.search("Y") !== -1) {
              object.position.y = Math.round(object.position.y / this.translationSnap) * this.translationSnap;
            }

            if (axis.search("Z") !== -1) {
              object.position.z = Math.round(object.position.z / this.translationSnap) * this.translationSnap;
            }

            object.position.applyQuaternion(this.quaternionStart);
          }

          if (space === "world") {
            if (object.parent) {
              object.position.add(this.tempVector.setFromMatrixPosition(object.parent.matrixWorld));
            }

            if (axis.search("X") !== -1) {
              object.position.x = Math.round(object.position.x / this.translationSnap) * this.translationSnap;
            }

            if (axis.search("Y") !== -1) {
              object.position.y = Math.round(object.position.y / this.translationSnap) * this.translationSnap;
            }

            if (axis.search("Z") !== -1) {
              object.position.z = Math.round(object.position.z / this.translationSnap) * this.translationSnap;
            }

            if (object.parent) {
              object.position.sub(this.tempVector.setFromMatrixPosition(object.parent.matrixWorld));
            }
          }
        }
      } else if (mode === "scale") {
        if (axis.search("XYZ") !== -1) {
          let d = this.pointEnd.length() / this.pointStart.length();

          if (this.pointEnd.dot(this.pointStart) < 0) d *= -1;

          this.tempVector.set(d, d, d);
        } else {
          this.tempVector.copy(this.pointEnd).divide(this.pointStart);

          if (axis.search("X") === -1) {
            this.tempVector.x = 1;
          }
          if (axis.search("Y") === -1) {
            this.tempVector.y = 1;
          }
          if (axis.search("Z") === -1) {
            this.tempVector.z = 1;
          }
        }

        // Apply scale

        object.scale.copy(this.scaleStart).multiply(this.tempVector);
      } else if (mode === "rotate") {
        const rotationSpeed =
          this.rotationSensitivity /
          this.worldPosition.distanceTo(this.tempVector.setFromMatrixPosition(this.camera.matrixWorld));

        const quaternion = this.space === "local" ? this.worldQuaternion : this.identityQuaternion;

        const unit = this.unit[axis];

        if (axis === "E") {
          this.tempVector.copy(this.pointEnd).cross(this.pointStart);
          this.rotationAxis.copy(this.eye);
          this.rotationAngle = this.pointEnd.angleTo(this.pointStart) * (this.tempVector.dot(this.eye) < 0 ? 1 : -1);
        } else if (axis === "XYZE") {
          this.tempVector
            .copy(this.pointEnd)
            .sub(this.pointStart)
            .cross(this.eye)
            .normalize();
          this.rotationAxis.copy(this.tempVector);
          this.rotationAngle = this.pointEnd.sub(this.pointStart).dot(this.tempVector.cross(this.eye)) * rotationSpeed;
        } else if (axis === "X" || axis === "Y" || axis === "Z") {
          this.alignVector.copy(unit).applyQuaternion(quaternion);

          this.rotationAxis.copy(unit);

          this.tempVector = unit.clone();
          this.tempVector2 = this.pointEnd.clone().sub(this.pointStart);
          if (space === "local") {
            this.tempVector.applyQuaternion(quaternion);
            this.tempVector2.applyQuaternion(this.worldQuaternionStart);
          }
          this.rotationAngle = this.tempVector2.dot(this.tempVector.cross(this.eye).normalize()) * rotationSpeed;
        }

        // Apply rotation snap

        if (snap) this.rotationAngle = Math.round(this.rotationAngle / this.rotationSnap) * this.rotationSnap;

        // Apply rotate

        if (space === "local") {
          object.quaternion.copy(this.quaternionStart);
          object.quaternion.multiply(this.tempQuaternion.setFromAxisAngle(this.rotationAxis, this.rotationAngle));
        } else {
          object.quaternion.copy(this.tempQuaternion.setFromAxisAngle(this.rotationAxis, this.rotationAngle));
          object.quaternion.multiply(this.quaternionStart);
        }
      }
    }

    this.plane.update();
    this.gizmo.update();

    this.object.updateMatrixWorld();
    this.object.parent.matrixWorld.decompose(this.parentPosition, this.parentQuaternion, this.parentScale);
    this.object.matrixWorld.decompose(this.worldPosition, this.worldQuaternion, this.worldScale);

    this.camera.updateMatrixWorld();
    this.camera.matrixWorld.decompose(this.cameraPosition, this.cameraQuaternion, this.cameraScale);

    if (this.camera instanceof PerspectiveCamera) {
      this.eye
        .copy(this.cameraPosition)
        .sub(this.worldPosition)
        .normalize();
    } else if (this.camera instanceof OrthographicCamera) {
      this.eye.copy(this.cameraPosition).normalize();
    }
  }
}
