import React, { Component } from "react";
import OnboardingContainer from "./OnboardingContainer";
import OnboardingDialog from "./OnboardingDialog";
import OnboardingPopover from "./OnboardingPopover";
import { withEditor } from "../contexts/EditorContext";
import libraryToolbarItemStyles from "../library/LibraryToolbarItem.scss";

/* eslint-disable react/prop-types */

class CreateModelPopover extends Component {
  componentDidMount() {
    const libraryButton = document.getElementById("models-library-btn");

    if (!libraryButton.classList.contains(libraryToolbarItemStyles.selected)) {
      libraryButton.click();
    }

    this.props.editor.signals.objectAdded.add(this.onObjectAdded);
  }

  onObjectAdded = () => {
    this.props.nextStep();
  };

  componentWillUnmount() {
    this.props.editor.signals.objectAdded.remove(this.onObjectAdded);
  }

  render() {
    return (
      <OnboardingPopover target="#library-container" {...this.props} disableNext>
        Add a model to your scene by clicking on it.
      </OnboardingPopover>
    );
  }
}

const WrappedCreateModelPopover = withEditor(CreateModelPopover);

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
    component: WrappedCreateModelPopover
  },
  {
    render(props) {
      return (
        <OnboardingPopover target="#properties-panel-container" {...props} position="left">
          {"You can change the model's position in the properties panel"}
        </OnboardingPopover>
      );
    }
  }
];

export default function Onboarding() {
  return <OnboardingContainer steps={steps} />;
}
