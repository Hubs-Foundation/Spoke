import React, { Component } from "react";
import PropTypes from "prop-types";
import { withEditor } from "../contexts/EditorContext";
import styles from "./ViewportPanelToolbarContainer.scss";

class ViewportPanelToolbarContainer extends Component {
  static propTypes = {
    editor: PropTypes.object
  };

  constructor(props) {
    super(props);
    this.state = {
      snapEnabled: false
    };
    this.props.editor.signals.viewportInitialized.add(viewport => {
      this.setState({ snapEnabled: viewport.snapEnabled });
    });
  }

  toggleSnap(snapEnabled) {
    this.setState({ snapEnabled }, () => {
      this.props.editor.signals.snapToggled.dispatch(snapEnabled);
    });
  }

  render() {
    return (
      <label className={styles.snap}>
        Snap:{" "}
        <input
          type="checkbox"
          className={styles.snapInput}
          checked={this.state.snapEnabled}
          onChange={e => this.toggleSnap(e.target.checked)}
        />
      </label>
    );
  }
}

export default withEditor(ViewportPanelToolbarContainer);
