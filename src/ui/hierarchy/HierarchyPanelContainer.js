import React, { Component, createRef } from "react";
import styled from "styled-components";
import PropTypes from "prop-types";
import DefaultNodeEditor from "../properties/DefaultNodeEditor";
import classnames from "classnames";
import { withEditor } from "../contexts/EditorContext";
import { ContextMenu, MenuItem, ContextMenuTrigger, connectMenu } from "react-contextmenu";
import "../styles/vendor/react-contextmenu/index.scss";
import { cmdOrCtrlString } from "../utils";

function collectNodeMenuProps({ node }) {
  return node;
}

const PanelContainer = styled.div`
  outline: none;
  user-select: none;
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  color: ${props => props.theme.text2};
  overflow: auto;
`;

const TreeContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const TreeNodeList = styled.ul``;

const TreeDepthContainer = styled.li``;

function treeNodeBackgroundColor({ root, selected, active, theme }) {
  if (selected) {
    if (active) {
      return theme.bluePressed;
    } else {
      return theme.selected;
    }
  } else {
    if (root) {
      return theme.panel2;
    } else {
      return theme.panel;
    }
  }
}

function getNodeElId(node) {
  return "hierarchy-node-" + node.id;
}

function traverse(node, cb) {
  cb(node);

  if (node.children) {
    for (const child of node.children) {
      traverse(child, cb);
    }
  }
}

const TreeNodeContainer = styled.div`
  display: flex;
  flex-direction: column;
  outline: none;
  overflow: hidden;

  background-color: ${treeNodeBackgroundColor};
  border-bottom: ${props => (props.root ? props.theme.borderStyle : "none")};

  color: ${props => (props.selected || props.focused ? props.theme.text : props.theme.text2)};

  :hover,
  :focus {
    background-color: ${props => (props.selected ? props.theme.blueHover : props.theme.hover)};
    color: ${props => props.theme.text};
  }

  :active {
    background-color: ${props => props.theme.bluePressed};
    color: ${props => props.theme.text};
  }
`;

const TreeNodeSelectTarget = styled.div`
  display: flex;
  flex: 1;
  padding: 2px 0;
`;

const TreeNodeContent = styled.div`
  outline: none;
  display: flex;
  padding-right: 8px;
  padding-left: ${props => props.depth * 8 + 2 + "px"};
`;

const TreeNodeToggle = styled.div`
  padding: 2px 6px;
  margin: 0 2px;

  :hover {
    color: ${props => props.theme.text};
    background-color: ${props => props.theme.hover2};
    border-radius: 3px;
  }
`;

const TreeNodeLeafSpacer = styled.div`
  width: 20px;
`;

const TreeNodeIcon = styled.div`
  margin-right: 6px;
`;

const TreeNodeLabel = styled.div``;

const TreeNodeDropTargetContainer = styled.div`
  height: 4px;
`;

const TreeNodeRenameInput = styled.input.attrs(() => ({ type: "text" }))`
  position: absolute;
  top: -3px;
  background-color: ${props => props.theme.inputBackground};
  color: ${props => props.theme.text};
  border: ${props => props.theme.borderStyle};
  padding: 2px 4px;
`;

const TreeNodeRenameInputContainer = styled.div`
  position: relative;
  height: 15px;
`;

class TreeNodeDropTarget extends Component {
  render() {
    return <TreeNodeDropTargetContainer />;
  }
}

class TreeNode extends Component {
  static propTypes = {
    node: PropTypes.object,
    renamingNodeId: PropTypes.number,
    renamingNodeValue: PropTypes.string,
    onRenameSubmit: PropTypes.func,
    onChangeName: PropTypes.func,
    onClick: PropTypes.func,
    onToggle: PropTypes.func,
    onContextMenu: PropTypes.func,
    onKeyDown: PropTypes.func
  };

  onClick = e => {
    if (this.props.onClick) {
      this.props.onClick(e, this.props.node);
    }
  };

  onContextMenu = e => {
    if (this.props.onContextMenu) {
      this.props.onContextMenu(e, this.props.node);
    }
  };

  onToggle = e => {
    e.stopPropagation();

    if (this.props.onToggle) {
      this.props.onToggle(e, this.props.node);
    }
  };

  onKeyDown = e => {
    e.stopPropagation();

    if (this.props.onKeyDown) {
      this.props.onKeyDown(e, this.props.node);
    }
  };

  onChangeNameInput = e => {
    this.props.onChangeName(this.props.node, e.target.value);
  };

  onKeyDownNameInput = e => {
    if (e.key === "Escape") {
      this.props.onRenameSubmit(this.props.node, null);
    } else if (e.key === "Enter") {
      this.props.onRenameSubmit(this.props.node, e.target.value);
    }
  };

  onBlurNameInput = e => {
    this.props.onRenameSubmit(this.props.node, e.target.value);
  };

