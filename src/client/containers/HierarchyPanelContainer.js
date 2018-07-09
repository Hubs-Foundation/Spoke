import React, { Component } from "react";
import PropTypes from "prop-types";
import { HotKeys } from "react-hotkeys";
import Tree from "@robertlong/react-ui-tree";
import classNames from "classnames";
import { ContextMenu, MenuItem, ContextMenuTrigger, connectMenu } from "react-contextmenu";

import styles from "./HierarchyPanelContainer.scss";
import { withEditor } from "./EditorContext";
import "../vendor/react-ui-tree/index.scss";
import "../vendor/react-contextmenu/index.scss";
import AddObjectCommand from "../editor/commands/AddObjectCommand";
import MoveObjectCommand from "../editor/commands/MoveObjectCommand";
import THREE from "../vendor/three";
import { last } from "../utils";

function createNodeHierarchy(object) {
  const node = {
    object,
    collapsed: false
  };

  if (object.children.length !== 0) {
    node.children = object.children.filter(({ userData }) => !userData._dontShowInHierarchy).map(createNodeHierarchy);
  }

  return node;
}

function collectNodeMenuProps({ node }) {
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
      tree: createNodeHierarchy(props.editor.scene),
      hierarchyHotKeyHandlers: {
        delete: this.onDeleteSelected,
        duplicate: this.onDuplicateSelected
      }
    };

    this.clicked = null;
    this.doubleClickTimeout = null;

    const editor = this.props.editor;
    editor.signals.editorCleared.add(this.rebuildNodeHierarchy);
    editor.signals.sceneSet.add(this.rebuildNodeHierarchy);
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

  onMouseUpNode = (e, node) => {
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

  onAddNode = (e, node) => {
    const object = new THREE.Object3D();
    object.name = "New_Node";
    this.props.editor.execute(new AddObjectCommand(object, node.object));
  };

  onDuplicateSelected = () => {
    this.props.editor.duplicateSelectedObject();
    return false;
  };

  onDuplicateNode = (e, node) => {
    this.props.editor.duplicateObject(node.object);
  };

  onEditPrefab = refComponent => {
    this.props.editor.editScenePrefab(refComponent.getProperty("src"));
  };

  onDeleteSelected = () => {
    this.props.editor.deleteSelectedObject();
  };

  onDeleteNode = (e, node) => {
    this.props.editor.deleteObject(node.object);
  };

  rebuildNodeHierarchy = () => {
    this.setState({
      tree: createNodeHierarchy(this.props.editor.scene)
    });
  };

  renderNode = node => {
    return (
      <div
        className={classNames("node", {
          "is-active": this.props.editor.selected && node.object.id === this.props.editor.selected.id
        })}
        onMouseUp={e => this.onMouseUpNode(e, node)}
      >
        <ContextMenuTrigger
          attributes={{ className: styles.treeNode }}
          holdToDisplay={-1}
          id="hierarchy-node-menu"
          node={node}
          collect={collectNodeMenuProps}
        >
          {node.object.name}
        </ContextMenuTrigger>
      </div>
    );
  };

  renderHierarchyNodeMenu = props => {
    const refComponent =
      props.trigger && this.props.editor.components.get("scene-reference").getComponent(props.trigger.object);
    return (
      <ContextMenu id="hierarchy-node-menu">
        <MenuItem onClick={this.onAddNode}>Add Node</MenuItem>
        <MenuItem onClick={this.onDuplicateNode}>Duplicate</MenuItem>
        {refComponent && <MenuItem onClick={this.onEditPrefab.bind(null, refComponent)}>Edit Prefab</MenuItem>}
        <MenuItem onClick={this.onDeleteNode}>Delete</MenuItem>
      </ContextMenu>
    );
  };

  HierarchyNodeMenu = connectMenu("hierarchy-node-menu")(this.renderHierarchyNodeMenu);

  popScene = () => {
    this.props.editor.signals.popScene.dispatch();
  };

  render() {
    return (
      <div className={styles.hierarchyRoot}>
        {this.props.editor.scenes.map((sceneInfo, i) => {
          const name = sceneInfo.uri ? last(sceneInfo.uri.split("/")) : "...";
          return (
            <button
              className={styles.breadCrumb}
              disabled={i !== this.props.editor.scenes.length - 2}
              onClick={this.popScene}
              key={name}
            >
              {name}
            </button>
          );
        })}
        <HotKeys handlers={this.state.hierarchyHotKeyHandlers}>
          <Tree
            paddingLeft={8}
            isNodeCollapsed={false}
            draggable={true}
            tree={this.state.tree}
            renderNode={this.renderNode}
            onChange={this.onChange}
          />
          <this.HierarchyNodeMenu />
        </HotKeys>
      </div>
    );
  }
}

export default withEditor(HierarchyPanelContainer);
