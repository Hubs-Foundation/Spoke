import test from "ava";
import sinon from "sinon";
import Editor from "../../src/editor/Editor2";
import MockNode from "../helpers/MockNode";

test("addObject", t => {
  const editor = new Editor();

  const sceneGraphChangedHandler = sinon.spy();
  const selectionChangedHandler = sinon.spy();
  editor.addListener("sceneGraphChanged", sceneGraphChangedHandler);
  editor.addListener("selectionChanged", selectionChangedHandler);

  const parentOnAddSpy = sinon.spy();
  const parentOnRemoveSpy = sinon.spy();
  const parentOnSelectSpy = sinon.spy();
  const parentOnDeselectSpy = sinon.spy();
  const siblingOnAddSpy = sinon.spy();
  const siblingOnRemoveSpy = sinon.spy();
  const siblingOnSelectSpy = sinon.spy();
  const siblingOnDeselectSpy = sinon.spy();
  const nodeOnAddSpy = sinon.spy();
  const nodeOnRemoveSpy = sinon.spy();
  const nodeOnSelectSpy = sinon.spy();
  const nodeOnDeselectSpy = sinon.spy();

  const parentNode = new MockNode(editor, {
    onAdd: parentOnAddSpy,
    onRemove: parentOnRemoveSpy,
    onSelect: parentOnSelectSpy,
    onDeselect: parentOnDeselectSpy
  });
  const siblingNode = new MockNode(editor, {
    onAdd: siblingOnAddSpy,
    onRemove: siblingOnRemoveSpy,
    onSelect: siblingOnSelectSpy,
    onDeselect: siblingOnDeselectSpy
  });
  const node = new MockNode(editor, {
    onAdd: nodeOnAddSpy,
    onRemove: nodeOnRemoveSpy,
    onSelect: nodeOnSelectSpy,
    onDeselect: nodeOnDeselectSpy
  });

  t.is(editor.nodes.length, 1);
  t.is(editor.selected.length, 0);
  t.is(editor.selectedTransformRoots.length, 0);

  editor.addObject(parentNode); // Add parentNode to scene
  t.not(editor.scene.children.indexOf(parentNode), -1);
  t.is(parentOnAddSpy.callCount, 1);
  t.is(parentOnSelectSpy.callCount, 1);
  t.is(sceneGraphChangedHandler.callCount, 1);
  t.is(selectionChangedHandler.callCount, 1);
  t.is(editor.selected.length, 1);
  t.is(editor.selected[0], parentNode);
  t.is(editor.nodes.length, 2);
  t.is(editor.nodes[1], parentNode);
  t.is(editor.selectedTransformRoots.length, 1);
  t.is(editor.selectedTransformRoots[0], parentNode);

  editor.addObject(siblingNode, parentNode); // Add sibling to parent
  t.is(parentNode.children.indexOf(siblingNode), 0);
  t.is(siblingOnAddSpy.callCount, 1);
  t.is(parentOnDeselectSpy.callCount, 1);
  t.is(siblingOnSelectSpy.callCount, 1);
  t.is(sceneGraphChangedHandler.callCount, 2);
  t.is(selectionChangedHandler.callCount, 2);
  t.is(editor.selected.length, 1);
  t.is(editor.selected[0], siblingNode);
  t.is(editor.nodes.length, 3);
  t.is(editor.nodes[2], siblingNode);
  t.is(editor.selectedTransformRoots.length, 1);
  t.is(editor.selectedTransformRoots[0], siblingNode);

  editor.addObject(node, parentNode, siblingNode); // Add node before sibling
  t.is(parentNode.children.indexOf(node), 0);
  t.is(parentNode.children.indexOf(siblingNode), 1);
  t.is(nodeOnAddSpy.callCount, 1);
  t.is(siblingOnDeselectSpy.callCount, 1);
  t.is(nodeOnSelectSpy.callCount, 1);
  t.is(sceneGraphChangedHandler.callCount, 3);
  t.is(selectionChangedHandler.callCount, 3);
  t.is(editor.selected.length, 1);
  t.is(editor.selected[0], node);
  t.is(editor.nodes.length, 4);
  t.is(editor.nodes[3], node);
  t.is(editor.selectedTransformRoots.length, 1);
  t.is(editor.selectedTransformRoots[0], node);

  editor.history.undo(); // Undo adding node
  t.is(parentNode.children.indexOf(node), -1);
  t.is(nodeOnRemoveSpy.callCount, 1);
  t.is(nodeOnDeselectSpy.callCount, 1);
  t.is(siblingOnSelectSpy.callCount, 2);
  t.is(sceneGraphChangedHandler.callCount, 4);
  t.is(selectionChangedHandler.callCount, 4);
  t.is(editor.selected.length, 1);
  t.is(editor.selected[0], siblingNode);
  t.is(editor.nodes.length, 3);
  t.is(editor.nodes.indexOf(node), -1);
  t.is(editor.selectedTransformRoots.length, 1);
  t.is(editor.selectedTransformRoots[0], siblingNode);

  editor.history.undo(); // Undo adding sibling
  t.is(parentNode.children.indexOf(siblingNode), -1);
  t.is(siblingOnRemoveSpy.callCount, 1);
  t.is(siblingOnDeselectSpy.callCount, 2);
  t.is(parentOnSelectSpy.callCount, 2);
  t.is(sceneGraphChangedHandler.callCount, 5);
  t.is(selectionChangedHandler.callCount, 5);
  t.is(editor.selected.length, 1);
  t.is(editor.selected[0], parentNode);
  t.is(editor.nodes.length, 2);
  t.is(editor.nodes.indexOf(siblingNode), -1);
  t.is(editor.selectedTransformRoots.length, 1);
  t.is(editor.selectedTransformRoots[0], parentNode);

  editor.history.undo(); // Undo adding parent
  t.is(editor.scene.children.indexOf(parentNode), -1);
  t.is(parentOnRemoveSpy.callCount, 1);
  t.is(parentOnDeselectSpy.callCount, 2);
  t.is(sceneGraphChangedHandler.callCount, 6);
  t.is(selectionChangedHandler.callCount, 6);
  t.is(editor.selected.length, 0);
  t.is(editor.nodes.length, 1);
  t.is(editor.nodes.indexOf(parentNode), -1);
  t.is(editor.selectedTransformRoots.length, 0);

  // TODO: add object with sub nodes
});

