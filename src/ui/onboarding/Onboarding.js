import React from "react";
import OnboardingContainer from "./OnboardingContainer";
import OnboardingDialog from "./OnboardingDialog";
import OnboardingPopover from "./OnboardingPopover";

/* eslint-disable react/prop-types */
const steps = [
  {
    render(props) {
      return (
        <OnboardingDialog {...props}>
          <h2>Introduction</h2>
          <h1>Welcome to Spoke</h1>
          <p>
            Welcome to Spoke, a browser based 3D editor for creating environments for Mozilla Hubs. Spoke allows you to
            intuitively build, edit, and create virtual worlds using your assets and creativity.
          </p>
        </OnboardingDialog>
      );
    }
  },
  {
    onEnter() {
      document.getElementById("models-library-btn").click();
    },
    render(props) {
      return (
        <OnboardingPopover target="#library-container" {...props}>
          Add a model to your scene by clicking on it.
        </OnboardingPopover>
      );
    }
  },
  {
    render(props) {
      return <OnboardingDialog {...props}>Step 3</OnboardingDialog>;
    }
  }
];

export default function Onboarding() {
  return <OnboardingContainer steps={steps} />;
}
