import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import InputGroup from "../inputs/InputGroup";
import ModelInput from "../inputs/ModelInput";
import BooleanInput from "../inputs/BooleanInput";
import { Magic } from "styled-icons/fa-solid/Magic";
import { GLTFInfo } from "../inputs/GLTFInfo";

export default class SpawnerNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconComponent = Magic;

  static description = "Spawns a model as an interactable object.";

  onChangeSrc = (src, initialProps) => {
    this.props.editor.setPropertiesSelected({ ...initialProps, src });
  };

  onChangeModifyGravityOnRelease = modifyGravityOnRelease => {
    this.props.editor.setPropertySelected("modifyGravityOnRelease", modifyGravityOnRelease);
  };

  render() {
    const node = this.props.node;

    return (
      <NodeEditor {...this.props} description={SpawnerNodeEditor.description}>
        <InputGroup name="Model Url">
          <ModelInput value={node.src} onChange={this.onChangeSrc} />
        </InputGroup>
        <InputGroup name="Spawned object is floaty">
          <BooleanInput value={node.modifyGravityOnRelease} onChange={this.onChangeModifyGravityOnRelease} />
        </InputGroup>
        {node.model && <GLTFInfo node={node} />}
      </NodeEditor>
    );
  }
}
