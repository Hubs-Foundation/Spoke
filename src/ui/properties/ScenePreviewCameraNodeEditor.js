import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import { Camera } from "styled-icons/fa-solid/Camera";
import { PropertiesPanelButton } from "../inputs/Button";

export default class ScenePreviewCameraNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconComponent = Camera;

  static description =
    "The camera used to generate the thumbnail for your scene and the starting position for the preview camera in Hubs.";

  onSetFromViewport = () => {
    this.props.node.setFromViewport();
  };

  render() {
    return (
      <NodeEditor {...this.props} description={ScenePreviewCameraNodeEditor.description}>
        <PropertiesPanelButton onClick={this.onSetFromViewport}>Set From Viewport</PropertiesPanelButton>
      </NodeEditor>
    );
  }
}
