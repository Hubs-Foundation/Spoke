import React, { useContext, useState, useEffect, useCallback, memo } from "react";
import styled from "styled-components";
import PropTypes from "prop-types";
import DefaultNodeEditor from "../properties/DefaultNodeEditor";
import { ContextMenu, MenuItem, ContextMenuTrigger } from "../layout/ContextMenu";
import { cmdOrCtrlString } from "../utils";
import Panel from "../layout/Panel";
import { EditorContext } from "../contexts/EditorContext";
import { useDrag, useDrop } from "react-dnd";
import { getEmptyImage } from "react-dnd-html5-backend";
import { FixedSizeList, areEqual } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { ItemTypes, addAssetOnDrop, isAsset, AssetTypes } from "../dnd";
import traverseEarlyOut from "../../editor/utils/traverseEarlyOut";
import { CaretRight } from "styled-icons/fa-solid/CaretRight";
import { CaretDown } from "styled-icons/fa-solid/CaretDown";
import { ProjectDiagram } from "styled-icons/fa-solid/ProjectDiagram";
import useUpload from "../assets/useUpload";
import { AllFileTypes } from "../assets/fileTypes";
import NodeIssuesIcon from "./NodeIssuesIcon";

const uploadOptions = {
  multiple: true,
  accepts: AllFileTypes
};

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
  flex: 1;
`;

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

function getNodeKey(index, data) {
  return data.nodes[index].object.id;
}

function getNodeElId(node) {
  return "hierarchy-node-" + node.id;
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
  padding: 2px 4px 2px 0;
`;

const TreeNodeLabelContainer = styled.div`
  display: flex;
  flex: 1;
`;

const TreeNodeContent = styled.div`
  outline: none;
  display: flex;
  padding-right: 8px;
  padding-left: ${props => props.depth * 8 + 2 + "px"};
`;

const TreeNodeToggle = styled.div`
  padding: 2px 4px;
  margin: 0 4px;

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
  width: 12px;
  height: 12px;
  margin: 2px 4px;
`;

