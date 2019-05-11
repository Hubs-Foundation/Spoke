import THREE from "../../vendor/three";

/**
 * Ported from https://github.com/mrdoob/three.js/blob/dev/examples/js/controls/TransformControls.js
 */
export default class TransformControlsGizmo extends THREE.Object3D {
  static isTransformControlsGizmo = true;

  constructor(transformControls) {
    super();
    this.type = "TransformControlsGizmo";
    this.transformControls = transformControls;

    // shared materials

    const gizmoMaterial = new THREE.MeshBasicMaterial({
      depthTest: false,
      depthWrite: false,
      transparent: true,
      side: THREE.DoubleSide,
      fog: false
    });

    const gizmoLineMaterial = new THREE.LineBasicMaterial({
      depthTest: false,
      depthWrite: false,
      transparent: true,
      linewidth: 1,
      fog: false
    });

    // Make unique material for each axis/color

    const matInvisible = gizmoMaterial.clone();
    matInvisible.opacity = 0.15;

    const matHelper = gizmoMaterial.clone();
    matHelper.opacity = 0.33;

    const matRed = gizmoMaterial.clone();
    matRed.color.set(0xff0000);

    const matGreen = gizmoMaterial.clone();
    matGreen.color.set(0x00ff00);

    const matBlue = gizmoMaterial.clone();
    matBlue.color.set(0x0000ff);

    const matWhiteTransperent = gizmoMaterial.clone();
    matWhiteTransperent.opacity = 0.25;

    const matYellowTransparent = matWhiteTransperent.clone();
    matYellowTransparent.color.set(0xffff00);

    const matCyanTransparent = matWhiteTransperent.clone();
    matCyanTransparent.color.set(0x00ffff);

    const matMagentaTransparent = matWhiteTransperent.clone();
    matMagentaTransparent.color.set(0xff00ff);

    const matYellow = gizmoMaterial.clone();
    matYellow.color.set(0xffff00);

    const matLineRed = gizmoLineMaterial.clone();
    matLineRed.color.set(0xff0000);

    const matLineGreen = gizmoLineMaterial.clone();
    matLineGreen.color.set(0x00ff00);

    const matLineBlue = gizmoLineMaterial.clone();
    matLineBlue.color.set(0x0000ff);

    const matLineCyan = gizmoLineMaterial.clone();
    matLineCyan.color.set(0x00ffff);

    const matLineMagenta = gizmoLineMaterial.clone();
    matLineMagenta.color.set(0xff00ff);

    const matLineYellow = gizmoLineMaterial.clone();
    matLineYellow.color.set(0xffff00);

    const matLineGray = gizmoLineMaterial.clone();
    matLineGray.color.set(0x787878);

    const matLineYellowTransparent = matLineYellow.clone();
    matLineYellowTransparent.opacity = 0.25;

    // reusable geometry

    const arrowGeometry = new THREE.CylinderBufferGeometry(0, 0.05, 0.2, 12, 1, false);

    const scaleHandleGeometry = new THREE.BoxBufferGeometry(0.125, 0.125, 0.125);

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.addAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0], 3));

    const CircleGeometry = function(radius, arc) {
      const geometry = new THREE.BufferGeometry();
      const vertices = [];

      for (let i = 0; i <= 64 * arc; ++i) {
        vertices.push(0, Math.cos((i / 32) * Math.PI) * radius, Math.sin((i / 32) * Math.PI) * radius);
      }

      geometry.addAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));

      return geometry;
    };

    // Special geometry for transform helper. If scaled with position vector it spans from [0,0,0] to position

    const TranslateHelperGeometry = function() {
      const geometry = new THREE.BufferGeometry();

      geometry.addAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 1, 1, 1], 3));

      return geometry;
    };

    // Gizmo definitions - custom hierarchy definitions for setupGizmo() function

    const gizmoTranslate = {
      X: [
        [new THREE.Mesh(arrowGeometry, matRed), [1, 0, 0], [0, 0, -Math.PI / 2], null, "fwd"],
        [new THREE.Mesh(arrowGeometry, matRed), [1, 0, 0], [0, 0, Math.PI / 2], null, "bwd"],
        [new THREE.Line(lineGeometry, matLineRed)]
      ],
      Y: [
        [new THREE.Mesh(arrowGeometry, matGreen), [0, 1, 0], null, null, "fwd"],
        [new THREE.Mesh(arrowGeometry, matGreen), [0, 1, 0], [Math.PI, 0, 0], null, "bwd"],
        [new THREE.Line(lineGeometry, matLineGreen), null, [0, 0, Math.PI / 2]]
      ],
      Z: [
        [new THREE.Mesh(arrowGeometry, matBlue), [0, 0, 1], [Math.PI / 2, 0, 0], null, "fwd"],
        [new THREE.Mesh(arrowGeometry, matBlue), [0, 0, 1], [-Math.PI / 2, 0, 0], null, "bwd"],
        [new THREE.Line(lineGeometry, matLineBlue), null, [0, -Math.PI / 2, 0]]
      ],
      XYZ: [[new THREE.Mesh(new THREE.OctahedronBufferGeometry(0.1, 0), matWhiteTransperent), [0, 0, 0], [0, 0, 0]]],
      XY: [
        [new THREE.Mesh(new THREE.PlaneBufferGeometry(0.295, 0.295), matYellowTransparent), [0.15, 0.15, 0]],
        [new THREE.Line(lineGeometry, matLineYellow), [0.18, 0.3, 0], null, [0.125, 1, 1]],
        [new THREE.Line(lineGeometry, matLineYellow), [0.3, 0.18, 0], [0, 0, Math.PI / 2], [0.125, 1, 1]]
      ],
      YZ: [
        [
          new THREE.Mesh(new THREE.PlaneBufferGeometry(0.295, 0.295), matCyanTransparent),
          [0, 0.15, 0.15],
          [0, Math.PI / 2, 0]
        ],
        [new THREE.Line(lineGeometry, matLineCyan), [0, 0.18, 0.3], [0, 0, Math.PI / 2], [0.125, 1, 1]],
        [new THREE.Line(lineGeometry, matLineCyan), [0, 0.3, 0.18], [0, -Math.PI / 2, 0], [0.125, 1, 1]]
      ],
      XZ: [
        [
          new THREE.Mesh(new THREE.PlaneBufferGeometry(0.295, 0.295), matMagentaTransparent),
          [0.15, 0, 0.15],
          [-Math.PI / 2, 0, 0]
        ],
        [new THREE.Line(lineGeometry, matLineMagenta), [0.18, 0, 0.3], null, [0.125, 1, 1]],
        [new THREE.Line(lineGeometry, matLineMagenta), [0.3, 0, 0.18], [0, -Math.PI / 2, 0], [0.125, 1, 1]]
      ]
    };

    const pickerTranslate = {
      X: [
        [
          new THREE.Mesh(new THREE.CylinderBufferGeometry(0.2, 0, 1, 4, 1, false), matInvisible),
          [0.6, 0, 0],
          [0, 0, -Math.PI / 2]
        ]
      ],
      Y: [[new THREE.Mesh(new THREE.CylinderBufferGeometry(0.2, 0, 1, 4, 1, false), matInvisible), [0, 0.6, 0]]],
      Z: [
        [
          new THREE.Mesh(new THREE.CylinderBufferGeometry(0.2, 0, 1, 4, 1, false), matInvisible),
          [0, 0, 0.6],
          [Math.PI / 2, 0, 0]
        ]
      ],
      XYZ: [[new THREE.Mesh(new THREE.OctahedronBufferGeometry(0.2, 0), matInvisible)]],
      XY: [[new THREE.Mesh(new THREE.PlaneBufferGeometry(0.4, 0.4), matInvisible), [0.2, 0.2, 0]]],
      YZ: [[new THREE.Mesh(new THREE.PlaneBufferGeometry(0.4, 0.4), matInvisible), [0, 0.2, 0.2], [0, Math.PI / 2, 0]]],
      XZ: [[new THREE.Mesh(new THREE.PlaneBufferGeometry(0.4, 0.4), matInvisible), [0.2, 0, 0.2], [-Math.PI / 2, 0, 0]]]
    };

    const helperTranslate = {
      START: [[new THREE.Mesh(new THREE.OctahedronBufferGeometry(0.01, 2), matHelper), null, null, null, "helper"]],
      END: [[new THREE.Mesh(new THREE.OctahedronBufferGeometry(0.01, 2), matHelper), null, null, null, "helper"]],
      DELTA: [[new THREE.Line(TranslateHelperGeometry(), matHelper), null, null, null, "helper"]],
      X: [[new THREE.Line(lineGeometry, matHelper.clone()), [-1e3, 0, 0], null, [1e6, 1, 1], "helper"]],
      Y: [[new THREE.Line(lineGeometry, matHelper.clone()), [0, -1e3, 0], [0, 0, Math.PI / 2], [1e6, 1, 1], "helper"]],
      Z: [[new THREE.Line(lineGeometry, matHelper.clone()), [0, 0, -1e3], [0, -Math.PI / 2, 0], [1e6, 1, 1], "helper"]]
    };

    const gizmoRotate = {
      X: [
        [new THREE.Line(CircleGeometry(1, 0.5), matLineRed)],
        [new THREE.Mesh(new THREE.OctahedronBufferGeometry(0.04, 0), matRed), [0, 0, 0.99], null, [1, 3, 1]]
      ],
      Y: [
        [new THREE.Line(CircleGeometry(1, 0.5), matLineGreen), null, [0, 0, -Math.PI / 2]],
        [new THREE.Mesh(new THREE.OctahedronBufferGeometry(0.04, 0), matGreen), [0, 0, 0.99], null, [3, 1, 1]]
      ],
      Z: [
        [new THREE.Line(CircleGeometry(1, 0.5), matLineBlue), null, [0, Math.PI / 2, 0]],
        [new THREE.Mesh(new THREE.OctahedronBufferGeometry(0.04, 0), matBlue), [0.99, 0, 0], null, [1, 3, 1]]
      ],
      E: [
        [new THREE.Line(CircleGeometry(1.25, 1), matLineYellowTransparent), null, [0, Math.PI / 2, 0]],
        [
          new THREE.Mesh(new THREE.CylinderBufferGeometry(0.03, 0, 0.15, 4, 1, false), matLineYellowTransparent),
          [1.17, 0, 0],
          [0, 0, -Math.PI / 2],
          [1, 1, 0.001]
        ],
        [
          new THREE.Mesh(new THREE.CylinderBufferGeometry(0.03, 0, 0.15, 4, 1, false), matLineYellowTransparent),
          [-1.17, 0, 0],
          [0, 0, Math.PI / 2],
          [1, 1, 0.001]
        ],
        [
          new THREE.Mesh(new THREE.CylinderBufferGeometry(0.03, 0, 0.15, 4, 1, false), matLineYellowTransparent),
          [0, -1.17, 0],
          [Math.PI, 0, 0],
          [1, 1, 0.001]
        ],
        [
          new THREE.Mesh(new THREE.CylinderBufferGeometry(0.03, 0, 0.15, 4, 1, false), matLineYellowTransparent),
          [0, 1.17, 0],
          [0, 0, 0],
          [1, 1, 0.001]
        ]
      ],
      XYZE: [[new THREE.Line(CircleGeometry(1, 1), matLineGray), null, [0, Math.PI / 2, 0]]]
    };

    const helperRotate = {
      AXIS: [[new THREE.Line(lineGeometry, matHelper.clone()), [-1e3, 0, 0], null, [1e6, 1, 1], "helper"]]
    };

    const pickerRotate = {
      X: [
        [
          new THREE.Mesh(new THREE.TorusBufferGeometry(1, 0.1, 4, 24), matInvisible),
          [0, 0, 0],
          [0, -Math.PI / 2, -Math.PI / 2]
        ]
      ],
      Y: [[new THREE.Mesh(new THREE.TorusBufferGeometry(1, 0.1, 4, 24), matInvisible), [0, 0, 0], [Math.PI / 2, 0, 0]]],
      Z: [
        [new THREE.Mesh(new THREE.TorusBufferGeometry(1, 0.1, 4, 24), matInvisible), [0, 0, 0], [0, 0, -Math.PI / 2]]
      ],
      E: [[new THREE.Mesh(new THREE.TorusBufferGeometry(1.25, 0.1, 2, 24), matInvisible)]],
      XYZE: [[new THREE.Mesh(new THREE.SphereBufferGeometry(0.7, 10, 8), matInvisible)]]
    };

    const gizmoScale = {
      X: [
        [new THREE.Mesh(scaleHandleGeometry, matRed), [0.8, 0, 0], [0, 0, -Math.PI / 2]],
        [new THREE.Line(lineGeometry, matLineRed), null, null, [0.8, 1, 1]]
      ],
      Y: [
        [new THREE.Mesh(scaleHandleGeometry, matGreen), [0, 0.8, 0]],
        [new THREE.Line(lineGeometry, matLineGreen), null, [0, 0, Math.PI / 2], [0.8, 1, 1]]
      ],
      Z: [
        [new THREE.Mesh(scaleHandleGeometry, matBlue), [0, 0, 0.8], [Math.PI / 2, 0, 0]],
        [new THREE.Line(lineGeometry, matLineBlue), null, [0, -Math.PI / 2, 0], [0.8, 1, 1]]
      ],
      XY: [
        [new THREE.Mesh(scaleHandleGeometry, matYellowTransparent), [0.85, 0.85, 0], null, [2, 2, 0.2]],
        [new THREE.Line(lineGeometry, matLineYellow), [0.855, 0.98, 0], null, [0.125, 1, 1]],
        [new THREE.Line(lineGeometry, matLineYellow), [0.98, 0.855, 0], [0, 0, Math.PI / 2], [0.125, 1, 1]]
      ],
      YZ: [
        [new THREE.Mesh(scaleHandleGeometry, matCyanTransparent), [0, 0.85, 0.85], null, [0.2, 2, 2]],
        [new THREE.Line(lineGeometry, matLineCyan), [0, 0.855, 0.98], [0, 0, Math.PI / 2], [0.125, 1, 1]],
        [new THREE.Line(lineGeometry, matLineCyan), [0, 0.98, 0.855], [0, -Math.PI / 2, 0], [0.125, 1, 1]]
      ],
      XZ: [
        [new THREE.Mesh(scaleHandleGeometry, matMagentaTransparent), [0.85, 0, 0.85], null, [2, 0.2, 2]],
        [new THREE.Line(lineGeometry, matLineMagenta), [0.855, 0, 0.98], null, [0.125, 1, 1]],
        [new THREE.Line(lineGeometry, matLineMagenta), [0.98, 0, 0.855], [0, -Math.PI / 2, 0], [0.125, 1, 1]]
      ],
      XYZX: [[new THREE.Mesh(new THREE.BoxBufferGeometry(0.125, 0.125, 0.125), matWhiteTransperent), [1.1, 0, 0]]],
      XYZY: [[new THREE.Mesh(new THREE.BoxBufferGeometry(0.125, 0.125, 0.125), matWhiteTransperent), [0, 1.1, 0]]],
      XYZZ: [[new THREE.Mesh(new THREE.BoxBufferGeometry(0.125, 0.125, 0.125), matWhiteTransperent), [0, 0, 1.1]]]
    };

    const pickerScale = {
      X: [
        [
          new THREE.Mesh(new THREE.CylinderBufferGeometry(0.2, 0, 0.8, 4, 1, false), matInvisible),
          [0.5, 0, 0],
          [0, 0, -Math.PI / 2]
        ]
      ],
      Y: [[new THREE.Mesh(new THREE.CylinderBufferGeometry(0.2, 0, 0.8, 4, 1, false), matInvisible), [0, 0.5, 0]]],
      Z: [
        [
          new THREE.Mesh(new THREE.CylinderBufferGeometry(0.2, 0, 0.8, 4, 1, false), matInvisible),
          [0, 0, 0.5],
          [Math.PI / 2, 0, 0]
        ]
      ],
      XY: [[new THREE.Mesh(scaleHandleGeometry, matInvisible), [0.85, 0.85, 0], null, [3, 3, 0.2]]],
      YZ: [[new THREE.Mesh(scaleHandleGeometry, matInvisible), [0, 0.85, 0.85], null, [0.2, 3, 3]]],
      XZ: [[new THREE.Mesh(scaleHandleGeometry, matInvisible), [0.85, 0, 0.85], null, [3, 0.2, 3]]],
      XYZX: [[new THREE.Mesh(new THREE.BoxBufferGeometry(0.2, 0.2, 0.2), matInvisible), [1.1, 0, 0]]],
      XYZY: [[new THREE.Mesh(new THREE.BoxBufferGeometry(0.2, 0.2, 0.2), matInvisible), [0, 1.1, 0]]],
      XYZZ: [[new THREE.Mesh(new THREE.BoxBufferGeometry(0.2, 0.2, 0.2), matInvisible), [0, 0, 1.1]]]
    };

    const helperScale = {
      X: [[new THREE.Line(lineGeometry, matHelper.clone()), [-1e3, 0, 0], null, [1e6, 1, 1], "helper"]],
      Y: [[new THREE.Line(lineGeometry, matHelper.clone()), [0, -1e3, 0], [0, 0, Math.PI / 2], [1e6, 1, 1], "helper"]],
      Z: [[new THREE.Line(lineGeometry, matHelper.clone()), [0, 0, -1e3], [0, -Math.PI / 2, 0], [1e6, 1, 1], "helper"]]
    };

    // Creates an Object3D with gizmos described in custom hierarchy definition.

    const setupGizmo = function(gizmoMap) {
      const gizmo = new THREE.Object3D();

      for (const name in gizmoMap) {
        for (let i = gizmoMap[name].length; i--; ) {
          const object = gizmoMap[name][i][0].clone();
          const position = gizmoMap[name][i][1];
          const rotation = gizmoMap[name][i][2];
          const scale = gizmoMap[name][i][3];
          const tag = gizmoMap[name][i][4];

          // name and tag properties are essential for picking and updating logic.
          object.name = name;
          object.tag = tag;

          if (position) {
            object.position.set(position[0], position[1], position[2]);
          }
          if (rotation) {
            object.rotation.set(rotation[0], rotation[1], rotation[2]);
          }
          if (scale) {
            object.scale.set(scale[0], scale[1], scale[2]);
          }

          object.updateMatrix();

          const tempGeometry = object.geometry.clone();
          tempGeometry.applyMatrix(object.matrix);
          object.geometry = tempGeometry;

          object.position.set(0, 0, 0);
          object.rotation.set(0, 0, 0);
          object.scale.set(1, 1, 1);
          object.layers.set(1);

          gizmo.add(object);
        }
      }

      return gizmo;
    };

    // Reusable utility variables

    this.tempVector = new THREE.Vector3(0, 0, 0);
    this.tempEuler = new THREE.Euler();
    this.alignVector = new THREE.Vector3(0, 1, 0);
    this.zeroVector = new THREE.Vector3(0, 0, 0);
    this.lookAtMatrix = new THREE.Matrix4();
    this.tempQuaternion = new THREE.Quaternion();
    this.tempQuaternion2 = new THREE.Quaternion();
    this.identityQuaternion = new THREE.Quaternion();

    this.unitX = new THREE.Vector3(1, 0, 0);
    this.unitY = new THREE.Vector3(0, 1, 0);
    this.unitZ = new THREE.Vector3(0, 0, 1);

    // Gizmo creation

    this.gizmo = {};
    this.picker = {};
    this.helper = {};

    this.add((this.gizmo["translate"] = setupGizmo(gizmoTranslate)));
    this.add((this.gizmo["rotate"] = setupGizmo(gizmoRotate)));
    this.add((this.gizmo["scale"] = setupGizmo(gizmoScale)));
    this.add((this.picker["translate"] = setupGizmo(pickerTranslate)));
    this.add((this.picker["rotate"] = setupGizmo(pickerRotate)));
    this.add((this.picker["scale"] = setupGizmo(pickerScale)));
    this.add((this.helper["translate"] = setupGizmo(helperTranslate)));
    this.add((this.helper["rotate"] = setupGizmo(helperRotate)));
    this.add((this.helper["scale"] = setupGizmo(helperScale)));

    // Pickers should be hidden always

    this.picker["translate"].visible = false;
    this.picker["rotate"].visible = false;
    this.picker["scale"].visible = false;
  }

  update() {
    let space = this.transformControls.space;

    if (this.transformControls.mode === "scale") space = "local"; // scale always oriented to local rotation

    const quaternion = space === "local" ? this.transformControls.worldQuaternion : this.identityQuaternion;

    // Show only gizmos for current transform mode

    this.gizmo["translate"].visible = this.transformControls.mode === "translate";
    this.gizmo["rotate"].visible = this.transformControls.mode === "rotate";
    this.gizmo["scale"].visible = this.transformControls.mode === "scale";

    this.helper["translate"].visible = this.transformControls.mode === "translate";
    this.helper["rotate"].visible = this.transformControls.mode === "rotate";
    this.helper["scale"].visible = this.transformControls.mode === "scale";

    let handles = [];
    handles = handles.concat(this.picker[this.transformControls.mode].children);
    handles = handles.concat(this.gizmo[this.transformControls.mode].children);
    handles = handles.concat(this.helper[this.transformControls.mode].children);

    for (let i = 0; i < handles.length; i++) {
      const handle = handles[i];

      // hide aligned to camera

      handle.visible = true;
      handle.rotation.set(0, 0, 0);
      handle.position.copy(this.transformControls.worldPosition);

      const eyeDistance = this.transformControls.worldPosition.distanceTo(this.transformControls.cameraPosition);
      handle.scale.set(1, 1, 1).multiplyScalar((eyeDistance * this.transformControls.size) / 7);

      // TODO: simplify helpers and consider decoupling from gizmo

      if (handle.tag === "helper") {
        handle.visible = false;

        if (handle.name === "AXIS") {
          handle.position.copy(this.transformControls.worldPositionStart);
          handle.visible = !!this.transformControls.axis;

          if (this.transformControls.axis === "X") {
            this.tempQuaternion.setFromEuler(this.tempEuler.set(0, 0, 0));
            handle.quaternion.copy(quaternion).multiply(this.tempQuaternion);

            if (
              Math.abs(
                this.alignVector
                  .copy(this.unitX)
                  .applyQuaternion(quaternion)
                  .dot(this.transformControls.eye)
              ) > 0.9
            ) {
              handle.visible = false;
            }
          }

          if (this.transformControls.axis === "Y") {
            this.tempQuaternion.setFromEuler(this.tempEuler.set(0, 0, Math.PI / 2));
            handle.quaternion.copy(quaternion).multiply(this.tempQuaternion);

            if (
              Math.abs(
                this.alignVector
                  .copy(this.unitY)
                  .applyQuaternion(quaternion)
                  .dot(this.transformControls.eye)
              ) > 0.9
            ) {
              handle.visible = false;
            }
          }

          if (this.transformControls.axis === "Z") {
            this.tempQuaternion.setFromEuler(this.tempEuler.set(0, Math.PI / 2, 0));
            handle.quaternion.copy(quaternion).multiply(this.tempQuaternion);

            if (
              Math.abs(
                this.alignVector
                  .copy(this.unitZ)
                  .applyQuaternion(quaternion)
                  .dot(this.transformControls.eye)
              ) > 0.9
            ) {
              handle.visible = false;
            }
          }

          if (this.transformControls.axis === "XYZE") {
            this.tempQuaternion.setFromEuler(this.tempEuler.set(0, Math.PI / 2, 0));
            this.alignVector.copy(this.transformControls.rotationAxis);
            handle.quaternion.setFromRotationMatrix(
              this.lookAtMatrix.lookAt(this.zeroVector, this.alignVector, this.unitY)
            );
            handle.quaternion.multiply(this.tempQuaternion);
            handle.visible = this.transformControls.dragging;
          }

          if (this.transformControls.axis === "E") {
            handle.visible = false;
          }
        } else if (handle.name === "START") {
          handle.position.copy(this.transformControls.worldPositionStart);
          handle.visible = this.transformControls.dragging;
        } else if (handle.name === "END") {
          handle.position.copy(this.transformControls.worldPosition);
          handle.visible = this.transformControls.dragging;
        } else if (handle.name === "DELTA") {
          handle.position.copy(this.transformControls.worldPositionStart);
          handle.quaternion.copy(this.transformControls.worldQuaternionStart);
          this.tempVector
            .set(1e-10, 1e-10, 1e-10)
            .add(this.transformControls.worldPositionStart)
            .sub(this.transformControls.worldPosition)
            .multiplyScalar(-1);
          this.tempVector.applyQuaternion(this.transformControls.worldQuaternionStart.clone().inverse());
          handle.scale.copy(this.tempVector);
          handle.visible = this.transformControls.dragging;
        } else {
          handle.quaternion.copy(quaternion);

          if (this.transformControls.dragging) {
            handle.position.copy(this.transformControls.worldPositionStart);
          } else {
            handle.position.copy(this.transformControls.worldPosition);
          }

          if (this.transformControls.axis) {
            handle.visible = this.transformControls.axis.search(handle.name) !== -1;
          }
        }

        // If updating helper, skip rest of the loop
        continue;
      }

      // Align handles to current local or world rotation

      handle.quaternion.copy(quaternion);

      if (this.transformControls.mode === "translate" || this.transformControls.mode === "scale") {
        // Hide translate and scale axis facing the camera

        const AXIS_HIDE_TRESHOLD = 0.99;
        const PLANE_HIDE_TRESHOLD = 0.2;
        const AXIS_FLIP_TRESHOLD = -0.4;

        if (handle.name === "X" || handle.name === "XYZX") {
          if (
            Math.abs(
              this.alignVector
                .copy(this.unitX)
                .applyQuaternion(quaternion)
                .dot(this.transformControls.eye)
            ) > AXIS_HIDE_TRESHOLD
          ) {
            handle.scale.set(1e-10, 1e-10, 1e-10);
            handle.visible = false;
          }
        }
        if (handle.name === "Y" || handle.name === "XYZY") {
          if (
            Math.abs(
              this.alignVector
                .copy(this.unitY)
                .applyQuaternion(quaternion)
                .dot(this.transformControls.eye)
            ) > AXIS_HIDE_TRESHOLD
          ) {
            handle.scale.set(1e-10, 1e-10, 1e-10);
            handle.visible = false;
          }
        }
        if (handle.name === "Z" || handle.name === "XYZZ") {
          if (
            Math.abs(
              this.alignVector
                .copy(this.unitZ)
                .applyQuaternion(quaternion)
                .dot(this.transformControls.eye)
            ) > AXIS_HIDE_TRESHOLD
          ) {
            handle.scale.set(1e-10, 1e-10, 1e-10);
            handle.visible = false;
          }
        }
        if (handle.name === "XY") {
          if (
            Math.abs(
              this.alignVector
                .copy(this.unitZ)
                .applyQuaternion(quaternion)
                .dot(this.transformControls.eye)
            ) < PLANE_HIDE_TRESHOLD
          ) {
            handle.scale.set(1e-10, 1e-10, 1e-10);
            handle.visible = false;
          }
        }
        if (handle.name === "YZ") {
          if (
            Math.abs(
              this.alignVector
                .copy(this.unitX)
                .applyQuaternion(quaternion)
                .dot(this.transformControls.eye)
            ) < PLANE_HIDE_TRESHOLD
          ) {
            handle.scale.set(1e-10, 1e-10, 1e-10);
            handle.visible = false;
          }
        }
        if (handle.name === "XZ") {
          if (
            Math.abs(
              this.alignVector
                .copy(this.unitY)
                .applyQuaternion(quaternion)
                .dot(this.transformControls.eye)
            ) < PLANE_HIDE_TRESHOLD
          ) {
            handle.scale.set(1e-10, 1e-10, 1e-10);
            handle.visible = false;
          }
        }

        // Flip translate and scale axis ocluded behind another axis

        if (handle.name.search("X") !== -1) {
          if (
            this.alignVector
              .copy(this.unitX)
              .applyQuaternion(quaternion)
              .dot(this.transformControls.eye) < AXIS_FLIP_TRESHOLD
          ) {
            if (handle.tag === "fwd") {
              handle.visible = false;
            } else {
              handle.scale.x *= -1;
            }
          } else if (handle.tag === "bwd") {
            handle.visible = false;
          }
        }

        if (handle.name.search("Y") !== -1) {
          if (
            this.alignVector
              .copy(this.unitY)
              .applyQuaternion(quaternion)
              .dot(this.transformControls.eye) < AXIS_FLIP_TRESHOLD
          ) {
            if (handle.tag === "fwd") {
              handle.visible = false;
            } else {
              handle.scale.y *= -1;
            }
          } else if (handle.tag === "bwd") {
            handle.visible = false;
          }
        }

        if (handle.name.search("Z") !== -1) {
          if (
            this.alignVector
              .copy(this.unitZ)
              .applyQuaternion(quaternion)
              .dot(this.transformControls.eye) < AXIS_FLIP_TRESHOLD
          ) {
            if (handle.tag === "fwd") {
              handle.visible = false;
            } else {
              handle.scale.z *= -1;
            }
          } else if (handle.tag === "bwd") {
            handle.visible = false;
          }
        }
      } else if (this.transformControls.mode === "rotate") {
        // Align handles to current local or world rotation

        this.tempQuaternion2.copy(quaternion);
        this.alignVector
          .copy(this.transformControls.eye)
          .applyQuaternion(this.tempQuaternion.copy(quaternion).inverse());

        if (handle.name.search("E") !== -1) {
          handle.quaternion.setFromRotationMatrix(
            this.lookAtMatrix.lookAt(this.transformControls.eye, this.zeroVector, this.unitY)
          );
        }

        if (handle.name === "X") {
          this.tempQuaternion.setFromAxisAngle(this.unitX, Math.atan2(-this.alignVector.y, this.alignVector.z));
          this.tempQuaternion.multiplyQuaternions(this.tempQuaternion2, this.tempQuaternion);
          handle.quaternion.copy(this.tempQuaternion);
        }

        if (handle.name === "Y") {
          this.tempQuaternion.setFromAxisAngle(this.unitY, Math.atan2(this.alignVector.x, this.alignVector.z));
          this.tempQuaternion.multiplyQuaternions(this.tempQuaternion2, this.tempQuaternion);
          handle.quaternion.copy(this.tempQuaternion);
        }

        if (handle.name === "Z") {
          this.tempQuaternion.setFromAxisAngle(this.unitZ, Math.atan2(this.alignVector.y, this.alignVector.x));
          this.tempQuaternion.multiplyQuaternions(this.tempQuaternion2, this.tempQuaternion);
          handle.quaternion.copy(this.tempQuaternion);
        }
      }

      // Hide disabled axes
      handle.visible = handle.visible && (handle.name.indexOf("X") === -1 || this.transformControls.showX);
      handle.visible = handle.visible && (handle.name.indexOf("Y") === -1 || this.transformControls.showY);
      handle.visible = handle.visible && (handle.name.indexOf("Z") === -1 || this.transformControls.showZ);
      handle.visible =
        handle.visible &&
        (handle.name.indexOf("E") === -1 ||
          (this.transformControls.showX && this.transformControls.showY && this.transformControls.showZ));

      // highlight selected axis

      handle.material._opacity = handle.material._opacity || handle.material.opacity;
      handle.material._color = handle.material._color || handle.material.color.clone();

      handle.material.color.copy(handle.material._color);
      handle.material.opacity = handle.material._opacity;

      if (!this.transformControls.enabled) {
        handle.material.opacity *= 0.5;
        handle.material.color.lerp(new THREE.Color(1, 1, 1), 0.25);
      } else if (this.transformControls.axis) {
        if (handle.name === this.transformControls.axis) {
          handle.material.opacity = 1.0;
        } else if (
          this.transformControls.axis.split("").some(function(a) {
            return handle.name === a;
          })
        ) {
          handle.material.opacity = 1.0;
          handle.material.color.lerp(new THREE.Color(1, 1, 1), 0.25);
        } else {
          handle.material.opacity *= 0.5;
          handle.material.color.lerp(new THREE.Color(1, 1, 1), 0.25);
        }
      }
    }
  }
}
