import React, { Component } from "react";
import PropTypes from "prop-types";
import { HotKeys } from "react-hotkeys";
import FileDropTarget from "../FileDropTarget";
import Tree from "@robertlong/react-ui-tree";
import classNames from "classnames";
import { ContextMenu, MenuItem, ContextMenuTrigger, connectMenu } from "react-contextmenu";

import styles from "./HierarchyPanelContainer.scss";
import { withEditor } from "../contexts/EditorContext";
import { withDialog } from "../contexts/DialogContext";
import "../../vendor/react-ui-tree/index.scss";
import "../../vendor/react-contextmenu/index.scss";
import AddObjectCommand from "../../editor/commands/AddObjectCommand";
import MoveObjectCommand from "../../editor/commands/MoveObjectCommand";
import THREE from "../../vendor/three";
import SceneReferenceComponent from "../../editor/components/SceneReferenceComponent";
import { last } from "../../utils";
import SnackBar from "../SnackBar";
import ReactTooltip from "react-tooltip";
import ErrorDialog from "../dialogs/ErrorDialog";
import { StaticMode, setStaticMode } from "../../editor/StaticMode";

function createNodeHierarchy(object) {
  const node = {
    object,
    collapsed: object.userData._collapsed ? object.userData._collapsed : false
  };

  if (!node.object.userData._collapsed) {
    node.object.userData._collapsed = node.collapsed;
  }

  if (object.children.length !== 0) {
    node.children = object.children.filter(({ userData }) => !userData._dontShowInHierarchy).map(createNodeHierarchy);
  }

  return node;
}

function updateCollapseStatus(node) {
  if (!node) {
    return;
  }
  node.object.userData._collapsed = node.collapsed;
  if (node.children) {
    for (const child of node.children) {
      updateCollapseStatus(child);
    }
  }
}

function collectNodeMenuProps({ node }) {
  return node;
}

class HierarchyPanelContainer extends Component {
  static propTypes = {
    path: PropTypes.array,
    editor: PropTypes.object,
    showDialog: PropTypes.func
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
    editor.signals.sceneSet.add(this.rebuildNodeHierarchy);
    editor.signals.sceneGraphChanged.add(this.rebuildNodeHierarchy);
    editor.signals.objectChanged.add(this.rebuildNodeHierarchy);
    editor.signals.objectSelected.add(this.rebuildNodeHierarchy);
  }

  onDropFile = file => {
    if (file.ext === ".gltf" || file.ext === ".scene") {
      if (file.uri === this.props.editor.sceneInfo.uri) {
        this.props.showDialog(ErrorDialog, {
          title: "Error adding prefab.",
          message: "Scene cannot be added to itself."
        });
        return;
      }

      const object = new THREE.Object3D();
      object.name = file.name;
      setStaticMode(object, StaticMode.Static);
      this.props.editor.addObject(object);
      this.props.editor.addComponent(object, "scene-reference", { src: file.uri });
      this.props.editor.select(object);
    }
  };

  onChange = (tree, parent, node) => {
    if (!node) {
      // parent and node are null when expanding/collapsing the tree.
      updateCollapseStatus(tree);
      return;
    }

    const object = node.object;
    const newParent = parent;
    let newBefore; // The object to insert the moved node before.

    if (newParent.children.length === 1) {
      newBefore = undefined;
    } else {
      const movedNodeIndex = newParent.children.indexOf(node);
      if (movedNodeIndex === newParent.children.length - 1) {
        newBefore = undefined;
      } else {
        newBefore = newParent.children[movedNodeIndex + 1].object;
      }
    }

    this.props.editor.execute(new MoveObjectCommand(object, newParent.object, newBefore));
  };

