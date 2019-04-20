import React from "react";
import PropTypes from "prop-types";
import styles from "./OnboardingDialog.scss";
import OnboardingOverlay from "./OnboardingOverlay";
import Button from "../inputs/Button";
import SecondaryButton from "../inputs/SecondaryButton";
import defaultBackgroundImage from "../../assets/onboarding/default.png";

export default function OnboardingDialog({ children, backgroundImage, steps, curStepIdx, prevStep, nextStep, skip }) {
  return (
    <OnboardingOverlay>
      <div className={styles.onboardingDialog}>
        <div className={styles.content}>
          <div
            className={styles.leftContent}
            style={{ backgroundImage: `url(${backgroundImage || defaultBackgroundImage}` }}
          />
          <div className={styles.rightContent}>{children}</div>
        </div>
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
    </OnboardingOverlay>
  );
}

OnboardingDialog.propTypes = {
  children: PropTypes.node,
  backgroundImage: PropTypes.string,
  steps: PropTypes.array.isRequired,
  curStepIdx: PropTypes.number.isRequired,
  nextStep: PropTypes.func.isRequired,
  prevStep: PropTypes.func.isRequired,
  skip: PropTypes.func.isRequired
};
