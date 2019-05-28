import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import ColorInput from "../inputs/ColorInput";
import InputGroup from "../inputs/InputGroup";

export default class BoxNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconClassName = "fa-box";

  static description = "Box. It's just a box.";

  onChangeColor = color => {
    this.props.editor.setNodeProperty(this.props.node, "color", color);
  };

  render() {
    return (
      <NodeEditor {...this.props} description={BoxNodeEditor.description}>
        <InputGroup name="Color">
          <ColorInput value={this.props.node.color} onChange={this.onChangeColor} />
        </InputGroup>
      </NodeEditor>
    );
  }
}
