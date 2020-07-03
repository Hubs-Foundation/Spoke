import React, { useCallback } from "react";
import PropTypes from "prop-types";
import Portal from "./Portal";
import Positioner from "./Positioner";
import useHover from "../hooks/useHover";
import styled from "styled-components";

const StyledTooltip = styled.div`
  display: inherit;
`;

export default function Tooltip({ children, padding, position, renderContent, disabled, ...rest }) {
  const [hoverRef, isHovered] = useHover();

  const getTargetRef = useCallback(() => {
    return hoverRef;
  }, [hoverRef]);

  return (
    <StyledTooltip ref={hoverRef} {...rest}>
      {children}
      {isHovered && (
        <Portal>
          <Positioner getTargetRef={getTargetRef} padding={padding} position={position}>
            {renderContent()}
          </Positioner>
        </Portal>
      )}
    </StyledTooltip>
  );
}

Tooltip.propTypes = {
  disabled: PropTypes.bool,
  children: PropTypes.node,
  padding: PropTypes.number,
  position: PropTypes.string,
  renderContent: PropTypes.func.isRequired
};

export const TooltipContainer = styled.div`
  display: inline-block;
  pointer-events: none;
  background-color: rgba(21, 23, 27, 0.9);
  border-radius: 3px;
  font-size: 13px;
  padding: 8px;
  max-width: 200px;
  overflow: hidden;
  overflow-wrap: break-word;
  user-select: none;
  text-align: center;
  white-space: pre-wrap;
}
`;

export function InfoTooltip({ info, children, ...rest }) {
  if (!info) {
    return <div {...rest}>{children}</div>;
  }

  return (
    <Tooltip {...rest} renderContent={() => <TooltipContainer>{info}</TooltipContainer>}>
      {children}
    </Tooltip>
  );
}

InfoTooltip.propTypes = {
  children: PropTypes.node,
  info: PropTypes.string
};
