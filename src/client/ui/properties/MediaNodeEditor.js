import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import InputGroup from "../inputs/InputGroup";
import StringInput from "../inputs/StringInput";

export default class MediaNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconClassName = "fa-film";

  onChangeSrc = src => {
    this.props.editor.setNodeProperty(this.props.node, "src", src);
  };

  render() {
    const node = this.props.node;

    return (
      <NodeEditor description="Dynamically loads a video, image, or 3D model." {...this.props}>
        <InputGroup name="URL">
          <StringInput value={node.src} onChange={this.onChangeSrc} />
        </InputGroup>
      </NodeEditor>
    );
  }
}
