import React from "react";
import { types } from "../../editor/components";
import NumericInput from "./NumericInput";
import Vector3Input from "./Vector3Input";
import EulerInput from "./EulerInput";
import ColorInput from "./ColorInput";
import FileInput from "./FileInput";
import BooleanInput from "./BooleanInput";

/* eslint react/display-name: 0 */
const componentTypeMappings = new Map([
  [types.color, (value, isValid, onChange) => <ColorInput value={value} onChange={onChange} />],
  [
    types.number,
    (value, isValid, onChange, { min, max }) => <NumericInput value={value} onChange={onChange} min={min} max={max} />
  ],
  [types.vector, (value, isValid, onChange) => <Vector3Input value={value} onChange={onChange} />],
  [types.euler, (value, isValid, onChange) => <EulerInput value={value} onChange={onChange} />],
  [types.boolean, (value, isValid, onChange) => <BooleanInput value={value} onChange={onChange} />],
  [types.file, (value, isValid, onChange, { filters }) => <FileInput {...{ value, isValid, onChange, filters }} />]
]);

export default componentTypeMappings;
