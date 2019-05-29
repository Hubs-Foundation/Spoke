import { XR, XRMapping, Spoke, SpokeMapping, OculusTouchMapping } from "./input-mappings";
import THREE from "../../vendor/three";
import Teleporter from "../objects/Teleporter";

export default class XRControls {
  constructor(editor, viewport, inputManager) {
    this.enabled = false;
    this.editor = editor;
    this.inputManager = inputManager;

    this.inputManager.registerGamepad(
      "rightOculusTouch",
      gamepad => gamepad.id === "Oculus Touch (Right)",
      OculusTouchMapping
    );

    this.xrManager = viewport.renderer.vr;
    this.leftController = null;
    this.rightController = null;
    this.raycaster = new THREE.Raycaster();
    this.teleporter = new Teleporter(this.raycaster);

    this.inputManager.addListener("xrdisplayconnect", this.onXRDisplayConnect);
  }

  async enable() {
    this.enabled = true;
    this.inputManager.disableInputMapping(Spoke);
    this.inputManager.enableInputMapping(XR, XRMapping);

    this.xrManager.enabled = true;

    this.xrSession = await this.inputManager.enterXR();

    if (this.xrSession) {
      this.xrSession.addEventListener("end", this.onXRSessionEnded);
      this.xrManager.setSession(this.xrSession, { frameOfReferenceType: "stage" });
    }

    this.leftController = this.xrManager.getController(0);
    this.leftController.add(
      new THREE.Mesh(new THREE.BoxBufferGeometry(0.1, 0.1, 0.1), new THREE.MeshBasicMaterial({ color: 0xff0000 }))
    );
    this.editor.scene.add(this.leftController);

    this.rightController = this.xrManager.getController(1);
    this.rightController.add(
      new THREE.Mesh(new THREE.BoxBufferGeometry(0.1, 0.1, 0.1), new THREE.MeshBasicMaterial({ color: 0xff0000 }))
    );
    this.rightController.add(this.teleporter);
    this.editor.scene.add(this.rightController);

    this.isTeleporting = false;
  }

  disable() {
    this.enabled = false;
    this.inputManager.disableInputMapping(XR);
    this.inputManager.enableInputMapping(Spoke, SpokeMapping);

    if (this.inputManager.exitXR() && this.xrManager.setSession) {
      this.xrManager.setSession(null);
    }

    this.xrManager.enabled = false;

    this.leftController = null;
    this.rightController = null;

    this.xrSession = null;

    this.editor.camera.rotation.set(0, 0, 0);
    this.editor.signals.windowResize.dispatch();
  }

  onXRDisplayConnect = display => {
    this.xrManager.setDevice(display);
  };

  onXRSessionEnded = () => {
    this.xrManager.setSession(null);
  };

  toggle() {
    if (this.enabled) {
      this.disable();
    } else {
      this.enable().catch(console.error);
    }
  }

  update(dt) {
    if (!this.enabled) return;

    const teleporting = this.inputManager.get(XR.teleport);

    if (!this.isTeleporting && teleporting) {
      this.editor.optimizeScene();
      this.isTeleporting = true;
      console.log("start");
      this.teleporter.start();
    }

    if (this.isTeleporting && !teleporting) {
      this.isTeleporting = false;
      console.log("end");
      this.teleporter.end();
    }

    if (this.isTeleporting) {
      this.teleporter.update(dt, [this.editor.scene]);
    }
  }
}
