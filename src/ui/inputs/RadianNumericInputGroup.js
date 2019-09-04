import React from "react";
import PropTypes from "prop-types";
import NumericInputGroup from "./NumericInputGroup";
import { Math as _Math } from "three";

const radToDeg = _Math.radToDeg;
const degToRad = _Math.degToRad;

export default function RadianNumericInputGroup({ convertTo, convertFrom, ...rest }) {
  return <NumericInputGroup {...rest} convertFrom={radToDeg} convertTo={degToRad} />;
}

RadianNumericInputGroup.propTypes = {
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  unit: PropTypes.string.isRequired,
  smallStep: PropTypes.number.isRequired,
  mediumStep: PropTypes.number.isRequired,
  largeStep: PropTypes.number.isRequired,
  convertTo: PropTypes.func,
  convertFrom: PropTypes.func
};

RadianNumericInputGroup.defaultProps = {
  min: 0,
  max: 360,
  smallStep: 1,
  mediumStep: 5,
  largeStep: 15,
  unit: "°"
};
