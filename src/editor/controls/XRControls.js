import { XR, XRMapping, Spoke, SpokeMapping } from "./input-mappings";

export default class XRControls {
  constructor(editor, viewport, inputManager) {
    this.enabled = false;
    this.editor = editor;
    this.inputManager = inputManager;
    this.xrManager = viewport.renderer.vr;
    this.xrDevice = null;
  }

  async setup() {
    const xrDevice = await this.inputManager.setupXR();
    this.xrManager.setDevice(xrDevice);
  }

  async enable() {
    this.enabled = true;
    this.inputManager.disableInputMapping(Spoke);
    this.inputManager.enableInputMapping(XR, XRMapping);
    const xrSession = await this.inputManager.enterXR();
    xrSession.addEventListener("end", this.onXRSessionEnded);
    this.xrManager.setSession(xrSession, { frameOfReferenceType: "stage" });
    this.xrManager.enabled = true;
  }

  disable() {
    this.enabled = false;
    this.inputManager.disableInputMapping(XR);
    this.inputManager.enableInputMapping(Spoke, SpokeMapping);

    if (this.inputManager.exitXR()) {
      this.xrManager.setSession(null);
    }

    this.xrManager.enabled = false;

    this.editor.signals.windowResize.dispatch();
  }

  toggle() {
    if (this.enabled) {
      this.disable();
    } else {
      this.enable().catch(console.error);
    }
  }

  onXRSessionEnded = () => {
    this.xrManager.setSession(null);
  };

  update() {
    if (!this.enabled) return;
  }

  onSceneSet = scene => {
    if (this.enabled) {
      scene.add(this.camera);
    }
  };
}
