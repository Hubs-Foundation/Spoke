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
    editor: PropTypes.object,
    node: PropTypes.object
  };
  constructor(props) {
    super(props);
    this.state = { node: null };
    this.positionVector = new THREE.Vector3();
    this.rotationEuler = new THREE.Euler();
    this.degreesVector = new THREE.Vector3();
    this.scaleVector = new THREE.Vector3();
  }
  updateName = e => {
    if (!this.props.node) return;
    this.props.editor.execute(new SetValueCommand(this.props.node, "name", e.target.value));
  };
  updatePosition = newPosition => {
    if (!this.props.node) return;
    this.props.editor.execute(new SetPositionCommand(this.props.node, this.positionVector.copy(newPosition)));
  };
  updateRotation = newRotation => {
    if (!this.props.node) return;
    this.rotationEuler.set(newRotation.x * DEG2RAD, newRotation.y * DEG2RAD, newRotation.z * DEG2RAD);
    this.props.editor.execute(new SetRotationCommand(this.props.node, this.rotationEuler));
  };
  updateScale = newScale => {
    if (!this.props.node) return;
    this.props.editor.execute(new SetScaleCommand(this.props.node, this.scaleVector.copy(newScale)));
  };
  render() {
    let name = "";
    let position = null;
    let rotation = null;
    let scale = null;
    if (this.props.node) {
      const { node } = this.props;
      name = node.name;
      position = node.position;
      scale = node.scale;
      const eulerRadians = node.rotation;
      this.degreesVector.set(eulerRadians.x * RAD2DEG, eulerRadians.y * RAD2DEG, eulerRadians.z * RAD2DEG);
      rotation = this.degreesVector;
    }
    return (
      <PropertyGroup name="Node">
        <InputGroup name="Name">
          <StringInput value={name} onChange={this.updateName} />
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
