import React, { Component } from "react";
import PropTypes from "prop-types";

import { withEditor } from "./contexts/EditorContext";
import styles from "./RendererStats.scss";

class RendererStats extends Component {
  static propTypes = {
    editor: PropTypes.object
  };

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.props.editor.signals.sceneRendered.add(info => {
      this.setState({
        drawCalls: info.render.calls,
        tris: info.render.triangles
      });
    });
  }

  formatQuantity(n) {
    if (n >= 1000000) {
      return `${(n / 1000000).toFixed(2)}M`;
    }
    if (n >= 1000) {
      return `${(n / 1000).toFixed(2)}K`;
    }
    return n.toString();
  }

  render() {
    if (!this.state) {
      return null;
    }

    return (
      <dl className={styles.rendererStats}>
        <dt>Draw calls</dt>
        <dd>{this.formatQuantity(this.state.drawCalls)}</dd>
        <dt>Tris</dt>
        <dd>{this.formatQuantity(this.state.tris)}</dd>
      </dl>
    );
  }
}

export default withEditor(RendererStats);
