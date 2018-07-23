import React from "react";
import PropTypes from "prop-types";
import styles from "./Vector3Input.scss";
import NumericInput from "./NumericInput";

export default function Vector3Input({ value, onChange, ...rest }) {
  const vx = value ? value.x : 0;
  const vy = value ? value.y : 0;
  const vz = value ? value.z : 0;
  return (
    <div className={styles.inputGroup}>
      <div className={styles.label}>X:</div>
      <NumericInput value={vx} onChange={x => onChange({ x, y: vy, z: vz })} {...rest} />
      <div className={styles.label}>Y:</div>
      <NumericInput value={vy} onChange={y => onChange({ x: vx, y, z: vz })} {...rest} />
      <div className={styles.label}>Z:</div>
      <NumericInput value={vz} onChange={z => onChange({ x: vx, y: vy, z })} {...rest} />
    </div>
  );
}

Vector3Input.defaultProps = {
  value: { x: 0, y: 0, z: 0 },
  onChange: () => {}
};

Vector3Input.propTypes = {
  value: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
    z: PropTypes.number
  }),
  onChange: PropTypes.func
};
