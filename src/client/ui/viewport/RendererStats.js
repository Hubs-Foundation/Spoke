import React, { Component } from "react";
import PropTypes from "prop-types";

import { withEditor } from "../contexts/EditorContext";
import styles from "./RendererStats.scss";

class RendererStats extends Component {
  static propTypes = {
    editor: PropTypes.object
  };

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.props.editor.signals.sceneRendered.add((renderer, scene) => {
      if (scene !== this.props.editor.scene) {
        return; // don't do anything with rendering information from the helper scene
      }
      const materials = new Set();
      scene.traverse(node => {
        if (node.material) {
          if (Array.isArray(node.material)) {
            for (const mat of node.material) {
              materials.add(mat);
            }
          } else {
            materials.add(node.material);
          }
        }
      });
      this.setState({
        materials: materials.size,
        tris: renderer.info.render.triangles
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
        <dt>Materials</dt>
        <dd>{this.formatQuantity(this.state.materials)}</dd>
        <dt>Tris</dt>
        <dd>{this.formatQuantity(this.state.tris)}</dd>
      </dl>
    );
  }
}

export default withEditor(RendererStats);
