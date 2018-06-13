import React from "react";
import { SketchPicker } from "react-color";

export default function ColorInput(props) {
  return <SketchPicker color={props.value}  />;
}
