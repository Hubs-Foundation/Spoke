import THREE from "../../vendor/three";

/**
 * Ported from https://github.com/mrdoob/three.js/blob/dev/examples/js/controls/TransformControls.js
 */
export default class TransformControlsPlane extends THREE.Mesh {
  static isTransformControlsPlane = true;

  constructor(transformControls) {
    const geometry = new THREE.PlaneBufferGeometry(100000, 100000, 2, 2);
    const material = new THREE.MeshBasicMaterial({
      visible: false,
      wireframe: true,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.1
    });

    super(geometry, material);

    this.layers.enable(3);

    this.type = "TransformControlsPlane";
    this.transformControls = transformControls;

    this.unitX = new THREE.Vector3(1, 0, 0);
    this.unitY = new THREE.Vector3(0, 1, 0);
    this.unitZ = new THREE.Vector3(0, 0, 1);

    this.tempVector = new THREE.Vector3();
    this.dirVector = new THREE.Vector3();
    this.alignVector = new THREE.Vector3();
    this.tempMatrix = new THREE.Matrix4();
    this.identityQuaternion = new THREE.Quaternion();
  }

  update() {
    let space = this.transformControls.space;

    this.position.copy(this.transformControls.worldPosition);

    if (this.mode === "scale") space = "local"; // scale always oriented to local rotation

    this.unitX
      .set(1, 0, 0)
      .applyQuaternion(space === "local" ? this.transformControls.worldQuaternion : this.identityQuaternion);
    this.unitY
      .set(0, 1, 0)
      .applyQuaternion(space === "local" ? this.transformControls.worldQuaternion : this.identityQuaternion);
    this.unitZ
      .set(0, 0, 1)
      .applyQuaternion(space === "local" ? this.transformControls.worldQuaternion : this.identityQuaternion);

    // Align the plane for current transform mode, axis and space.

    this.alignVector.copy(this.unitY);

    switch (this.transformControls.mode) {
      case "translate":
      case "scale":
        switch (this.transformControls.axis) {
          case "X":
            this.alignVector.copy(this.transformControls.eye).cross(this.unitX);
            this.dirVector.copy(this.unitX).cross(this.alignVector);
            break;
          case "Y":
            this.alignVector.copy(this.transformControls.eye).cross(this.unitY);
            this.dirVector.copy(this.unitY).cross(this.alignVector);
            break;
          case "Z":
            this.alignVector.copy(this.transformControls.eye).cross(this.unitZ);
            this.dirVector.copy(this.unitZ).cross(this.alignVector);
            break;
          case "XY":
            this.dirVector.copy(this.unitZ);
            break;
          case "YZ":
            this.dirVector.copy(this.unitX);
            break;
          case "XZ":
            this.alignVector.copy(this.unitZ);
            this.dirVector.copy(this.unitY);
            break;
          case "XYZ":
          case "E":
            this.dirVector.set(0, 0, 0);
            break;
        }
        break;
      case "rotate":
      default:
        // special case for rotate
        this.dirVector.set(0, 0, 0);
    }

    if (this.dirVector.length() === 0) {
      // If in rotate mode, make the plane parallel to camera
      this.quaternion.copy(this.transformControls.cameraQuaternion);
    } else {
      this.tempMatrix.lookAt(this.tempVector.set(0, 0, 0), this.dirVector, this.alignVector);

      this.quaternion.setFromRotationMatrix(this.tempMatrix);
    }
  }
}
