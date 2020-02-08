import React, { Component } from "react";
import PropTypes from "prop-types";
import NumericInput from "./NumericInput";
import Scrubber from "./Scrubber";
import { Vector3 } from "three";
import styled from "styled-components";
import { Link } from "styled-icons/fa-solid/Link";
import { Unlink } from "styled-icons/fa-solid/Unlink";
import Hidden from "../layout/Hidden";

export const Vector3InputContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex: 1 1 auto;
  width: 70%;
  justify-content: flex-start;
`;

export const Vector3Scrubber = styled(Scrubber)`
  display: flex;
  align-items: center;
  padding: 0 8px;
  color: ${props => props.theme.text2};
`;

const UniformButtonContainer = styled.div`
  display: flex;
  align-items: center;

  svg {
    width: 12px;
  }

  label {
    color: ${props => props.theme.text2};
  }

  label:hover {
    color: ${props => props.theme.blueHover};
  }
`;

let uniqueId = 0;

export default class Vector3Input extends Component {
  static propTypes = {
    uniformScaling: PropTypes.bool,
    value: PropTypes.object,
    onChange: PropTypes.func
  };

  static defaultProps = {
    value: new Vector3(),
    onChange: () => {}
  };

  constructor(props) {
    super(props);

    this.id = uniqueId++;

    this.newValue = new Vector3();

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
      <Vector3InputContainer>
        {uniformScaling && (
          <UniformButtonContainer>
            <Hidden
              as="input"
              id={checkboxId}
              type="checkbox"
              checked={uniformEnabled}
              onChange={this.onToggleUniform}
            />
            <label title="Uniform Scale" htmlFor={checkboxId}>
              {uniformEnabled ? <Link /> : <Unlink />}
            </label>
          </UniformButtonContainer>
        )}
        <Vector3Scrubber {...rest} tag="div" value={vx} onChange={this.onChangeX}>
          X:
        </Vector3Scrubber>
        <NumericInput {...rest} value={vx} onChange={this.onChangeX} />
        <Vector3Scrubber {...rest} tag="div" value={vy} onChange={this.onChangeY}>
          Y:
        </Vector3Scrubber>
        <NumericInput {...rest} value={vy} onChange={this.onChangeY} />
        <Vector3Scrubber {...rest} tag="div" value={vz} onChange={this.onChangeZ}>
          Z:
        </Vector3Scrubber>
        <NumericInput {...rest} value={vz} onChange={this.onChangeZ} />
      </Vector3InputContainer>
    );
  }
}
