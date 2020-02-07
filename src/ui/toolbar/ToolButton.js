import React from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import { InfoTooltip } from "../layout/Tooltip";

const StyledToolButton = styled.button`
  width: 40px;
  height: 40px;
  border: none;
  color: ${props => props.theme.white};
  cursor: pointer;
  position: relative;

  background-color: ${props => (props.selected ? props.theme.blue : props.theme.toolbar)};

  &:hover {
    background-color: ${props => (props.selected ? props.theme.blueHover : props.theme.panel2)};
  }
`;

const Icon = styled.div`
  width: 14px;
  height: 14px;
  font-size: 14px;
`;

export default function ToolButton({ id, icon, onClick, selected, tooltip }) {
  return (
    <InfoTooltip id={id} info={tooltip} position="bottom">
      <StyledToolButton selected={selected} onClick={onClick}>
        <Icon as={icon} />
      </StyledToolButton>
    </InfoTooltip>
  );
}

ToolButton.propTypes = {
  id: PropTypes.string,
  icon: PropTypes.object,
  onClick: PropTypes.func,
  selected: PropTypes.bool,
  tooltip: PropTypes.string
};