const TreeNodeLabel = styled.div`
  background-color: ${props => (props.isOver && props.canDrop ? "rgba(255, 255, 255, 0.3)" : "transparent")};
  color: ${props => (props.isOver && props.canDrop ? props.theme.text : "inherit")};
  border-radius: 4px;
  padding: 0 2px;
  text-decoration: ${props => (props.enabled ? "none" : "line-through")};
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
  margin-left: ${props => (props.depth > 0 ? props.depth * 8 + 20 : 0)}px;
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

function TreeNode({
  index,
  data: { nodes, renamingNode, onToggle, onKeyDown, onMouseDown, onClick, onChangeName, onRenameSubmit, onUpload },
  style
}) {
  const node = nodes[index];
  const { isLeaf, object, depth, selected, active, iconComponent, isExpanded, childIndex, lastChild, enabled } = node;

  const editor = useContext(EditorContext);

  const onClickToggle = useCallback(
    e => {
      e.stopPropagation();

      if (onToggle) {
        onToggle(e, node);
      }
    },
    [onToggle, node]
  );

  const onNodeKeyDown = useCallback(
    e => {
      e.stopPropagation();

      if (onKeyDown) {
        onKeyDown(e, node);
      }
    },
    [onKeyDown, node]
  );

  const onKeyDownNameInput = useCallback(
    e => {
      if (e.key === "Escape") {
        onRenameSubmit(node, null);
      } else if (e.key === "Enter") {
        onRenameSubmit(node, e.target.value);
      }
    },
    [onRenameSubmit, node]
  );

  const onClickNode = useCallback(
    e => {
      onClick(e, node);
    },
    [node, onClick]
  );

  const onMouseDownNode = useCallback(
    e => {
      onMouseDown(e, node);
    },
    [node, onMouseDown]
  );

  const onChangeNodeName = useCallback(
    e => {
      onChangeName(node, e.target.value);
    },
    [node, onChangeName]
  );

  const onSubmitNodeName = useCallback(
    e => {
      onRenameSubmit(node, e.target.value);
    },
    [onRenameSubmit, node]
  );

  const renaming = renamingNode && renamingNode.id === node.id;

  const [_dragProps, drag, preview] = useDrag({
    item: { type: ItemTypes.Node },
    begin() {
      const multiple = editor.selected.length > 1;
      return { type: ItemTypes.Node, multiple, value: multiple ? editor.selected : editor.selected[0] };
    },
    canDrag() {
      return !editor.selected.some(selectedObj => !selectedObj.parent);
    },
    collect: monitor => ({
      isDragging: !!monitor.isDragging()
    })
  });

  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  const [{ canDropBefore, isOverBefore }, beforeDropTarget] = useDrop({
    accept: [ItemTypes.Node, ItemTypes.File, ...AssetTypes],
    drop(item) {
      if (item.files) {
        onUpload(item.files).then(assets => {
          if (assets) {
            for (const asset of assets) {
              editor.addMedia(asset.url, object.parent, object);
            }
          }
        });
        return;
      }

      if (addAssetOnDrop(editor, item, object.parent, object)) {
        return;
      } else {
        if (item.multiple) {
          editor.reparentMultiple(item.value, object.parent, object);
        } else {
          editor.reparent(item.value, object.parent, object);
        }
      }
    },
    canDrop(item, monitor) {
      if (!monitor.isOver() || !object.parent) {
        return false;
      }

      if (isAsset(item)) {
        return true;
      }

      if (item.type === ItemTypes.Node) {
        return (
          object.parent &&
          !(item.multiple
            ? item.value.some(otherObject => isAncestor(otherObject, object))
            : isAncestor(item.value, object))
        );
      }

      return true;
    },
    collect: monitor => ({
      canDropBefore: monitor.canDrop(),
      isOverBefore: monitor.isOver()
    })
  });

  const [{ canDropAfter, isOverAfter }, afterDropTarget] = useDrop({
    accept: [ItemTypes.Node, ItemTypes.File, ...AssetTypes],
    drop(item) {
      const next = !lastChild && object.parent.children[childIndex + 1];

      if (item.files) {
        onUpload(item.files).then(assets => {
          if (assets) {
            for (const asset of assets) {
              editor.addMedia(asset.url, object.parent, next);
            }
          }
        });
        return;
      }

      if (addAssetOnDrop(editor, item, object.parent, next)) {
        return;
      } else {
        if (item.multiple) {
          editor.reparentMultiple(item.value, object.parent, next);
        } else {
          editor.reparent(item.value, object.parent, next);
        }
      }
    },
    canDrop(item, monitor) {
      if (!monitor.isOver() || !object.parent) {
        return false;
      }

      if (isAsset(item)) {
        return true;
      }

      if (item.type === ItemTypes.Node) {
        return (
          object.parent &&
          !(item.multiple
            ? item.value.some(otherObject => isAncestor(otherObject, object))
            : isAncestor(item.value, object))
        );
      }

      return true;
    },
    collect: monitor => ({
      canDropAfter: monitor.canDrop(),
      isOverAfter: monitor.isOver()
    })
  });

  const [{ canDropOn, isOverOn }, onDropTarget] = useDrop({
    accept: [ItemTypes.Node, ItemTypes.File, ...AssetTypes],
    drop(item) {
      if (item.files) {
        onUpload(item.files).then(assets => {
          if (assets) {
            for (const asset of assets) {
              editor.addMedia(asset.url, object);
            }
          }
        });
        return;
      }

      if (addAssetOnDrop(editor, item, object)) {
        return;
      } else {
        if (item.multiple) {
          editor.reparentMultiple(item.value, object);
        } else {
          editor.reparent(item.value, object);
        }
      }
    },
    canDrop(item, monitor) {
      if (!monitor.isOver()) {
        return false;
      }

      if (isAsset(item)) {
        return true;
      }

      if (item.type === ItemTypes.Node) {
        return !(item.multiple
          ? item.value.some(otherObject => isAncestor(otherObject, object))
          : isAncestor(item.value, object));
      }

      return true;
    },
    collect: monitor => ({
      canDropOn: monitor.canDrop(),
      isOverOn: monitor.isOver()
    })
  });

  return (
    <TreeDepthContainer style={style}>
      <ContextMenuTrigger holdToDisplay={-1} id="hierarchy-node-menu" node={node} collect={collectNodeMenuProps}>
        <TreeNodeContainer
          ref={drag}
          id={getNodeElId(node)}
          onMouseDown={onMouseDownNode}
          onClick={onClickNode}
          tabIndex="0"
          onKeyDown={onNodeKeyDown}
          root={depth === 0}
          selected={selected}
          active={active}
        >
          <TreeNodeDropTarget
            ref={beforeDropTarget}
            depth={depth}
            position="before"
            canDrop={canDropBefore}
            isOver={isOverBefore}
          />
          <TreeNodeContent depth={depth} ref={onDropTarget}>
            {isLeaf ? (
              <TreeNodeLeafSpacer />
            ) : (
              <TreeNodeToggle onClick={onClickToggle}>
                {isExpanded ? <CaretDown size={12} /> : <CaretRight size={12} />}
              </TreeNodeToggle>
            )}

            <TreeNodeSelectTarget>
              <TreeNodeIcon as={iconComponent} />
              <TreeNodeLabelContainer>
                {renaming ? (
                  <TreeNodeRenameInputContainer>
                    <TreeNodeRenameInput
                      type="text"
                      onChange={onChangeNodeName}
                      onKeyDown={onKeyDownNameInput}
                      onBlur={onSubmitNodeName}
                      value={renamingNode.name}
                      autoFocus
                    />
                  </TreeNodeRenameInputContainer>
                ) : (
                  <TreeNodeLabel enabled={enabled} canDrop={canDropOn} isOver={isOverOn}>
                    {object.name}
                  </TreeNodeLabel>
                )}
              </TreeNodeLabelContainer>
              {node.object.issues.length > 0 && <NodeIssuesIcon node={node.object} />}
            </TreeNodeSelectTarget>
          </TreeNodeContent>

          <TreeNodeDropTarget
            depth={depth}
            ref={afterDropTarget}
            position="after"
            canDrop={canDropAfter}
            isOver={isOverAfter}
          />
        </TreeNodeContainer>
      </ContextMenuTrigger>
    </TreeDepthContainer>
  );
}

TreeNode.propTypes = {
  data: PropTypes.shape({
    nodes: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.any.isRequired,
        object: PropTypes.object.isRequired,
        isLeaf: PropTypes.bool,
        depth: PropTypes.number,
        selected: PropTypes.bool,
        active: PropTypes.bool,
        iconComponent: PropTypes.object,
        isExpanded: PropTypes.bool,
        childIndex: PropTypes.number.isRequired,
        lastChild: PropTypes.bool.isRequired,
        enabled: PropTypes.bool.isRequired
      })
    ),
    renamingNode: PropTypes.object,
    onRenameSubmit: PropTypes.func.isRequired,
    onChangeName: PropTypes.func.isRequired,
    onMouseDown: PropTypes.func.isRequired,
    onClick: PropTypes.func.isRequired,
    onToggle: PropTypes.func.isRequired,
    onKeyDown: PropTypes.func.isRequired,
    onUpload: PropTypes.func.isRequired
  }),
  index: PropTypes.number,
  style: PropTypes.object.isRequired,
  isScrolling: PropTypes.bool
};

const MemoTreeNode = memo(TreeNode, areEqual);

function* treeWalker(editor, expandedNodes) {
  const stack = [];

  stack.push({
    depth: 0,
    object: editor.scene,
    childIndex: 0,
    lastChild: true,
    parentEnabled: true
  });

  while (stack.length !== 0) {
    const { depth, object, childIndex, lastChild, parentEnabled } = stack.pop();

    const NodeEditor = editor.getNodeEditor(object) || DefaultNodeEditor;
    const iconComponent = NodeEditor.iconComponent || DefaultNodeEditor.iconComponent;

    const isExpanded = expandedNodes[object.id] || object === editor.scene;
    const enabled = parentEnabled && object.enabled;

    yield {
      id: object.id,
      isLeaf: object.children.filter(c => c.isNode).length === 0,
      isExpanded,
      depth,
      object,
      iconComponent,
      selected: editor.selected.indexOf(object) !== -1,
      active: editor.selected.length > 0 && object === editor.selected[editor.selected.length - 1],
      enabled,
      childIndex,
      lastChild
    };

    if (object.children.length !== 0 && isExpanded) {
      for (let i = object.children.length - 1; i >= 0; i--) {
        const child = object.children[i];

        if (child.isNode) {
          stack.push({
            depth: depth + 1,
            object: child,
            childIndex: i,
            lastChild: i === 0,
            parentEnabled: enabled
          });
        }
      }
    }
  }
}

export default function HierarchyPanel() {
  const editor = useContext(EditorContext);
  const onUpload = useUpload(uploadOptions);
  const [renamingNode, setRenamingNode] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState({});
  const [nodes, setNodes] = useState([]);
  const updateNodeHierarchy = useCallback(() => {
    setNodes(Array.from(treeWalker(editor, expandedNodes)));
  }, [editor, expandedNodes]);

  const expandNode = useCallback(
    node => {
      setExpandedNodes({ ...expandedNodes, [node.id]: true });
    },
    [expandedNodes]
  );

  const collapseNode = useCallback(
    node => {
      delete expandedNodes[node.id];
      setExpandedNodes({ ...expandedNodes });
    },
    [setExpandedNodes, expandedNodes]
  );

  const expandChildren = useCallback(
    node => {
      node.object.traverse(child => {
        if (child.isNode) {
          expandedNodes[child.id] = true;
        }
      });
      setExpandedNodes({ ...expandedNodes });
    },
    [setExpandedNodes, expandedNodes]
  );

  const collapseChildren = useCallback(
    node => {
      node.object.traverse(child => {
        if (child.isNode) {
          delete expandedNodes[child.id];
        }
      });
      setExpandedNodes({ ...expandedNodes });
    },
    [setExpandedNodes, expandedNodes]
  );

  const onExpandAllNodes = useCallback(() => {
    const newExpandedNodes = {};
    editor.scene.traverse(child => {
      if (child.isNode) {
        newExpandedNodes[child.id] = true;
      }
    });
    setExpandedNodes(newExpandedNodes);
  }, [editor, setExpandedNodes]);

  const onCollapseAllNodes = useCallback(() => {
    setExpandedNodes({});
  }, [setExpandedNodes]);

  const onObjectChanged = useCallback(
    (objects, propertyName) => {
      if (propertyName === "name" || propertyName === "enabled" || !propertyName) {
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
  }, [editor, updateNodeHierarchy, onObjectChanged]);

  const onMouseDown = useCallback(
    (e, node) => {
      if (e.detail === 1) {
        if (e.shiftKey) {
          editor.toggleSelection(node.object);
        } else if (!node.selected) {
          editor.setSelection([node.object]);
        }
      }
    },
    [editor]
  );

  const onClick = useCallback(
    (e, node) => {
      if (e.detail === 2) {
        editor.spokeControls.focus([node.object]);
      } else if (!e.shiftKey) {
        editor.setSelection([node.object]);
      }
    },
    [editor]
  );

  const onToggle = useCallback(
    (_e, node) => {
      if (expandedNodes[node.id]) {
        collapseNode(node);
      } else {
        expandNode(node);
      }
    },
    [expandedNodes, expandNode, collapseNode]
  );

  const onKeyDown = useCallback(
    (e, node) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();

        const nodeIndex = nodes.indexOf(node);
        const nextNode = nodeIndex !== -1 && nodes[nodeIndex + 1];

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
        e.preventDefault();

        const nodeIndex = nodes.indexOf(node);
        const prevNode = nodeIndex !== -1 && nodes[nodeIndex - 1];

        if (prevNode) {
          if (e.shiftKey) {
            editor.select(prevNode.object);
          }

          const prevNodeEl = document.getElementById(getNodeElId(prevNode));

          if (prevNodeEl) {
            prevNodeEl.focus();
          }
        }
      } else if (e.key === "ArrowLeft" && node.object.children.filter(o => o.isNode).length > 0) {
        if (e.shiftKey) {
          collapseChildren(node);
        } else {
          collapseNode(node);
        }
      } else if (e.key === "ArrowRight" && node.object.children.filter(o => o.isNode).length > 0) {
        if (e.shiftKey) {
          expandChildren(node);
        } else if (node.object.children.filter(o => o.isNode).length > 0) {
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
    [nodes, editor, expandNode, collapseNode, expandChildren, collapseChildren]
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

  const onGroupNodes = useCallback(
    (e, node) => {
      if (node.selected) {
        editor.groupSelected();
      } else {
        editor.groupMultiple([node.object]);
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

  const [, treeContainerDropTarget] = useDrop({
    accept: [ItemTypes.Node, ItemTypes.File, ...AssetTypes],
    drop(item, monitor) {
      if (monitor.didDrop()) {
        return;
      }

      if (item.files) {
        onUpload(item.files).then(assets => {
          if (assets) {
            for (const asset of assets) {
              editor.addMedia(asset.url);
            }
          }
        });
        return;
      }

      if (addAssetOnDrop(editor, item)) {
        return;
      }

      if (item.multiple) {
        editor.reparentMultiple(item.value, editor.scene);
      } else {
        editor.reparent(item.value, editor.scene);
      }
    },
    canDrop(item, monitor) {
      if (!monitor.isOver({ shallow: true })) {
        return false;
      }

      if (isAsset(item)) {
        return true;
      }

      if (item.type === ItemTypes.Node) {
        return !(item.multiple
          ? item.value.some(otherObject => isAncestor(otherObject, editor.scene))
          : isAncestor(item.value, editor.scene));
      }

      return true;
    }
  });

  useEffect(() => {
    updateNodeHierarchy();
  }, [expandedNodes, updateNodeHierarchy]);

  return (
    <Panel id="hierarchy-panel" title="Hierarchy" icon={ProjectDiagram}>
      <PanelContainer>
        {editor.scene && (
          <AutoSizer>
            {({ height, width }) => (
              <FixedSizeList
                height={height}
                width={width}
                itemSize={32}
                itemCount={nodes.length}
                itemData={{
                  renamingNode,
                  nodes,
                  onKeyDown,
                  onChangeName,
                  onRenameSubmit,
                  onMouseDown,
                  onClick,
                  onToggle,
                  onUpload
                }}
                itemKey={getNodeKey}
                outerRef={treeContainerDropTarget}
                innerElementType="ul"
              >
                {MemoTreeNode}
              </FixedSizeList>
            )}
          </AutoSizer>
        )}
      </PanelContainer>
      <ContextMenu id="hierarchy-node-menu">
        <MenuItem onClick={onRenameNode}>Rename</MenuItem>
        <MenuItem onClick={onDuplicateNode}>
          Duplicate
          <div>{cmdOrCtrlString + "+ D"}</div>
        </MenuItem>
        <MenuItem onClick={onGroupNodes}>
          Group
          <div>{cmdOrCtrlString + "+ G"}</div>
        </MenuItem>
        <MenuItem onClick={onDeleteNode}>Delete</MenuItem>
        <MenuItem onClick={onExpandAllNodes}>Expand All</MenuItem>
        <MenuItem onClick={onCollapseAllNodes}>Collapse All</MenuItem>
      </ContextMenu>
    </Panel>
  );
}
