import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "./Vector3Input.scss";
import NumericInput from "./NumericInput";
import Scrubber from "./Scrubber";
import THREE from "../../vendor/three";

let uniqueId = 0;

export default class Vector3Input extends Component {
  static propTypes = {
    uniformScaling: PropTypes.bool,
    value: PropTypes.object,
    onChange: PropTypes.func
  };

  static defaultProps = {
    value: new THREE.Vector3(),
    onChange: () => {}
  };

  constructor(props) {
    super(props);

    this.id = uniqueId++;

    this.newValue = new THREE.Vector3();

    this.state = {
      uniformEnabled: props.uniformScaling
    };
  }

  onToggleUniform = () => {
    this.setState({ uniformEnabled: !this.state.uniformEnabled });
  };

  onChange = (field, fieldValue) => {
    const value = this.props.value;

    if (this.state.uniformEnabled) {
      this.newValue.set(fieldValue, fieldValue, fieldValue);
    } else {
      const x = value ? value.x : 0;
      const y = value ? value.y : 0;
      const z = value ? value.z : 0;

      this.newValue.x = field === "x" ? fieldValue : x;
      this.newValue.y = field === "y" ? fieldValue : y;
      this.newValue.z = field === "z" ? fieldValue : z;
    }

    this.props.onChange(this.newValue);
  };

  onChangeX = x => this.onChange("x", x);

  onChangeY = y => this.onChange("y", y);

  onChangeZ = z => this.onChange("z", z);

  render() {
    const { uniformScaling, value, onChange, ...rest } = this.props;
    const { uniformEnabled } = this.state;
    const vx = value ? value.x : 0;
    const vy = value ? value.y : 0;
    const vz = value ? value.z : 0;
    const checkboxId = "uniform-button-" + this.id;

    return (
      <div className={styles.inputGroup}>
        {uniformScaling && (
          <div className={styles.uniformButton}>
            <input id={checkboxId} type="checkbox" checked={uniformEnabled} onChange={this.onToggleUniform} />
            <label title="Uniform Scale" htmlFor={checkboxId} />
          </div>
        )}
        <Scrubber {...rest} tag="div" className={styles.label} value={vx} onChange={this.onChangeX}>
          X:
        </Scrubber>
        <NumericInput {...rest} value={vx} onChange={this.onChangeX} />
        <Scrubber {...rest} tag="div" className={styles.label} value={vy} onChange={this.onChangeY}>
          Y:
        </Scrubber>
        <NumericInput {...rest} value={vy} onChange={this.onChangeY} />
        <Scrubber {...rest} tag="div" className={styles.label} value={vz} onChange={this.onChangeZ}>
          Z:
        </Scrubber>
        <NumericInput {...rest} value={vz} onChange={this.onChangeZ} />
      </div>
    );
  }
}