  render() {
    const { node, ...rest } = this.props;

    const renaming = this.props.renamingNodeId === node.id;

    return (
      <TreeDepthContainer>
        <ContextMenuTrigger holdToDisplay={-1} id="hierarchy-node-menu" node={node} collect={collectNodeMenuProps}>
          <TreeNodeContainer
            id={getNodeElId(node)}
            node={node}
            onClick={this.onClick}
            tabIndex="0"
            onKeyDown={this.onKeyDown}
            root={node.depth === 0}
            selected={node.selected}
            active={node.active}
          >
            <TreeNodeDropTarget />
            <TreeNodeContent depth={node.depth}>
              {node.leaf ? (
                <TreeNodeLeafSpacer />
              ) : (
                <TreeNodeToggle
                  collapsed={node.collapsed}
                  className={classnames("fas", {
                    "fa-caret-right": node.collapsed,
                    "fa-caret-down": !node.collapsed
                  })}
                  onClick={this.onToggle}
                />
              )}

              <TreeNodeSelectTarget>
                <TreeNodeIcon className={classnames("fas", node.iconClassName)} />
                {renaming ? (
                  <TreeNodeRenameInputContainer>
                    <TreeNodeRenameInput
                      onChange={this.onChangeNameInput}
                      onKeyDown={this.onKeyDownNameInput}
                      onBlur={this.onBlurNameInput}
                      value={this.props.renamingNodeValue}
                      autoFocus
                    />
                  </TreeNodeRenameInputContainer>
                ) : (
                  <TreeNodeLabel>{node.label}</TreeNodeLabel>
                )}
              </TreeNodeSelectTarget>
            </TreeNodeContent>

            <TreeNodeDropTarget />
          </TreeNodeContainer>
        </ContextMenuTrigger>
        {node.children && node.children.length > 0 && !node.collapsed && (
          <TreeNodeList>
            {node.children.map(child => (
              <TreeNode key={child.id} node={child} {...rest} />
            ))}
          </TreeNodeList>
        )}
      </TreeDepthContainer>
    );
  }
}

class HierarchyPanelContainer extends Component {
  static propTypes = {
    editor: PropTypes.object.isRequired
  };

  state = {
    sceneRootNode: null,
    renamingNodeId: null,
    renamingNodeValue: "",
    collapsedNodes: new Set()
  };

  panelContainerRef = createRef();

  componentDidMount() {
    this.props.editor.addListener("sceneGraphChanged", this.onSceneGraphChanged);
    this.props.editor.addListener("selectionChanged", this.onSelectionChanged);
  }

  componentWillUnmount() {
    this.props.editor.removeListener("sceneGraphChanged", this.onSceneGraphChanged);
    this.props.editor.removeListener("selectionChanged", this.onSelectionChanged);
  }

  onSceneGraphChanged = () => {
    this._updateNodeHierarchy();
  };

  onSelectionChanged = () => {
    this._updateNodeHierarchy();
  };

  onClick = (e, node) => {
    if (e.shiftKey) {
      this.props.editor.toggleSelection(node.object);
    } else {
      this.props.editor.setSelection([node.object]);
    }
  };

  onToggle = (e, node) => {
    if (this.state.collapsedNodes.has(node.id)) {
      this.state.collapsedNodes.delete(node.id);
    } else {
      this.state.collapsedNodes.add(node.id);
    }

    this._updateNodeHierarchy();
  };

  onKeyDown = (e, node) => {
    if (!node) {
      node = this.state.sceneRootNode;
    }

    if (e.key === "ArrowDown") {
      let nextNode;

      if (node.last) {
        if (node.children.length === 0) {
          nextNode = null;
        } else {
          nextNode = node.children[0];
        }
      } else {
        if (node.parent) {
          nextNode = node.parent.children[node.index + 1];
        } else {
          nextNode = null;
        }
      }

      if (nextNode) {
        if (e.shiftKey) {
          this.props.editor.select(nextNode.object);
        }

        const nextNodeEl = document.getElementById(getNodeElId(nextNode));

        if (nextNodeEl) {
          nextNodeEl.focus();
        }
      }
    } else if (e.key === "ArrowUp") {
      let nextNode;

      if (node.index === 0) {
        if (node.parent) {
          nextNode = node.parent;
        } else {
          nextNode = null;
        }
      } else {
        if (node.parent) {
          nextNode = node.parent.children[node.index - 1];
        } else {
          nextNode = null;
        }
      }

      if (nextNode) {
        if (e.shiftKey) {
          this.props.editor.select(nextNode.object);
        }

        const nextNodeEl = document.getElementById(getNodeElId(nextNode));

        if (nextNodeEl) {
          nextNodeEl.focus();
        }
      }
    } else if (e.key === "ArrowLeft") {
      if (e.shiftKey) {
        this.collapseChildren(node.object);
      } else {
        if (node.children.length > 0) {
          this.state.collapsedNodes.add(node.id);
          this._updateNodeHierarchy();
        }
      }
    } else if (e.key === "ArrowRight") {
      if (e.shiftKey) {
        this.expandChildren(node.object);
      } else {
        if (node.children.length > 0) {
          this.state.collapsedNodes.delete(node.id);
          this._updateNodeHierarchy();
        }
      }
    } else if (e.key === "Enter") {
      if (e.shiftKey) {
        this.props.editor.toggleSelection(node.object);
      } else {
        this.props.editor.setSelection([node.object]);
      }
    }
  };

