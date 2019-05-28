import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import ColorInput from "../inputs/ColorInput";
import InputGroup from "../inputs/InputGroup";
import NumericInputGroup from "../inputs/NumericInputGroup";

export default class SphereNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconClassName = "fa-circle";

  static description = "my sphere";

  onChangeColor = color => {
    this.props.editor.setNodeProperty(this.props.node, "color", color);
  };

  onChangeRadius = radius => {
    this.props.editor.setNodeProperty(this.props.node, "radius", radius);
  };

  render() {
    return (
      <NodeEditor {...this.props} description={SphereNodeEditor.description}>
        <InputGroup name="Color">
          <ColorInput value={this.props.node.color} onChange={this.onChangeColor} />
        </InputGroup>
        <NumericInputGroup
          name="Radius"
          min={0}
          smallStep={0.001}
          mediumStep={0.01}
          largeStep={0.1}
          value={this.props.node.radius}
          onChange={this.onChangeRadius}
          unit=""
        />
      </NodeEditor>
    );
  }
}
