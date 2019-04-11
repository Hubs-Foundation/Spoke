export default class PlayModeControls {
  constructor(inputManager, spokeControls, flyControls) {
    this.inputManager = inputManager;
    this.spokeControls = spokeControls;
    this.flyControls = flyControls;
    this.enabled = false;
  }

  enable() {
    this.enabled = true;
    this.inputManager.canvas.addEventListener("click", this.onClickCanvas);
    document.addEventListener("pointerlockchange", this.onPointerLockChange);
  }

  disable() {
    this.enabled = false;
    this.spokeControls.enable();
    this.flyControls.disable();
    this.inputManager.canvas.removeEventListener("click", this.onClickCanvas);
    document.removeEventListener("pointerlockchange", this.onPointerLockChange);
    document.exitPointerLock();
  }

  onClickCanvas = () => {
    this.inputManager.canvas.requestPointerLock();
  };

  onPointerLockChange = () => {
    if (document.pointerLockElement === this.inputManager.canvas) {
      this.spokeControls.disable();
      this.flyControls.enable();
    } else {
      this.spokeControls.enable();
      this.flyControls.disable();
    }
  };
}
