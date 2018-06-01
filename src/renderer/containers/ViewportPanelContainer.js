import React, { Component } from "react";
import PropTypes from "prop-types";
import Viewport from "../components/Viewport";
import Panel from "../components/Panel";
import { withEditor } from "./EditorContext";

class ViewportPanelContainer extends Component {
  static propTypes = {
    path: PropTypes.array,
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
      <Panel title="Viewport" path={this.props.path} toolbarControls={[]}>
        <Viewport ref={this.canvasRef} />
      </Panel>
    );
  }
}

export default withEditor(ViewportPanelContainer);
