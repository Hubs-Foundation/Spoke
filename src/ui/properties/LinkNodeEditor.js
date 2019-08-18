import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import InputGroup from "../inputs/InputGroup";
import StringInput from "../inputs/StringInput";

export default class LinkNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconClassName = "fa-link";

  static description = "Link to a Hubs room.";

  onChangeHref = href => {
    this.props.editor.setProperty(this.props.node, "href", href);
  };

  render() {
    const node = this.props.node;

    return (
      <NodeEditor description={LinkNodeEditor.description} {...this.props}>
        <InputGroup name="Url">
          <StringInput value={node.href} onChange={this.onChangeHref} />
        </InputGroup>
      </NodeEditor>
    );
  }
}
