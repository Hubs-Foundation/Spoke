import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "../panels/PropertiesPanelContainer.scss";
import PropertyGroup from "../PropertyGroup";
import TransformPropertyGroup from "./TransformPropertyGroup";
import NameInputGroup from "./NameInputGroup";

export default class NodeEditor extends Component {
  static propTypes = {
    name: PropTypes.string,
    description: PropTypes.string,
    node: PropTypes.object,
    editor: PropTypes.object,
    children: PropTypes.node,
    hideTransform: PropTypes.bool
  };

  static defaultProps = {
    hideTransform: false
  };

  render() {
    const { node, description, editor, children } = this.props;

    return (
      <div className={styles.propertiesPanelContainer}>
        <div className={styles.propertiesHeader}>
          <div className={styles.propertiesPanelTopBar}>
            <NameInputGroup node={node} editor={editor} />
          </div>
          {!node.hideTransform && <TransformPropertyGroup node={node} editor={editor} />}
        </div>
        <PropertyGroup name={node.nodeName} description={description}>
          {children}
        </PropertyGroup>
      </div>
    );
  }
}
