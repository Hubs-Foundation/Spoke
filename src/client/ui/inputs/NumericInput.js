import React from "react";
import PropTypes from "prop-types";

import styles from "./NumericInput.scss";

function round(value) {
  return Math.round(value * 1000) / 1000;
}

const partialValue = /[-.0]$/;
const wholeNumber = /-?[0-9]+$/;

export default class NumericInput extends React.Component {
  static propTypes = {
    value: PropTypes.number,
    mediumStep: PropTypes.number,
    smallStep: PropTypes.number,
    bigStep: PropTypes.number,
    min: PropTypes.number,
    max: PropTypes.number,
    onChange: PropTypes.func
  };

  static defaultProps = {
    smallStep: 0.1,
    mediumStep: 1,
    bigStep: 10
  };

  constructor(props) {
    super(props);
    this.state = {
      value: props.value.toString(),
      step: props.mediumStep
    };
    this.lastValidValue = this.props.value;
  }

  getStepForKeys(ctrlKey, shiftKey) {
    let step = this.props.mediumStep;
    if (ctrlKey) {
      step = this.props.smallStep;
    } else if (shiftKey) {
      step = this.props.bigStep;
    }
    return step;
  }

  clamp(value) {
    const { min, max } = this.props;
    if (max !== null && max !== undefined) {
      value = Math.min(value, this.props.max);
    }
    if (min !== null && min !== undefined) {
      value = Math.max(value, this.props.min);
    }
    return value;
  }

  setValidValue(value) {
    value = this.clamp(round(value));
    this.lastValidValue = value;
    this.props.onChange(value);
  }

  onKeyDown = e => {
    const { ctrlKey, shiftKey, key } = e;
    if (key !== "ArrowUp" && key !== "ArrowDown") return;

    e.preventDefault();

    const step = this.getStepForKeys(ctrlKey, shiftKey);
    let { value } = this.props;
    if (key === "ArrowUp") {
      value += step;
    } else if (key === "ArrowDown") {
      value -= step;
    }
    this.setValidValue(value);
  };

  onWheel = e => {
    const { ctrlKey, shiftKey, deltaY } = e;

    e.stopPropagation();
    e.preventDefault();

    const step = this.getStepForKeys(ctrlKey, shiftKey);
    let { value } = this.props;
    value += (deltaY > 0 ? 1 : -1) * step;
    this.setValidValue(value);
  };

  setStep = e => {
    const { ctrlKey, shiftKey } = e;
    this.setState(prevState => {
      const newStep = this.getStepForKeys(ctrlKey, shiftKey);
      if (newStep === prevState.step) return;
      return { step: newStep };
    });
  };

  onMouseDown = e => {
    e.target.select();
    e.preventDefault();

    const { ctrlKey, shiftKey } = e;
    this.setState({ step: this.getStepForKeys(ctrlKey, shiftKey) });

    if (e.button === 1) {
      document.body.requestPointerLock();
    }

    window.addEventListener("keydown", this.setStep);
    window.addEventListener("keyup", this.setStep);
    window.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("mouseup", this.cleanUpListeners);
  };

  onMouseMove = e => {
    this.setValidValue(this.props.value + (e.movementX / 100) * this.state.step);
  };

  cleanUpListeners = () => {
    document.exitPointerLock();
    window.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("keydown", this.setStep);
    window.removeEventListener("keyup", this.setStep);
    window.removeEventListener("mouseup", this.cleanUpListeners);
  };

  validate = () => {
    this.setState({ value: this.lastValidValue.toString() });
    this.props.onChange(this.lastValidValue);
  };

  setValue(value) {
    const trimmed = value.trim();

    this.setState({ value });

    if (isNaN(trimmed)) return;

    const looksValid = wholeNumber.test(trimmed) || (trimmed.length > 0 && !partialValue.test(trimmed));
    if (looksValid) {
      const parsed = parseFloat(trimmed);
      if (this.clamp(parsed) === parsed) {
        this.setValidValue(parsed);
      }
    }
  }

  componentDidUpdate(prevProps) {
    const valueChanged = this.props.value !== prevProps.value;
    const stateIsNotLikeNewVal = parseFloat(this.state.value.trim()) !== this.props.value;
    if (valueChanged && stateIsNotLikeNewVal) {
      this.setState({ value: round(this.props.value).toString() });
    }
  }

  render() {
    return (
      <input
        className={styles.numericInput}
        value={this.state.value}
        onKeyDown={this.onKeyDown}
        onKeyUp={this.setStep}
        onMouseDown={this.onMouseDown}
        onWheel={this.onWheel}
        onChange={e => this.setValue(e.target.value)}
        onBlur={this.validate}
      />
    );
  }
}
