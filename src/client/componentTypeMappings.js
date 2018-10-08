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
  [types.color, (component, prop, value, isValid, onChange) => <ColorInput value={value} onChange={onChange} />],
  [types.string, (component, prop, value, isValid, onChange) => <StringInput value={value} onChange={onChange} />],
  [
    types.number,
    (component, prop, value, isValid, onChange) => {
      if (prop.min === undefined || prop.max === undefined) {
        return <NumericInput value={value} onChange={onChange} {...prop} />;
      } else {
        return <CompoundNumericInput value={value} onChange={onChange} {...prop} />;
      }
    }
  ],
  [types.vector, (component, prop, value, isValid, onChange) => <Vector3Input value={value} onChange={onChange} />],
  [types.euler, (component, prop, value, isValid, onChange) => <EulerInput value={value} onChange={onChange} />],
  [types.boolean, (component, prop, value, isValid, onChange) => <BooleanInput value={value} onChange={onChange} />],
  [
    types.file,
    (component, prop, value, isValid, onChange) => (
      <FileInput value={value} onChange={onChange} isValid={isValid} filters={prop.filters} />
    )
  ],
  [
    types.select,
    (component, prop, value, isValid, onChange) => (
      <SelectInput value={value} onChange={onChange} options={prop.options(component)} />
    )
  ]
]);

export default componentTypeMappings;
