import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import Tree from "@robertlong/react-ui-tree";
import "../styles/vendor/react-ui-tree/index.scss";
import "../styles/vendor/react-contextmenu/index.scss";
import { ContextMenu, MenuItem, ContextMenuTrigger, connectMenu } from "react-contextmenu";
import styles from "./HierarchyPanelContainer.scss";
import { withEditor } from "../contexts/EditorContext";
import { withDialog } from "../contexts/DialogContext";
import DefaultNodeEditor from "../properties/DefaultNodeEditor";
import { cmdOrCtrlString } from "../utils";

function collectNodeMenuProps({ node }) {
  return node;
}

function buildNodeHierarchy(object, selectedObjects) {
  const collapsed = object.isCollapsed;

  const node = {
    object,
    collapsed,
    selected: selectedObjects.indexOf(object) !== -1
  };

  if (object.children.length !== 0) {
    node.children = object.children
      .filter(child => child.isNode)
      .map(child => buildNodeHierarchy(child, selectedObjects));
  }

  return node;
}

class HierarchyPanelContainer extends Component {
  static propTypes = {
    path: PropTypes.array,
    editor: PropTypes.object,
    showDialog: PropTypes.func,
    hideDialog: PropTypes.func
  };

  constructor(props) {
    super(props);

    this.state = {
      tree: buildNodeHierarchy(props.editor.scene, props.editor.selected),
      singleClicked: null
    };

    this.doubleClickTimeout = null;
  }

  componentDidMount() {
    const editor = this.props.editor;
    editor.addListener("sceneGraphChanged", this.rebuildNodeHierarchy);
    editor.addListener("selectionChanged", this.rebuildNodeHierarchy);
    editor.addListener("objectsChanged", this.onObjectsChanged);
  }

  componentWillUnmount() {
    const editor = this.props.editor;
    editor.removeListener("sceneGraphChanged", this.rebuildNodeHierarchy);
    editor.removeListener("selectionChanged", this.rebuildNodeHierarchy);
    editor.removeListener("objectsChanged", this.onObjectsChanged);
  }

  onObjectsChanged = (_objects, property) => {
    if (property === "name") {
      this.rebuildNodeHierarchy();
    }
  };

  onChange = (tree, parent, node) => {
    if (!node) {
      // parent and node are null when expanding/collapsing the tree.
      tree.object.isCollapsed = !tree.object.isCollapsed;
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

    this.props.editor.reparent(object, newParent.object, newBefore);
  };

  onClickNode = (e, node) => {
    // Prevent double click on right click.
    if (e.button !== 0) {
      this.setState({ singleClicked: null });
      clearTimeout(this.doubleClickTimeout);
      return;
    }

    if (this.state.singleClicked === node.object) {
      this.props.editor.spokeControls.focus([node.object]);
      return;
    }

    if (e.metaKey || e.ctrlKey) {
      this.props.editor.toggleSelection(node.object);
    } else {
      this.props.editor.setSelection([node.object]);
    }

    this.setState({ singleClicked: node.object });

    clearTimeout(this.doubleClickTimeout);
    this.doubleClickTimeout = setTimeout(() => {
      this.setState({ singleClicked: null });
    }, 500);
  };

  onDuplicateNode = (e, node) => {
    this.props.editor.duplicate(node.object);
  };

  onDeleteNode = (e, node) => {
    this.props.editor.removeObject(node.object);
  };

  rebuildNodeHierarchy = () => {
    const editor = this.props.editor;
    this.setState({
      tree: buildNodeHierarchy(editor.scene, editor.selected)
    });
  };

  getNodeIconClassName = node => {
    const NodeEditor = this.props.editor.getNodeEditor(node) || DefaultNodeEditor;
    return NodeEditor.iconClassName || DefaultNodeEditor.iconClassName;
  };

  renderNode = node => {
    const iconClassName = this.getNodeIconClassName(node.object);

    const className = classNames("node", {
      "is-active": node.selected
    });
    const onClick = e => this.onClickNode(e, node);

    const content = (
      <div className={styles.treeNode}>
        <i className={classNames("fas", iconClassName)} />
        {this.renderNodeName(node)}
      </div>
    );

    if (!node.object.parent) {
      return (
        <div className={className} onClick={onClick}>
          {content}
        </div>
      );
    }

    return (
      <ContextMenuTrigger
        attributes={{
          className,
          onClick
        }}
        holdToDisplay={-1}
        id="hierarchy-node-menu"
        node={node}
        collect={collectNodeMenuProps}
      >
        {content}
      </ContextMenuTrigger>
    );
  };

  renderNodeName = node => {
    return <div>{node.object.name}</div>;
  };

  renderHierarchyNodeMenu = () => {
    return (
      <ContextMenu id="hierarchy-node-menu">
        <MenuItem onClick={this.onDuplicateNode}>
          Duplicate
          <div className={styles.menuHotkey}>{cmdOrCtrlString + "+ D"}</div>
        </MenuItem>
        <MenuItem onClick={this.onDeleteNode}>Delete</MenuItem>
      </ContextMenu>
    );
  };

  HierarchyNodeMenu = connectMenu("hierarchy-node-menu")(this.renderHierarchyNodeMenu);

  render() {
    return (
      <div className={styles.hierarchyRoot}>
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
      </div>
    );
  }
}

export default withEditor(withDialog(HierarchyPanelContainer));
