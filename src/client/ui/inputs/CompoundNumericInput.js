import React from "react";
import PropTypes from "prop-types";
import Slider from "rc-slider";
import NumericInput from "./NumericInput";
import styles from "./CompoundNumericInput.scss";

export default function CompoundNumericInput({ value, onChange, ...extras }) {
  const { min, max, step } = extras;
  return (
    <div className={styles.compound}>
      <Slider className={styles.slider} min={min} max={max} value={value} step={step} onChange={onChange} />
      <NumericInput {...extras} value={value} onChange={onChange} />
    </div>
  );
}

CompoundNumericInput.defaultProps = {
  value: 0,
  onChange: () => {},
  min: 0,
  max: 1,
  step: 0.01
};

CompoundNumericInput.propTypes = {
  value: PropTypes.number,
  onChange: PropTypes.func
};
