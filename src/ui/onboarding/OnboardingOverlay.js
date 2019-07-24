import React from "react";
import PropTypes from "prop-types";
import styled from "styled-components";

const StyledOnboardingOverlay = styled.div`
  display: flex;
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
  pointer-events: all;
`;

const Content = styled.div`
  display: flex;
`;

export default function OnboardingOverlay({ children }) {
  return (
    <StyledOnboardingOverlay>
      <Content>{children}</Content>
    </StyledOnboardingOverlay>
  );
}
OnboardingOverlay.propTypes = {
  children: PropTypes.node
};
