import React, { Component } from "react";
import THREE from "../vendor/three";
import PropTypes from "prop-types";
import { withEditor } from "./EditorContext";
import PropertyGroup from "../components/PropertyGroup";
import InputGroup from "../components/InputGroup";
import Vector3Input from "../components/Vector3Input";
import StringInput from "../components/StringInput";
import SetValueCommand from "../editor/commands/SetValueCommand";
import SetPositionCommand from "../editor/commands/SetPositionCommand";

class NodePropertyGroupContainer extends Component {
  static propTypes = {
    editor: PropTypes.object
  };
  constructor(props) {
    super(props);
    this.props.editor.signals.objectSelected.add(this.updateNode);
    this.props.editor.signals.objectChanged.add(this.updateStateFromNode);
    this.state = { node: {} };
  }
  updateNode = node => {
    this.setState({ node }, () => this.updateStateFromNode(node));
  };
  updateStateFromNode = node => {
    // Ignore objectChanged signals if they are for another node.
    if (!this.state.node || this.state.node !== node) return;
    this.setState({
      name: node.name
    });
  };
  updateName = e => {
    if (!this.state.node) return;
    this.props.editor.execute(new SetValueCommand(this.state.node, "name", e.target.value));
  };
  updatePosition = newPosition => {
    if (!this.state.node) return;
    this.props.editor.execute(new SetPositionCommand(this.state.node, new THREE.Vector3().copy(newPosition)));
  };
  render() {
    return (
      <PropertyGroup name="Node">
        <InputGroup name="Name">
          <StringInput value={this.state.name} onChange={this.updateName} />
        </InputGroup>
        <InputGroup name="Position">
          <Vector3Input value={this.state.node.position} onChange={this.updatePosition} />
        </InputGroup>
        <InputGroup name="Rotation">
          <Vector3Input />
        </InputGroup>
        <InputGroup name="Scale">
          <Vector3Input />
        </InputGroup>
      </PropertyGroup>
    );
  }
}

export default withEditor(NodePropertyGroupContainer);