test("addMultipleObjects", t => {
  const editor = new Editor();

  const sceneGraphChangedHandler = sinon.spy();
  const selectionChangedHandler = sinon.spy();
  editor.addListener("sceneGraphChanged", sceneGraphChangedHandler);
  editor.addListener("selectionChanged", selectionChangedHandler);

  const nodeAOnAddSpy = sinon.spy();
  const nodeAOnRemoveSpy = sinon.spy();
  const nodeAOnSelectSpy = sinon.spy();
  const nodeAOnDeselectSpy = sinon.spy();

  const nodeA = new MockNode(editor, {
    onAdd: nodeAOnAddSpy,
    onRemove: nodeAOnRemoveSpy,
    onSelect: nodeAOnSelectSpy,
    onDeselect: nodeAOnDeselectSpy
  });

  const nodeBOnAddSpy = sinon.spy();
  const nodeBOnRemoveSpy = sinon.spy();
  const nodeBOnSelectSpy = sinon.spy();
  const nodeBOnDeselectSpy = sinon.spy();

  const nodeB = new MockNode(editor, {
    onAdd: nodeBOnAddSpy,
    onRemove: nodeBOnRemoveSpy,
    onSelect: nodeBOnSelectSpy,
    onDeselect: nodeBOnDeselectSpy
  });

  const nodeCOnAddSpy = sinon.spy();
  const nodeCOnRemoveSpy = sinon.spy();
  const nodeCOnSelectSpy = sinon.spy();
  const nodeCOnDeselectSpy = sinon.spy();

  const nodeC = new MockNode(editor, {
    onAdd: nodeCOnAddSpy,
    onRemove: nodeCOnRemoveSpy,
    onSelect: nodeCOnSelectSpy,
    onDeselect: nodeCOnDeselectSpy
  });

  const nodeDOnAddSpy = sinon.spy();
  const nodeDOnRemoveSpy = sinon.spy();
  const nodeDOnSelectSpy = sinon.spy();
  const nodeDOnDeselectSpy = sinon.spy();

  const nodeD = new MockNode(editor, {
    onAdd: nodeDOnAddSpy,
    onRemove: nodeDOnRemoveSpy,
    onSelect: nodeDOnSelectSpy,
    onDeselect: nodeDOnDeselectSpy
  });

  const nodeEOnAddSpy = sinon.spy();
  const nodeEOnRemoveSpy = sinon.spy();
  const nodeEOnSelectSpy = sinon.spy();
  const nodeEOnDeselectSpy = sinon.spy();

  const nodeE = new MockNode(editor, {
    onAdd: nodeEOnAddSpy,
    onRemove: nodeEOnRemoveSpy,
    onSelect: nodeEOnSelectSpy,
    onDeselect: nodeEOnDeselectSpy
  });

  const nodeFOnAddSpy = sinon.spy();
  const nodeFOnRemoveSpy = sinon.spy();
  const nodeFOnSelectSpy = sinon.spy();
  const nodeFOnDeselectSpy = sinon.spy();

  const nodeF = new MockNode(editor, {
    onAdd: nodeFOnAddSpy,
    onRemove: nodeFOnRemoveSpy,
    onSelect: nodeFOnSelectSpy,
    onDeselect: nodeFOnDeselectSpy
  });

  // TODO: add object with sub nodes

  t.is(editor.nodes.length, 1);
  t.is(editor.selected.length, 0);
  t.is(editor.selectedTransformRoots.length, 0);

  editor.addMultipleObjects([nodeA, nodeB]); // Add nodeA and nodeB to the scene
  t.not(editor.scene.children.indexOf(nodeA), -1);
  t.not(editor.scene.children.indexOf(nodeB), -1);
  t.is(nodeAOnAddSpy.callCount, 1);
  t.is(nodeAOnSelectSpy.callCount, 1);
  t.is(nodeBOnAddSpy.callCount, 1);
  t.is(nodeBOnSelectSpy.callCount, 1);
  t.is(sceneGraphChangedHandler.callCount, 1);
  t.is(selectionChangedHandler.callCount, 1);
  t.is(editor.selected.length, 2);
  t.is(editor.selected[0], nodeA);
  t.is(editor.selected[1], nodeB);
  t.is(editor.nodes.length, 3);
  t.is(editor.nodes[1], nodeA);
  t.is(editor.nodes[2], nodeB);
  t.is(editor.selectedTransformRoots.length, 2);
  t.is(editor.selectedTransformRoots[0], nodeA);
  t.is(editor.selectedTransformRoots[1], nodeB);

  editor.addMultipleObjects([nodeC, nodeD], nodeA); // Add nodeC and nodeD to nodeA
  t.is(nodeA.children.indexOf(nodeC), 0);
  t.is(nodeA.children.indexOf(nodeD), 1);
  t.is(nodeAOnDeselectSpy.callCount, 1);
  t.is(nodeBOnDeselectSpy.callCount, 1);
  t.is(nodeCOnAddSpy.callCount, 1);
  t.is(nodeCOnSelectSpy.callCount, 1);
  t.is(nodeDOnAddSpy.callCount, 1);
  t.is(nodeDOnSelectSpy.callCount, 1);
  t.is(sceneGraphChangedHandler.callCount, 2);
  t.is(selectionChangedHandler.callCount, 2);
  t.is(editor.selected.length, 2);
  t.is(editor.selected[0], nodeC);
  t.is(editor.selected[1], nodeD);
  t.is(editor.nodes.length, 5);
  t.is(editor.nodes[3], nodeC);
  t.is(editor.nodes[4], nodeD);
  t.is(editor.selectedTransformRoots.length, 2);
  t.is(editor.selectedTransformRoots[0], nodeC);
  t.is(editor.selectedTransformRoots[1], nodeD);

  editor.addMultipleObjects([nodeE, nodeF], nodeA, nodeD); // Add nodeE and nodeF before nodeD on nodeA
  t.is(nodeA.children.indexOf(nodeC), 0);
  t.is(nodeA.children.indexOf(nodeE), 1);
  t.is(nodeA.children.indexOf(nodeF), 2);
  t.is(nodeA.children.indexOf(nodeD), 3);
  t.is(nodeCOnDeselectSpy.callCount, 1);
  t.is(nodeDOnDeselectSpy.callCount, 1);
  t.is(nodeEOnAddSpy.callCount, 1);
  t.is(nodeEOnSelectSpy.callCount, 1);
  t.is(nodeFOnAddSpy.callCount, 1);
  t.is(nodeFOnSelectSpy.callCount, 1);
  t.is(sceneGraphChangedHandler.callCount, 3);
  t.is(selectionChangedHandler.callCount, 3);
  t.is(editor.selected.length, 2);
  t.is(editor.selected[0], nodeE);
  t.is(editor.selected[1], nodeF);
  t.is(editor.nodes.length, 7);
  t.is(editor.nodes[5], nodeE);
  t.is(editor.nodes[6], nodeF);
  t.is(editor.selectedTransformRoots.length, 2);
  t.is(editor.selectedTransformRoots[0], nodeE);
  t.is(editor.selectedTransformRoots[1], nodeF);

  editor.history.undo();
  t.is(nodeA.children.indexOf(nodeC), 0);
  t.is(nodeA.children.indexOf(nodeD), 1);
  t.is(nodeEOnDeselectSpy.callCount, 1);
  t.is(nodeEOnRemoveSpy.callCount, 1);
  t.is(nodeFOnDeselectSpy.callCount, 1);
  t.is(nodeFOnRemoveSpy.callCount, 1);
  t.is(nodeCOnSelectSpy.callCount, 2);
  t.is(nodeDOnSelectSpy.callCount, 2);
  t.is(sceneGraphChangedHandler.callCount, 4);
  t.is(selectionChangedHandler.callCount, 4);
  t.is(editor.selected.length, 2);
  t.is(editor.selected[0], nodeC);
  t.is(editor.selected[1], nodeD);
  t.is(editor.nodes.length, 5);
  t.is(editor.nodes[3], nodeC);
  t.is(editor.nodes[4], nodeD);
  t.is(editor.selectedTransformRoots.length, 2);
  t.is(editor.selectedTransformRoots[0], nodeC);
  t.is(editor.selectedTransformRoots[1], nodeD);

  editor.history.undo();
  t.is(nodeA.children.length, 0);
  t.not(editor.scene.children.indexOf(nodeA), -1);
  t.not(editor.scene.children.indexOf(nodeB), -1);
  t.is(nodeCOnDeselectSpy.callCount, 2);
  t.is(nodeCOnRemoveSpy.callCount, 1);
  t.is(nodeDOnDeselectSpy.callCount, 2);
  t.is(nodeDOnRemoveSpy.callCount, 1);
  t.is(nodeAOnSelectSpy.callCount, 2);
  t.is(nodeBOnSelectSpy.callCount, 2);
  t.is(sceneGraphChangedHandler.callCount, 5);
  t.is(selectionChangedHandler.callCount, 5);
  t.is(editor.selected.length, 2);
  t.is(editor.selected[0], nodeA);
  t.is(editor.selected[1], nodeB);
  t.is(editor.nodes.length, 3);
  t.is(editor.nodes[1], nodeA);
  t.is(editor.nodes[2], nodeB);
  t.is(editor.selectedTransformRoots.length, 2);
  t.is(editor.selectedTransformRoots[0], nodeA);
  t.is(editor.selectedTransformRoots[1], nodeB);

  editor.history.undo();
  t.is(editor.scene.children.length, 0);
  t.is(nodeAOnDeselectSpy.callCount, 2);
  t.is(nodeAOnRemoveSpy.callCount, 1);
  t.is(nodeBOnDeselectSpy.callCount, 2);
  t.is(nodeBOnRemoveSpy.callCount, 1);
  t.is(sceneGraphChangedHandler.callCount, 6);
  t.is(selectionChangedHandler.callCount, 6);
  t.is(editor.nodes.length, 1);
  t.is(editor.selected.length, 0);
  t.is(editor.selectedTransformRoots.length, 0);
});

