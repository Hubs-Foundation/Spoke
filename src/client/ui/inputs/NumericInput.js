import React from "react";
import PropTypes from "prop-types";

import styles from "./NumericInput.scss";

function round(value) {
  return Math.round(value * 1000) / 1000;
}

function copyStepKeys({ ctrlKey, metaKey, shiftKey }) {
  // Copy keys so we don't have to persist the SyntheticEvent
  return { ctrlKey, metaKey, shiftKey };
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
    format: PropTypes.func,
    parse: PropTypes.func,
    onChange: PropTypes.func
  };

  static defaultProps = {
    smallStep: 0.1,
    mediumStep: 1,
    bigStep: 10
  };

  constructor(props) {
    super(props);

    const initialValue = this.formatValue(props.value);

    this.state = {
      value: initialValue.toString(),
      step: props.mediumStep
    };
    this.lastValidValue = initialValue;
  }

  formatValue(value) {
    const format = this.props.format;
    return format ? format(value) : value;
  }

  parseValue(value) {
    const parse = this.props.parse;
    return parse ? parse(value) : value;
  }

  getStepForEvent(e) {
    const { ctrlKey, metaKey, shiftKey } = e;
    let step = this.props.mediumStep;
    if (ctrlKey || metaKey) {
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
  }

  setValidValueAndDispatch(value) {
    this.setValidValue(value);
    const parsedValue = this.parseValue(value);
    this.props.onChange(parsedValue);
  }

  onKeyDown = e => {
    const { key } = e;
    if (key !== "ArrowUp" && key !== "ArrowDown") return;

    e.preventDefault();

    const step = this.getStepForEvent(e);
    let { value } = this.props;
    if (key === "ArrowUp") {
      value += step;
    } else if (key === "ArrowDown") {
      value -= step;
    }
    this.setValidValueAndDispatch(value);
  };

  onWheel = e => {
    const { deltaY } = e;

    e.stopPropagation();
    e.preventDefault();

    const step = this.getStepForEvent(e);
    let { value } = this.props;
    value += (deltaY > 0 ? 1 : -1) * step;
    this.setValidValueAndDispatch(value);
  };

  setStep = e => {
    const keys = copyStepKeys(e);
    this.setState(prevState => {
      const newStep = this.getStepForEvent(keys);
      if (newStep === prevState.step) return;
      return { step: newStep };
    });
  };

  onMouseDown = e => {
    e.target.select();
    e.preventDefault();
    const keys = copyStepKeys(e);
    this.setState({ step: this.getStepForEvent(keys) });

    if (e.button === 1) {
      document.body.requestPointerLock();
    }

    window.addEventListener("keydown", this.setStep);
    window.addEventListener("keyup", this.setStep);
    window.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("mouseup", this.cleanUpListeners);
  };

  onMouseMove = e => {
    const value = this.formatValue(this.props.value);
    this.setValidValueAndDispatch(value + (e.movementX / 100) * this.state.step);
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
    const parsedValue = this.parseValue(this.lastValidValue);
    this.props.onChange(parsedValue);
  };

  setValue(value) {
    const trimmed = value.trim();

    this.setState({ value });

    if (isNaN(trimmed)) return;

    const looksValid = wholeNumber.test(trimmed) || (trimmed.length > 0 && !partialValue.test(trimmed));
    if (looksValid) {
      const parsed = parseFloat(trimmed);
      if (this.clamp(parsed) === parsed) {
        this.setValidValueAndDispatch(parsed);
      }
    }
  }

  componentDidUpdate(prevProps) {
    const value = this.formatValue(this.props.value);
    const propValueChanged = value !== this.formatValue(prevProps.value);
    const currentStateIsDifferent = parseFloat(this.state.value.trim()) !== value;
    if (propValueChanged && currentStateIsDifferent) {
      this.setValidValue(this.props.value);
      this.setState({ value: round(value).toString() });
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
