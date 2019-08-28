import React, { useContext, useState, useEffect, useCallback, useMemo } from "react";
import styled from "styled-components";
import PropTypes from "prop-types";
import DefaultNodeEditor from "../properties/DefaultNodeEditor";
import classnames from "classnames";
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";
import "../styles/vendor/react-contextmenu/index.scss";
import { cmdOrCtrlString } from "../utils";
import Panel from "../layout/Panel";
import { EditorContext } from "../contexts/EditorContext";
import { useDrag, useDrop } from "react-dnd";
import { getEmptyImage } from "react-dnd-html5-backend";
import { ItemTypes } from "../dnd";
import traverseEarlyOut from "../../editor/utils/traverseEarlyOut";

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
  margin-right: 4px;
`;

const TreeNodeLabel = styled.div`
  background-color: ${props => (props.isOver && props.canDrop ? "rgba(255, 255, 255, 0.3)" : "transparent")};
  color: ${props => (props.isOver && props.canDrop ? props.theme.text : "inherit")};
  border-radius: 4px;
  padding: 0 2px;
`;

function borderStyle({ isOver, canDrop, position }) {
  if (isOver && canDrop) {
    return `border-${position === "before" ? "top" : "bottom"}: 2px solid rgba(255, 255, 255, 0.3)`;
  } else {
    return "";
  }
}

const TreeNodeDropTarget = styled.div`
  height: 4px;
  box-sizing: content-box;
  ${borderStyle};
`;

const TreeNodeRenameInput = styled.input`
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

function isAncestor(object, otherObject) {
  return !traverseEarlyOut(object, child => child !== otherObject);
}