test("removeObject", t => {
  const editor = new Editor();

  const sceneGraphChangedHandler = sinon.spy();
  const selectionChangedHandler = sinon.spy();
  editor.addListener("sceneGraphChanged", sceneGraphChangedHandler);
  editor.addListener("selectionChanged", selectionChangedHandler);

  const parentOnAddSpy = sinon.spy();
  const parentOnRemoveSpy = sinon.spy();
  const siblingOnAddSpy = sinon.spy();
  const siblingOnRemoveSpy = sinon.spy();
  const nodeOnAddSpy = sinon.spy();
  const nodeOnRemoveSpy = sinon.spy();
  const selectedNodeOnAddSpy = sinon.spy();
  const selectedNodeOnRemoveSpy = sinon.spy();
  const selectedNodeOnDeselectSpy = sinon.spy();
  const selectedNodeOnSelectSpy = sinon.spy();

  const parentNode = new MockNode(editor, { onAdd: parentOnAddSpy, onRemove: parentOnRemoveSpy });
  const siblingNode = new MockNode(editor, { onAdd: siblingOnAddSpy, onRemove: siblingOnRemoveSpy });
  const node = new MockNode(editor, { onAdd: nodeOnAddSpy, onRemove: nodeOnRemoveSpy });
  const selectedNode = new MockNode(editor, {
    onAdd: selectedNodeOnAddSpy,
    onRemove: selectedNodeOnRemoveSpy,
    onSelect: selectedNodeOnSelectSpy,
    onDeselect: selectedNodeOnDeselectSpy
  });

  editor.addObject(parentNode);
  editor.addObject(node, parentNode);
  editor.addObject(siblingNode, parentNode);
  editor.addObject(selectedNode);

  sceneGraphChangedHandler.resetHistory();
  selectionChangedHandler.resetHistory();
  parentOnAddSpy.resetHistory();
  parentOnRemoveSpy.resetHistory();
  siblingOnAddSpy.resetHistory();
  siblingOnRemoveSpy.resetHistory();
  nodeOnAddSpy.resetHistory();
  nodeOnRemoveSpy.resetHistory();
  selectedNodeOnAddSpy.resetHistory();
  selectedNodeOnRemoveSpy.resetHistory();
  selectedNodeOnDeselectSpy.resetHistory();
  selectedNodeOnSelectSpy.resetHistory();

  // selectedNode currently selected
  t.is(editor.selected.length, 1);
  t.is(editor.selected[0], selectedNode);
  t.is(editor.selectedTransformRoots.length, 1);
  t.is(editor.selectedTransformRoots[0], selectedNode);

  editor.removeObject(parentNode); // Remove parentNode with ancestors
  t.is(editor.scene.children.indexOf(parentNode), -1);
  t.true(parentOnRemoveSpy.calledOnce);
  t.true(siblingOnRemoveSpy.calledOnce);
  t.true(nodeOnRemoveSpy.calledOnce);
  t.is(sceneGraphChangedHandler.callCount, 1);
  t.is(selectionChangedHandler.callCount, 0);
  t.is(editor.selected.length, 1);
  t.is(editor.nodes.length, 2);
  t.is(editor.nodes.indexOf(parentNode), -1);
  t.is(editor.nodes.indexOf(siblingNode), -1);
  t.is(editor.nodes.indexOf(node), -1);
  t.is(editor.selectedTransformRoots.length, 1);
  t.is(editor.selectedTransformRoots[0], selectedNode);

  editor.history.undo(); // Undo removing parentNode
  t.not(editor.scene.children.indexOf(parentNode), -1);
  t.true(parentOnAddSpy.calledOnce);
  t.true(siblingOnAddSpy.calledOnce);
  t.true(nodeOnAddSpy.calledOnce);
  t.is(sceneGraphChangedHandler.callCount, 2);
  t.is(selectionChangedHandler.callCount, 0);
  t.is(editor.selected.length, 1);
  t.is(editor.nodes.length, 5);
  t.not(editor.nodes.indexOf(parentNode), -1);
  t.not(editor.nodes.indexOf(siblingNode), -1);
  t.not(editor.nodes.indexOf(node), -1);
  t.is(editor.selectedTransformRoots.length, 1);
  t.is(editor.selectedTransformRoots[0], selectedNode);

  editor.removeObject(selectedNode); // Remove the selected node
  t.is(editor.scene.children.indexOf(selectedNode), -1);
  t.true(selectedNodeOnDeselectSpy.calledOnce);
  t.true(selectedNodeOnRemoveSpy.calledOnce);
  t.is(sceneGraphChangedHandler.callCount, 3);
  t.is(selectionChangedHandler.callCount, 1);
  t.is(editor.selected.length, 0);
  t.is(editor.nodes.length, 4);
  t.is(editor.nodes.indexOf(selectedNode), -1);
  t.is(editor.selectedTransformRoots.length, 0);

  editor.history.undo(); // Undo removing selectedNode
  t.not(editor.scene.children.indexOf(selectedNode), -1);
  t.true(selectedNodeOnSelectSpy.calledOnce);
  t.true(selectedNodeOnAddSpy.calledOnce);
  t.is(sceneGraphChangedHandler.callCount, 4);
  t.is(selectionChangedHandler.callCount, 2);
  t.is(editor.selected.length, 1);
  t.is(editor.selected[0], selectedNode);
  t.is(editor.nodes.length, 5);
  t.not(editor.nodes.indexOf(selectedNode), -1);
  t.is(editor.selectedTransformRoots.length, 1);
  t.is(editor.selectedTransformRoots[0], selectedNode);

  // TODO: remove object with sub nodes
});

