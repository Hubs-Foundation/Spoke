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

  onChangeAnimation = animation => {
    console.log(animation);
  };

  render() {
    const activeClipName = this.props.node.getActiveClipName();
    const selectedAnimationOption = activeClipName ? { value: activeClipName, label: activeClipName } : null;
    const animationOptions = this.props.node.getClipNames().map(name => ({ value: name, label: name }));

    return (
      <NodeEditor description="A 3D model in your scene, loaded from a GLTF URL or file." {...this.props}>
        {animationOptions.length > 0 && (
          <InputGroup name="Loop Animation">
            <SelectInput options={animationOptions} value={selectedAnimationOption} onChange={this.onChangeAnimation} />
          </InputGroup>
        )}
      </NodeEditor>
    );
  }
}
