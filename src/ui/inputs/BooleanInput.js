import React, { Component } from "react";
import PropTypes from "prop-types";
import Input from "./Input";
import styled from "styled-components";
import { Check } from "styled-icons/fa-solid";

let uniqueId = 0;

const StyledBooleanInput = styled.input`
  display: none;

  :disabled ~ label {
    background-color: ${props => props.theme.disabled};
    color: ${props => props.theme.disabledText};
  }
`;

const BooleanInputLabel = styled(Input).attrs(() => ({ as: "label" }))`
  width: 18px;
  height: 18px;
  margin: 4px;
  cursor: pointer;
  display: block;
  position: relative;
`;

const BooleanCheck = styled(Check)`
  position: absolute;
  top: 3px;
  left: 2px;
  color: ${props => props.theme.blue};
`;

export default class BooleanInput extends Component {
  static propTypes = {
    value: PropTypes.bool,
    onChange: PropTypes.func
  };

  static defaultProps = {
    value: false,
    onChange: () => {}
  };

  constructor(props) {
    super(props);
    this.checkboxId = `boolean-input-${uniqueId++}`;
  }

  onChange = e => {
    this.props.onChange(e.target.checked);
  };

  render() {
    const { value, onChange, ...rest } = this.props;

    return (
      <div>
        <StyledBooleanInput {...rest} id={this.checkboxId} type="checkbox" checked={value} onChange={this.onChange} />
        <BooleanInputLabel htmlFor={this.checkboxId}>{value && <BooleanCheck size={12} />}</BooleanInputLabel>
      </div>
    );
  }
}