test("removeMultipleObjects", t => {
  const editor = new Editor();

  const sceneGraphChangedHandler = sinon.spy();
  const selectionChangedHandler = sinon.spy();
  editor.addListener("sceneGraphChanged", sceneGraphChangedHandler);
  editor.addListener("selectionChanged", selectionChangedHandler);

  const nodeAOnAddSpy = sinon.spy();
  const nodeAOnRemoveSpy = sinon.spy();
  const nodeAOnSelectSpy = sinon.spy();
  const nodeAOnDeselectSpy = sinon.spy();

  const nodeA = new MockNode(editor, {
    onAdd: nodeAOnAddSpy,
    onRemove: nodeAOnRemoveSpy,
    onSelect: nodeAOnSelectSpy,
    onDeselect: nodeAOnDeselectSpy
  });

  const nodeBOnAddSpy = sinon.spy();
  const nodeBOnRemoveSpy = sinon.spy();
  const nodeBOnSelectSpy = sinon.spy();
  const nodeBOnDeselectSpy = sinon.spy();

  const nodeB = new MockNode(editor, {
    onAdd: nodeBOnAddSpy,
    onRemove: nodeBOnRemoveSpy,
    onSelect: nodeBOnSelectSpy,
    onDeselect: nodeBOnDeselectSpy
  });

  editor.addMultipleObjects([nodeA, nodeB]);

  sceneGraphChangedHandler.resetHistory();
  selectionChangedHandler.resetHistory();
  nodeAOnAddSpy.resetHistory();
  nodeAOnRemoveSpy.resetHistory();
  nodeAOnSelectSpy.resetHistory();
  nodeAOnDeselectSpy.resetHistory();
  nodeBOnAddSpy.resetHistory();
  nodeBOnRemoveSpy.resetHistory();
  nodeBOnSelectSpy.resetHistory();
  nodeBOnDeselectSpy.resetHistory();

  t.is(editor.nodes.length, 3);
  t.is(editor.nodes[1], nodeA);
  t.is(editor.nodes[2], nodeB);
  t.is(editor.selected.length, 2);
  t.is(editor.selected[0], nodeA);
  t.is(editor.selected[1], nodeB);
  t.is(editor.selectedTransformRoots.length, 2);
  t.is(editor.selectedTransformRoots[0], nodeA);
  t.is(editor.selectedTransformRoots[1], nodeB);

  editor.removeMultipleObjects([nodeA, nodeB]);

  t.is(editor.nodes.length, 1);
  t.is(editor.selected.length, 0);
  t.is(editor.selectedTransformRoots.length, 0);
  t.is(nodeAOnDeselectSpy.callCount, 1);
  t.is(nodeAOnRemoveSpy.callCount, 1);
  t.is(nodeBOnDeselectSpy.callCount, 1);
  t.is(nodeBOnRemoveSpy.callCount, 1);
  t.is(selectionChangedHandler.callCount, 1);
  t.is(sceneGraphChangedHandler.callCount, 1);

  editor.history.undo();
  t.is(editor.nodes.length, 3);
  t.is(editor.nodes[1], nodeA);
  t.is(editor.nodes[2], nodeB);
  t.is(editor.selected.length, 2);
  t.is(editor.selected[0], nodeA);
  t.is(editor.selected[1], nodeB);
  t.is(editor.selectedTransformRoots.length, 2);
  t.is(editor.selectedTransformRoots[0], nodeA);
  t.is(editor.selectedTransformRoots[1], nodeB);
  t.is(nodeAOnSelectSpy.callCount, 1);
  t.is(nodeAOnAddSpy.callCount, 1);
  t.is(nodeBOnSelectSpy.callCount, 1);
  t.is(nodeBOnAddSpy.callCount, 1);
  t.is(selectionChangedHandler.callCount, 2);
  t.is(sceneGraphChangedHandler.callCount, 2);
});

