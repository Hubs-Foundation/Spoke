import React, { Component } from "react";
import PropTypes from "prop-types";
import PropertyGroup from "./PropertyGroup";
import EntityEditor from "./EntityEditor";

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
    const { editor, node, description, children } = this.props;
    const enableExperimentalFeatures = editor.settings.enableExperimentalFeatures;

    return (
      <PropertyGroup name={node.nodeName} description={description}>
        {children}
        {enableExperimentalFeatures && <EntityEditor node={node} editor={editor} />}
      </PropertyGroup>
    );
  }
}
