import React, { Component } from "react";
import PropTypes from "prop-types";
import PropertyGroup from "./PropertyGroup";

export default class NodeEditor extends Component {
  static propTypes = {
    name: PropTypes.string,
    description: PropTypes.string,
    node: PropTypes.object,
    editor: PropTypes.object,
    children: PropTypes.node,
    disableTransform: PropTypes.bool
  };

  static defaultProps = {
    disableTransform: false
  };

  render() {
    const { node, description, children } = this.props;

    return (
      <PropertyGroup name={node.nodeName} description={description}>
        {children}
      </PropertyGroup>
    );
  }
}
