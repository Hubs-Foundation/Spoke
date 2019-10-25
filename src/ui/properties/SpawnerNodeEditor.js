import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import InputGroup from "../inputs/InputGroup";
import ModelInput from "../inputs/ModelInput";
import { Magic } from "styled-icons/fa-solid/Magic";

export default class SpawnerNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconComponent = Magic;

  static description = "Spawns a model as an interactable object.";

  onChangeSrc = (src, { scaleToFit }) => {
    this.props.editor.setPropertiesSelected({ scaleToFit: scaleToFit || false, src });
  };

  render() {
    const node = this.props.node;

    return (
      <NodeEditor {...this.props} description={SpawnerNodeEditor.description}>
        <InputGroup name="Model">
          <ModelInput value={node.src} onChange={this.onChangeSrc} />
        </InputGroup>
      </NodeEditor>
    );
  }
}
