import React from "react";
import PropTypes from "prop-types";
import styles from "./Vector3Input.scss";
import NumericInput from "./NumericInput";

const RAD2DEG = 180 / Math.PI;
const DEG2RAD = Math.PI / 180;

function deg2rad(x, y, z) {
  return { x: x * DEG2RAD, y: y * DEG2RAD, z: z * DEG2RAD };
}

export default function EulerInput({ value, onChange, ...rest }) {
  const vx = value ? (value.x || 0) * RAD2DEG : 0;
  const vy = value ? (value.y || 0) * RAD2DEG : 0;
  const vz = value ? (value.z || 0) * RAD2DEG : 0;
  return (
    <div className={styles.inputGroup}>
      <div className={styles.label}>X:</div>
      <NumericInput value={vx} onChange={x => onChange(deg2rad(x, vy, vz))} {...rest} />
      <div className={styles.label}>Y:</div>
      <NumericInput value={vy} onChange={y => onChange(deg2rad(vx, y, vz))} {...rest} />
      <div className={styles.label}>Z:</div>
      <NumericInput value={vz} onChange={z => onChange(deg2rad(vx, vy, z))} {...rest} />
    </div>
  );
}

EulerInput.defaultProps = {
  value: { x: 0, y: 0, z: 0 },
  onChange: () => {}
};

EulerInput.propTypes = {
  value: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
    z: PropTypes.number
  }),
  onChange: PropTypes.func
};
