import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./NumericInput.scss";
import { getStepSize, clamp, toPrecision } from "../utils";

export default class NumericInput extends Component {
  constructor(props) {
    super(props);

    this.state = { tempValue: null, focused: false };
  }

  handleKeyPress = event => {
    const { smallStep, mediumStep, largeStep, min, max, precision, convertTo, onChange, onCommit } = this.props;

    let direction = 0;

    if (event.key === "ArrowUp") {
      direction = 1;
    } else if (event.key === "ArrowDown") {
      direction = -1;
    }

    if (!direction) return;

    event.preventDefault();

    const nextValue = parseFloat(event.target.value) + getStepSize(event, smallStep, mediumStep, largeStep) * direction;
    const clampedValue = clamp(nextValue, min, max);
    const roundedValue = precision ? toPrecision(clampedValue, precision) : nextValue;
    const finalValue = convertTo(roundedValue);

    if (onCommit) {
      onCommit(finalValue);
    } else {
      onChange(finalValue);
    }

    this.setState({ tempValue: roundedValue.toString(), focused: true });
  };

  handleChange = event => {
    const { min, max, precision, convertTo, onChange } = this.props;

    const tempValue = event.target.value;

    this.setState({ tempValue, focused: true });

    const parsedValue = parseFloat(tempValue);

    if (!Number.isNaN(parsedValue)) {
      const clampedValue = clamp(parsedValue, min, max);
      const roundedValue = precision ? toPrecision(clampedValue, precision) : clampedValue;
      const finalValue = convertTo(roundedValue);
      onChange(finalValue);
    }
  };

  handleFocus = () => {
    const { value, convertFrom } = this.props;
    this.setState({ tempValue: convertFrom(value).toString(), focused: true });
  };

  handleBlur = () => {
    const { value, onCommit, onChange } = this.props;

    this.setState({ tempValue: null, focused: false });

    if (onCommit) {
      onCommit(value);
    } else {
      onChange(value);
    }
  };

  render() {
    const {
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
    } = this.props;

    return (
      <div className={styles.container}>
        <input
          {...rest}
          className={classNames(styles.numericInput, className)}
          value={
            this.state.focused
              ? this.state.tempValue
              : precision
              ? convertFrom(value).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: -Math.log10(precision)
                })
              : convertFrom(value).toString()
          }
          onKeyUp={this.handleKeyPress}
          onChange={this.handleChange}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
        />
        {unit && <div className={styles.unit}>{unit}</div>}
      </div>
    );
  }
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
