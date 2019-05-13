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
    this.props.editor.initializeViewport(this.canvasRef.current);
    this.props.editor.signals.objectSelected.add(this.onObjectSelected);
    this.props.editor.viewport.spokeControls.addListener("mode-changed", this.onFlyModeChanged);
  }

  componentWillUnmount() {
    this.props.editor.viewport.spokeControls.removeListener("mode-changed", this.onFlyModeChanged);
    this.props.editor.signals.objectSelected.remove(this.onObjectSelected);
    this.props.editor.viewport.dispose();
  }

  onFlyModeChanged = () => {
    const flyModeEnabled = this.props.editor.viewport.spokeControls.flyControls.enabled;
    this.setState({ flyModeEnabled });
  };

  onObjectSelected = () => {
    this.setState({ objectSelected: !!this.props.editor.selected });
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
            ? "[W][A][S][D] Move Camera"
            : `[LMB] Orbit / Select | [RMB] Fly ${this.state.objectSelected ? "| [F] Focus" : ""}`}
        </div>
      </div>
    );
  }
}

export default withEditor(ViewportPanelContainer);
