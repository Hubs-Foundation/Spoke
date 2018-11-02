import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import SelectInput from "../inputs/SelectInput";
import InputGroup from "../InputGroup";
import BooleanInput from "../inputs/BooleanInput";

export default class ModelNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconClassName = "fa-cube";

  onChangeAnimation = activeClipName => {
    this.props.editor.setNodeProperty(this.props.node, "activeClipName", activeClipName);
  };

  onChangeIncludeInFloorPlan = includeInFloorPlan => {
    this.props.editor.setNodeProperty(this.props.node, "includeInFloorPlan", includeInFloorPlan);
  };

  render() {
    const node = this.props.node;
    const activeClipName = node.activeClipName;
    const clipOptions = node.getClipNames().map(name => ({ label: name, value: name }));
    clipOptions.unshift({ label: "None", value: null });

    return (
      <NodeEditor description="A 3D model in your scene, loaded from a GLTF URL or file." {...this.props}>
        <InputGroup name="Loop Animation">
          <SelectInput options={clipOptions} value={activeClipName} onChange={this.onChangeAnimation} />
        </InputGroup>
        <InputGroup name="Include in Floor Plan">
          <BooleanInput value={node.includeInFloorPlan} onChange={this.onChangeIncludeInFloorPlan} />
        </InputGroup>
      </NodeEditor>
    );
  }
}
