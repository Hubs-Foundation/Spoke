import React from "react";
import PropTypes from "prop-types";
import { SketchPicker } from "react-color";

export default function ColorInput(props) {
  return <SketchPicker color={props.value} onChange={color => props.onChange(color.hex)} />;
}

ColorInput.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func
};
