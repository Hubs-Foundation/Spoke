import React from "react";
import PropTypes from "prop-types";
import OnboardingOverlay from "./OnboardingOverlay";
import { Button, SecondaryButton } from "../inputs/Button";
import defaultBackgroundImage from "../../assets/onboarding/default.png";
import styled from "styled-components";

const StyledOnboadingDialog = styled.div`
  width: 800px;
  height: 480px;
  background-color: #282c31;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
`;

const Content = styled.div`
  display: flex;
  flex-direction: row;
  flex: 1;
  border-top-left-radius: inherit;
  border-top-right-radius: inherit;
`;

const LeftContent = styled.div`
  display: flex;
  width: 360px;
  background-color: #006eff;
  background-size: cover;
  border-top-left-radius: inherit;
  align-items: center;
  padding: 30px;
  background-image: url(${props => props.backgroundImage});

  video {
    border-radius: 6px;
  }
`;

const RightContent = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 90px 60px 30px 60px;

  h1 {
    font-size: 3em;
    font-weight: lighter;
    margin-bottom: 16px;
  }

  h2 {
    color: ${props => props.theme.text2};
    margin-bottom: 8px;
  }

  p {
    margin-bottom: 12px;
    line-height: 1.5em;
  }

  img {
    align-self: center;
    margin-bottom: 8px;
  }
`;

const BottomNav = styled.div`
  display: flex;
  height: 64px;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  background-color: black;
  border-bottom-left-radius: inherit;
  border-bottom-right-radius: inherit;
  padding: 8px;

  a {
    color: ${props => props.theme.text2};
  }

  button {
    width: 84px;
  }

  & > * {
    margin: 0 8px;
  }
`;

export default function OnboardingDialog({
  children,
  backgroundImage,
  videoSrc,
  steps,
  curStepIdx,
  prevStep,
  disablePrev,
  nextStep,
  disableNext,
  disableSkip,
  skip
}) {
  return (
    <OnboardingOverlay>
      <StyledOnboadingDialog>
        <Content>
          <LeftContent backgroundImage={backgroundImage || defaultBackgroundImage}>
            {videoSrc && <video src={videoSrc} loop autoPlay muted />}
          </LeftContent>
          <RightContent>{children}</RightContent>
        </Content>
        <BottomNav>
          {!disableSkip && (
            <a
              href=""
              onClick={e => {
                e.preventDefault();
                e.target.blur();
                skip();
              }}
            >
              Skip Tutorial
            </a>
          )}
          {!disablePrev && curStepIdx > 0 && <SecondaryButton onClick={prevStep}>Back</SecondaryButton>}
          {!disableNext && curStepIdx < steps.length - 1 && <Button onClick={nextStep}>Next</Button>}
          {!disableNext && curStepIdx === steps.length - 1 && <Button onClick={nextStep}>Finish</Button>}
        </BottomNav>
      </StyledOnboadingDialog>
    </OnboardingOverlay>
  );
}

OnboardingDialog.propTypes = {
  children: PropTypes.node,
  backgroundImage: PropTypes.string,
  videoSrc: PropTypes.string,
  steps: PropTypes.array.isRequired,
  curStepIdx: PropTypes.number.isRequired,
  nextStep: PropTypes.func.isRequired,
  disableNext: PropTypes.bool,
  prevStep: PropTypes.func.isRequired,
  disablePrev: PropTypes.bool,
  disableSkip: PropTypes.bool,
  skip: PropTypes.func.isRequired
};
