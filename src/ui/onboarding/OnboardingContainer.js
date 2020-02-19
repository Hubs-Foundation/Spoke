import React, { Component } from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import { trackEvent } from "../../telemetry";

const StyledOnboardingContainer = styled.div`
  position: absolute;
  display: flex;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1000;
`;

export default class OnboardingContainer extends Component {
  static propTypes = {
    steps: PropTypes.array.isRequired,
    onFinish: PropTypes.func.isRequired,
    onSkip: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      curStepIdx: props.steps.length > 0 ? 0 : -1,
      steps: props.steps
    };
  }

  nextStep = () => {
    const { steps, curStepIdx } = this.state;

    if (curStepIdx >= steps.length - 1) {
      this.setStep(-1);
    } else {
      this.setStep(curStepIdx + 1);
    }
  };

  prevStep = () => {
    const { curStepIdx } = this.state;

    if (curStepIdx > 0) {
      this.setStep(curStepIdx - 1);
    }
  };

  skip = () => {
    trackEvent("Tutorial Skipped", this.state.curStepIdx);
    this.setStep(-1, true);
  };

  setStep = (index, skip) => {
    const { steps, curStepIdx } = this.state;

    const stepProps = {
      steps,
      curStepIdx,
      nextStep: this.nextStep,
      prevStep: this.prevStep,
      setStep: this.setStep,
      skip: this.skip
    };

    const step = steps[curStepIdx];

    if (step && step.onLeave) {
      step.onLeave(stepProps);
    }

    const nextStep = steps[index];

    if (nextStep && nextStep.onEnter) {
      nextStep.onEnter(stepProps);
    }

    if (index > steps.length) {
      index = -1;
    }

    this.setState({ curStepIdx: index });

    if (index === -1) {
      if (skip) {
        this.props.onSkip(curStepIdx);
      } else {
        this.props.onFinish();
      }
    }
  };

  render() {
    const { steps, curStepIdx } = this.state;
    const step = steps[curStepIdx];

    const stepProps = {
      ...this.props,
      steps,
      curStepIdx,
      nextStep: this.nextStep,
      prevStep: this.prevStep,
      setStep: this.setStep,
      skip: this.skip
    };

    return (
      <StyledOnboardingContainer>
        {step && (step.render ? step.render(stepProps) : React.createElement(step.component, stepProps))}
      </StyledOnboardingContainer>
    );
  }
}
