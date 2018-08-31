import React, { Component } from "react";
import PropTypes from "prop-types";
import Viewport from "../Viewport";
import { withEditor } from "../contexts/EditorContext";
import { withDialog } from "../contexts/DialogContext";
import { withSceneActions } from "../contexts/SceneActionsContext";
import ErrorDialog from "../dialogs/ErrorDialog";
import styles from "./ViewportPanelContainer.scss";
import FileDropTarget from "../FileDropTarget";

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

  onDropFile = async item => {
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
    }
  };

  render() {
    return (
      <div className={styles.viewportPanelContainer}>
        <FileDropTarget onDropFile={this.onDropFile}>
          <Viewport ref={this.canvasRef} onDropFile={this.onDropFile} />
        </FileDropTarget>
      </div>
    );
  }
}

export default withEditor(withDialog(withSceneActions(ViewportPanelContainer)));
