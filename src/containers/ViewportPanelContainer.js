import React, { Component } from "react";
import PropTypes from "prop-types";
import Viewport from "../components/Viewport";
import { withEditor } from "./EditorContext";
import styles from "./ViewportPanelContainer.scss";

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

  render() {
    return (
      <div className={styles.viewportPanelContainer}>
        <Viewport ref={this.canvasRef} />
      </div>
    );
  }
}

export default withEditor(ViewportPanelContainer);
