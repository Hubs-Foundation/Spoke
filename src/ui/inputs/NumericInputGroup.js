import React from "react";
import PropTypes from "prop-types";
import { InputGroupContainer, InputGroupContent, InputGroupInfo } from "./InputGroup";
import Scrubber from "./Scrubber";
import NumericInput from "./NumericInput";

export default function NumericInputGroup({ name, className, info, ...rest }) {
  const { displayPrecision, ...scrubberProps } = rest;
  return (
    <InputGroupContainer>
      <Scrubber {...scrubberProps}>{name}:</Scrubber>
      <InputGroupContent>
        <NumericInput {...rest} />
        {info && <InputGroupInfo info={info} />}
      </InputGroupContent>
    </InputGroupContainer>
  );
}

NumericInputGroup.propTypes = {
  name: PropTypes.string.isRequired,
  className: PropTypes.string,
  info: PropTypes.string
};