function TreeNode(props) {
  const { node, ...rest } = props;

  const editor = useContext(EditorContext);

  const onToggle = useCallback(
    e => {
      e.stopPropagation();

      if (props.onToggle) {
        props.onToggle(e, node);
      }
    },
    [props.onToggle, node]
  );

  const onKeyDown = useCallback(
    e => {
      e.stopPropagation();

      if (props.onKeyDown) {
        props.onKeyDown(e, node);
      }
    },
    [props.onKeyDown, node]
  );

  const onKeyDownNameInput = useCallback(
    e => {
      if (e.key === "Escape") {
        props.onRenameSubmit(node, null);
      } else if (e.key === "Enter") {
        props.onRenameSubmit(node, e.target.value);
      }
    },
    [props.onRenameSubmit, node]
  );

  const renaming = props.renamingNode && props.renamingNode.id === node.id;
  const collapsed = props.collapsedNodes[node.id] === true;

  const [_dragProps, drag, preview] = useDrag({
    item: { type: ItemTypes.Node },
    begin() {
      const multiple = editor.selected.length > 1;
      return { type: ItemTypes.Node, multiple, value: multiple ? editor.selected : editor.selected[0] };
    },
    canDrag() {
      return !editor.selected.some(object => !object.parent);
    },
    collect: monitor => ({
      isDragging: !!monitor.isDragging()
    })
  });

  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, []);

  const [{ canDropBefore, isOverBefore }, beforeDropTarget] = useDrop({
    accept: ItemTypes.Node,
    drop(item) {
      if (item.multiple) {
        editor.reparentMultiple(item.value, node.object.parent, node.object);
      } else {
        editor.reparent(item.value, node.object.parent, node.object);
      }
    },
    canDrop(item) {
      return !(item.multiple
        ? item.value.some(otherObject => isAncestor(otherObject, node.object))
        : isAncestor(item.value, node.object));
    },
    collect: monitor => ({
      canDropBefore: monitor.canDrop(),
      isOverBefore: monitor.isOver()
    })
  });

  const [{ canDropAfter, isOverAfter }, afterDropTarget] = useDrop({
    accept: ItemTypes.Node,
    drop(item) {
      const next = !node.last && node.parent.children[node.index + 1];
      if (item.multiple) {
        editor.reparentMultiple(item.value, node.object.parent, next && next.object);
      } else {
        editor.reparent(item.value, node.object.parent, next && next.object);
      }
    },
    canDrop(item) {
      return !(item.multiple
        ? item.value.some(otherObject => isAncestor(otherObject, node.object))
        : isAncestor(item.value, node.object));
    },
    collect: monitor => ({
      canDropAfter: monitor.canDrop(),
      isOverAfter: monitor.isOver()
    })
  });

  const [{ canDropOn, isOverOn }, onDropTarget] = useDrop({
    accept: ItemTypes.Node,
    drop(item) {
      if (item.multiple) {
        editor.reparentMultiple(item.value, node.object);
      } else {
        editor.reparent(item.value, node.object);
      }
    },
    canDrop(item) {
      return !(item.multiple
        ? item.value.some(otherObject => isAncestor(otherObject, node.object))
        : isAncestor(item.value, node.object));
    },
    collect: monitor => ({
      canDropOn: monitor.canDrop(),
      isOverOn: monitor.isOver()
    })
  });

  return (
    <TreeDepthContainer>
      <ContextMenuTrigger holdToDisplay={-1} id="hierarchy-node-menu" node={node} collect={collectNodeMenuProps}>
        <TreeNodeContainer
          ref={drag}
          id={getNodeElId(node)}
          node={node}
          onMouseDown={e => props.onMouseDown(e, node)}
          onClick={e => props.onClick(e, node)}
          tabIndex="0"
          onKeyDown={onKeyDown}
          root={node.depth === 0}
          selected={node.selected}
          active={node.active}
        >
          <TreeNodeDropTarget
            ref={beforeDropTarget}
            depth={node.depth}
            position="before"
            canDrop={canDropBefore}
            isOver={isOverBefore}
          />
          <TreeNodeContent depth={node.depth} ref={onDropTarget}>
            {node.leaf ? (
              <TreeNodeLeafSpacer />
            ) : (
              <TreeNodeToggle
                collapsed={collapsed}
                className={classnames("fas", {
                  "fa-caret-right": collapsed,
                  "fa-caret-down": !collapsed
                })}
                onClick={onToggle}
              />
            )}

            <TreeNodeSelectTarget>
              <TreeNodeIcon className={classnames("fas", node.iconClassName)} />
              {renaming ? (
                <TreeNodeRenameInputContainer>
                  <TreeNodeRenameInput
                    type="text"
                    onChange={e => props.onChangeName(node, e.target.value)}
                    onKeyDown={onKeyDownNameInput}
                    onBlur={e => props.onRenameSubmit(node, e.target.value)}
                    value={props.renamingNode.name}
                    autoFocus
                  />
                </TreeNodeRenameInputContainer>
              ) : (
                <TreeNodeLabel canDrop={canDropOn} isOver={isOverOn}>
                  {node.label}
                </TreeNodeLabel>
              )}
            </TreeNodeSelectTarget>
          </TreeNodeContent>

          <TreeNodeDropTarget
            depth={node.depth}
            ref={afterDropTarget}
            position="after"
            canDrop={canDropAfter}
            isOver={isOverAfter}
          />
        </TreeNodeContainer>
      </ContextMenuTrigger>
      {node.children && node.children.length > 0 && !collapsed && (
        <TreeNodeList>
          {node.children.map(child => (
            <TreeNode key={child.id} node={child} {...rest} />
          ))}
        </TreeNodeList>
      )}
    </TreeDepthContainer>
  );
}

TreeNode.propTypes = {
  node: PropTypes.object.isRequired,
  collapsedNodes: PropTypes.object.isRequired,
  renamingNode: PropTypes.object,
  onRenameSubmit: PropTypes.func.isRequired,
  onChangeName: PropTypes.func.isRequired,
  onMouseDown: PropTypes.func.isRequired,
  onClick: PropTypes.func.isRequired,
  onToggle: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func.isRequired
};

