import React from "react";
import { types } from "../editor/gltf-components";
import NumericInput from "../components/NumericInput";
import ColorInput from "../components/ColorInput";
import StringInput from "../components/StringInput";

/* eslint react/display-name: 0 */
export const gltfComponentTypeToReactComponent = new Map([
  [types.color, (value, onChange) => <ColorInput value={value} onChange={onChange} />],
  [types.number, (value, onChange) => <NumericInput value={value} onChange={onChange} />],
  [
    types.boolean,
    (value, onChange) => <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} />
  ],
  [types.file, (value, onChange) => <StringInput value={value} onChange={e => onChange(e.target.value)} />]
]);
