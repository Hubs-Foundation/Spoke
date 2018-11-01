import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import SelectInput from "../inputs/SelectInput";
import InputGroup from "../InputGroup";

export default class ModelNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconClassName = "fa-cube";

  onChangeAnimation = ({ value }) => {
    this.props.node.activeClip = value;
  };

  render() {
    const activeClipName = this.props.node.activeClip;
    const clipOptions = this.props.node
      .getClipNames()
      .map(name => ({ label: name, value: name }))
      .concat({ label: "None", value: null });

    return (
      <NodeEditor description="A 3D model in your scene, loaded from a GLTF URL or file." {...this.props}>
        {clipOptions.length > 0 && (
          <InputGroup name="Loop Animation">
            <SelectInput options={clipOptions} value={activeClipName} onChange={this.onChangeAnimation} />
          </InputGroup>
        )}
      </NodeEditor>
    );
  }
}
