import React from "react";
import PropTypes from "prop-types";
import styles from "./OnboardingOverlay.scss";

export default function OnboardingOverlay({ children }) {
  return (
    <div className={styles.onboardingOverlay}>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
OnboardingOverlay.propTypes = {
  children: PropTypes.node
};
