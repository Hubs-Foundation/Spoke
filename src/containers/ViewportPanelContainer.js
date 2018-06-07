import React, { Component } from "react";
import PropTypes from "prop-types";
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

    this.canvasRef = React.createRef();
  }

  componentDidMount() {
    this.props.editor.createRenderer(this.canvasRef.current);
  }

  onDropFile = file => {
    if (file.ext === "gltf") {
      this.props.editor.loadGLTF(file.uri);
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

export default withEditor(ViewportPanelContainer);
