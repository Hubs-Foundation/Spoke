import React from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import { QuestionCircle } from "styled-icons/fa-regular/QuestionCircle";
import { InfoTooltip } from "../layout/Tooltip";
import ResetButton from "./ResetButton";
import { PropertyLabel } from "./PropertyLabel";

export const InputGroupContainer = styled.div`
  display: flex;
  flex-direction: row;
  padding: 4px 8px;
  flex: 1;
  min-height: 24px;

  ${props =>
    props.disabled &&
    `
    pointer-events: none;
    opacity: 0.3;
  `}

  & > label {
    display: block;
    width: 25%;
    color: ${props => props.theme.text2};
    padding-bottom: 2px;
    padding-top: 4px;
  }
`;

export const InputGroupContent = styled.div`
  display: flex;
  flex-direction: row;
  flex: 1;
  padding-left: 8px;
  align-items: center;
`;

export const InputGroupInfoIcon = styled(QuestionCircle)`
  width: 20px;
  display: flex;
  padding-left: 8px;
  color: ${props => props.theme.blue};
  cursor: pointer;
  align-self: center;
`;

export function InputGroupInfo({ info }) {
  return (
    <InfoTooltip info={info}>
      <InputGroupInfoIcon />
    </InfoTooltip>
  );
}

InputGroupInfo.propTypes = {
  info: PropTypes.string
};

export default function InputGroup({ name, children, disabled, info, reset, onReset }) {
  return (
    <InputGroupContainer disabled={disabled}>
      <PropertyLabel modified={!reset}>{name}:</PropertyLabel>
      <InputGroupContent>
        {children}
        {info && <InputGroupInfo info={info} />}
        {onReset && <ResetButton disabled={!reset} onClick={onReset} />}
      </InputGroupContent>
    </InputGroupContainer>
  );
}

InputGroup.propTypes = {
  name: PropTypes.string,
  children: PropTypes.any,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  info: PropTypes.string,
  onReset: PropTypes.func,
  reset: PropTypes.bool
};
