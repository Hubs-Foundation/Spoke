import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { withEditor } from "./contexts/EditorContext";
import { withDialog } from "./contexts/DialogContext";
import { withSceneActions } from "./contexts/SceneActionsContext";
import ButtonSelectDialog from "./dialogs/ButtonSelectDialog";
import AddModelDialog from "./dialogs/AddModelDialog";
import FileDialog from "./dialogs/FileDialog";
import { getDisplayName } from "../utils/get-display-name";
import { performModelImport } from "../utils/import.js";
import styles from "./AddNodeActionButtons.scss";
import SpotLightComponent from "../editor/components/SpotLightComponent";
import DirectionalLightComponent from "../editor/components/DirectionalLightComponent";
import AmbientLightComponent from "../editor/components/AmbientLightComponent";
import HemisphereLightComponent from "../editor/components/HemisphereLightComponent";
import PointLightComponent from "../editor/components/PointLightComponent";
import SkyboxComponent from "../editor/components/SkyboxComponent";
import SpawnPointComponent from "../editor/components/SpawnPointComponent";
import GroupComponent from "../editor/components/GroupComponent";
import BoxColliderComponent from "../editor/components/BoxColliderComponent";
import GLTFModelComponent from "../editor/components/GLTFModelComponent";

function AddButton({ label, iconClassName, onClick }) {
  return (
    <div className={styles.addButton}>
      <label>{label}</label>
      <button onClick={onClick}>
        <i className={classNames("fas", iconClassName)} />
      </button>
    </div>
  );
}

AddButton.propTypes = {
  label: PropTypes.string.isRequired,
  iconClassName: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired
};

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
    editor.addUnicomponentNode(getDisplayName(name), name);
    this.setState({ open: false });
  };

  addModel = () => {
    this.props.showDialog(AddModelDialog, {
      title: "Add Model",
      message: "Enter the URL to a Sketchfab model, a Poly model, or a GLTF/GLB file.",
      onURLEntered: async url => {
        performModelImport(url, this.props.editor, this.props.showDialog, this.props.hideDialog);
      },
      onFilePickerChosen: () => {
        this.props.hideDialog();
        this.props.showDialog(FileDialog, {
          filters: [".glb", ".gltf"],
          onCancel: this.props.hideDialog,
          onConfirm: (uri, name) => {
            this.props.editor.addGLTFModelNode(name, uri);
            this.props.hideDialog();
          }
        });
      },
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
      [styles.fabOpen]: this.state.open,
      [styles.fabClosed]: !this.state.open
    };

    const hasSkybox = !!this.props.editor.findFirstWithComponent("skybox");

    return (
      <div className={styles.addNodeActionButtons}>
        {this.state.open && (
          <div className={styles.actionButtonContainer}>
            {!hasSkybox && (
              <AddButton
                label="Skybox"
                iconClassName={SkyboxComponent.iconClassName}
                onClick={() => this.addNodeWithComponent("skybox")}
              />
            )}
            <AddButton
              label="Collider"
              iconClassName={BoxColliderComponent.iconClassName}
              onClick={() => this.addNodeWithComponent("box-collider")}
            />
            <AddButton
              label="Spawn Point"
              iconClassName={SpawnPointComponent.iconClassName}
              onClick={() => this.addNodeWithComponent("spawn-point")}
            />
            <AddButton label="Light" iconClassName={PointLightComponent.iconClassName} onClick={this.addLight} />
            <AddButton
              label="Group"
              iconClassName={GroupComponent.iconClassName}
              onClick={() => this.addNodeWithComponent("group")}
            />
            <AddButton label="Model" iconClassName={GLTFModelComponent.iconClassName} onClick={this.addModel} />
          </div>
        )}
        <button onClick={this.toggle} className={classNames(fabClassNames)}>
          <i className={classNames("fas", "fa-plus")} />
        </button>
      </div>
    );
  }
}

export default withEditor(withDialog(withSceneActions(AddNodeActionButtons)));
