import React from "react";
import PropTypes from "prop-types";
import styles from "./Vector3Input.scss";
import NumericInput from "./NumericInput";

export default function Vector3Input({ value, onChange, ...rest }) {
  return (
    <div className={styles.vector3Input}>
      <div className={styles.label}>X:</div>
      <NumericInput value={value.x} onChange={x => onChange({ x, y: value.y, z: value.z })} {...rest} />
      <div className={styles.label}>Y:</div>
      <NumericInput value={value.y} onChange={y => onChange({ x: value.y, y, z: value.z })} {...rest} />
      <div className={styles.label}>Z:</div>
      <NumericInput value={value.z} onChange={z => onChange({ x: value.y, y: value.y, z })} {...rest} />
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
