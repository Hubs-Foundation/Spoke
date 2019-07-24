import React from "react";
import PropTypes from "prop-types";
import { insertSeparator } from "../utils";
import styled from "styled-components";

const StyledHotkeyDescription = styled.div`
  display: flex;
  align-items: center;
  margin: 4px 4px;
`;

const HotkeySeparator = styled.div`
  margin: 0 4px;
`;

export default function HotkeyDescription({ children, action }) {
  return (
    <StyledHotkeyDescription>
      {insertSeparator(children, index => (
        <HotkeySeparator key={index}>+</HotkeySeparator>
      ))}
      <HotkeySeparator>=</HotkeySeparator>
      <div>{action}</div>
    </StyledHotkeyDescription>
  );
}

HotkeyDescription.propTypes = {
  action: PropTypes.string.isRequired,
  children: PropTypes.node
};
