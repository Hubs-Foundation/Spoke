import React, { Component } from "react";
import PropTypes from "prop-types";
import configs from "../../configs";
import OnboardingContainer from "./OnboardingContainer";
import OnboardingDialog from "./OnboardingDialog";
import OnboardingPopover from "./OnboardingPopover";
import { withEditor } from "../contexts/EditorContext";
import Icon from "../inputs/Icon";
import lmbIcon from "../../assets/onboarding/lmb.svg";
import rmbIcon from "../../assets/onboarding/rmb.svg";
import wasdIcon from "../../assets/onboarding/wasd.svg";
import HotkeyDescription from "./HotkeyDescription";
import { withApi } from "../contexts/ApiContext";
import { Button } from "../inputs/Button";
import Well from "../layout/Well";
import { cmdOrCtrlString } from "../utils";
import { Link } from "react-router-dom";

/* eslint-disable react/prop-types */

class CreateModelPopover extends Component {
  componentDidMount() {
    // TODO: Check if object was added
    this.props.editor.setSource("sketchfab");
    this.props.editor.addListener("sceneGraphChanged", this.onObjectAdded);
  }

  onObjectAdded = () => {
    this.props.nextStep();
  };

  componentWillUnmount() {
    this.props.editor.removeListener("sceneGraphChanged", this.onObjectAdded);
  }

  render() {
    return (
      <OnboardingPopover target="#assets-panel" {...this.props} disableNext>
        Add a model to your scene by clicking on it.
      </OnboardingPopover>
    );
  }
}

const WrappedCreateModelPopover = withEditor(CreateModelPopover);

class SaveProjectDialog extends Component {
  componentDidMount() {
    this.props.api.addListener("project-saving", this.onProjectSaving);
  }

  onProjectSaving = () => {
    this.props.nextStep();
  };

  componentWillUnmount() {
    this.props.api.removeListener("project-saving", this.onProjectSaving);
  }

  render() {
    return (
      <OnboardingDialog {...this.props} disableNext>
        <h2>Saving and Publishing</h2>
        <h1>Saving Your Project</h1>
        <p>
          Before you navigate away from the page you&#39;ll want to save your work. You can do this by opening the menu
          and clicking Save Project or by pressing {cmdOrCtrlString} + S.
        </p>
        <Well>
          <HotkeyDescription action="Save Project">
            <div>{cmdOrCtrlString}</div>
            <div>S</div>
          </HotkeyDescription>
        </Well>
      </OnboardingDialog>
    );
  }
}

const WrappedSaveProjectDialog = withApi(SaveProjectDialog);

class SaveProjectPopover extends Component {
  componentDidMount() {
    this.props.api.addListener("project-saved", this.onProjectSaved);
  }

  onProjectSaved = () => {
    this.props.nextStep();
  };

  componentWillUnmount() {
    this.props.api.removeListener("project-saved", this.onProjectSaved);
  }

  render() {
    return (
      <OnboardingPopover target="#viewport-panel .toolbar" {...this.props} position="bottom" disablePrev disableNext>
        Press {cmdOrCtrlString} + S to save your project.
        <Well>
          <HotkeyDescription action="Save Project">
            <div>{cmdOrCtrlString}</div>
            <div>S</div>
          </HotkeyDescription>
        </Well>
      </OnboardingPopover>
    );
  }
}

const WrappedSaveProjectPopover = withApi(SaveProjectPopover);

class PublishScenePopover extends Component {
  componentDidMount() {
    this.props.api.addListener("project-published", this.onScenePublished);
  }

  onScenePublished = () => {
    this.props.nextStep();
  };

  componentWillUnmount() {
    this.props.api.removeListener("project-published", this.onScenePublishing);
  }

  render() {
    return (
      <OnboardingPopover target="#publish-button" {...this.props} position="bottom" disablePrev disableNext>
        Click to publish your scene.
      </OnboardingPopover>
    );
  }
}

const WrappedPublishScenePopover = withApi(PublishScenePopover);

