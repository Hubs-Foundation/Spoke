import React, { Component } from "react";
import PropTypes from "prop-types";
import FileDropTarget from "../FileDropTarget";
import Tree from "@robertlong/react-ui-tree";
import classNames from "classnames";
import { ContextMenu, MenuItem, ContextMenuTrigger, connectMenu } from "react-contextmenu";
import styles from "./HierarchyPanelContainer.scss";
import { withEditor } from "../contexts/EditorContext";
import { withDialog } from "../contexts/DialogContext";
import { withSceneActions } from "../contexts/SceneActionsContext";
import "../../vendor/react-ui-tree/index.scss";
import "../../vendor/react-contextmenu/index.scss";
import SnackBar from "../SnackBar";
import ReactTooltip from "react-tooltip";
import ErrorDialog from "../dialogs/ErrorDialog";

function collectNodeMenuProps({ node }) {
  return node;
}

class HierarchyPanelContainer extends Component {
  static propTypes = {
    path: PropTypes.array,
    editor: PropTypes.object,
    sceneActions: PropTypes.object,
    showDialog: PropTypes.func,
    hideDialog: PropTypes.func
  };

  constructor(props) {
    super(props);

    this.state = {
      tree: this.props.editor.getNodeHierarchy()
    };

    this.clicked = null;
    this.doubleClickTimeout = null;

    const editor = this.props.editor;
    editor.signals.sceneSet.add(this.rebuildNodeHierarchy);
    editor.signals.sceneGraphChanged.add(this.rebuildNodeHierarchy);
    editor.signals.objectChanged.add(this.rebuildNodeHierarchy);
    editor.signals.objectSelected.add(this.rebuildNodeHierarchy);
  }

  onDropFile = async item => {
    if (item.file) {
      const file = item.file;

      if (file.ext === ".gltf" || file.ext === ".glb") {
        try {
          this.props.editor.addGLTFModelNode(file.name, file.uri);
        } catch (e) {
          this.props.showDialog(ErrorDialog, {
            title: "Error adding model.",
            message: e.message
          });
        }
      }
    }
  };

  onChange = (tree, parent, node) => {
    if (!node) {
      // parent and node are null when expanding/collapsing the tree.
      const collapsed = this.props.editor.isCollapsed(tree.object);
      this.props.editor.setCollapsed(tree.object, !collapsed);
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

    this.props.editor.moveObject(object, newParent.object, newBefore);
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
    this.props.editor.createNode("New_Node", node.object);
  };

  onDuplicateNode = (e, node) => {
    this.props.editor.duplicateObject(node.object);
  };

  onDeleteNode = (e, node) => {
    this.props.editor.deleteObject(node.object);
  };

  onClickBreadCrumb = () => {
    this.props.sceneActions.onPopScene();
  };

  rebuildNodeHierarchy = () => {
    this.setState({
      tree: this.props.editor.getNodeHierarchy()
    });
  };

  getNodeType = node => {
    const prefix = "icon-";
    if (!node.object.parent) {
      return prefix + "root";
    }
    if (
      this.props.editor.getComponent(node.object, "scene-reference") ||
      this.props.editor.getComponent(node.object, "gltf-model")
    ) {
      return prefix + "scene";
    }
    return prefix + "node";
  };

  renderNode = node => {
    const isMissingChild = node.object.userData._missing && !node.object.userData._isMissingRoot;
    const isDuplicateChild = node.object.userData._duplicate && !node.object.userData._isDuplicateRoot;
    const disableEditing =
      node.object.userData._duplicate || node.object.userData._isDuplicateRoot || node.object.userData._isMissingRoot;
    const nodeType = this.getNodeType(node);
    const onMouseDown = disableEditing ? e => e.stopPropagation() : e => this.onMouseDownNode(e, node);
    return (
      <ContextMenuTrigger
        attributes={{
          className: classNames("node", nodeType, {
            "is-active": this.props.editor.selected && node.object.id === this.props.editor.selected.id,
            conflict: disableEditing,
            "error-root": node.object.userData._isMissingRoot ? node.object.userData._missing : false,
            "warning-root": node.object.userData._isDuplicateRoot ? node.object.userData._duplicate : false,
            disabled: isMissingChild || isDuplicateChild
          }),
          onMouseDown
        }}
        holdToDisplay={-1}
        id="hierarchy-node-menu"
        node={node}
        collect={collectNodeMenuProps}
      >
        <div className={styles.treeNode}>{this.renderNodeName(node)}</div>
      </ContextMenuTrigger>
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
    const hasParent = node && node.object.parent;
    return (
      <ContextMenu id="hierarchy-node-menu">
        <MenuItem onClick={this.onAddNode}>New Node</MenuItem>
        {hasParent && <MenuItem divider />}
        {hasParent && (
          <MenuItem onClick={this.onDuplicateNode}>
            Duplicate
            <div className={styles.menuHotkey}>⌘D</div>
          </MenuItem>
        )}
        {hasParent && <MenuItem onClick={this.onDeleteNode}>Delete</MenuItem>}
      </ContextMenu>
    );
  };

  HierarchyNodeMenu = connectMenu("hierarchy-node-menu")(this.renderHierarchyNodeMenu);

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
        <FileDropTarget onDropFile={this.onDropFile}>
          <div className={styles.tree}>
            <Tree
              paddingLeft={8}
              isNodeCollapsed={false}
              draggable={true}
              tree={this.state.tree}
              renderNode={this.renderNode}
              onChange={this.onChange}
            />
            <this.HierarchyNodeMenu />
          </div>
        </FileDropTarget>
        {this.renderWarnings()}
      </div>
    );
  }
}

export default withEditor(withDialog(withSceneActions(HierarchyPanelContainer)));