test("removeSelectedObjects", t => {
  const editor = new Editor();

  const sceneGraphChangedHandler = sinon.spy();
  const selectionChangedHandler = sinon.spy();
  editor.addListener("sceneGraphChanged", sceneGraphChangedHandler);
  editor.addListener("selectionChanged", selectionChangedHandler);

  const nodeAOnAddSpy = sinon.spy();
  const nodeAOnRemoveSpy = sinon.spy();
  const nodeAOnSelectSpy = sinon.spy();
  const nodeAOnDeselectSpy = sinon.spy();

  const nodeA = new MockNode(editor, {
    onAdd: nodeAOnAddSpy,
    onRemove: nodeAOnRemoveSpy,
    onSelect: nodeAOnSelectSpy,
    onDeselect: nodeAOnDeselectSpy
  });

  const nodeBOnAddSpy = sinon.spy();
  const nodeBOnRemoveSpy = sinon.spy();
  const nodeBOnSelectSpy = sinon.spy();
  const nodeBOnDeselectSpy = sinon.spy();

  const nodeB = new MockNode(editor, {
    onAdd: nodeBOnAddSpy,
    onRemove: nodeBOnRemoveSpy,
    onSelect: nodeBOnSelectSpy,
    onDeselect: nodeBOnDeselectSpy
  });

  editor.addMultipleObjects([nodeA, nodeB]);

  sceneGraphChangedHandler.resetHistory();
  selectionChangedHandler.resetHistory();
  nodeAOnAddSpy.resetHistory();
  nodeAOnRemoveSpy.resetHistory();
  nodeAOnSelectSpy.resetHistory();
  nodeAOnDeselectSpy.resetHistory();
  nodeBOnAddSpy.resetHistory();
  nodeBOnRemoveSpy.resetHistory();
  nodeBOnSelectSpy.resetHistory();
  nodeBOnDeselectSpy.resetHistory();

  t.is(editor.nodes.length, 3);
  t.is(editor.nodes[1], nodeA);
  t.is(editor.nodes[2], nodeB);
  t.is(editor.selected.length, 2);
  t.is(editor.selected[0], nodeA);
  t.is(editor.selected[1], nodeB);
  t.is(editor.selectedTransformRoots.length, 2);
  t.is(editor.selectedTransformRoots[0], nodeA);
  t.is(editor.selectedTransformRoots[1], nodeB);

  editor.removeSelectedObjects();

  t.is(editor.nodes.length, 1);
  t.is(editor.selected.length, 0);
  t.is(editor.selectedTransformRoots.length, 0);
  t.is(nodeAOnDeselectSpy.callCount, 1);
  t.is(nodeAOnRemoveSpy.callCount, 1);
  t.is(nodeBOnDeselectSpy.callCount, 1);
  t.is(nodeBOnRemoveSpy.callCount, 1);
  t.is(selectionChangedHandler.callCount, 1);
  t.is(sceneGraphChangedHandler.callCount, 1);

  editor.history.undo();
  t.is(editor.nodes.length, 3);
  t.is(editor.nodes[1], nodeA);
  t.is(editor.nodes[2], nodeB);
  t.is(editor.selected.length, 2);
  t.is(editor.selected[0], nodeA);
  t.is(editor.selected[1], nodeB);
  t.is(editor.selectedTransformRoots.length, 2);
  t.is(editor.selectedTransformRoots[0], nodeA);
  t.is(editor.selectedTransformRoots[1], nodeB);
  t.is(nodeAOnSelectSpy.callCount, 1);
  t.is(nodeAOnAddSpy.callCount, 1);
  t.is(nodeBOnSelectSpy.callCount, 1);
  t.is(nodeBOnAddSpy.callCount, 1);
  t.is(selectionChangedHandler.callCount, 2);
  t.is(sceneGraphChangedHandler.callCount, 2);
});

