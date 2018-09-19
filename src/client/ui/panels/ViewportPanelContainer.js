import React, { Component } from "react";
import PropTypes from "prop-types";
import Viewport from "../Viewport";
import { withEditor } from "../contexts/EditorContext";
import { withDialog } from "../contexts/DialogContext";
import { withSceneActions } from "../contexts/SceneActionsContext";
import { performModelImport } from "../../utils/import.js";
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
    } else if (item.dataTransfer && item.dataTransfer.items.length) {
      const urlItem = Array.from(item.dataTransfer.items).find(
        item => item.kind === "string" && item.type === "text/plain"
      );
      if (!urlItem) return;
      const url = (await new Promise(resolve => urlItem.getAsString(resolve))).trim();
      performModelImport(url, this.props.editor, this.props.showDialog, this.props.hideDialog);
    }
  };

  render() {
    return (
      <div className={styles.viewportPanelContainer}>
        <AssetDropTarget onDropAsset={this.onDropAsset}>
          <Viewport ref={this.canvasRef} onDropAsset={this.onDropAsset} />
        </AssetDropTarget>
        <AddNodeActionButtons />
      </div>
    );
  }
}

export default withEditor(withDialog(withSceneActions(ViewportPanelContainer)));
