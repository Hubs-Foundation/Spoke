import React from "react";
import PropTypes from "prop-types";
import { InputGroupContainer, InputGroupContent, InputGroupInfo } from "./InputGroup";
import Scrubber from "./Scrubber";
import NumericInput from "./NumericInput";

export default function NumericInputGroup({ name, className, disabled, tooltipId, info, ...rest }) {
  const { displayPrecision, ...scrubberProps } = rest;
  return (
    <InputGroupContainer>
      <Scrubber {...scrubberProps}>{name}:</Scrubber>
      <InputGroupContent>
        <NumericInput {...rest} />
        {info && <InputGroupInfo data-for={tooltipId} data-tip={info} />}
      </InputGroupContent>
    </InputGroupContainer>
  );
}

NumericInputGroup.defaultProps = {
  tooltipId: "node-editor"
};

NumericInputGroup.propTypes = {
  name: PropTypes.string.isRequired,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  tooltipId: PropTypes.string,
  info: PropTypes.string
};
