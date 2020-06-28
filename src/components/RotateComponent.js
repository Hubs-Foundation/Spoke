import { Vector3 } from "three";
import { Component, Types } from "ecsy";
import { ThreeTypes } from "ecsy-three";

export class RotateComponent extends Component {
  static schema = {
    axis: { type: ThreeTypes.Vector3Type, default: new Vector3(0, 1, 0) },
    speed: { type: Types.Number, default: 0.001 }
  };
}
