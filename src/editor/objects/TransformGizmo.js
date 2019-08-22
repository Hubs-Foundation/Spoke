import { Object3D, Color, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import transformGizmoUrl from "../../assets/TransformGizmo.glb";
import cloneObject3D from "../utils/cloneObject3D";
import eventToMessage from "../utils/eventToMessage";
import { TransformMode, TransformAxis } from "../controls/SpokeControls";

let gizmoGltf = null;

export default class TransformGizmo extends Object3D {
  static async load() {
    if (gizmoGltf) {
      return Promise.resolve(gizmoGltf);
    }

    const gltf = await new Promise((resolve, reject) => {
      new GLTFLoader().load(transformGizmoUrl, resolve, null, e => {
        reject(new Error(`Error loading Model. ${eventToMessage(e)}`));
      });
    });

    gizmoGltf = gltf;

    return gizmoGltf;
  }

  constructor() {
    super();

    this.name = "TransformGizmo";

    if (!gizmoGltf) {
      throw new Error("TransformGizmo must be loaded before it can be used. Await TransformGizmo.load()");
    }

    this.model = cloneObject3D(gizmoGltf.scene);
    this.add(this.model);

    this.selectionColor = new Color().setRGB(1, 1, 1);
    this.previousColor = new Color();
    this.raycasterResults = [];

    this.translateControls = this.model.getObjectByName("TranslateControls");
    this.translateXAxis = this.translateControls.getObjectByName("TranslateXAxis");
    this.translateXAxis.axisInfo = {
      axis: TransformAxis.X,
      planeNormal: new Vector3(0, 1, 0),
      selectionColorTarget: this.translateXAxis.material
    };
    this.translateYAxis = this.translateControls.getObjectByName("TranslateYAxis");
    this.translateYAxis.axisInfo = {
      axis: TransformAxis.Y,
      planeNormal: new Vector3(0, 0, 1),
      selectionColorTarget: this.translateYAxis.material
    };
    this.translateZAxis = this.translateControls.getObjectByName("TranslateZAxis");
    this.translateZAxis.axisInfo = {
      axis: TransformAxis.Z,
      planeNormal: new Vector3(0, 1, 0),
      selectionColorTarget: this.translateZAxis.material
    };
    this.translateXYPlane = this.translateControls.getObjectByName("TranslateXYPlane");
    this.translateXYPlane.axisInfo = {
      axis: TransformAxis.XY,
      planeNormal: new Vector3(0, 0, 1),
      selectionColorTarget: this.translateXYPlane.material
    };
    this.translateYZPlane = this.translateControls.getObjectByName("TranslateYZPlane");
    this.translateYZPlane.axisInfo = {
      axis: TransformAxis.YZ,
      planeNormal: new Vector3(1, 0, 0),
      selectionColorTarget: this.translateYZPlane.material
    };
    this.translateXZPlane = this.translateControls.getObjectByName("TranslateXZPlane");
    this.translateXZPlane.axisInfo = {
      axis: TransformAxis.XZ,
      planeNormal: new Vector3(0, 1, 0),
      selectionColorTarget: this.translateXZPlane.material
    };

    this.rotateControls = this.model.getObjectByName("RotateControls");
    this.rotateXAxis = this.rotateControls.getObjectByName("RotateXAxis");
    const rotateXAxisDisk = this.rotateXAxis.getObjectByName("RotateXAxisDisk");
    const rotateXAxisStart = this.rotateXAxis.getObjectByName("RotateXAxisStart");
    const rotateXAxisEnd = this.rotateXAxis.getObjectByName("RotateXAxisEnd");
    rotateXAxisDisk.axisInfo = {
      axis: TransformAxis.X,
      planeNormal: new Vector3(1, 0, 0),
      rotationTarget: rotateXAxisDisk,
      startMarker: rotateXAxisStart,
      endMarker: rotateXAxisEnd,
      selectionColorTarget: rotateXAxisDisk.material
    };
    this.rotateYAxis = this.rotateControls.getObjectByName("RotateYAxis");
    const rotateYAxisDisk = this.rotateYAxis.getObjectByName("RotateYAxisDisk");
    const rotateYAxisStart = this.rotateYAxis.getObjectByName("RotateYAxisStart");
    const rotateYAxisEnd = this.rotateYAxis.getObjectByName("RotateYAxisEnd");
    rotateYAxisDisk.axisInfo = {
      axis: TransformAxis.Y,
      planeNormal: new Vector3(0, 1, 0),
      rotationTarget: rotateYAxisDisk,
      startMarker: rotateYAxisStart,
      endMarker: rotateYAxisEnd,
      selectionColorTarget: rotateYAxisDisk.material
    };
    this.rotateZAxis = this.rotateControls.getObjectByName("RotateZAxis");
    const rotateZAxisDisk = this.rotateZAxis.getObjectByName("RotateZAxisDisk");
    const rotateZAxisStart = this.rotateZAxis.getObjectByName("RotateZAxisStart");
    const rotateZAxisEnd = this.rotateZAxis.getObjectByName("RotateZAxisEnd");
    rotateZAxisDisk.axisInfo = {
      axis: TransformAxis.Z,
      planeNormal: new Vector3(0, 0, 1),
      rotationTarget: rotateZAxisDisk,
      startMarker: rotateZAxisStart,
      endMarker: rotateZAxisEnd,
      selectionColorTarget: rotateZAxisDisk.material
    };

    this.scaleControls = this.model.getObjectByName("ScaleControls");
    this.scaleXAxis = this.scaleControls.getObjectByName("ScaleXAxis");
    this.scaleXAxis.axisInfo = {
      axis: TransformAxis.X,
      planeNormal: new Vector3(0, 1, 0),
      selectionColorTarget: this.scaleXAxis
    };
    this.scaleYAxis = this.scaleControls.getObjectByName("ScaleYAxis");
    this.scaleYAxis.axisInfo = {
      axis: TransformAxis.Y,
      planeNormal: new Vector3(0, 0, 1),
      selectionColorTarget: this.scaleYAxis
    };
    this.scaleZAxis = this.scaleControls.getObjectByName("ScaleZAxis");
    this.scaleZAxis.axisInfo = {
      axis: TransformAxis.Z,
      planeNormal: new Vector3(0, 1, 0),
      selectionColorTarget: this.scaleZAxis
    };
    this.scaleXYPlane = this.scaleControls.getObjectByName("ScaleXYPlane");
    this.scaleXYPlane.axisInfo = {
      axis: TransformAxis.XY,
      planeNormal: new Vector3(0, 0, 1),
      selectionColorTarget: this.scaleXYPlane
    };
    this.scaleYZPlane = this.scaleControls.getObjectByName("ScaleYZPlane");
    this.scaleYZPlane.axisInfo = {
      axis: TransformAxis.YZ,
      planeNormal: new Vector3(1, 0, 0),
      selectionColorTarget: this.scaleYZPlane
    };
    this.scaleXZPlane = this.scaleControls.getObjectByName("ScaleXZPlane");
    this.scaleXZPlane.axisInfo = {
      axis: TransformAxis.XZ,
      planeNormal: new Vector3(0, 1, 0),
      selectionColorTarget: this.scaleXZPlane
    };
    this.scaleUniformHandle = this.scaleControls.getObjectByName("ScaleUniformHandle");
    this.scaleUniformHandle.axisInfo = {
      axis: TransformAxis.XYZ,
      planeNormal: new Vector3(0, 0, 0),
      selectionColorTarget: this.scaleXYZPlane
    };

    rotateXAxisStart.visible = false;
    rotateXAxisEnd.visible = false;
    rotateYAxisStart.visible = false;
    rotateYAxisEnd.visible = false;
    rotateZAxisStart.visible = false;
    rotateZAxisEnd.visible = false;
    this.translateControls.visible = false;
    this.rotateControls.visible = false;
    this.scaleControls.visible = false;

    this.transformMode = TransformMode.Disabled;

    this.model.traverse(obj => {
      if (obj.isMesh) {
        obj.material.depthTest = false;
        obj.material.depthWrite = false;
        obj.renderOrder = 100;
      }
    });
  }

  setTransformMode(transformMode) {
    this.transformMode = transformMode;

    this.translateControls.visible = false;
    this.rotateControls.visible = false;
    this.scaleControls.visible = false;

    switch (transformMode) {
      case TransformMode.Translate:
        this.translateControls.visible = true;
        this.activeControls = this.translateControls;
        break;
      case TransformMode.Rotate:
        this.rotateControls.visible = true;
        this.activeControls = this.rotateControls;
        break;
      case TransformMode.Scale:
        this.scaleControls.visible = true;
        this.activeControls = this.scaleControls;
        break;
      default:
        this.selectedAxis = undefined;
        break;
    }
  }

  selectAxisWithRaycaster(raycaster) {
    this.deselectAxis();

    this.raycasterResults.length = 0;
    raycaster.intersectObject(this.activeControls, true, this.raycasterResults);
    console.log(this.raycasterResults);
    const axisResult = this.raycasterResults.find(result => result.object.axisInfo !== undefined);

    if (!axisResult) {
      return undefined;
    }

    this.selectedAxis = axisResult.object;

    const newAxisInfo = this.selectedAxis.axisInfo;

    this.previousColor.copy(newAxisInfo.selectionColorTarget.color);
    newAxisInfo.selectionColorTarget.color.copy(this.selectionColor);

    if (newAxisInfo.rotationStartObject) {
      newAxisInfo.rotationStartObject.visible = true;
    }

    if (newAxisInfo.rotationEndObject) {
      newAxisInfo.rotationEndObject.visible = true;
    }

    return newAxisInfo.axis;
  }

  deselectAxis() {
    if (this.selectedAxis) {
      const oldAxisInfo = this.selectedAxis.axisInfo;

      oldAxisInfo.selectionColorTarget.color.copy(this.previousColor);

      if (oldAxisInfo.rotationStartObject) {
        oldAxisInfo.rotationStartObject.visible = false;
      }

      if (oldAxisInfo.rotationEndObject) {
        oldAxisInfo.rotationEndObject.visible = false;
      }

      this.selectedAxis = undefined;
    }
  }

  setRotation(rotation) {
    if (this.selectedAxis) {
      const rotationTarget = this.selectedAxis.axisInfo.rotationTarget;

      if (rotationTarget) {
        rotationTarget.copy(rotation);
      }
    }
  }

  clone() {
    // You can only have one instance of TransformControls so return a dummy object when cloning.
    return new Object3D().copy(this);
  }
}
