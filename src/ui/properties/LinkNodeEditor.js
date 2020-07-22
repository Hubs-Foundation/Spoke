import React, { Component } from "react";
import PropTypes from "prop-types";
import configs from "../../configs";
import NodeEditor from "./NodeEditor";
import InputGroup from "../inputs/InputGroup";
import StringInput from "../inputs/StringInput";
import { Link } from "styled-icons/fa-solid/Link";

export default class LinkNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconComponent = Link;

  static description = `Link to a ${configs.isMoz() ? "Hubs " : ""}room or a website.`;

  onChangeHref = href => {
    this.props.editor.setPropertySelected("href", href);
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
