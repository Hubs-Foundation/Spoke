import React from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import { InfoTooltip } from "../layout/Tooltip";
import { UndoAlt } from "styled-icons/fa-solid/UndoAlt";

const ResetButtonContainer = styled.div`
  margin-left: auto;
`;

const StyledResetButton = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 24px;
  height: 24px;
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
  margin-left: 8px;
  margin-right: 8px;
  padding: 4px;

  :hover {
    background-color: ${props => props.theme.blueHover};
  }

  :active {
    background-color: ${props => props.theme.blue};
  }

  ${props =>
    props.disabled &&
    `
    pointer-events: none;
    opacity: 0.3;
  `}
`;

export default function ResetButton({ tooltip, disabled, children, ...rest }) {
  return (
    <ResetButtonContainer>
      <InfoTooltip info={tooltip}>
        <StyledResetButton disabled={disabled} {...rest}>
          <UndoAlt size={16} />
        </StyledResetButton>
      </InfoTooltip>
    </ResetButtonContainer>
  );
}

ResetButton.propTypes = {
  tooltip: PropTypes.string,
  children: PropTypes.node,
  disabled: PropTypes.bool
};
