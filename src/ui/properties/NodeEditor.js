import React, { Component } from "react";
import PropTypes from "prop-types";
import ReactTooltip from "react-tooltip";
import styles from "./PropertiesPanelContainer.scss";
import PropertyGroup from "./PropertyGroup";
import TransformPropertyGroup from "./TransformPropertyGroup";
import NameInputGroup from "./NameInputGroup";
import InputGroup from "../inputs/InputGroup";
import BooleanInput from "../inputs/BooleanInput";

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

  onChangeVisible = value => {
    this.props.editor.setProperty(this.props.node, "visible", value);
  };

  render() {
    const { node, description, editor, children } = this.props;

    return (
      <div className={styles.nodeEditor}>
        <div className={styles.propertiesHeader}>
          <div className={styles.propertiesPanelTopBar}>
            <NameInputGroup node={node} editor={editor} />
            {node.nodeName !== "Scene" && (
              <InputGroup name="Visible" className={styles.visibleInputGroup}>
                <BooleanInput value={node.visible} onChange={this.onChangeVisible} />
              </InputGroup>
            )}
          </div>
          {!node.disableTransform && <TransformPropertyGroup node={node} editor={editor} />}
        </div>
        <PropertyGroup name={node.nodeName} description={description}>
          {children}
        </PropertyGroup>
        <ReactTooltip id="node-editor" className={styles.tooltip} />
      </div>
    );
  }
}