function buildNodeHierarchy(editor, object = null, parent = null, index = 0, last = true, depth = 0) {
  object = object || editor.scene;

  const NodeEditor = editor.getNodeEditor(object) || DefaultNodeEditor;
  const iconClassName = NodeEditor.iconClassName || DefaultNodeEditor.iconClassName;

  const node = {
    id: object.id,
    object,
    iconClassName,
    label: object.name,
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
        buildNodeHierarchy(editor, child, node, index, index === object.children.length - 1, depth + 1)
      );
  }

  node.leaf = !(node.children && node.children.length > 0);

  return node;
}

function getVisibleTreeNodes(node, collapsedNodes, acc = []) {
  if (!node) {
    return acc;
  }

  acc.push(node);

  if (!collapsedNodes[node.id] && node.children) {
    for (const child of node.children) {
      getVisibleTreeNodes(child, collapsedNodes, acc);
    }
  }

  return acc;
}

export default function HierarchyPanel() {
  const editor = useContext(EditorContext);

  const [sceneRootNode, setSceneRootNode] = useState(null);
  const [renamingNode, setRenamingNode] = useState(null);

  const updateNodeHierarchy = useCallback(() => {
    setSceneRootNode(buildNodeHierarchy(editor));
  }, [editor]);

  const [collapsedNodes, setCollapsedNodes] = useState({});

  const visibleNodes = useMemo(() => getVisibleTreeNodes(sceneRootNode, collapsedNodes), [
    collapsedNodes,
    sceneRootNode
  ]);

  const expandNode = useCallback(
    node => {
      delete collapsedNodes[node.id];
      setCollapsedNodes({ ...collapsedNodes });
    },
    [collapsedNodes]
  );

  const collapseNode = useCallback(
    node => {
      setCollapsedNodes({ ...collapsedNodes, [node.id]: true });
    },
    [collapsedNodes]
  );

  const expandChildren = useCallback(
    node => {
      traverse(node, child => {
        collapsedNodes[child.id] = true;
      });
      setCollapsedNodes({ ...collapsedNodes });
    },
    [collapsedNodes]
  );

  const collapseChildren = useCallback(
    node => {
      traverse(node, child => {
        delete collapsedNodes[child.id];
      });
      setCollapsedNodes({ ...collapsedNodes });
    },
    [collapsedNodes]
  );

  const onExpandAllNodes = useCallback(() => {
    setCollapsedNodes({});
  });

  const onCollapseAllNodes = useCallback(() => {
    const newCollapsedNodes = {};
    traverse(sceneRootNode, child => {
      newCollapsedNodes[child.id] = true;
    });
    setCollapsedNodes(newCollapsedNodes);
  });

  const onObjectChanged = useCallback(
    (objects, propertyName) => {
      if (propertyName === "name" || !propertyName) {
        updateNodeHierarchy();
      }
    },
    [updateNodeHierarchy]
  );

  useEffect(() => {
    editor.addListener("sceneGraphChanged", updateNodeHierarchy);
    editor.addListener("selectionChanged", updateNodeHierarchy);
    editor.addListener("objectsChanged", onObjectChanged);

    return () => {
      editor.removeListener("sceneGraphChanged", updateNodeHierarchy);
      editor.removeListener("selectionChanged", updateNodeHierarchy);
      editor.removeListener("objectsChanged", onObjectChanged);
    };
  }, [editor, updateNodeHierarchy]);

  const onMouseDown = useCallback(
    (e, node) => {
      if (e.shiftKey) {
        editor.toggleSelection(node.object);
      } else if (!node.selected) {
        editor.setSelection([node.object]);
      }
    },
    [editor]
  );

  const onClick = useCallback(
    (e, node) => {
      if (!e.shiftKey) {
        editor.setSelection([node.object]);
      }
    },
    [editor]
  );

  const onToggle = useCallback(
    (_e, node) => {
      if (collapsedNodes[node.id]) {
        expandNode(node);
      } else {
        collapseNode(node);
      }
    },
    [collapsedNodes]
  );

  const onKeyDown = useCallback(
    (e, node) => {
      if (!node) {
        node = sceneRootNode;
      }

      if (e.key === "ArrowDown") {
        const visibleNodeIndex = visibleNodes.indexOf(node);
        const nextNode = visibleNodeIndex !== -1 && visibleNodes[visibleNodeIndex + 1];

        if (nextNode) {
          if (e.shiftKey) {
            editor.select(nextNode.object);
          }

          const nextNodeEl = document.getElementById(getNodeElId(nextNode));

          if (nextNodeEl) {
            nextNodeEl.focus();
          }
        }
      } else if (e.key === "ArrowUp") {
        const visibleNodeIndex = visibleNodes.indexOf(node);
        const prevNode = visibleNodeIndex !== -1 && visibleNodes[visibleNodeIndex - 1];

        if (prevNode) {
          if (e.shiftKey) {
            editor.select(prevNode.object);
          }

          const prevNodeEl = document.getElementById(getNodeElId(prevNode));

          if (prevNodeEl) {
            prevNodeEl.focus();
          }
        }
      } else if (e.key === "ArrowLeft" && node.children && node.children.length > 0) {
        if (e.shiftKey) {
          collapseChildren(node.object);
        } else {
          collapseNode(node);
        }
      } else if (e.key === "ArrowRight" && node.children && node.children.length > 0) {
        if (e.shiftKey) {
          expandChildren(node.object);
        } else if (node.children.length > 0) {
          expandNode(node);
        }
      } else if (e.key === "Enter") {
        if (e.shiftKey) {
          editor.toggleSelection(node.object);
        } else {
          editor.setSelection([node.object]);
        }
      }
    },
    [editor, sceneRootNode, visibleNodes, expandNode, collapseNode, expandChildren, collapseChildren]
  );

  const onDeleteNode = useCallback(
    (e, node) => {
      if (node.selected) {
        editor.removeSelectedObjects();
      } else {
        editor.removeObject(node.object);
      }
    },
    [editor]
  );

  const onDuplicateNode = useCallback(
    (e, node) => {
      if (node.selected) {
        editor.duplicateSelected();
      } else {
        editor.duplicate(node.object);
      }
    },
    [editor]
  );

  const onRenameNode = useCallback(
    (e, node) => {
      setRenamingNode({ id: node.id, name: node.object.name });
    },
    [setRenamingNode]
  );

  const onChangeName = useCallback(
    (node, name) => {
      setRenamingNode({ id: node.id, name });
    },
    [setRenamingNode]
  );

  const onRenameSubmit = useCallback(
    (node, name) => {
      if (name !== null) {
        editor.setProperty(node.object, "name", name);
      }
      setRenamingNode(null);
    },
    [editor]
  );

  return (
    <Panel id="hierarchy-panel" title="Hierarchy" icon="fa-project-diagram">
      <PanelContainer>
        <TreeContainer>
          <TreeNodeList>
            {sceneRootNode && (
              <TreeNode
                node={sceneRootNode}
                renamingNode={renamingNode}
                collapsedNodes={collapsedNodes}
                onChangeName={onChangeName}
                onRenameSubmit={onRenameSubmit}
                onMouseDown={onMouseDown}
                onClick={onClick}
                onToggle={onToggle}
                onKeyDown={onKeyDown}
              />
            )}
          </TreeNodeList>
        </TreeContainer>
        <ContextMenu id="hierarchy-node-menu">
          <MenuItem onClick={onRenameNode}>Rename</MenuItem>
          <MenuItem onClick={onDuplicateNode}>
            Duplicate
            <div>{cmdOrCtrlString + "+ D"}</div>
          </MenuItem>
          <MenuItem onClick={onDeleteNode}>Delete</MenuItem>
          <MenuItem onClick={onExpandAllNodes}>Expand All</MenuItem>
          <MenuItem onClick={onCollapseAllNodes}>Collapse All</MenuItem>
        </ContextMenu>
      </PanelContainer>
    </Panel>
  );
}
