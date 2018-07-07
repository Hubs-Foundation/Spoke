import React, { Component } from "react";
import PropTypes from "prop-types";
import { HotKeys } from "react-hotkeys";

import Viewport from "../components/Viewport";
import { withEditor } from "./EditorContext";
import styles from "./ViewportPanelContainer.scss";
import FileDropTarget from "../components/FileDropTarget";

class ViewportPanelContainer extends Component {
  static propTypes = {
    editor: PropTypes.object
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
    this.props.editor.createRenderer(this.canvasRef.current);
  }

  onDropFile = file => {
    if (file.ext === ".gltf" || file.ext === ".scene") {
      const object = new THREE.Object3D();
      object.name = file.name;
      this.props.editor.addObject(object);
      this.props.editor.addComponent(object, "scene-reference", {
        src: file.uri
      });
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

  onDuplicate = () => {
    this.props.editor.duplicateSelectedObject();
    return false;
  };

  onDelete = () => {
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

export default withEditor(ViewportPanelContainer);
