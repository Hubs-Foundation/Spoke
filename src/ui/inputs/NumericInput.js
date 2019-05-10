import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./NumericInput.scss";
import { getStepSize, clamp, toPrecision } from "../utils";

export default function NumericInput({
  className,
  unit,
  smallStep,
  mediumStep,
  largeStep,
  min,
  max,
  precision,
  value,
  onChange,
  onCommit,
  ...rest
}) {
  const [state, setState] = useState({ tempValue: null, focused: false });

  const handleKeyPress = useCallback(
    event => {
      let direction = 0;

      if (event.key === "ArrowUp") {
        direction = 1;
      } else if (event.key === "ArrowDown") {
        direction = -1;
      }

      if (!direction) return;

      event.preventDefault();

      const nextValue = toPrecision(getStepSize(event, smallStep, mediumStep, largeStep) * direction, precision);
      const clampedValue = clamp(nextValue, min, max);

      if (onCommit) {
        onCommit(clampedValue);
      } else {
        onChange(clampedValue);
      }

      setState({ tempValue: clampedValue.toString(), focused: true });
    },
    [smallStep, mediumStep, largeStep, value, min, max, precision, onCommit, onChange]
  );

  const handleChange = useCallback(
    event => {
      const tempValue = event.target.value;

      setState({ tempValue, focused: true });

      const parsedValue = parseFloat(tempValue);

      if (!Number.isNaN(parsedValue)) {
        const nextValue = clamp(toPrecision(parsedValue, precision), min, max);
        onChange(nextValue);
      }
    },
    [onChange]
  );

  const handleFocus = useCallback(() => {
    setState({ tempValue: value.toString(), focused: true });
  }, [value]);

  const handleBlur = useCallback(() => {
    setState({ tempValue: null, focused: false });

    if (onCommit) {
      onCommit(value);
    } else {
      onChange(value);
    }
  }, [value, onChange, onCommit]);

  return (
    <div className={styles.container}>
      <input
        {...rest}
        className={classNames(styles.numericInput, className)}
        value={state.focused ? state.tempValue : value}
        onKeyUp={handleKeyPress}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
      {unit && <div className={styles.unit}>{unit}</div>}
    </div>
  );
}

NumericInput.propTypes = {
  className: PropTypes.string,
  unit: PropTypes.node,
  smallStep: PropTypes.number.isRequired,
  mediumStep: PropTypes.number.isRequired,
  largeStep: PropTypes.number.isRequired,
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  precision: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  onCommit: PropTypes.func
};

NumericInput.defaultProps = {
  smallStep: 0.025,
  mediumStep: 0.1,
  largeStep: 0.25,
  min: -Infinity,
  max: Infinity,
  precision: 0.00001
};
