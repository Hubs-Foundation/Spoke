import React from "react";
import PropTypes from "prop-types";
import { InputGroupHeader, InputGroupContainer, InputGroupContent, InputGroupInfo, OptionalGroup } from "./InputGroup";
import Scrubber from "./Scrubber";
import NumericInput from "./NumericInput";
import BooleanInput from "./BooleanInput";

export default function NumericInputGroup({
  name,
  className,
  info,
  optional,
  enabled,
  onEnable,
  children,
  resetButton,
  ...rest
}) {
  const { displayPrecision, ...scrubberProps } = rest;
  return (
    <InputGroupContainer>
      <InputGroupHeader>
        {optional && <BooleanInput value={enabled} onChange={onEnable} />}
        <OptionalGroup disabled={optional && !enabled}>
          <Scrubber {...scrubberProps}>{name}:</Scrubber>
        </OptionalGroup>
      </InputGroupHeader>
      <InputGroupContent disabled={optional && !enabled}>
        <NumericInput {...rest} />
        {children}
        {info && <InputGroupInfo info={info} />}
        {resetButton}
      </InputGroupContent>
    </InputGroupContainer>
  );
}

NumericInputGroup.propTypes = {
  name: PropTypes.string.isRequired,
  className: PropTypes.string,
  children: PropTypes.any,
  info: PropTypes.string,
  optional: PropTypes.bool,
  enabled: PropTypes.bool,
  onEnable: PropTypes.func,
  resetButton: PropTypes.any
};
