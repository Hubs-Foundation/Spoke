import { Fly, FlyMapping } from "./input-mappings";
import THREE from "../../vendor/three";

export default class FlyControls {
  constructor(camera, inputManager) {
    this.enabled = false;
    this.camera = camera;
    this.inputManager = inputManager;
    this.moveSpeed = 2;
    this.boostSpeed = 2;
    this.lookSensitivity = 1;
    this.direction = new THREE.Vector3();
    this.maxXRotation = THREE.Math.degToRad(70);
    this.inputManager.canvas.addEventListener("click", this.onClickCanvas);
  }

  onClickCanvas = () => {
    if (this.enabled && document.pointerLockElement !== this.inputManager.canvas) {
      this.inputManager.canvas.requestPointerLock();
    }
  };

  enable() {
    this.enabled = true;
    this.inputManager.setInputMapping(FlyMapping);
    this.camera.rotation.set(0, 0, 0);
  }

  disable() {
    this.enabled = false;
    this.inputManager.setInputMapping({});
    this.inputManager.canvas.exitPointerLock();
  }

  update(dt) {
    if (!this.enabled || document.pointerLockElement !== this.inputManager.canvas) return;

    const input = this.inputManager;

    const rotation = this.camera.rotation;
    const lookSensitivity = this.lookSensitivity;

    let xRotation = rotation.x > Math.PI ? rotation.x - 2 * Math.PI : rotation.x;
    xRotation = THREE.Math.clamp(xRotation, -this.maxXRotation, this.maxXRotation);

    rotation.set(
      xRotation + input.get(Fly.lookY) * lookSensitivity,
      rotation.y + input.get(Fly.lookX) * lookSensitivity,
      0,
      "ZYX"
    );

    this.direction.set(input.get(Fly.moveX), 0, input.get(Fly.moveZ));

    const boostSpeed = input.get(Fly.boost) ? this.boostSpeed : 1;
    const speed = dt * this.moveSpeed * boostSpeed;

    this.camera.translateOnAxis(this.direction, speed);
  }
}
