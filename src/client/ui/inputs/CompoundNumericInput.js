import React from "react";
import PropTypes from "prop-types";
import Slider from "rc-slider";
import NumericInput from "./NumericInput";
import styles from "./CompoundNumericInput.scss";

export default function CompoundNumericInput({ value, onChange, ...extras }) {
  const { min, max } = extras;
  const step = 0.1;
  return (
    <div className={styles.compound}>
      <Slider className={styles.slider} min={min} max={max} value={value} step={step} onChange={onChange} />
      <NumericInput value={value} onChange={onChange} {...extras} />
    </div>
  );
}

CompoundNumericInput.defaultProps = {
  value: 0,
  onChange: () => {},
  min: 0,
  max: 1
};

CompoundNumericInput.propTypes = {
  value: PropTypes.number,
  onChange: PropTypes.func
};