  onMouseDownNode = (e, node) => {
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

  onEditPrefab = (object, refComponent) => {
    const path = refComponent.getProperty("src");
    this.props.editor.editScenePrefab(object, path);
  };

  onDeleteSelected = e => {
    e.preventDefault();
    this.props.editor.deleteSelectedObject();
  };

  onDeleteNode = (e, node) => {
    this.props.editor.deleteObject(node.object);
  };

  rebuildNodeHierarchy = () => {
    const handler = this.props.editor.scene.userData._conflictHandler;
    if (handler) {
      const list = handler.checkResolvedMissingRoot(this.props.editor.scene);
      if (list.length > 0) {
        list.forEach(resolvedMissingRoot => {
          this.props.editor.removeObject(resolvedMissingRoot);
        });
      }
      handler.updateNodesMissingStatus(this.props.editor.scene);
      handler.updateNodesDuplicateStatus(this.props.editor.scene);
    }

    this.setState({
      tree: createNodeHierarchy(this.props.editor.scene)
    });
  };

  renderNode = node => {
    const isMissingChild = node.object.userData._missing && !node.object.userData._isMissingRoot;
    const isDuplicateChild = node.object.userData._duplicate && !node.object.userData._isDuplicateRoot;
    const disableEditing =
      node.object.userData._duplicate || node.object.userData._isDuplicateRoot || node.object.userData._isMissingRoot;
    return (
      <div
        className={classNames("node", {
          "is-active": this.props.editor.selected && node.object.id === this.props.editor.selected.id,
          conflict: disableEditing,
          "error-root": node.object.userData._isMissingRoot ? node.object.userData._missing : false,
          "warning-root": node.object.userData._isDuplicateRoot ? node.object.userData._duplicate : false,
          disabled: isMissingChild || isDuplicateChild
        })}
        onMouseDown={disableEditing ? e => e.stopPropagation() : e => this.onMouseDownNode(e, node)}
      >
        <ContextMenuTrigger
          attributes={{ className: styles.treeNode }}
          holdToDisplay={-1}
          id="hierarchy-node-menu"
          node={node}
          collect={collectNodeMenuProps}
        >
          {this.renderNodeName(node)}
        </ContextMenuTrigger>
      </div>
    );
  };

  renderNodeName = node => {
    let name = node.object.name;
    if (node.object.userData._isDuplicateRoot) {
      const duplicatePostfix = `_${node.object.userData._path.join("-")}`;
      name = `${name}${duplicatePostfix}`;
    }
    return (
      <div data-tip={node.object.userData._isDuplicateRoot} data-for={name}>
        {name}
        {node.object.userData._isDuplicateRoot ? (
          <ReactTooltip id={name} type="warning" place="bottom" effect="float">
            <span>Original node name: {node.object.name}</span>
          </ReactTooltip>
        ) : null}
      </div>
    );
  };

  renderHierarchyNodeMenu = props => {
    const node = props.trigger;
    const refComponent = node && this.props.editor.getComponent(node.object, SceneReferenceComponent.componentName);
    const hasParent = node && node.object.parent;
    return (
      <ContextMenu id="hierarchy-node-menu">
        <MenuItem onClick={this.onAddNode}>Add Node</MenuItem>
        {hasParent && <MenuItem onClick={this.onDuplicateNode}>Duplicate</MenuItem>}
        {refComponent && (
          <MenuItem onClick={this.onEditPrefab.bind(null, node.object, refComponent)}>Edit Prefab</MenuItem>
        )}
        {hasParent && <MenuItem onClick={this.onDeleteNode}>Delete</MenuItem>}
      </ContextMenu>
    );
  };

  HierarchyNodeMenu = connectMenu("hierarchy-node-menu")(this.renderHierarchyNodeMenu);

  popScene = () => {
    this.props.editor.signals.popScene.dispatch();
  };

  renderWarnings = () => {
    const handler = this.props.editor.scene.userData._conflictHandler;
    if (!handler) {
      return;
    }

    const conflicts = handler.getConflictInfo();

    return (
      <div className={styles.conflictDisplay}>
        {Object.keys(conflicts).map((type, i) => (conflicts[type] ? <SnackBar conflictType={type} key={i} /> : null))}
      </div>
    );
  };

  render() {
    return (
      <div className={styles.hierarchyRoot}>
        <div className={styles.breadCrumbBar}>
          {this.props.editor.scenes.map((sceneInfo, i) => {
            const name = sceneInfo.uri ? last(sceneInfo.uri.split("/")) : "<unsaved>";
            const ancestors = sceneInfo.scene.userData._ancestors;
            return (
              <div key={name}>
                {ancestors &&
                  ancestors.map((ancestor, i) => (
                    <div className={styles.ancestor} key={`ancestor_${i}`}>
                      {last(ancestor.split("/"))}
                    </div>
                  ))}
                <button
                  className={styles.breadCrumb}
                  disabled={i !== this.props.editor.scenes.length - 2}
                  onClick={this.popScene}
                >
                  {name}
                </button>
              </div>
            );
          })}
        </div>
        <FileDropTarget onDropFile={this.onDropFile}>
          <HotKeys className={styles.tree} handlers={this.state.hierarchyHotKeyHandlers}>
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
        </FileDropTarget>
        {this.renderWarnings()}
      </div>
    );
  }
}

export default withEditor(withDialog(HierarchyPanelContainer));
