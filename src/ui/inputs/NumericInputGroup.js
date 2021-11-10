import React from "react";
import PropTypes from "prop-types";
import { InputGroupHeader, InputGroupContainer, InputGroupContent, InputGroupInfo, OptionalGroup } from "./InputGroup";
import Scrubber from "./Scrubber";
import NumericInput from "./NumericInput";
import ResetButton from "./ResetButton";
import BooleanInput from "./BooleanInput";
import { PropertyLabel } from "./PropertyLabel";

export default function NumericInputGroup({
  name,
  className,
  info,
  optional,
  children,
  enabled,
  onEnable,
  reset,
  onReset,
  ...rest
}) {
  const { displayPrecision, ...scrubberProps } = rest;
  return (
    <InputGroupContainer>
      <InputGroupHeader>
        {optional && <BooleanInput value={enabled} onChange={onEnable} />}
        <OptionalGroup disabled={optional && !enabled}>
          <Scrubber {...scrubberProps}>
            <PropertyLabel modified={!reset}>{name}:</PropertyLabel>
          </Scrubber>
        </OptionalGroup>
      </InputGroupHeader>
      <InputGroupContent disabled={optional && !enabled}>
        <NumericInput {...rest} />
        {children}
        {info && <InputGroupInfo info={info} modified={reset} />}
        {onReset && <ResetButton disabled={!reset} onClick={onReset} />}
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
  onReset: PropTypes.func,
  reset: PropTypes.bool
};
