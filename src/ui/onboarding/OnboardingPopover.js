import React, { Component } from "react";
import PropTypes from "prop-types";
import Button from "../inputs/Button";
import SecondaryButton from "../inputs/SecondaryButton";
import styles from "./OnboardingPopover.scss";

export default class OnboardingPopover extends Component {
  static propTypes = {
    children: PropTypes.node,
    steps: PropTypes.array.isRequired,
    curStepIdx: PropTypes.number.isRequired,
    nextStep: PropTypes.func.isRequired,
    prevStep: PropTypes.func.isRequired,
    skip: PropTypes.func.isRequired
  };

  render() {
    const { children, steps, curStepIdx, prevStep, nextStep, skip } = this.props;

    return (
      <div className={styles.container}>
        <div className={styles.popover}>
          <div className={styles.content}>{children}</div>
          <div className={styles.bottomNav}>
            <a
              href="#"
              onClick={e => {
                e.preventDefault();
                skip();
              }}
            >
              Skip Tutorial
            </a>
            {curStepIdx > 0 && <SecondaryButton onClick={prevStep}>Back</SecondaryButton>}
            {curStepIdx < steps.length - 1 && <Button onClick={nextStep}>Next</Button>}
            {curStepIdx === steps.length - 1 && <Button onClick={nextStep}>Finish</Button>}
          </div>
        </div>
      </div>
    );
  }
}
