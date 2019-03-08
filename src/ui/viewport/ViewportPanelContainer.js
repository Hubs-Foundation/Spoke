import React, { Component } from "react";
import PropTypes from "prop-types";
import Viewport from "./Viewport";
import { withEditor } from "../contexts/EditorContext";
import styles from "./ViewportPanelContainer.scss";
import AddNodeActionButtons from "./AddNodeActionButtons";
import RendererStats from "./RendererStats";

class ViewportPanelContainer extends Component {
  static propTypes = {
    editor: PropTypes.object,
    showDialog: PropTypes.func,
    hideDialog: PropTypes.func
  };

  constructor(props) {
    super(props);

    this.canvasRef = React.createRef();
  }

  componentDidMount() {
    this.props.editor.initializeViewport(this.canvasRef.current);
  }

  componentWillUnmount() {
    this.props.editor.viewport.dispose();
  }

  render() {
    return (
      <div className={styles.viewportPanelContainer}>
        <Viewport ref={this.canvasRef} />
        <AddNodeActionButtons />
        <RendererStats />
      </div>
    );
  }
}

export default withEditor(ViewportPanelContainer);
