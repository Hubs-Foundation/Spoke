import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { withEditor } from "./contexts/EditorContext";
import { withDialog } from "./contexts/DialogContext";
import { withSceneActions } from "./contexts/SceneActionsContext";
import ButtonSelectDialog from "./dialogs/ButtonSelectDialog";
import AddModelDialog from "./dialogs/AddModelDialog";
import { getDisplayName } from "../utils/get-display-name";
import styles from "./AddNodeActionButtons.scss";
import SpotLightComponent from "../editor/components/SpotLightComponent";
import DirectionalLightComponent from "../editor/components/DirectionalLightComponent";
import AmbientLightComponent from "../editor/components/AmbientLightComponent";
import HemisphereLightComponent from "../editor/components/HemisphereLightComponent";
import PointLightComponent from "../editor/components/PointLightComponent";

class AddNodeActionButtons extends Component {
  static propTypes = {
    editor: PropTypes.object,
    sceneActions: PropTypes.object,
    showDialog: PropTypes.func,
    hideDialog: PropTypes.func
  };

  state = {
    open: false
  };

  toggle = () => {
    this.setState({ open: !this.state.open });
  };

  addNodeWithComponent = name => {
    const editor = this.props.editor;
    editor.addUnicomponentNode(name, name);
    this.setState({ open: false });
  };

  addOrSelectSkybox = () => {
    const editor = this.props.editor;
    const existingSkybox = editor.findFirstWithComponent("skybox");

    if (existingSkybox) {
      editor.select(existingSkybox);
    } else {
      editor.addUnicomponentNode("Skybox", "skybox");
    }

    this.setState({ open: false });
  };

  addModel = () => {
    this.props.showDialog(AddModelDialog, {
      title: "Add Model",
      message: "Enter the URL to a Sketchfab model, a Poly model, or a GLTF/GLB file.",
      onURLEntered: () => {},
      onFilePickerChosen: () => {},
      onCancel: this.props.hideDialog
    });

    this.setState({ open: false });
  };

  addLight = () => {
    this.props.showDialog(ButtonSelectDialog, {
      title: "Add Light",
      message: "Choose the type of light to add.",
      options: [
        PointLightComponent,
        SpotLightComponent,
        DirectionalLightComponent,
        AmbientLightComponent,
        HemisphereLightComponent
      ].map(c => ({ value: c.componentName, iconClassName: c.iconClassName, label: getDisplayName(c.componentName) })),
      onSelect: v => {
        this.addNodeWithComponent(v);
        this.props.hideDialog();
      },
      onCancel: this.props.hideDialog
    });
    this.setState({ open: false });
  };

  constructor(props) {
    super(props);
  }

  componentDidMount() {}

  render() {
    const fabClassNames = {
      [styles.fab]: true,
      [styles.fabOpen]: this.state.open
    };

    return (
      <div className={styles.addNodeActionButtons}>
        {this.state.open && (
          <div className={styles.actionButtonContainer}>
            <button onClick={this.addOrSelectSkybox}>skybox</button>
            <button onClick={() => this.addNodeWithComponent("box-collider")}>box-collider</button>
            <button onClick={() => this.addNodeWithComponent("spawn-point")}>spawn-point</button>
            <button onClick={this.addLight}>light</button>
            <button onClick={this.addModel}>model</button>
          </div>
        )}
        <button onClick={this.toggle} className={classNames(fabClassNames)}>
          {this.state.open ? "Open" : "Closed"}
        </button>
      </div>
    );
  }
}

export default withEditor(withDialog(withSceneActions(AddNodeActionButtons)));
