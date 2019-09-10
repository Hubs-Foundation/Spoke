import React from "react";
import PropTypes from "prop-types";
import Slider from "./Slider";
import NumericInput from "./NumericInput";
import styled from "styled-components";

const StyledCompoundNumericInput = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

export default function CompoundNumericInput({ value, onChange, ...extras }) {
  const { min, max, step } = extras;
  return (
    <StyledCompoundNumericInput>
      <Slider min={min} max={max} value={value} step={step} onChange={onChange} />
      <NumericInput {...extras} mediumStep={step} value={value} onChange={onChange} />
    </StyledCompoundNumericInput>
  );
}

CompoundNumericInput.defaultProps = {
  value: 0,
  onChange: () => {},
  min: 0,
  max: 1,
  step: 0.01
};

CompoundNumericInput.propTypes = {
  value: PropTypes.number,
  onChange: PropTypes.func
};
