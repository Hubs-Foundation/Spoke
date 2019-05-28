import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import ColorInput from "../inputs/ColorInput";
import InputGroup from "../inputs/InputGroup";
//import NumericInputGroup from "../inputs/NumericInputGroup";

export default class ParticleNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconClassName = "fa-spray-can";

  static description = "my particle";

  onChangeColor = color => {
    this.props.editor.setNodeProperty(this.props.node, "color", color);
  };

  render() {
    return (
      <NodeEditor {...this.props} description={ParticleNodeEditor.description}>
        <InputGroup name="Color">
          <ColorInput value={this.props.node.color} onChange={this.onChangeColor} />
        </InputGroup>
      </NodeEditor>
    );
  }
}
