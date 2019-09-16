import React, { Component } from "react";
import PropTypes from "prop-types";
import NumericInput from "./NumericInput";
import { Math as _Math, Euler } from "three";
import { Vector3InputContainer, Vector3Scrubber } from "./Vector3Input";

const { RAD2DEG, DEG2RAD } = _Math;

export default class EulerInput extends Component {
  static propTypes = {
    value: PropTypes.shape({
      x: PropTypes.number,
      y: PropTypes.number,
      z: PropTypes.number
    }),
    onChange: PropTypes.func
  };

  static defaultProps = {
    value: new Euler(),
    onChange: () => {},
    smallStep: 0.1,
    mediumStep: 1,
    largeStep: 5
  };

  onChange = (x, y, z) => {
    this.props.onChange(new Euler(x * DEG2RAD, y * DEG2RAD, z * DEG2RAD));
  };

  render() {
    const { value, onChange, ...rest } = this.props;

    const vx = value ? (value.x || 0) * RAD2DEG : 0;
    const vy = value ? (value.y || 0) * RAD2DEG : 0;
    const vz = value ? (value.z || 0) * RAD2DEG : 0;
    return (
      <Vector3InputContainer>
        <Vector3Scrubber {...rest} tag="div" value={vx} onChange={x => this.onChange(x, vy, vz)}>
          X:
        </Vector3Scrubber>
        <NumericInput {...rest} value={vx} onChange={x => this.onChange(x, vy, vz)} />
        <Vector3Scrubber {...rest} tag="div" value={vy} onChange={y => this.onChange(vx, y, vz)}>
          Y:
        </Vector3Scrubber>
        <NumericInput {...rest} value={vy} onChange={y => this.onChange(vx, y, vz)} />
        <Vector3Scrubber {...rest} tag="div" value={vz} onChange={z => this.onChange(vx, vy, z)}>
          Z:
        </Vector3Scrubber>
        <NumericInput {...rest} value={vz} onChange={z => this.onChange(vx, vy, z)} />
      </Vector3InputContainer>
    );
  }
}
