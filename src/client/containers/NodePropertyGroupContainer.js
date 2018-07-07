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
import AddComponentCommand from "../editor/commands/AddComponentCommand";
import { getDisplayName } from "../editor/components";
import Select from "react-select";
import "../vendor/react-select/index.scss";
import styles from "./NodePropertyGroupContainer.scss";

const RAD2DEG = THREE.Math.RAD2DEG;
const DEG2RAD = THREE.Math.DEG2RAD;

class NodePropertyGroupContainer extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.positionVector = new THREE.Vector3();
    this.rotationEuler = new THREE.Euler();
    this.degreesVector = new THREE.Vector3();
    this.scaleVector = new THREE.Vector3();
  }

  updateName = e => {
    this.props.editor.execute(new SetValueCommand(this.props.node, "name", e.target.value));
  };

  updatePosition = newPosition => {
    this.props.editor.execute(new SetPositionCommand(this.props.node, this.positionVector.copy(newPosition)));
  };

  updateRotation = newRotation => {
    this.rotationEuler.set(newRotation.x * DEG2RAD, newRotation.y * DEG2RAD, newRotation.z * DEG2RAD);
    this.props.editor.execute(new SetRotationCommand(this.props.node, this.rotationEuler));
  };

  updateScale = newScale => {
    this.props.editor.execute(new SetScaleCommand(this.props.node, this.scaleVector.copy(newScale)));
  };

  onChangeComponent = ({ value }) => {
    this.props.editor.execute(new AddComponentCommand(this.props.node, value));
  };

  render() {
    const node = this.props.node;
    const name = node.name;
    const position = node.position;
    const scale = node.scale;
    const eulerRadians = node.rotation;
    this.degreesVector.set(eulerRadians.x * RAD2DEG, eulerRadians.y * RAD2DEG, eulerRadians.z * RAD2DEG);
    const rotation = this.degreesVector;

    const componentOptions = [];

    for (const [name] of this.props.editor.components) {
      componentOptions.push({
        value: name,
        label: getDisplayName(name)
      });
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
        <div className={styles.addComponentContainer}>
          <Select
            placeholder="Add a component..."
            className={styles.addComponentSelect}
            options={componentOptions}
            onChange={this.onChangeComponent}
          />
        </div>
      </PropertyGroup>
    );
  }
}

export default withEditor(NodePropertyGroupContainer);
