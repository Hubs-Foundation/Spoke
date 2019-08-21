import React, { Component } from "react";
import PropTypes from "prop-types";
import Viewport from "./Viewport";
import { withEditor } from "../contexts/EditorContext";
import styles from "./ViewportPanelContainer.scss";
import LibraryContainer from "../library/LibraryContainer";

class ViewportPanelContainer extends Component {
  static propTypes = {
    editor: PropTypes.object,
    showDialog: PropTypes.func,
    hideDialog: PropTypes.func
  };

  constructor(props) {
    super(props);

    this.canvasRef = React.createRef();

    this.state = {
      flyModeEnabled: false
    };
  }

  componentDidMount() {
    const editor = this.props.editor;
    editor.addListener("initialized", this.onEditorInitialized);
    editor.initializeRenderer(this.canvasRef.current);
  }

  componentWillUnmount() {
    const editor = this.props.editor;

    editor.removeListener("selectionChanged", this.onSelectionChanged);

    if (editor.spokeControls) {
      editor.spokeControls.removeListener("flyModeChanged", this.onFlyModeChanged);
    }

    if (editor.renderer) {
      editor.renderer.dispose();
    }
  }

  onEditorInitialized = () => {
    const editor = this.props.editor;
    editor.addListener("selectionChanged", this.onSelectionChanged);
    editor.spokeControls.addListener("flyModeChanged", this.onFlyModeChanged);
  };

  onFlyModeChanged = () => {
    this.setState({ flyModeEnabled: this.props.editor.flyControls.enabled });
  };

  onSelectionChanged = () => {
    this.setState({ objectSelected: this.props.editor.selected.length > 0 });
  };

  render() {
    return (
      <div id="viewport-panel-container" className={styles.viewportPanelContainer}>
        <Viewport ref={this.canvasRef} />
        <div className={styles.libraryToolbarContainer}>
          <LibraryContainer />
        </div>
        <div className={styles.controls}>
          {this.state.flyModeEnabled
            ? "[W][A][S][D] Move Camera | [Shift] Fly faster"
            : `[LMB] Orbit / Select | [MMB] Pan | [RMB] Fly ${this.state.objectSelected ? "| [F] Focus" : ""}`}
        </div>
      </div>
    );
  }
}

export default withEditor(ViewportPanelContainer);
