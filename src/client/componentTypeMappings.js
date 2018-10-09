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
import SelectInput from "./ui/inputs/SelectInput";

/* eslint react/display-name: 0 */
const componentTypeMappings = new Map([
  [types.color, (component, propDef, value, isValid, onChange) => <ColorInput value={value} onChange={onChange} />],
  [types.string, (component, propDef, value, isValid, onChange) => <StringInput value={value} onChange={onChange} />],
  [
    types.number,
    (component, propDef, value, isValid, onChange) => {
      if (propDef.min === undefined || propDef.max === undefined) {
        return <NumericInput value={value} onChange={onChange} {...propDef} />;
      } else {
        return <CompoundNumericInput value={value} onChange={onChange} {...propDef} />;
      }
    }
  ],
  [
    types.vector,
    (component, propDef, value, isValid, onChange) => (
      <Vector3Input value={value} onChange={onChange} uniformScaling={propDef.uniformScaling} />
    )
  ],
  [types.euler, (component, propDef, value, isValid, onChange) => <EulerInput value={value} onChange={onChange} />],
  [types.boolean, (component, propDef, value, isValid, onChange) => <BooleanInput value={value} onChange={onChange} />],
  [
    types.file,
    (component, propDef, value, isValid, onChange) => (
      <FileInput value={value} onChange={onChange} isValid={isValid} filters={propDef.filters} />
    )
  ],
  [
    types.select,
    (component, propDef, value, isValid, onChange) => (
      <SelectInput value={value} onChange={onChange} options={propDef.options(component)} />
    )
  ]
]);

export default componentTypeMappings;
