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
  convertTo,
  convertFrom,
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

      const nextValue =
        parseFloat(event.target.value) + getStepSize(event, smallStep, mediumStep, largeStep) * direction;
      const clampedValue = clamp(nextValue, min, max);
      const roundedValue = precision ? toPrecision(clampedValue, precision) : nextValue;
      const finalValue = convertTo(roundedValue);

      if (onCommit) {
        onCommit(finalValue);
      } else {
        onChange(finalValue);
      }

      setState({ tempValue: roundedValue.toString(), focused: true });
    },
    [smallStep, mediumStep, largeStep, min, max, precision, convertTo, onCommit, onChange]
  );

  const handleChange = useCallback(
    event => {
      const tempValue = event.target.value;

      setState({ tempValue, focused: true });

      const parsedValue = parseFloat(tempValue);

      if (!Number.isNaN(parsedValue)) {
        const clampedValue = clamp(parsedValue, min, max);
        const roundedValue = precision ? toPrecision(clampedValue, precision) : clampedValue;
        const finalValue = convertTo(roundedValue);
        onChange(finalValue);
      }
    },
    [onChange, precision, convertTo, min, max]
  );

  const handleFocus = useCallback(() => {
    setState({ tempValue: convertFrom(value).toString(), focused: true });
  }, [value, convertFrom]);

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
        value={
          state.focused
            ? state.tempValue
            : precision
            ? convertFrom(value).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: -Math.log10(precision)
              })
            : convertFrom(value).toString()
        }
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
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  onCommit: PropTypes.func,
  convertTo: PropTypes.func.isRequired,
  convertFrom: PropTypes.func.isRequired,
  precision: PropTypes.number
};

NumericInput.defaultProps = {
  smallStep: 0.025,
  mediumStep: 0.1,
  largeStep: 0.25,
  min: -Infinity,
  max: Infinity,
  convertTo: value => value,
  convertFrom: value => value
};
