import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";

import { withEditor } from "../contexts/EditorContext";
import { withDialog } from "../contexts/DialogContext";
import { withSceneActions } from "../contexts/SceneActionsContext";
import ButtonSelectDialog from "../dialogs/ButtonSelectDialog";
import AddModelDialog from "../dialogs/AddModelDialog";
import AddMediaDialog from "../dialogs/AddMediaDialog";
import ProgressDialog from "../dialogs/ProgressDialog";
import ErrorDialog from "../dialogs/ErrorDialog";
import FileDialog from "../dialogs/FileDialog";
import styles from "./AddNodeActionButtons.scss";

import GroupNode from "../../editor/nodes/GroupNode";
import GroupNodeEditor from "../properties/GroupNodeEditor";
import ModelNode from "../../editor/nodes/ModelNode";
import ModelNodeEditor from "../properties/ModelNodeEditor";
import BoxColliderNodeEditor from "../properties/BoxColliderNodeEditor";
import BoxColliderNode from "../../editor/nodes/BoxColliderNode";
import GroundPlaneNodeEditor from "../properties/GroundPlaneNodeEditor";
import GroundPlaneNode from "../../editor/nodes/GroundPlaneNode";
import SpawnPointNodeEditor from "../properties/SpawnPointNodeEditor";
import SpawnPointNode from "../../editor/nodes/SpawnPointNode";
import AmbientLightNode from "../../editor/nodes/AmbientLightNode";
import AmbientLightNodeEditor from "../properties/AmbientLightNodeEditor";
import DirectionalLightNode from "../../editor/nodes/DirectionalLightNode";
import DirectionalLightNodeEditor from "../properties/DirectionalLightNodeEditor";
import HemisphereLightNode from "../../editor/nodes/HemisphereLightNode";
import HemisphereLightNodeEditor from "../properties/HemisphereLightNodeEditor";
import SpotLightNode from "../../editor/nodes/SpotLightNode";
import SpotLightNodeEditor from "../properties/SpotLightNodeEditor";
import PointLightNode from "../../editor/nodes/PointLightNode";
import PointLightNodeEditor from "../properties/PointLightNodeEditor";
import SkyboxNode from "../../editor/nodes/SkyboxNode";
import SkyboxNodeEditor from "../properties/SkyboxNodeEditor";
import MediaNode from "../../editor/nodes/MediaNode";
import MediaNodeEditor from "../properties/MediaNodeEditor";

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
    hideDialog: PropTypes.func,
    onAddModelByURL: PropTypes.func
  };

  toggle = () => {
    this.setState({ open: !this.state.open });
  };

  addNode = NodeConstructor => {
    const node = new NodeConstructor();
    this.props.editor.addObject(node);
    this.setState({ open: false });
  };

  addModel = () => {
    this.props.showDialog(AddModelDialog, {
      title: "Add Model",
      message: "Enter the URL to a Sketchfab model, a Poly model, or a GLTF/GLB file.",
      onURLEntered: async url => {
        return this.props.onAddModelByURL(url);
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

  addMedia = () => {
    this.props.showDialog(AddMediaDialog, {
      title: "Add Media",
      message: "Enter the URL to an image or video.",
      onURLEntered: async url => {
        this.props.showDialog(ProgressDialog, {
          title: "Loading Media",
          message: `Loading media...`
        });

        try {
          const node = new MediaNode();
          await node.setMedia(url);
          this.props.editor.addObject(node);

          this.props.hideDialog();
        } catch (e) {
          console.error(e);
          this.props.showDialog(ErrorDialog, {
            title: "Error Loading Media",
            message: e.message || "There was an unknown error."
          });
        }
      },
      onCancel: this.props.hideDialog
    });

    this.setState({ open: false });
  };

  addLight = () => {
    const hasAmbientLight = !!this.props.editor.scene.findNodeByType(AmbientLightNode);
    const hasHemisphereLight = !!this.props.editor.scene.findNodeByType(HemisphereLightNode);

    const options = [
      {
        value: DirectionalLightNode,
        iconClassName: DirectionalLightNodeEditor.iconClassName,
        label: DirectionalLightNode.nodeName
      },

      {
        value: PointLightNode,
        iconClassName: PointLightNodeEditor.iconClassName,
        label: PointLightNode.nodeName
      },
      {
        value: SpotLightNode,
        iconClassName: SpotLightNodeEditor.iconClassName,
        label: SpotLightNode.nodeName
      }
    ];

    if (!hasHemisphereLight) {
      options.unshift({
        value: HemisphereLightNode,
        iconClassName: HemisphereLightNodeEditor.iconClassName,
        label: HemisphereLightNode.nodeName
      });
    }

    if (!hasAmbientLight) {
      options.unshift({
        value: AmbientLightNode,
        iconClassName: AmbientLightNodeEditor.iconClassName,
        label: AmbientLightNode.nodeName
      });
    }

    this.props.showDialog(ButtonSelectDialog, {
      title: "Add Light",
      message: "Choose the type of light to add.",
      options,
      onSelect: value => {
        this.addNode(value);
        this.props.hideDialog();
      },
      onCancel: this.props.hideDialog
    });
    this.setState({ open: false });
  };

  constructor(props) {
    super(props);
    this.props.editor.signals.sceneGraphChanged.add(this.updateSingletonState);
    this.state = {
      open: true,
      ...this.getSingletonNodeState()
    };
  }

  getSingletonNodeState() {
    return {
      hasSkybox: !!this.props.editor.scene.findNodeByType(SkyboxNode),
      hasGroundPlane: !!this.props.editor.scene.findNodeByType(GroundPlaneNode)
    };
  }

  updateSingletonState = () => {
    this.setState(this.getSingletonNodeState());
  };

  render() {
    const fabClassNames = {
      [styles.fab]: true,
      [styles.fabOpen]: this.state.open,
      [styles.fabClosed]: !this.state.open
    };

    const { open, hasSkybox, hasGroundPlane } = this.state;

    return (
      <div className={styles.addNodeActionButtons}>
        {open && (
          <div className={styles.actionButtonContainer}>
            <AddButton
              label={ModelNode.nodeName}
              iconClassName={ModelNodeEditor.iconClassName}
              onClick={this.addModel}
            />
            <AddButton
              label={GroupNode.nodeName}
              iconClassName={GroupNodeEditor.iconClassName}
              onClick={() => this.addNode(GroupNode)}
            />
            <AddButton
              label={BoxColliderNode.nodeName}
              iconClassName={BoxColliderNodeEditor.iconClassName}
              onClick={() => this.addNode(BoxColliderNode)}
            />
            {!hasGroundPlane && (
              <AddButton
                label={GroundPlaneNode.nodeName}
                iconClassName={GroundPlaneNodeEditor.iconClassName}
                onClick={() => this.addNode(GroundPlaneNode)}
              />
            )}
            <AddButton
              label={SpawnPointNode.nodeName}
              iconClassName={SpawnPointNodeEditor.iconClassName}
              onClick={() => this.addNode(SpawnPointNode)}
            />
            <AddButton label="Light" iconClassName={PointLightNodeEditor.iconClassName} onClick={this.addLight} />
            <AddButton
              label={MediaNode.nodeName}
              iconClassName={MediaNodeEditor.iconClassName}
              onClick={this.addMedia}
            />
            {!hasSkybox && (
              <AddButton
                label={SkyboxNode.nodeName}
                iconClassName={SkyboxNodeEditor.iconClassName}
                onClick={() => this.addNode(SkyboxNode)}
              />
            )}
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
