import React, { Component } from "react";
import PropTypes from "prop-types";
import { withEditor } from "./EditorContext";
import Tree from "@robertlong/react-ui-tree";
import "../vendor/react-ui-tree/index.scss";
import classNames from "classnames";
import ContextMenuContainer from "./ContextMenuContainer";
import AddObjectCommand from "../editor/commands/AddObjectCommand";
import MoveObjectCommand from "../editor/commands/MoveObjectCommand";
import RemoveObjectCommand from "../editor/commands/RemoveObjectCommand";
import THREE from "../vendor/three";

function createNodeHierarchy(object) {
  const node = {
    object,
    collapsed: false
  };

  if (object.children.length !== 0) {
    node.children = object.children.map(createNodeHierarchy);
  }

  return node;
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

  onChange = (tree, parent, node) => {
    if (!node) {
      // parent and node are null when expanding/collapsing the tree.
      return;
    }

    const object = node.object;
    const newParent = parent.object;
    let newBefore; // The object to insert the moved node before.

    if (newParent.children.length === 1) {
      newBefore = undefined;
    } else {
      const movedNodeIndex = newParent.children.indexOf(node.object);

      if (movedNodeIndex === newParent.children.length - 1) {
        newBefore = undefined;
      } else {
        newBefore = newParent.children[movedNodeIndex + 1];
      }
    }

    this.props.editor.execute(new MoveObjectCommand(object, newParent, newBefore));
  };

  onClickNode = node => {
    if (this.clicked === node.object) {
      this.props.editor.focusById(node.object.id);
      return;
    }

    this.props.editor.selectById(node.object.id);
    this.clicked = node.object;

    clearTimeout(this.doubleClickTimeout);
    this.doubleClickTimeout = setTimeout(() => {
      this.clicked = null;
    }, 500);
  };

  onAddNode = node => {
    const object = new THREE.Object3D();
    object.name = "New Node";
    this.props.editor.execute(new AddObjectCommand(object, node.object));
  };

  onDeleteNode = node => {
    this.props.editor.execute(new RemoveObjectCommand(node.object));
  };

  rebuildNodeHierarchy = () => {
    this.setState({
      tree: createNodeHierarchy(this.props.editor.scene)
    });
  };

  renderNode = node => {
    const menuItems = [
      {
        label: "Add Node",
        click: this.onAddNode.bind(this, node)
      },
      {
        label: "Delete",
        click: this.onDeleteNode.bind(this, node)
      }
    ];

    return (
      <ContextMenuContainer
        className={classNames("node", {
          "is-active": this.props.editor.selected && node.object.id === this.props.editor.selected.id
        })}
        onClick={e => this.onClickNode(node, e)}
        menuItems={menuItems}
      >
        {node.object.name}
      </ContextMenuContainer>
    );
  };

  render() {
    return (
      <div>
        <Tree
          paddingLeft={8}
          isNodeCollapsed={false}
          tree={this.state.tree}
          renderNode={this.renderNode}
          onChange={this.onChange}
        />
      </div>
    );
  }
}

export default withEditor(HierarchyPanelContainer);
