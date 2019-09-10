import React from "react";
import PropTypes from "prop-types";
import styled from "styled-components";

const StyledToolButton = styled.button`
  width: 40px;
  height: 40px;
  border: none;
  color: ${props => props.theme.white};
  cursor: pointer;

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
    <div id={id} data-tip={tooltip} data-for="toolbar" data-delay-show="500" data-place="bottom">
      <StyledToolButton selected={selected} onClick={onClick}>
        <Icon as={icon} />
      </StyledToolButton>
    </div>
  );
}

ToolButton.propTypes = {
  id: PropTypes.string,
  icon: PropTypes.object,
  onClick: PropTypes.func,
  selected: PropTypes.bool,
  tooltip: PropTypes.string
};