test("select", t => {
  const editor = new Editor();

  const selectionChangedHandler = sinon.spy();
  editor.addListener("selectionChanged", selectionChangedHandler);

  const onSelectASpy = sinon.spy();
  const onDeselectASpy = sinon.spy();
  const onSelectBSpy = sinon.spy();
  const onDeselectBSpy = sinon.spy();

  const nodeA = new MockNode(editor, { onSelect: onSelectASpy, onDeselect: onDeselectASpy });
  const nodeB = new MockNode(editor, { onSelect: onSelectBSpy, onDeselect: onDeselectBSpy });

  editor.addObject(nodeA);
  editor.addObject(nodeB);
  editor.deselectAll();

  selectionChangedHandler.resetHistory();
  onSelectASpy.resetHistory();
  onSelectBSpy.resetHistory();
  onDeselectASpy.resetHistory();
  onDeselectBSpy.resetHistory();

  t.is(editor.selected.length, 0);
  t.is(editor.selectedTransformRoots.length, 0);

  editor.select(nodeA);
  t.is(editor.selected.length, 1);
  t.is(editor.selected[0], nodeA);
  t.is(onSelectASpy.callCount, 1);
  t.is(selectionChangedHandler.callCount, 1);
  t.is(editor.selectedTransformRoots.length, 1);
  t.is(editor.selectedTransformRoots[0], nodeA);

  editor.select(nodeB);
  t.is(editor.selected.length, 2);
  t.is(editor.selected[0], nodeA);
  t.is(editor.selected[1], nodeB);
  t.is(onSelectBSpy.callCount, 1);
  t.is(selectionChangedHandler.callCount, 2);
  t.is(editor.selectedTransformRoots.length, 2);
  t.is(editor.selectedTransformRoots[0], nodeA);
  t.is(editor.selectedTransformRoots[1], nodeB);

  editor.history.undo();
  t.is(editor.selected.length, 1);
  t.is(editor.selected[0], nodeA);
  t.is(onDeselectBSpy.callCount, 1);
  t.is(selectionChangedHandler.callCount, 3);
  t.is(editor.selectedTransformRoots.length, 1);
  t.is(editor.selectedTransformRoots[0], nodeA);

  editor.history.undo();
  t.is(editor.selected.length, 0);
  t.is(onDeselectASpy.callCount, 1);
  t.is(selectionChangedHandler.callCount, 4);
  t.is(editor.selectedTransformRoots.length, 0);
});

test("selectMultiple", t => {
  const editor = new Editor();

  const selectionChangedHandler = sinon.spy();
  editor.addListener("selectionChanged", selectionChangedHandler);

  const onSelectASpy = sinon.spy();
  const onDeselectASpy = sinon.spy();
  const onSelectBSpy = sinon.spy();
  const onDeselectBSpy = sinon.spy();
  const onSelectCSpy = sinon.spy();
  const onDeselectCSpy = sinon.spy();

  const nodeA = new MockNode(editor, { onSelect: onSelectASpy, onDeselect: onDeselectASpy });
  const nodeB = new MockNode(editor, { onSelect: onSelectBSpy, onDeselect: onDeselectBSpy });
  const nodeC = new MockNode(editor, { onSelect: onSelectCSpy, onDeselect: onDeselectCSpy });

  editor.addObject(nodeA);
  editor.addObject(nodeB);
  editor.addObject(nodeC, nodeB);

  // nodeC currently selected

  selectionChangedHandler.resetHistory();
  onSelectASpy.resetHistory();
  onSelectBSpy.resetHistory();
  onSelectCSpy.resetHistory();
  onDeselectASpy.resetHistory();
  onDeselectBSpy.resetHistory();
  onDeselectCSpy.resetHistory();

  t.is(editor.selected.length, 1);
  t.is(editor.selected[0], nodeC);
  t.is(editor.selectedTransformRoots.length, 1);
  t.is(editor.selectedTransformRoots[0], nodeC);

  editor.selectMultiple([nodeA, nodeB]); // Add A and B to selection
  t.is(onDeselectCSpy.callCount, 0);
  t.is(onSelectASpy.callCount, 1);
  t.is(onSelectBSpy.callCount, 1);
  t.is(selectionChangedHandler.callCount, 1);
  t.is(editor.selected.length, 3);
  t.is(editor.selected[0], nodeC);
  t.is(editor.selected[1], nodeA);
  t.is(editor.selected[2], nodeB);
  t.is(editor.selectedTransformRoots.length, 2);
  t.is(editor.selectedTransformRoots[0], nodeA);
  t.is(editor.selectedTransformRoots[1], nodeB);

  editor.history.undo(); // Undo A and B selection
  t.is(onSelectCSpy.callCount, 0);
  t.is(onDeselectASpy.callCount, 1);
  t.is(onDeselectBSpy.callCount, 1);
  t.is(selectionChangedHandler.callCount, 2);
  t.is(editor.selected.length, 1);
  t.is(editor.selected[0], nodeC);
  t.is(editor.selectedTransformRoots.length, 1);
  t.is(editor.selectedTransformRoots[0], nodeC);
});

