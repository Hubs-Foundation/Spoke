import React from "react";
import PropTypes from "prop-types";
import styles from "./OnboardingDialog.scss";
import OnboardingOverlay from "./OnboardingOverlay";
import Button from "../inputs/Button";
import defaultBackgroundImage from "../../assets/onboarding/default.png";

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
      <div className={styles.onboardingDialog}>
        <div className={styles.content}>
          <div
            className={styles.leftContent}
            style={{ backgroundImage: `url(${backgroundImage || defaultBackgroundImage}` }}
          >
            {videoSrc && <video src={videoSrc} loop autoPlay muted />}
          </div>
          <div className={styles.rightContent}>{children}</div>
        </div>
        <div className={styles.bottomNav}>
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
          {!disablePrev && curStepIdx > 0 && (
            <Button secondary onClick={prevStep}>
              Back
            </Button>
          )}
          {!disableNext && curStepIdx < steps.length - 1 && <Button onClick={nextStep}>Next</Button>}
          {!disableNext && curStepIdx === steps.length - 1 && <Button onClick={nextStep}>Finish</Button>}
        </div>
      </div>
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
