import React from "react";
import { types } from "./editor/components";
import BooleanInput from "./ui/inputs/BooleanInput";
import ColorInput from "./ui/inputs//ColorInput";
import CompoundNumericInput from "./ui/inputs/CompoundNumericInput";
import EulerInput from "./ui/inputs//EulerInput";
import FileInput from "./ui/inputs/FileInput";
import NumericInput from "./ui/inputs/NumericInput";
import StringInput from "./ui/inputs/StringInput";
import Vector3Input from "./ui/inputs/Vector3Input";

/* eslint react/display-name: 0 */
const componentTypeMappings = new Map([
  [types.color, (value, isValid, onChange) => <ColorInput value={value} onChange={onChange} />],
  [types.string, (value, isValid, onChange) => <StringInput value={value} onChange={onChange} />],
  [
    types.number,
    (value, isValid, onChange, extras) => {
      if (extras.min === undefined || extras.max === undefined) {
        return <NumericInput value={value} onChange={onChange} {...extras} />;
      } else {
        return <CompoundNumericInput value={value} onChange={onChange} {...extras} />;
      }
    }
  ],
  [types.vector, (value, isValid, onChange) => <Vector3Input value={value} onChange={onChange} />],
  [types.euler, (value, isValid, onChange) => <EulerInput value={value} onChange={onChange} />],
  [types.boolean, (value, isValid, onChange) => <BooleanInput value={value} onChange={onChange} />],
  [
    types.file,
    (value, isValid, onChange, extras) => <FileInput value={value} onChange={onChange} isValid={isValid} {...extras} />
  ]
]);

export default componentTypeMappings;
