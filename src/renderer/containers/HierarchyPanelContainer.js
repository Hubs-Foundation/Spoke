import React, { Component } from "react";
import PropTypes from "prop-types";
import Panel from "../components/Panel";
import { withEditor } from "./EditorContext";
import Tree from "react-ui-tree";
import "../vendor/react-ui-tree/index.scss";
import classNames from "classnames";

function createNodeHierarchy(object) {
  return {
    object,
    collapsed: false,
    children: object.children.map(createNodeHierarchy)
  };
}

class HierarchyPanelContainer extends Component {
  static propTypes = {
    path: PropTypes.array,
    editor: PropTypes.object
  };

  constructor(props) {
    super(props);

    this.state = {
      tree: createNodeHierarchy(props.editor.scene)
    };

    this.clicked = null;
    this.doubleClickTimeout = null;

    const editor = this.props.editor;
    editor.signals.editorCleared.add(this.rebuildNodeHierarchy);
    editor.signals.sceneGraphChanged.add(this.rebuildNodeHierarchy);
    editor.signals.objectChanged.add(this.rebuildNodeHierarchy);
    editor.signals.objectSelected.add(this.rebuildNodeHierarchy);
  }

  onChange = node => {
    this.ignoreObjectSelectedSignal = true;
    this.props.editor.selectById(node.object.id);
    this.ignoreObjectSelectedSignal = false;
  };

  onClickNode = node => {
    if (this.clicked === node.object) {
      this.props.editor.focusById(node.object.id);
    }

    this.clicked = node.object;

    clearTimeout(this.doubleClickTimeout);
    this.doubleClickTimeout = setTimeout(() => {
      this.clicked = null;
    }, 500);
  };

  rebuildNodeHierarchy = () => {
    this.setState({
      tree: createNodeHierarchy(this.props.editor.scene)
    });
  };

  renderNode = node => {
    return (
      <span
        className={classNames("node", {
          "is-active": this.props.editor.selected && node.object.id === this.props.editor.selected.id
        })}
        onClick={() => this.onClickNode(node)}
      >
        {node.object.name}
      </span>
    );
  };

  render() {
    return (
      <Panel title="Hierarchy" path={this.props.path}>
        <Tree paddingLeft={8} tree={this.state.tree} renderNode={this.renderNode} onChange={this.onChange} />
      </Panel>
    );
  }
}

export default withEditor(HierarchyPanelContainer);
