import React, { Component } from "react";
import PropTypes from "prop-types";
import Viewport from "../Viewport";
import { withEditor } from "../contexts/EditorContext";
import { withDialog } from "../contexts/DialogContext";
import { withSceneActions } from "../contexts/SceneActionsContext";
import ProgressDialog from "../dialogs/ProgressDialog";
import ErrorDialog from "../dialogs/ErrorDialog";
import styles from "./ViewportPanelContainer.scss";
import AssetDropTarget from "../AssetDropTarget";
import AddNodeActionButtons from "../AddNodeActionButtons";

class ViewportPanelContainer extends Component {
  static propTypes = {
    editor: PropTypes.object,
    sceneActions: PropTypes.object,
    showDialog: PropTypes.func,
    hideDialog: PropTypes.func
  };

  constructor(props) {
    super(props);

    this.canvasRef = React.createRef();
  }

  componentDidMount() {
    this.props.editor.createViewport(this.canvasRef.current);
  }

  onDropAsset = async item => {
    if (item.file) {
      const file = item.file;

      if (file.ext === ".gltf" || file.ext === ".glb") {
        try {
          this.props.editor.addGLTFModelNode(file.name, file.uri);
        } catch (e) {
          this.props.showDialog(ErrorDialog, {
            title: "Error adding model.",
            message: e.message
          });
        }
      }
    } else if (item.dataTransfer) {
      let url;
      if (Array.from(item.dataTransfer.types).includes("text/plain")) {
        url = item.dataTransfer.getData("text/plain");
        if (!url) return;
      } else {
        const urlItem = Array.from(item.dataTransfer.items).find(item => item.kind === "string");
        if (!urlItem) return;
        url = (await new Promise(resolve => urlItem.getAsString(resolve))).trim();
      }
      try {
        new URL(url);
      } catch (e) {
        const truncatedUrl = url.substring(0, 50).replace(/\n/g, "");
        this.props.showDialog(ErrorDialog, {
          title: "Error adding model.",
          message: `"${truncatedUrl}${url.length > 50 ? "..." : ""}" is not a valid URL.`
        });
        return;
      }
      this.performModelImport(url);
    }
  };

  performModelImport = async url => {
    const editor = this.props.editor;
    const showDialog = this.props.showDialog;
    const hideDialog = this.props.hideDialog;

    showDialog(ProgressDialog, {
      title: "Importing Asset",
      message: "Importing asset..."
    });

    try {
      await editor.importGLTFIntoModelNode(url);
      hideDialog();
    } catch (e) {
      let message = e.message;

      if (url.indexOf("sketchfab.com") >= 0) {
        message =
          "Error adding model.\n\nNote: Sketchfab models must be marked as 'Downloadable' to be added to your scene.\n\nError: " +
          e.message;
      } else if (url.indexOf("poly.google.com") >= 0) {
        message =
          "Error adding model.\n\nNote: Poly panoramas are not supported and 3D models must be GLTF 2.0.\n\nError: " +
          e.message;
      }

      showDialog(ErrorDialog, {
        title: "Add Model",
        message: message
      });
    }
  };

  render() {
    return (
      <div className={styles.viewportPanelContainer}>
        <AssetDropTarget onDropAsset={this.onDropAsset}>
          <Viewport ref={this.canvasRef} onDropAsset={this.onDropAsset} />
        </AssetDropTarget>
        <AddNodeActionButtons onAddModelByURL={this.performModelImport} />
      </div>
    );
  }
}

export default withEditor(withDialog(withSceneActions(ViewportPanelContainer)));
