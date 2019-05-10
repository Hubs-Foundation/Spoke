import React from "react";
import PropTypes from "prop-types";
import NumericInputGroup from "./NumericInputGroup";
import THREE from "../../vendor/three";

const radToDeg = THREE.Math.radToDeg;
const degToRad = THREE.Math.degToRad;

export default function RadianNumericInputGroup({ value, onChange, ...rest }) {
  return <NumericInputGroup value={radToDeg(value)} onChange={result => onChange(degToRad(result))} {...rest} />;
}

RadianNumericInputGroup.propTypes = {
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired
};
