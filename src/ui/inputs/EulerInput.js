import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "./Vector3Input.scss";
import NumericInput from "./NumericInput";
import { Math as _Math, Euler } from "three";
import Scrubber from "./Scrubber";

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
    value: null,
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
      <div className={styles.inputGroup}>
        <Scrubber {...rest} tag="div" className={styles.label} value={vx} onChange={x => this.onChange(x, vy, vz)}>
          X:
        </Scrubber>
        <NumericInput {...rest} value={vx} onChange={x => this.onChange(x, vy, vz)} />
        <Scrubber {...rest} tag="div" className={styles.label} value={vy} onChange={y => this.onChange(vx, y, vz)}>
          Y:
        </Scrubber>
        <NumericInput {...rest} value={vy} onChange={y => this.onChange(vx, y, vz)} />
        <Scrubber {...rest} tag="div" className={styles.label} value={vz} onChange={z => this.onChange(vx, vy, z)}>
          Z:
        </Scrubber>
        <NumericInput {...rest} value={vz} onChange={z => this.onChange(vx, vy, z)} />
      </div>
    );
  }
}