const steps = [
  {
    render(props) {
      return (
        <OnboardingDialog {...props}>
          <h2>Introduction</h2>
          <h1>Welcome{configs.isMoz() ? " to Spoke" : ""}</h1>
          <p>In this tutorial we&#39;ll go over how to create and publish a scene.</p>
        </OnboardingDialog>
      );
    }
  },
  {
    render(props) {
      return (
        <OnboardingPopover target="#viewport-panel .toolbar" {...props} position="bottom">
          <p>You can orbit around the scene by holding the left mouse button and dragging.</p>
          <p>You can also fly around the scene by holding the right mouse button and using the WASD keys.</p>
          <Well>
            <HotkeyDescription action="Orbit">
              <Icon src={lmbIcon} />
            </HotkeyDescription>
            <HotkeyDescription action="Fly">
              <Icon src={rmbIcon} />
              <Icon src={wasdIcon} />
            </HotkeyDescription>
            <HotkeyDescription action="Boost">
              <Icon src={rmbIcon} />
              <Icon src={wasdIcon} />
              <div>Shift</div>
            </HotkeyDescription>
          </Well>
        </OnboardingPopover>
      );
    }
  },
  {
    component: WrappedCreateModelPopover
  },
  {
    render(props) {
      return (
        <OnboardingPopover target="#assets-panel" {...props} position="top" disablePrev>
          <p>While the model is loading you&#39;ll see the loading indicator.</p>
          <p>Press Q to rotate the object to the left and E to rotate the object to the right.</p>
          <p>Click to place the object and press ESC to stop placing objects.</p>
          <Well>
            <HotkeyDescription action="Rotate Left">
              <div>Q</div>
            </HotkeyDescription>
            <HotkeyDescription action="Rotate Right">
              <div>E</div>
            </HotkeyDescription>
            <HotkeyDescription action="Cancel Placement">
              <div>Esc</div>
            </HotkeyDescription>
          </Well>
        </OnboardingPopover>
      );
    }
  },
  {
    render(props) {
      return (
        <OnboardingPopover target="#assets-panel" {...props} position="top" disablePrev>
          <p>You can select objects by clicking on them.</p>
          <p>Hold shift to select multiple objects.</p>
          <p>Press ESC to deselect all objects.</p>
          <Well>
            <HotkeyDescription action="Select">
              <Icon src={lmbIcon} />
            </HotkeyDescription>
            <HotkeyDescription action="Add to Selection">
              <Icon src={lmbIcon} />
              <div>Shift</div>
            </HotkeyDescription>
            <HotkeyDescription action="Deselect All">
              <div>ESC</div>
            </HotkeyDescription>
          </Well>
        </OnboardingPopover>
      );
    }
  },
  {
    render(props) {
      return (
        <OnboardingPopover target="#hierarchy-panel" {...props} position="left">
          Objects you add to the scene show up in the hierarchy panel. Double click the object you added to focus it.
          You can also press the F key to focus the selected object.
          <Well>
            <HotkeyDescription action="Focus Selected Object">
              <div>F</div>
            </HotkeyDescription>
          </Well>
        </OnboardingPopover>
      );
    }
  },
  {
    render(props) {
      return (
        <OnboardingPopover target="#translate-button" {...props} position="bottom-left">
          <p>
            You can move objects around the scene using the translation gizmo by selecting an object and pressing T to
            enter translation mode.
          </p>
          <p>Drag the arrows of the gizmo to move the object along the X, Y, or Z axis.</p>
          <Well>
            <HotkeyDescription action="Translation Mode">
              <div>T</div>
            </HotkeyDescription>
          </Well>
        </OnboardingPopover>
      );
    }
  },
  {
    render(props) {
      return (
        <OnboardingPopover target="#rotate-button" {...props} position="bottom-left">
          <p>
            You can rotate objects using the rotation gizmo by selecting an object and pressing R to enter rotation
            mode.
          </p>
          <p>Drag the rings of the gizmo to rotate the object along the X, Y, or Z axis.</p>
          <Well>
            <HotkeyDescription action="Rotation Mode">
              <div>R</div>
            </HotkeyDescription>
          </Well>
        </OnboardingPopover>
      );
    }
  },
  {
    render(props) {
      return (
        <OnboardingPopover target="#scale-button" {...props} position="bottom-left">
          <p>You can scale objects using the scale gizmo by selecting an object and pressing Y to enter scale mode.</p>
          <p>Drag the center cube of the gizmo to scale the object up or down.</p>
          <Well>
            <HotkeyDescription action="Scale Mode">
              <div>Y</div>
            </HotkeyDescription>
          </Well>
        </OnboardingPopover>
      );
    }
  },
  {
    render(props) {
      return (
        <OnboardingPopover target="#translate-button" {...props} position="bottom-left">
          <p>
            You can also move objects around using the grab tool. While objects are selected press G to grab the
            selection. Move your mouse and click to place the onject in the scene.
          </p>
          <p>Press Esc or press G again to cancel the current grab operation.</p>
          <Well>
            <HotkeyDescription action="Grab Object">
              <div>G</div>
            </HotkeyDescription>
            <HotkeyDescription action="Cancel Grab">
              <div>Esc / G</div>
            </HotkeyDescription>
          </Well>
        </OnboardingPopover>
      );
    }
  },

  {
    render(props) {
      return (
        <OnboardingPopover target="#transform-pivot" {...props} position="bottom-left">
          <p>
            Sometimes placing an object can be tough if the model&apos;s pivot point is set incorrectly. You can change
            how the pivot is calculated in this dropdown menu. The pivot mode can be changed by pressing X.
          </p>
          <Well>
            <HotkeyDescription action="Change Pivot Mode">
              <div>X</div>
            </HotkeyDescription>
          </Well>
        </OnboardingPopover>
      );
    }
  },

  {
    render(props) {
      return (
        <OnboardingPopover target="#transform-snap" {...props} position="bottom-left">
          <p>
            Sometimes you may want to move an object with a precise position or rotation. To do this toggle the snapping
            mode by clicking on the magnet icon. You can set the translation and rotation snap settings by using the
            dropdown menus above.
          </p>
          <Well>
            <HotkeyDescription action="Toggle Snap Mode">
              <div>C</div>
            </HotkeyDescription>
          </Well>
        </OnboardingPopover>
      );
    }
  },

  {
    render(props) {
      return (
        <OnboardingPopover target="#transform-grid" {...props} position="bottom-left">
          <p>
            In placement mode, objects can be placed on top of other objects or the grid. When building vertically, it
            can be useful to change the grid height.
          </p>
          <Well>
            <HotkeyDescription action="Increase Grid Height">
              <div>=</div>
            </HotkeyDescription>
            <HotkeyDescription action="Decrease Grid Height">
              <div>-</div>
            </HotkeyDescription>
          </Well>
        </OnboardingPopover>
      );
    }
  },

  {
    render(props) {
      return (
        <OnboardingPopover target="#properties-panel" {...props} position="left">
          Additional object properties can be set in the properties panel. This includes things like shadows, light
          color, and more.
        </OnboardingPopover>
      );
    }
  },
  {
    component: WrappedSaveProjectDialog
  },
  {
    component: WrappedSaveProjectPopover
  },
  {
    render(props) {
      return (
        <OnboardingDialog {...props} disablePrev>
          <h2>Saving and Publishing</h2>
          <h1>Publishing Your Project</h1>
          <p>
            Once your project is ready, you can publish it{configs.isMoz() && " to Hubs"} and invite your friends with
            the click of a button.
          </p>
        </OnboardingDialog>
      );
    }
  },
  {
    component: WrappedPublishScenePopover
  },
  {
    render(props) {
      return (
        <OnboardingDialog {...props} disablePrev disableSkip>
          <h2>Saving and Publishing</h2>
          <h1>Great Job!</h1>
          <p>
            Great job! You&#39;ve touched all the basics {configs.isMoz() && "of Spoke "}and published a scene{" "}
            {configs.isMoz() && "to Hubs"}! To get started on your own scene check out your projects page. Or click
            finish to continue working on this scene.
          </p>
          <Button as={Link} onClick={() => props.onFinish("Navigate to Projects Page")} to="/projects">
            My Projects
          </Button>
        </OnboardingDialog>
      );
    }
  }
];

export default function Onboarding({ onFinish, onSkip }) {
  return <OnboardingContainer steps={steps} onFinish={() => onFinish("Continue")} onSkip={onSkip} />;
}

Onboarding.propTypes = {
  onFinish: PropTypes.func.isRequired,
  onSkip: PropTypes.func.isRequired
};
