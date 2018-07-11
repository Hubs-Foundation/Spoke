import React from "react";
import { types } from "../../editor/components";
import NumericInput from "./NumericInput";
import ColorInput from "./ColorInput";
import FileInput from "./FileInput";

/* eslint react/display-name: 0 */
const componentTypeMappings = new Map([
  [types.color, (value, onChange) => <ColorInput value={value} onChange={onChange} />],
  [types.number, (value, onChange) => <NumericInput value={value} onChange={onChange} />],
  [
    types.boolean,
    (value, onChange) => <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} />
  ],
  [
    types.file,
    (value, onChange, { openFileDialog, filters }) => <FileInput {...{ value, onChange, openFileDialog, filters }} />
  ]
]);

export default componentTypeMappings;
