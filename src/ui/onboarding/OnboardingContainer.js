import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "./OnboardingContainer.scss";

export default class OnboardingContainer extends Component {
  static propTypes = {
    steps: PropTypes.array.isRequired
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
    this.setStep(-1);
  };

  setStep = index => {
    const { steps, curStepIdx } = this.state;

    const step = steps[curStepIdx];

    if (step && step.onLeave) {
      step.onLeave();
    }

    const nextStep = steps[index];

    if (nextStep && nextStep.onEnter) {
      nextStep.onEnter();
    }

    this.setState({ curStepIdx: index });
  };

  render() {
    const { steps, curStepIdx } = this.state;
    const step = steps[curStepIdx];

    const stepProps = {
      steps,
      curStepIdx,
      nextStep: this.nextStep,
      prevStep: this.prevStep,
      setStep: this.setStep,
      skip: this.skip
    };

    return (
      <div className={styles.onboardingContainer}>
        {step && (step.render ? step.render(stepProps) : React.createElement(step.component, stepProps))}
      </div>
    );
  }
}