test("selectAll", t => {
  const editor = new Editor();

  const selectionChangedHandler = sinon.spy();
  editor.addListener("selectionChanged", selectionChangedHandler);

  const onSelectSceneSpy = sinon.spy(editor.scene, "onSelect");
  const onDeselectSceneSpy = sinon.spy(editor.scene, "onDeselect");
  const onSelectASpy = sinon.spy();
  const onDeselectASpy = sinon.spy();
  const onSelectBSpy = sinon.spy();
  const onDeselectBSpy = sinon.spy();
  const onSelectCSpy = sinon.spy();
  const onDeselectCSpy = sinon.spy();

  const nodeA = new MockNode(editor, { onSelect: onSelectASpy, onDeselect: onDeselectASpy });
  const nodeB = new MockNode(editor, { onSelect: onSelectBSpy, onDeselect: onDeselectBSpy });
  const nodeC = new MockNode(editor, { onSelect: onSelectCSpy, onDeselect: onDeselectCSpy });

  editor.addObject(nodeA);
  editor.addObject(nodeB);
  editor.addObject(nodeC, nodeB);

  // nodeC currently selected

  selectionChangedHandler.resetHistory();
  onSelectSceneSpy.resetHistory();
  onSelectASpy.resetHistory();
  onSelectBSpy.resetHistory();
  onSelectCSpy.resetHistory();
  onDeselectSceneSpy.resetHistory();
  onDeselectASpy.resetHistory();
  onDeselectBSpy.resetHistory();
  onDeselectCSpy.resetHistory();

  t.is(editor.selected.length, 1);
  t.is(editor.selected[0], nodeC);
  t.is(editor.selectedTransformRoots.length, 1);
  t.is(editor.selectedTransformRoots[0], nodeC);

  editor.selectAll(); // Select all nodes in the scene graph
  t.is(editor.selected.length, 4);
  t.is(editor.selected[0], nodeC);
  t.is(editor.selected[1], editor.scene);
  t.is(editor.selected[2], nodeA);
  t.is(editor.selected[3], nodeB);
  t.is(onSelectSceneSpy.callCount, 1);
  t.is(onSelectASpy.callCount, 1);
  t.is(onSelectBSpy.callCount, 1);
  t.is(onSelectCSpy.callCount, 0);
  t.is(selectionChangedHandler.callCount, 1);
  t.is(editor.selectedTransformRoots.length, 2);
  t.is(editor.selectedTransformRoots[0], nodeA);
  t.is(editor.selectedTransformRoots[1], nodeB);

  editor.history.undo(); // Undo select all
  t.is(editor.selected.length, 1);
  t.is(editor.selected[0], nodeC);
  t.is(onDeselectSceneSpy.callCount, 1);
  t.is(onDeselectASpy.callCount, 1);
  t.is(onDeselectBSpy.callCount, 1);
  t.is(onDeselectCSpy.callCount, 0);
  t.is(selectionChangedHandler.callCount, 2);
  t.is(editor.selectedTransformRoots.length, 1);
  t.is(editor.selectedTransformRoots[0], nodeC);
});

test("deselect", t => {
  const editor = new Editor();

  const selectionChangedHandler = sinon.spy();
  editor.addListener("selectionChanged", selectionChangedHandler);

  const onSelectASpy = sinon.spy();
  const onDeselectASpy = sinon.spy();

  const nodeA = new MockNode(editor, { onSelect: onSelectASpy, onDeselect: onDeselectASpy });
  const nodeB = new MockNode(editor);
  const nodeC = new MockNode(editor);

  editor.addObject(nodeA);
  editor.addObject(nodeB);
  editor.addObject(nodeC, nodeB);
  editor.select(nodeA);

  // nodeA and nodeC currently selected

  selectionChangedHandler.resetHistory();
  onSelectASpy.resetHistory();
  onDeselectASpy.resetHistory();

  t.is(editor.selected.length, 2);
  t.is(editor.selected[0], nodeC);
  t.is(editor.selected[1], nodeA);
  t.is(editor.selectedTransformRoots.length, 2);
  t.is(editor.selectedTransformRoots[0], nodeA);
  t.is(editor.selectedTransformRoots[1], nodeC);

  editor.deselect(nodeA);
  t.is(onDeselectASpy.callCount, 1);
  t.is(editor.selected.length, 1);
  t.is(editor.selected[0], nodeC);
  t.is(selectionChangedHandler.callCount, 1);
  t.is(editor.selectedTransformRoots.length, 1);
  t.is(editor.selectedTransformRoots[0], nodeC);

  editor.history.undo();
  t.is(onSelectASpy.callCount, 1);
  t.is(editor.selected.length, 2);
  t.is(editor.selected[0], nodeC);
  t.is(editor.selected[1], nodeA);
  t.is(selectionChangedHandler.callCount, 2);
  t.is(editor.selectedTransformRoots.length, 2);
  t.is(editor.selectedTransformRoots[0], nodeA);
  t.is(editor.selectedTransformRoots[1], nodeC);
});

test("deselectMultiple", t => {
  const editor = new Editor();

  const selectionChangedHandler = sinon.spy();
  editor.addListener("selectionChanged", selectionChangedHandler);

  const onSelectASpy = sinon.spy();
  const onDeselectASpy = sinon.spy();
  const onSelectBSpy = sinon.spy();
  const onDeselectBSpy = sinon.spy();
  const onSelectCSpy = sinon.spy();
  const onDeselectCSpy = sinon.spy();

  const nodeA = new MockNode(editor, { onSelect: onSelectASpy, onDeselect: onDeselectASpy });
  const nodeB = new MockNode(editor, { onSelect: onSelectBSpy, onDeselect: onDeselectBSpy });
  const nodeC = new MockNode(editor, { onSelect: onSelectCSpy, onDeselect: onDeselectCSpy });

  editor.addObject(nodeA);
  editor.addObject(nodeB);
  editor.addObject(nodeC, nodeB);
  editor.selectMultiple([nodeA, nodeB]);

  // nodeA, nodeB, and nodeC currently selected

  selectionChangedHandler.resetHistory();
  onSelectASpy.resetHistory();
  onSelectBSpy.resetHistory();
  onSelectCSpy.resetHistory();
  onDeselectASpy.resetHistory();
  onDeselectBSpy.resetHistory();
  onDeselectCSpy.resetHistory();

  t.is(editor.selected.length, 3);
  t.is(editor.selected[0], nodeC);
  t.is(editor.selected[1], nodeA);
  t.is(editor.selected[2], nodeB);
  t.is(editor.selectedTransformRoots.length, 2);
  t.is(editor.selectedTransformRoots[0], nodeA);
  t.is(editor.selectedTransformRoots[1], nodeB);

  editor.deselectMultiple([nodeA, nodeC]);
  t.is(onDeselectASpy.callCount, 1);
  t.is(onDeselectCSpy.callCount, 1);
  t.is(editor.selected.length, 1);
  t.is(editor.selected[0], nodeB);
  t.is(selectionChangedHandler.callCount, 1);
  t.is(editor.selectedTransformRoots.length, 1);
  t.is(editor.selectedTransformRoots[0], nodeB);

  editor.history.undo();
  t.is(onSelectASpy.callCount, 1);
  t.is(onSelectCSpy.callCount, 1);
  t.is(editor.selected.length, 3);
  t.is(editor.selected[0], nodeC);
  t.is(editor.selected[1], nodeA);
  t.is(editor.selected[2], nodeB);
  t.is(selectionChangedHandler.callCount, 2);
  t.is(editor.selectedTransformRoots.length, 2);
  t.is(editor.selectedTransformRoots[0], nodeA);
  t.is(editor.selectedTransformRoots[1], nodeB);
});

