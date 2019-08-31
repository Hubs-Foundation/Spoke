import React, { Component, createRef } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./NumericInput.scss";
import { getStepSize, clamp, toPrecision } from "../utils";

function toPrecisionString(value, precision) {
  if (precision && precision <= 1) {
    const numDigits = Math.abs(Math.log10(precision));
    const minimumFractionDigits = Math.min(numDigits, 2);
    const maximumFractionDigits = Math.max(minimumFractionDigits, numDigits);

    return value.toLocaleString("fullwide", {
      minimumFractionDigits,
      maximumFractionDigits,
      useGrouping: false
    });
  } else {
    return value.toLocaleString("fullwide", { useGrouping: false });
  }
}

export default class NumericInput extends Component {
  constructor(props) {
    super(props);

    this.state = { tempValue: null, focused: false };
    this.inputEl = createRef();
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

    this.setState({
      tempValue: roundedValue.toLocaleString("fullwide", {
        useGrouping: false,
        minimumFractionDigits: 0,
        maximumFractionDigits: Math.abs(Math.log10(precision)) + 1
      }),
      focused: true
    });
  };

  handleKeyDown = event => {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
    }
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
    const { value, convertFrom, precision } = this.props;
    this.setState(
      {
        tempValue: convertFrom(value).toLocaleString("fullwide", {
          useGrouping: false,
          minimumFractionDigits: 0,
          maximumFractionDigits: Math.abs(Math.log10(precision)) + 1
        }),
        focused: true
      },
      () => {
        this.inputEl.current.select();
      }
    );
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
      displayPrecision,
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
          ref={this.inputEl}
          value={this.state.focused ? this.state.tempValue : toPrecisionString(convertFrom(value), displayPrecision)}
          onKeyUp={this.handleKeyPress}
          onKeyDown={this.handleKeyDown}
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
  precision: PropTypes.number.isRequired,
  displayPrecision: PropTypes.number.isRequired
};

NumericInput.defaultProps = {
  smallStep: 0.025,
  mediumStep: 0.1,
  largeStep: 0.25,
  min: -Infinity,
  max: Infinity,
  displayPrecision: 0.001,
  precision: Number.EPSILON,
  convertTo: value => value,
  convertFrom: value => value
};
