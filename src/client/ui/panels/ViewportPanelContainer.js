import React, { Component } from "react";
import PropTypes from "prop-types";
import { HotKeys } from "react-hotkeys";

import THREE from "../../vendor/three";
import Viewport from "../Viewport";
import { withEditor } from "../contexts/EditorContext";
import { withDialog } from "../contexts/DialogContext";
import ErrorDialog from "../dialogs/ErrorDialog";
import styles from "./ViewportPanelContainer.scss";
import FileDropTarget from "../FileDropTarget";

class ViewportPanelContainer extends Component {
  static propTypes = {
    editor: PropTypes.object,
    showDialog: PropTypes.func
  };

  constructor(props) {
    super(props);

    this.state = {
      viewportHotKeyHandlers: {
        translateTool: this.onTranslateTool,
        rotateTool: this.onRotateTool,
        scaleTool: this.onScaleTool,
        delete: this.onDelete,
        duplicate: this.onDuplicate
      }
    };

    this.canvasRef = React.createRef();
  }

  componentDidMount() {
    this.props.editor.createViewport(this.canvasRef.current);
  }

  onDropFile = file => {
    if (file.ext === ".gltf" || file.ext === ".scene") {
      if (file.uri === this.props.editor.sceneInfo.uri) {
        this.props.showDialog(ErrorDialog, {
          title: "Error adding prefab.",
          message: "Scene cannot be added to itself."
        });
        return;
      }

      const object = new THREE.Object3D();
      object.name = file.name;
      this.props.editor.addObject(object);
      this.props.editor.addComponent(object, "scene-reference", { src: file.uri });
      this.props.editor.select(object);
    }
  };

  onTranslateTool = () => {
    this.props.editor.signals.transformModeChanged.dispatch("translate");
  };

  onRotateTool = () => {
    this.props.editor.signals.transformModeChanged.dispatch("rotate");
  };

  onScaleTool = () => {
    this.props.editor.signals.transformModeChanged.dispatch("scale");
  };

  onDuplicate = e => {
    e.preventDefault();
    this.props.editor.duplicateSelectedObject();
    return false;
  };

  onDelete = e => {
    e.preventDefault();
    this.props.editor.deleteSelectedObject();
  };

  render() {
    return (
      <HotKeys handlers={this.state.viewportHotKeyHandlers} className={styles.viewportPanelContainer}>
        <FileDropTarget onDropFile={this.onDropFile}>
          <Viewport ref={this.canvasRef} onDropFile={this.onDropFile} />
        </FileDropTarget>
      </HotKeys>
    );
  }
}

export default withEditor(withDialog(ViewportPanelContainer));