test("deselectAll", t => {
  const editor = new Editor();

  const selectionChangedHandler = sinon.spy();
  editor.addListener("selectionChanged", selectionChangedHandler);

  const onSelectSceneSpy = sinon.spy(editor.scene, "onSelect");
  const onDeselectSceneSpy = sinon.spy(editor.scene, "onDeselect");
  const onSelectASpy = sinon.spy();
  const onDeselectASpy = sinon.spy();
  const onSelectBSpy = sinon.spy();
  const onDeselectBSpy = sinon.spy();
  const onSelectCSpy = sinon.spy();
  const onDeselectCSpy = sinon.spy();

  const nodeA = new MockNode(editor, { onSelect: onSelectASpy, onDeselect: onDeselectASpy });
  const nodeB = new MockNode(editor, { onSelect: onSelectBSpy, onDeselect: onDeselectBSpy });
  const nodeC = new MockNode(editor, { onSelect: onSelectCSpy, onDeselect: onDeselectCSpy });

  editor.addObject(nodeA);
  editor.addObject(nodeB);
  editor.addObject(nodeC, nodeB);

  // nodeC currently selected

  selectionChangedHandler.resetHistory();
  onSelectSceneSpy.resetHistory();
  onSelectASpy.resetHistory();
  onSelectBSpy.resetHistory();
  onSelectCSpy.resetHistory();
  onDeselectSceneSpy.resetHistory();
  onDeselectASpy.resetHistory();
  onDeselectBSpy.resetHistory();
  onDeselectCSpy.resetHistory();

  editor.selectAll(); // Select all nodes in the scene graph
  t.is(editor.selected.length, 4);
  t.is(editor.selected[0], nodeC);
  t.is(editor.selected[1], editor.scene);
  t.is(editor.selected[2], nodeA);
  t.is(editor.selected[3], nodeB);
  t.is(onSelectSceneSpy.callCount, 1);
  t.is(onSelectASpy.callCount, 1);
  t.is(onSelectBSpy.callCount, 1);
  t.is(onSelectCSpy.callCount, 0);
  t.is(selectionChangedHandler.callCount, 1);
  t.is(editor.selectedTransformRoots.length, 2);
  t.is(editor.selectedTransformRoots[0], nodeA);
  t.is(editor.selectedTransformRoots[1], nodeB);

  editor.history.undo(); // Undo select all
  t.is(editor.selected.length, 1);
  t.is(editor.selected[0], nodeC);
  t.is(onDeselectSceneSpy.callCount, 1);
  t.is(onDeselectASpy.callCount, 1);
  t.is(onDeselectBSpy.callCount, 1);
  t.is(onDeselectCSpy.callCount, 0);
  t.is(selectionChangedHandler.callCount, 2);
  t.is(editor.selectedTransformRoots.length, 1);
  t.is(editor.selectedTransformRoots[0], nodeC);
});

test("setSelection", t => {
  const editor = new Editor();

  const selectionChangedHandler = sinon.spy();
  editor.addListener("selectionChanged", selectionChangedHandler);
  const onSelectASpy = sinon.spy();
  const onDeselectASpy = sinon.spy();
  const onSelectBSpy = sinon.spy();
  const onDeselectBSpy = sinon.spy();
  const onSelectCSpy = sinon.spy();
  const onDeselectCSpy = sinon.spy();

  const nodeA = new MockNode(editor, { onSelect: onSelectASpy, onDeselect: onDeselectASpy });
  const nodeB = new MockNode(editor, { onSelect: onSelectBSpy, onDeselect: onDeselectBSpy });
  const nodeC = new MockNode(editor, { onSelect: onSelectCSpy, onDeselect: onDeselectCSpy });

  editor.addObject(nodeA);
  editor.addObject(nodeB);
  editor.addObject(nodeC, nodeB);

  // nodeC currently selected

  selectionChangedHandler.resetHistory();
  onSelectASpy.resetHistory();
  onSelectBSpy.resetHistory();
  onSelectCSpy.resetHistory();
  onDeselectASpy.resetHistory();
  onDeselectBSpy.resetHistory();
  onDeselectCSpy.resetHistory();

  t.is(editor.selected.length, 1);
  t.is(editor.selected[0], nodeC);

  editor.setSelection([nodeA, nodeB]);
  t.is(editor.selected.length, 2);
  t.is(editor.selected[0], nodeA);
  t.is(editor.selected[1], nodeB);
  t.is(onSelectASpy.callCount, 1);
  t.is(onSelectBSpy.callCount, 1);
  t.is(onDeselectCSpy.callCount, 1);
  t.is(selectionChangedHandler.callCount, 1);
  t.is(editor.selectedTransformRoots.length, 2);
  t.is(editor.selectedTransformRoots[0], nodeA);
  t.is(editor.selectedTransformRoots[1], nodeB);

  editor.history.undo();
  t.is(editor.selected.length, 1);
  t.is(editor.selected[0], nodeC);
  t.is(onSelectCSpy.callCount, 1);
  t.is(onDeselectASpy.callCount, 1);
  t.is(onDeselectBSpy.callCount, 1);
  t.is(selectionChangedHandler.callCount, 2);
  t.is(editor.selectedTransformRoots.length, 1);
  t.is(editor.selectedTransformRoots[0], nodeC);
});