  onDeleteNode = (e, node) => {
    if (node.selected) {
      this.props.editor.removeSelectedObjects();
    } else {
      this.props.editor.removeObject(node.object);
    }
  };

  onDuplicateNode = (e, node) => {
    if (node.selected) {
      this.props.editor.duplicateSelected();
    } else {
      this.props.editor.duplicate(node.object);
    }
  };

  expandChildren(node) {
    traverse(node, child => {
      this.state.collapsedNodes.delete(child.id);
    });
    this._updateNodeHierarchy();
  }

  collapseChildren(node) {
    traverse(node, child => {
      this.state.collapsedNodes.add(child.id);
    });
    this._updateNodeHierarchy();
  }

  onRenameNode = (e, node) => {
    this.setState({ renamingNodeId: node.id, renamingNodeValue: node.object.name });
  };

  onChangeName = (node, value) => {
    this.setState({ renamingNodeValue: value });
  };

  onRenameSubmit = (node, value) => {
    if (value !== null) {
      this.props.editor.setProperty(node.object, "name", value);
    }

    this._updateNodeHierarchy();
  };

  onExpandAll = () => {
    this.state.collapsedNodes.clear();
    this._updateNodeHierarchy();
  };

  onCollapseAll = () => {
    traverse(this.state.sceneRootNode, child => {
      this.state.collapsedNodes.add(child.id);
    });
    this._updateNodeHierarchy();
  };

  _buildNodeHierarchy = (object, state, parent = null, index = 0, last = true, depth = 0) => {
    const editor = this.props.editor;
    const NodeEditor = editor.getNodeEditor(object) || DefaultNodeEditor;
    const iconClassName = NodeEditor.iconClassName || DefaultNodeEditor.iconClassName;

    const node = {
      id: object.id,
      object,
      iconClassName,
      label: object.name,
      collapsed: state.collapsedNodes.has(object.id),
      selected: editor.selected.indexOf(object) !== -1,
      active: editor.selected.length > 0 && object === editor.selected[editor.selected.length - 1],
      index,
      last,
      depth,
      parent
    };

    if (object.children.length !== 0) {
      node.children = object.children
        .filter(child => child.isNode)
        .map((child, index) =>
          this._buildNodeHierarchy(child, state, node, index, index === object.children.length - 1, depth + 1)
        );
    }

    node.leaf = !(node.children && node.children.length > 0);

    return node;
  };

  _updateNodeHierarchy() {
    this.setState({
      sceneRootNode: this._buildNodeHierarchy(this.props.editor.scene, this.state),
      collapsedNodes: this.state.collapsedNodes,
      renamingNodeId: null,
      renamingNodeValue: ""
    });
  }

  renderNodeContextMenu = () => {
    return (
      <ContextMenu id="hierarchy-node-menu">
        <MenuItem onClick={this.onRenameNode}>Rename</MenuItem>
        <MenuItem onClick={this.onDuplicateNode}>
          Duplicate
          <div>{cmdOrCtrlString + "+ D"}</div>
        </MenuItem>
        <MenuItem onClick={this.onDeleteNode}>Delete</MenuItem>
        <MenuItem onClick={this.onExpandAll}>Expand All</MenuItem>
        <MenuItem onClick={this.onCollapseAll}>Collapse All</MenuItem>
      </ContextMenu>
    );
  };

  NodeContextMenu = connectMenu("hierarchy-node-menu")(this.renderNodeContextMenu);

  render() {
    const sceneRootNode = this.state.sceneRootNode;
    return (
      <PanelContainer ref={this.panelContainerRef}>
        <TreeContainer>
          <TreeNodeList>
            {sceneRootNode && (
              <TreeNode
                node={sceneRootNode}
                renamingNodeId={this.state.renamingNodeId}
                renamingNodeValue={this.state.renamingNodeValue}
                onChangeName={this.onChangeName}
                onRenameSubmit={this.onRenameSubmit}
                onClick={this.onClick}
                onContextMenu={this.onContextMenu}
                onToggle={this.onToggle}
                onKeyDown={this.onKeyDown}
              />
            )}
          </TreeNodeList>
        </TreeContainer>
        <this.NodeContextMenu />
      </PanelContainer>
    );
  }
}

export default withEditor(HierarchyPanelContainer);
