import React from "react";
import { types } from "../editor/gltf-components";
import NumericInput from "../components/NumericInput";
import ColorInput from "../components/ColorInput";

export const gltfComponentTypeToReactComponent = new Map([
  [types.color, value => <ColorInput value={value} />],
  [types.number, value => <NumericInput value={value}  />]
]);
