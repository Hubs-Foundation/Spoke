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
import SetRotationCommand from "../editor/commands/SetRotationCommand";
import SetScaleCommand from "../editor/commands/SetScaleCommand";

const RAD2DEG = THREE.Math.RAD2DEG;
const DEG2RAD = THREE.Math.DEG2RAD;

class NodePropertyGroupContainer extends Component {
  static propTypes = {
    editor: PropTypes.object
  };
  constructor(props) {
    super(props);
    this.props.editor.signals.objectSelected.add(this.updateNode);
    this.props.editor.signals.objectChanged.add(this.updateStateFromNode);
    this.state = { node: null };
    this.positionVector = new THREE.Vector3();
    this.rotationEuler = new THREE.Euler();
    this.degreesVector = new THREE.Vector3();
    this.scaleVector = new THREE.Vector3();
  }
  updateNode = node => {
    this.setState({ node }, () => this.updateStateFromNode(node));
  };
  updateStateFromNode = node => {
    // deselected
    if (node === null) {
      this.setState({ name: "" });
      return;
    }

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
    this.props.editor.execute(new SetPositionCommand(this.state.node, this.positionVector.copy(newPosition)));
  };
  updateRotation = newRotation => {
    if (!this.state.node) return;
    this.rotationEuler.set(newRotation.x * DEG2RAD, newRotation.y * DEG2RAD, newRotation.z * DEG2RAD);
    this.props.editor.execute(new SetRotationCommand(this.state.node, this.rotationEuler));
  };
  updateScale = newScale => {
    if (!this.state.node) return;
    this.props.editor.execute(new SetScaleCommand(this.state.node, this.scaleVector.copy(newScale)));
  };
  render() {
    const position = this.state.node ? this.state.node.position : null;
    let rotation = null;
    if (this.state.node) {
      const eulerRadians = this.state.node.rotation;
      this.degreesVector.set(eulerRadians.x * RAD2DEG, eulerRadians.y * RAD2DEG, eulerRadians.z * RAD2DEG);
      rotation = this.degreesVector;
    }
    const scale = this.state.node ? this.state.node.scale : null;
    return (
      <PropertyGroup name="Node">
        <InputGroup name="Name">
          <StringInput value={this.state.name} onChange={this.updateName} />
        </InputGroup>
        <InputGroup name="Position">
          <Vector3Input value={position} onChange={this.updatePosition} />
        </InputGroup>
        <InputGroup name="Rotation">
          <Vector3Input value={rotation} onChange={this.updateRotation} />
        </InputGroup>
        <InputGroup name="Scale">
          <Vector3Input value={scale} onChange={this.updateScale} />
        </InputGroup>
      </PropertyGroup>
    );
  }
}

export default withEditor(NodePropertyGroupContainer);
