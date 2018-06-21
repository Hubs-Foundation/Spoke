import React from "react";
import { types } from "../editor/gltf-components";
import NumericInput from "../components/NumericInput";
import ColorInput from "../components/ColorInput";

export const gltfComponentTypeToReactComponent = new Map([
  [types.color, (value, onChange) => <ColorInput value={value} onChange={onChange} />],
  [types.number, (value, onChange) => <NumericInput value={value} onChange={onChange} />]
]);
