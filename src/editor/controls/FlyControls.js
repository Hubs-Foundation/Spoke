import { Fly, FlyMapping } from "./input-mappings";
import { Vector3, Matrix4, Quaternion, Math as _Math } from "three";

const EPSILON = 10e-5;
const UP = new Vector3(0, 1, 0);
const parentInverse = new Matrix4();
const IDENTITY = new Matrix4().identity();
const vec = new Vector3();
const quat = new Quaternion();
const worldPos = new Vector3();
const worldQuat = new Quaternion();
const worldScale = new Vector3();
const candidateWorldQuat = new Quaternion();

export default class FlyControls {
  constructor(camera, inputManager) {
    this.enabled = false;
    this.camera = camera;
    this.inputManager = inputManager;
    this.moveSpeed = 2;
    this.boostSpeed = 2;
    this.lookSensitivity = 10;
    this.maxXRotation = _Math.degToRad(80);
    this.direction = new Vector3();

    this.onMouseUp = e => {
      if (this.enabled && e.button === 2) {
        if (document.pointerLockElement === this.inputManager.canvas) {
          document.exitPointerLock();
        }
      }
    };
  }

  enable() {
    this.enabled = true;
    this.inputManager.enableInputMapping(Fly, FlyMapping);
    this.inputManager.canvas.addEventListener("mouseup", this.onMouseUp);
  }

  disable() {
    this.enabled = false;
    this.inputManager.disableInputMapping(Fly);
    this.inputManager.canvas.removeEventListener("mouseup", this.onMouseUp);
  }

  update(dt) {
    if (!this.enabled) return;
    const input = this.inputManager;

    // assume that this.camera[position,quaterion/rotation,scale] are authority
    this.camera.updateMatrix();
    this.camera.updateMatrixWorld();
    this.camera.matrixWorld.decompose(worldPos, worldQuat, worldScale);

    // rotate about the camera's local x axis
    candidateWorldQuat.multiplyQuaternions(
      quat.setFromAxisAngle(vec.set(1, 0, 0).applyQuaternion(worldQuat), input.get(Fly.lookY) * this.lookSensitivity),
      worldQuat
    );

    // check change of local "forward" and "up" to disallow flipping
    const camUpY = vec.set(0, 1, 0).applyQuaternion(worldQuat).y;
    const newCamUpY = vec.set(0, 1, 0).applyQuaternion(candidateWorldQuat).y;
    const newCamForwardY = vec.set(0, 0, -1).applyQuaternion(candidateWorldQuat).y;
    const extrema = Math.sin(this.maxXRotation);
    const allowRotationInX =
      newCamUpY > 0 && ((newCamForwardY < extrema && newCamForwardY > -extrema) || newCamUpY > camUpY);
    if (allowRotationInX) {
      this.camera.matrixWorld.compose(
        worldPos,
        candidateWorldQuat,
        worldScale
      );
      // assume that if camera.parent exists, its matrixWorld is up to date
      parentInverse.getInverse(this.camera.parent ? this.camera.parent.matrixWorld : IDENTITY);
      this.camera.matrix.multiplyMatrices(parentInverse, this.camera.matrixWorld);
      this.camera.matrixWorld.decompose(this.camera.position, this.camera.quaternion, this.camera.scale);
    }

    this.camera.matrixWorld.decompose(worldPos, worldQuat, worldScale);
    // rotate about the world y axis
    candidateWorldQuat.multiplyQuaternions(
      quat.setFromAxisAngle(UP, input.get(Fly.lookX) * this.lookSensitivity),
      worldQuat
    );
    this.camera.matrixWorld.compose(
      worldPos,
      candidateWorldQuat,
      worldScale
    );
    this.camera.matrix.multiplyMatrices(parentInverse, this.camera.matrixWorld);
    this.camera.matrix.decompose(this.camera.position, this.camera.quaternion, this.camera.scale);

    // translate
    this.direction.set(input.get(Fly.moveX), 0, input.get(Fly.moveZ));
    const boostSpeed = input.get(Fly.boost) ? this.boostSpeed : 1;
    const speed = dt * this.moveSpeed * boostSpeed;
    if (this.direction.lengthSq() > EPSILON) {
      this.camera.translateOnAxis(this.direction, speed);
    }

    this.camera.position.y += input.get(Fly.moveY) * dt * this.moveSpeed * boostSpeed;
  }
}
