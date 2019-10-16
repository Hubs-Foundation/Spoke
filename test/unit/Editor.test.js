import test from "ava";
import sinon from "sinon";
import Editor, { TransformSpace } from "../../src/editor/Editor";
import MockNode from "../helpers/MockNode";
import { Vector3, Euler, Quaternion } from "three";
import arrayShallowEqual from "../../src/editor/utils/arrayShallowEqual";

// Modified from: https://github.com/sindresorhus/float-equal
function floatEqual(a, b, epsilon = Number.EPSILON) {
  if (a === b) {
    return true;
  }

  const diff = Math.abs(a - b);

  if (diff < epsilon) {
    return true;
  }

  return diff <= epsilon * Math.min(Math.abs(a), Math.abs(b));
}

function eulerEqual(a, b, epsilon = 2.22e-12) {
  return floatEqual(a.x, b.x, epsilon) && floatEqual(a.y, b.y, epsilon) && floatEqual(a.z, b.z, epsilon);
}

function quaternionEqual(a, b, epsilon = Number.EPSILON) {
  return (
    floatEqual(a.x, b.x, epsilon) &&
    floatEqual(a.y, b.y, epsilon) &&
    floatEqual(a.z, b.z, epsilon) &&
    floatEqual(a.w, b.w, epsilon)
  );
}

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
  t.is(editor.selected[0], editor.scene);
  t.is(editor.selected[1], nodeA);
  t.is(editor.selected[2], nodeB);
  t.is(editor.selected[3], nodeC);
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
  t.is(editor.selected.length, 1);
  t.is(editor.selected[0], nodeB);
  t.is(onDeselectASpy.callCount, 1);
  t.is(onDeselectCSpy.callCount, 1);
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
  t.is(editor.selected[0], editor.scene);
  t.is(editor.selected[1], nodeA);
  t.is(editor.selected[2], nodeB);
  t.is(editor.selected[3], nodeC);
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

test("toggleSelection", t => {
  const editor = new Editor();

  const selectionChangedHandler = sinon.spy();
  editor.addListener("selectionChanged", selectionChangedHandler);

  const onSelectASpy = sinon.spy();
  const onDeselectASpy = sinon.spy();
  const nodeA = new MockNode(editor, { onSelect: onSelectASpy, onDeselect: onDeselectASpy });

  editor.addObject(nodeA);

  selectionChangedHandler.resetHistory();
  onSelectASpy.resetHistory();
  onDeselectASpy.resetHistory();

  t.is(editor.selected.length, 1);
  t.is(editor.selected[0], nodeA);

  editor.toggleSelection(nodeA);

  t.is(editor.selected.length, 0);
  t.is(selectionChangedHandler.callCount, 1);
  t.is(onDeselectASpy.callCount, 1);

  editor.toggleSelection(nodeA);

  t.is(editor.selected.length, 1);
  t.is(editor.selected[0], nodeA);
  t.is(selectionChangedHandler.callCount, 2);
  t.is(onSelectASpy.callCount, 1);

  editor.history.undo();

  t.is(editor.selected.length, 0);
  t.is(selectionChangedHandler.callCount, 3);
  t.is(onDeselectASpy.callCount, 2);

  editor.history.undo();

  t.is(editor.selected.length, 1);
  t.is(editor.selected[0], nodeA);
  t.is(selectionChangedHandler.callCount, 4);
  t.is(onSelectASpy.callCount, 2);
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
  nodeA.name = "NodeA";

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
  nodeB.name = "NodeB";

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
  nodeC.name = "NodeC";

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
  nodeD.name = "NodeD";

  editor.addMultipleObjects([nodeA, nodeB]);
  editor.addObject(nodeC);
  editor.addObject(nodeD, nodeC);
  editor.setSelection([nodeA, nodeB]);

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
  nodeCOnAddSpy.resetHistory();
  nodeCOnRemoveSpy.resetHistory();
  nodeCOnSelectSpy.resetHistory();
  nodeCOnDeselectSpy.resetHistory();
  nodeDOnAddSpy.resetHistory();
  nodeDOnRemoveSpy.resetHistory();
  nodeDOnSelectSpy.resetHistory();
  nodeDOnDeselectSpy.resetHistory();

  t.is(editor.nodes.length, 5);
  t.is(editor.nodes[1], nodeA);
  t.is(editor.nodes[2], nodeB);
  t.is(editor.nodes[3], nodeC);
  t.is(editor.nodes[4], nodeD);
  t.is(editor.selected.length, 2);
  t.is(editor.selected[0], nodeA);
  t.is(editor.selected[1], nodeB);
  t.is(editor.selectedTransformRoots.length, 2);
  t.is(editor.selectedTransformRoots[0], nodeA);
  t.is(editor.selectedTransformRoots[1], nodeB);

  editor.removeMultipleObjects([nodeA, nodeB]); // Remove sibling nodes: nodeA and nodeB

  t.is(editor.nodes.length, 3);
  t.is(editor.selected.length, 0);
  t.is(editor.selectedTransformRoots.length, 0);
  t.is(nodeAOnDeselectSpy.callCount, 1);
  t.is(nodeAOnRemoveSpy.callCount, 1);
  t.is(nodeBOnDeselectSpy.callCount, 1);
  t.is(nodeBOnRemoveSpy.callCount, 1);
  t.is(selectionChangedHandler.callCount, 1);
  t.is(sceneGraphChangedHandler.callCount, 1);

  editor.history.undo();

  t.is(editor.nodes.length, 5);
  t.is(editor.nodes[1], nodeA);
  t.is(editor.nodes[2], nodeB);
  t.is(editor.nodes[3], nodeC);
  t.is(editor.nodes[4], nodeD);
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

  editor.removeMultipleObjects([nodeC, nodeD]); // Remove parent nodeC and child nodeD (should filter out nodeD)

  t.is(editor.nodes.length, 3);
  t.is(editor.nodes[1], nodeA);
  t.is(editor.nodes[2], nodeB);
  t.is(editor.selected.length, 2);
  t.is(editor.selected[0], nodeA);
  t.is(editor.selected[1], nodeB);
  t.is(editor.selectedTransformRoots.length, 2);
  t.is(editor.selectedTransformRoots[0], nodeA);
  t.is(editor.selectedTransformRoots[1], nodeB);
  t.is(nodeCOnRemoveSpy.callCount, 1);
  t.is(nodeDOnRemoveSpy.callCount, 1);
  t.is(selectionChangedHandler.callCount, 2);
  t.is(sceneGraphChangedHandler.callCount, 3);

  t.is(nodeDOnAddSpy.callCount, 0);

  editor.history.undo();

  t.is(editor.nodes.length, 5);
  t.is(editor.nodes[1], nodeA);
  t.is(editor.nodes[2], nodeB);
  t.is(editor.nodes[3], nodeC);
  t.is(editor.nodes[4], nodeD);
  t.is(editor.selected.length, 2);
  t.is(editor.selected[0], nodeA);
  t.is(editor.selected[1], nodeB);
  t.is(editor.selectedTransformRoots.length, 2);
  t.is(editor.selectedTransformRoots[0], nodeA);
  t.is(editor.selectedTransformRoots[1], nodeB);
  t.is(nodeCOnAddSpy.callCount, 1);
  t.is(nodeDOnAddSpy.callCount, 1);
  t.is(selectionChangedHandler.callCount, 2);
  t.is(sceneGraphChangedHandler.callCount, 4);
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

test("duplicate", t => {
  const editor = new Editor();

  const sceneGraphChangedHandler = sinon.spy();
  const selectionChangedHandler = sinon.spy();
  editor.addListener("sceneGraphChanged", sceneGraphChangedHandler);
  editor.addListener("selectionChanged", selectionChangedHandler);

  const nodeAOnSelectSpy = sinon.spy();
  const nodeAOnDeselectSpy = sinon.spy();

  const nodeA = new MockNode(editor, {
    onSelect: nodeAOnSelectSpy,
    onDeselect: nodeAOnDeselectSpy
  });
  nodeA.name = "NodeA";

  const nodeBOnSelectSpy = sinon.spy();
  const nodeBOnDeselectSpy = sinon.spy();

  const nodeB = new MockNode(editor, {
    onSelect: nodeBOnSelectSpy,
    onDeselect: nodeBOnDeselectSpy
  });
  nodeB.name = "NodeB";

  const nodeCOnSelectSpy = sinon.spy();
  const nodeCOnDeselectSpy = sinon.spy();

  const nodeC = new MockNode(editor, {
    onSelect: nodeCOnSelectSpy,
    onDeselect: nodeCOnDeselectSpy
  });
  nodeC.name = "NodeC";

  editor.addObject(nodeA);
  editor.addMultipleObjects([nodeB, nodeC], nodeA);

  sceneGraphChangedHandler.resetHistory();
  selectionChangedHandler.resetHistory();

  nodeAOnSelectSpy.resetHistory();
  nodeAOnDeselectSpy.resetHistory();

  nodeBOnSelectSpy.resetHistory();
  nodeBOnDeselectSpy.resetHistory();

  nodeCOnSelectSpy.resetHistory();
  nodeCOnDeselectSpy.resetHistory();

  t.is(editor.nodes.length, 4);
  t.is(editor.nodes[1], nodeA);
  t.is(editor.nodes[2], nodeB);
  t.is(editor.nodes[3], nodeC);
  t.is(editor.selected.length, 2);
  t.is(editor.selected[0], nodeB);
  t.is(editor.selected[1], nodeC);

  editor.duplicate(nodeA); // Duplicate nodeA and add to scene

  t.is(editor.nodes.length, 7);
  t.is(editor.scene.children.length, 2);
  t.is(editor.selected.length, 1);
  t.is(editor.scene.children[0], nodeA);
  t.is(editor.scene.children[1], editor.selected[0]);
  t.is(nodeBOnDeselectSpy.callCount, 1);
  t.is(nodeCOnDeselectSpy.callCount, 1);
  t.is(sceneGraphChangedHandler.callCount, 1);
  t.is(selectionChangedHandler.callCount, 1);

  editor.history.undo();

  t.is(editor.nodes.length, 4);
  t.is(editor.nodes[1], nodeA);
  t.is(editor.nodes[2], nodeB);
  t.is(editor.nodes[3], nodeC);
  t.is(editor.selected.length, 2);
  t.is(editor.selected[0], nodeB);
  t.is(editor.selected[1], nodeC);
  t.is(nodeBOnSelectSpy.callCount, 1);
  t.is(nodeCOnSelectSpy.callCount, 1);
  t.is(sceneGraphChangedHandler.callCount, 2);
  t.is(selectionChangedHandler.callCount, 2);

  editor.duplicate(nodeB, nodeA); // Duplicate nodeB and add to nodeA

  t.is(editor.nodes.length, 5);
  t.is(editor.selected.length, 1);
  t.is(nodeA.children.length, 3);
  t.is(nodeA.children[0], nodeB);
  t.is(nodeA.children[1], nodeC);
  t.is(nodeBOnDeselectSpy.callCount, 2);
  t.is(nodeCOnDeselectSpy.callCount, 2);
  t.is(sceneGraphChangedHandler.callCount, 3);
  t.is(selectionChangedHandler.callCount, 3);

  editor.history.undo();

  t.is(editor.nodes.length, 4);
  t.is(editor.nodes[1], nodeA);
  t.is(editor.nodes[2], nodeB);
  t.is(editor.nodes[3], nodeC);
  t.is(editor.selected.length, 2);
  t.is(editor.selected[0], nodeB);
  t.is(editor.selected[1], nodeC);
  t.is(nodeBOnSelectSpy.callCount, 2);
  t.is(nodeCOnSelectSpy.callCount, 2);
  t.is(sceneGraphChangedHandler.callCount, 4);
  t.is(selectionChangedHandler.callCount, 4);

  editor.duplicate(nodeB, nodeA, nodeC); // Duplicate nodeB and add to nodeA before nodeC

  t.is(editor.nodes.length, 5);
  t.is(editor.selected.length, 1);
  t.is(nodeA.children.length, 3);
  t.is(nodeA.children[0], nodeB);
  t.is(nodeA.children[2], nodeC);
  t.is(nodeBOnDeselectSpy.callCount, 3);
  t.is(nodeCOnDeselectSpy.callCount, 3);
  t.is(sceneGraphChangedHandler.callCount, 5);
  t.is(selectionChangedHandler.callCount, 5);

  editor.history.undo();

  t.is(editor.nodes.length, 4);
  t.is(editor.nodes[1], nodeA);
  t.is(editor.nodes[2], nodeB);
  t.is(editor.nodes[3], nodeC);
  t.is(editor.selected.length, 2);
  t.is(editor.selected[0], nodeB);
  t.is(editor.selected[1], nodeC);
  t.is(nodeBOnSelectSpy.callCount, 3);
  t.is(nodeCOnSelectSpy.callCount, 3);
  t.is(sceneGraphChangedHandler.callCount, 6);
  t.is(selectionChangedHandler.callCount, 6);
});

test("duplicateMultiple", t => {
  const editor = new Editor();

  const sceneGraphChangedHandler = sinon.spy();
  const selectionChangedHandler = sinon.spy();
  editor.addListener("sceneGraphChanged", sceneGraphChangedHandler);
  editor.addListener("selectionChanged", selectionChangedHandler);

  const nodeAOnSelectSpy = sinon.spy();
  const nodeAOnDeselectSpy = sinon.spy();

  const nodeA = new MockNode(editor, {
    onSelect: nodeAOnSelectSpy,
    onDeselect: nodeAOnDeselectSpy
  });
  nodeA.name = "NodeA";

  const nodeBOnSelectSpy = sinon.spy();
  const nodeBOnDeselectSpy = sinon.spy();

  const nodeB = new MockNode(editor, {
    onSelect: nodeBOnSelectSpy,
    onDeselect: nodeBOnDeselectSpy
  });
  nodeB.name = "NodeB";

  const nodeCOnSelectSpy = sinon.spy();
  const nodeCOnDeselectSpy = sinon.spy();

  const nodeC = new MockNode(editor, {
    onSelect: nodeCOnSelectSpy,
    onDeselect: nodeCOnDeselectSpy
  });
  nodeC.name = "NodeC";

  const nodeDOnSelectSpy = sinon.spy();
  const nodeDOnDeselectSpy = sinon.spy();

  const nodeD = new MockNode(editor, {
    onSelect: nodeDOnSelectSpy,
    onDeselect: nodeDOnDeselectSpy
  });
  nodeD.name = "NodeD";

  editor.addObject(nodeA);
  editor.addMultipleObjects([nodeB, nodeC], nodeA);
  editor.addObject(nodeD);

  sceneGraphChangedHandler.resetHistory();
  selectionChangedHandler.resetHistory();

  nodeAOnSelectSpy.resetHistory();
  nodeAOnDeselectSpy.resetHistory();

  nodeBOnSelectSpy.resetHistory();
  nodeBOnDeselectSpy.resetHistory();

  nodeCOnSelectSpy.resetHistory();
  nodeCOnDeselectSpy.resetHistory();

  nodeDOnSelectSpy.resetHistory();
  nodeDOnDeselectSpy.resetHistory();

  t.is(editor.nodes.length, 5);
  t.is(editor.nodes[1], nodeA);
  t.is(editor.nodes[2], nodeB);
  t.is(editor.nodes[3], nodeC);
  t.is(editor.nodes[4], nodeD);
  t.is(editor.selected.length, 1);
  t.is(editor.selected[0], nodeD);
  t.is(nodeDOnSelectSpy.callCount, 0);
  t.is(nodeDOnDeselectSpy.callCount, 0);
  t.is(sceneGraphChangedHandler.callCount, 0);
  t.is(selectionChangedHandler.callCount, 0);

  editor.duplicateMultiple([nodeA, nodeD]); // Duplicate nodeA and nodeD and add to scene

  t.is(editor.selected.length, 2);
  t.is(editor.nodes.length, 9);
  t.is(editor.nodes[5], editor.selected[0]);
  t.is(editor.nodes[8], editor.selected[1]);
  t.is(editor.scene.children.length, 4);
  t.is(editor.scene.children[0], nodeA);
  t.is(editor.scene.children[1], nodeD);
  t.is(editor.scene.children[2], editor.selected[0]);
  t.is(editor.scene.children[3], editor.selected[1]);
  t.is(nodeDOnDeselectSpy.callCount, 1);
  t.is(sceneGraphChangedHandler.callCount, 1);
  t.is(selectionChangedHandler.callCount, 1);

  editor.history.undo();

  t.is(editor.nodes.length, 5);
  t.is(editor.nodes[1], nodeA);
  t.is(editor.nodes[2], nodeB);
  t.is(editor.nodes[3], nodeC);
  t.is(editor.nodes[4], nodeD);
  t.is(editor.selected.length, 1);
  t.is(editor.selected[0], nodeD);
  t.is(nodeDOnSelectSpy.callCount, 1);
  t.is(sceneGraphChangedHandler.callCount, 2);
  t.is(selectionChangedHandler.callCount, 2);

  editor.duplicateMultiple([nodeA, nodeB]); // Duplicate nodeA and nodeB and add to scene (B is a child of A, only A should be duplicated)

  t.is(editor.nodes.length, 8);
  t.is(editor.selected.length, 1);
  t.is(editor.nodes[5], editor.selected[0]); // Because nodeB was a child of nodeA, only nodeA was duplicated and only nodeA was selected
  t.is(editor.nodes[5].children.length, 2);
  t.is(nodeDOnDeselectSpy.callCount, 2);
  t.is(sceneGraphChangedHandler.callCount, 3);
  t.is(selectionChangedHandler.callCount, 3);

  editor.history.undo();

  t.is(editor.nodes.length, 5);
  t.is(editor.nodes[1], nodeA);
  t.is(editor.nodes[2], nodeB);
  t.is(editor.nodes[3], nodeC);
  t.is(editor.nodes[4], nodeD);
  t.is(editor.selected.length, 1);
  t.is(editor.selected[0], nodeD);
  t.is(nodeDOnSelectSpy.callCount, 2);
  t.is(sceneGraphChangedHandler.callCount, 4);
  t.is(selectionChangedHandler.callCount, 4);

  editor.duplicateMultiple([nodeA, nodeD], nodeD); // Duplicate nodeA and nodeD and add to nodeD

  t.is(editor.nodes.length, 9);
  t.is(editor.selected.length, 2);
  t.is(nodeD.children.length, 2);
  t.is(editor.nodes[5], editor.selected[0]);
  t.is(editor.nodes[5].children.length, 2);
  t.is(editor.nodes[8], editor.selected[1]);
  t.is(nodeDOnDeselectSpy.callCount, 3);
  t.is(sceneGraphChangedHandler.callCount, 5);
  t.is(selectionChangedHandler.callCount, 5);

  editor.history.undo();

  t.is(editor.nodes.length, 5);
  t.is(editor.nodes[1], nodeA);
  t.is(editor.nodes[2], nodeB);
  t.is(editor.nodes[3], nodeC);
  t.is(editor.nodes[4], nodeD);
  t.is(editor.selected.length, 1);
  t.is(editor.selected[0], nodeD);
  t.is(nodeDOnSelectSpy.callCount, 3);
  t.is(sceneGraphChangedHandler.callCount, 6);
  t.is(selectionChangedHandler.callCount, 6);

  editor.duplicateMultiple([nodeA, nodeD], nodeA, nodeC); // Duplicate nodeA and nodeD and add to nodeA before nodeC

  t.is(editor.nodes.length, 9);
  t.is(editor.selected.length, 2);
  t.is(nodeA.children.length, 4);
  t.is(nodeA.children[0], nodeB);
  t.is(nodeA.children[1], editor.selected[0]);
  t.is(nodeA.children[2], editor.selected[1]);
  t.is(nodeA.children[3], nodeC);
  t.is(nodeDOnDeselectSpy.callCount, 4);
  t.is(sceneGraphChangedHandler.callCount, 7);
  t.is(selectionChangedHandler.callCount, 7);

  editor.history.undo();

  t.is(editor.nodes.length, 5);
  t.is(editor.nodes[1], nodeA);
  t.is(editor.nodes[2], nodeB);
  t.is(editor.nodes[3], nodeC);
  t.is(editor.nodes[4], nodeD);
  t.is(editor.selected.length, 1);
  t.is(editor.selected[0], nodeD);
  t.is(sceneGraphChangedHandler.callCount, 8);
  t.is(selectionChangedHandler.callCount, 8);
});

test("duplicateSelected", t => {
  const editor = new Editor();

  const sceneGraphChangedHandler = sinon.spy();
  const selectionChangedHandler = sinon.spy();
  editor.addListener("sceneGraphChanged", sceneGraphChangedHandler);
  editor.addListener("selectionChanged", selectionChangedHandler);

  const nodeAOnSelectSpy = sinon.spy();
  const nodeAOnDeselectSpy = sinon.spy();

  const nodeA = new MockNode(editor, {
    onSelect: nodeAOnSelectSpy,
    onDeselect: nodeAOnDeselectSpy
  });
  nodeA.name = "NodeA";

  const nodeBOnSelectSpy = sinon.spy();
  const nodeBOnDeselectSpy = sinon.spy();

  const nodeB = new MockNode(editor, {
    onSelect: nodeBOnSelectSpy,
    onDeselect: nodeBOnDeselectSpy
  });
  nodeB.name = "NodeB";

  const nodeCOnSelectSpy = sinon.spy();
  const nodeCOnDeselectSpy = sinon.spy();

  const nodeC = new MockNode(editor, {
    onSelect: nodeCOnSelectSpy,
    onDeselect: nodeCOnDeselectSpy
  });
  nodeC.name = "NodeC";

  const nodeDOnSelectSpy = sinon.spy();
  const nodeDOnDeselectSpy = sinon.spy();

  const nodeD = new MockNode(editor, {
    onSelect: nodeDOnSelectSpy,
    onDeselect: nodeDOnDeselectSpy
  });
  nodeD.name = "NodeD";

  editor.addObject(nodeA);
  editor.addMultipleObjects([nodeB, nodeC], nodeA);
  editor.addObject(nodeD);
  editor.setSelection([nodeA, nodeD]);

  sceneGraphChangedHandler.resetHistory();
  selectionChangedHandler.resetHistory();

  nodeAOnSelectSpy.resetHistory();
  nodeAOnDeselectSpy.resetHistory();

  nodeBOnSelectSpy.resetHistory();
  nodeBOnDeselectSpy.resetHistory();

  nodeCOnSelectSpy.resetHistory();
  nodeCOnDeselectSpy.resetHistory();

  nodeDOnSelectSpy.resetHistory();
  nodeDOnDeselectSpy.resetHistory();

  t.is(editor.nodes.length, 5);
  t.is(editor.nodes[1], nodeA);
  t.is(editor.nodes[2], nodeB);
  t.is(editor.nodes[3], nodeC);
  t.is(editor.nodes[4], nodeD);
  t.is(editor.selected.length, 2);
  t.is(editor.selected[0], nodeA);
  t.is(editor.selected[1], nodeD);
  t.is(nodeDOnSelectSpy.callCount, 0);
  t.is(nodeDOnDeselectSpy.callCount, 0);
  t.is(sceneGraphChangedHandler.callCount, 0);
  t.is(selectionChangedHandler.callCount, 0);

  editor.duplicateSelected(); // Duplicate nodeA and nodeD and add to scene

  t.is(editor.selected.length, 2);
  t.is(editor.nodes.length, 9);
  t.is(editor.nodes[5], editor.selected[0]);
  t.is(editor.nodes[8], editor.selected[1]);
  t.is(editor.scene.children.length, 4);
  t.is(editor.scene.children[0], nodeA);
  t.is(editor.scene.children[1], nodeD);
  t.is(editor.scene.children[2], editor.selected[0]);
  t.is(editor.scene.children[3], editor.selected[1]);
  t.is(nodeDOnDeselectSpy.callCount, 1);
  t.is(sceneGraphChangedHandler.callCount, 1);
  t.is(selectionChangedHandler.callCount, 1);

  editor.history.undo();

  t.is(editor.nodes.length, 5);
  t.is(editor.nodes[1], nodeA);
  t.is(editor.nodes[2], nodeB);
  t.is(editor.nodes[3], nodeC);
  t.is(editor.nodes[4], nodeD);
  t.is(editor.selected.length, 2);
  t.is(editor.selected[0], nodeA);
  t.is(editor.selected[1], nodeD);
  t.is(nodeDOnSelectSpy.callCount, 1);
  t.is(sceneGraphChangedHandler.callCount, 2);
  t.is(selectionChangedHandler.callCount, 2);
});

test("reparent", t => {
  const editor = new Editor();

  const sceneGraphChangedHandler = sinon.spy();
  const selectionChangedHandler = sinon.spy();
  editor.addListener("sceneGraphChanged", sceneGraphChangedHandler);
  editor.addListener("selectionChanged", selectionChangedHandler);

  const nodeA = new MockNode();
  nodeA.name = "NodeA";
  const nodeB = new MockNode();
  nodeB.name = "NodeB";
  const nodeC = new MockNode();
  nodeC.name = "NodeC";
  const nodeD = new MockNode();
  nodeD.name = "NodeD";

  editor.addObject(nodeA);
  editor.addObject(nodeB);
  editor.addObject(nodeC, nodeA);
  editor.addObject(nodeD, nodeB);

  sceneGraphChangedHandler.resetHistory();
  selectionChangedHandler.resetHistory();

  t.is(nodeA.children.length, 1);
  t.is(nodeA.children[0], nodeC);
  t.is(nodeB.children.length, 1);
  t.is(nodeB.children[0], nodeD);
  t.is(editor.selectedTransformRoots.length, 1);
  t.is(editor.selectedTransformRoots[0], nodeD);
  t.is(sceneGraphChangedHandler.callCount, 0);
  t.is(selectionChangedHandler.callCount, 0);

  editor.reparent(nodeC, nodeB); // Move nodeC to nodeB as the last child

  t.is(nodeA.children.length, 0);
  t.is(nodeB.children.length, 2);
  t.is(nodeB.children[0], nodeD);
  t.is(nodeB.children[1], nodeC);
  t.is(editor.selectedTransformRoots.length, 1);
  t.is(editor.selectedTransformRoots[0], nodeC);
  t.is(sceneGraphChangedHandler.callCount, 1);
  t.is(selectionChangedHandler.callCount, 1);

  editor.history.undo();

  t.is(nodeA.children.length, 1);
  t.is(nodeA.children[0], nodeC);
  t.is(nodeB.children.length, 1);
  t.is(nodeB.children[0], nodeD);
  t.is(editor.selectedTransformRoots.length, 1);
  t.is(editor.selectedTransformRoots[0], nodeD);
  t.is(sceneGraphChangedHandler.callCount, 2);
  t.is(selectionChangedHandler.callCount, 2);

  editor.reparent(nodeD, nodeA, nodeC); // Move nodeD to nodeA before nodeC

  t.is(nodeA.children.length, 2);
  t.is(nodeA.children[0], nodeD);
  t.is(nodeA.children[1], nodeC);
  t.is(nodeB.children.length, 0);
  t.is(editor.selectedTransformRoots.length, 1);
  t.is(editor.selectedTransformRoots[0], nodeD);
  t.is(sceneGraphChangedHandler.callCount, 3);
  t.is(selectionChangedHandler.callCount, 3);

  editor.history.undo();

  t.is(nodeA.children.length, 1);
  t.is(nodeA.children[0], nodeC);
  t.is(nodeB.children.length, 1);
  t.is(nodeB.children[0], nodeD);
  t.is(editor.selectedTransformRoots.length, 1);
  t.is(editor.selectedTransformRoots[0], nodeD);
  t.is(sceneGraphChangedHandler.callCount, 4);
  t.is(selectionChangedHandler.callCount, 3);
});

test("reparentMultiple", t => {
  const editor = new Editor();

  const sceneGraphChangedHandler = sinon.spy();
  const selectionChangedHandler = sinon.spy();
  editor.addListener("sceneGraphChanged", sceneGraphChangedHandler);
  editor.addListener("selectionChanged", selectionChangedHandler);

  const nodeA = new MockNode();
  nodeA.name = "NodeA";
  const nodeB = new MockNode();
  nodeB.name = "NodeB";
  const nodeC = new MockNode();
  nodeC.name = "NodeC";
  const nodeD = new MockNode();
  nodeD.name = "NodeD";
  const nodeE = new MockNode();
  nodeE.name = "NodeE";

  editor.addObject(nodeA);
  editor.addObject(nodeB);
  editor.addObject(nodeC, nodeA);
  editor.addObject(nodeD, nodeB);
  editor.addObject(nodeE, nodeB);

  sceneGraphChangedHandler.resetHistory();
  selectionChangedHandler.resetHistory();

  t.is(nodeA.children.length, 1);
  t.is(nodeA.children[0], nodeC);
  t.is(nodeB.children.length, 2);
  t.is(nodeB.children[0], nodeD);
  t.is(nodeB.children[1], nodeE);
  t.is(editor.selectedTransformRoots.length, 1);
  t.is(editor.selectedTransformRoots[0], nodeE);
  t.is(sceneGraphChangedHandler.callCount, 0);
  t.is(selectionChangedHandler.callCount, 0);

  editor.reparentMultiple([nodeE, nodeD], nodeA); // Move nodeE and nodeD to nodeA as the last children, in tree traversal order

  t.is(nodeA.children.length, 3);
  t.is(nodeA.children[0], nodeC);
  t.is(nodeA.children[1], nodeD);
  t.is(nodeA.children[2], nodeE);
  t.is(nodeB.children.length, 0);
  t.is(editor.selectedTransformRoots.length, 2);
  t.is(editor.selectedTransformRoots[0], nodeD);
  t.is(editor.selectedTransformRoots[1], nodeE);
  t.is(sceneGraphChangedHandler.callCount, 1);
  t.is(selectionChangedHandler.callCount, 1);

  editor.history.undo();

  t.is(nodeA.children.length, 1);
  t.is(nodeA.children[0], nodeC);
  t.is(nodeB.children.length, 2);
  t.is(nodeB.children[0], nodeD);
  t.is(nodeB.children[1], nodeE);
  t.is(editor.selectedTransformRoots.length, 1);
  t.is(editor.selectedTransformRoots[0], nodeE);
  t.is(sceneGraphChangedHandler.callCount, 2);
  t.is(selectionChangedHandler.callCount, 2);

  editor.reparentMultiple([nodeE, nodeD], nodeA, nodeC); // Move nodeE and nodeD to nodeA before nodeC, in tree traversal order

  t.is(nodeA.children.length, 3);
  t.is(nodeA.children[0], nodeD);
  t.is(nodeA.children[1], nodeE);
  t.is(nodeA.children[2], nodeC);
  t.is(nodeB.children.length, 0);
  t.is(editor.selectedTransformRoots.length, 2);
  t.is(editor.selectedTransformRoots[0], nodeD);
  t.is(editor.selectedTransformRoots[1], nodeE);
  t.is(sceneGraphChangedHandler.callCount, 3);
  t.is(selectionChangedHandler.callCount, 3);

  editor.history.undo();

  t.is(nodeA.children.length, 1);
  t.is(nodeA.children[0], nodeC);
  t.is(nodeB.children.length, 2);
  t.is(nodeB.children[0], nodeD);
  t.is(nodeB.children[1], nodeE);
  t.is(editor.selectedTransformRoots.length, 1);
  t.is(editor.selectedTransformRoots[0], nodeE);
  t.is(sceneGraphChangedHandler.callCount, 4);
  t.is(selectionChangedHandler.callCount, 4);
});

test("reparentSelected", t => {
  const editor = new Editor();

  const sceneGraphChangedHandler = sinon.spy();
  const selectionChangedHandler = sinon.spy();
  editor.addListener("sceneGraphChanged", sceneGraphChangedHandler);
  editor.addListener("selectionChanged", selectionChangedHandler);

  const nodeA = new MockNode();
  nodeA.name = "NodeA";
  const nodeB = new MockNode();
  nodeB.name = "NodeB";
  const nodeC = new MockNode();
  nodeC.name = "NodeC";
  const nodeD = new MockNode();
  nodeD.name = "NodeD";
  const nodeE = new MockNode();
  nodeE.name = "NodeE";

  editor.addObject(nodeA);
  editor.addObject(nodeB);
  editor.addObject(nodeC, nodeA);
  editor.addObject(nodeD, nodeB);
  editor.addObject(nodeE, nodeB);

  sceneGraphChangedHandler.resetHistory();
  selectionChangedHandler.resetHistory();

  t.is(nodeA.children.length, 1);
  t.is(nodeA.children[0], nodeC);
  t.is(nodeB.children.length, 2);
  t.is(nodeB.children[0], nodeD);
  t.is(nodeB.children[1], nodeE);
  t.is(editor.selectedTransformRoots.length, 1);
  t.is(editor.selectedTransformRoots[0], nodeE);
  t.is(sceneGraphChangedHandler.callCount, 0);
  t.is(selectionChangedHandler.callCount, 0);

  editor.setSelection([nodeE, nodeD]);
  editor.reparentSelected(nodeA); // Move nodeE and nodeD to nodeA as the last children, in tree traversal order

  t.is(nodeA.children.length, 3);
  t.is(nodeA.children[0], nodeC);
  t.is(nodeA.children[1], nodeD);
  t.is(nodeA.children[2], nodeE);
  t.is(nodeB.children.length, 0);
  t.is(editor.selected.length, 2);
  t.is(editor.selected[0], nodeD);
  t.is(editor.selected[1], nodeE);
  t.is(editor.selectedTransformRoots.length, 2);
  t.is(editor.selectedTransformRoots[0], nodeD);
  t.is(editor.selectedTransformRoots[1], nodeE);
  t.is(sceneGraphChangedHandler.callCount, 1);
  t.is(selectionChangedHandler.callCount, 2);

  editor.history.undo();
  editor.history.undo();

  t.is(nodeA.children.length, 1);
  t.is(nodeA.children[0], nodeC);
  t.is(nodeB.children.length, 2);
  t.is(nodeB.children[0], nodeD);
  t.is(nodeB.children[1], nodeE);
  t.is(editor.selectedTransformRoots.length, 1);
  t.is(editor.selectedTransformRoots[0], nodeE);
  t.is(sceneGraphChangedHandler.callCount, 2);
  t.is(selectionChangedHandler.callCount, 4);

  editor.setSelection([nodeE, nodeD]);
  editor.reparentSelected(nodeA, nodeC); // Move nodeE and nodeD to nodeA before nodeC, in tree traversal order

  t.is(nodeA.children.length, 3);
  t.is(nodeA.children[0], nodeD);
  t.is(nodeA.children[1], nodeE);
  t.is(nodeA.children[2], nodeC);
  t.is(nodeB.children.length, 0);
  t.is(editor.selectedTransformRoots.length, 2);
  t.is(editor.selectedTransformRoots[0], nodeD);
  t.is(editor.selectedTransformRoots[1], nodeE);
  t.is(sceneGraphChangedHandler.callCount, 3);
  t.is(selectionChangedHandler.callCount, 6);

  editor.history.undo();
  editor.history.undo();

  t.is(nodeA.children.length, 1);
  t.is(nodeA.children[0], nodeC);
  t.is(nodeB.children.length, 2);
  t.is(nodeB.children[0], nodeD);
  t.is(nodeB.children[1], nodeE);
  t.is(editor.selectedTransformRoots.length, 1);
  t.is(editor.selectedTransformRoots[0], nodeE);
  t.is(sceneGraphChangedHandler.callCount, 4);
  t.is(selectionChangedHandler.callCount, 8);
});

test("setPosition", t => {
  const editor = new Editor();
  editor.history.commandUpdatesEnabled = false;

  const objectsChangedHandler = sinon.spy();
  editor.addListener("objectsChanged", objectsChangedHandler);

  const onChangeBSpy = sinon.spy();

  const nodeA = new MockNode(editor);
  nodeA.rotation.set(0, Math.PI, 0);
  const nodeB = new MockNode(editor, { onChange: onChangeBSpy });

  editor.addObject(nodeA);
  editor.addObject(nodeB, nodeA);

  const nodeBWorldPosition = new Vector3();

  nodeB.getWorldPosition(nodeBWorldPosition);

  t.true(floatEqual(nodeBWorldPosition.x, 0));
  t.true(floatEqual(nodeBWorldPosition.y, 0));
  t.true(floatEqual(nodeBWorldPosition.z, 0));

  editor.setPosition(nodeB, new Vector3(1, 0, 0), TransformSpace.World);

  nodeB.getWorldPosition(nodeBWorldPosition);

  t.true(floatEqual(nodeBWorldPosition.x, 1));
  t.true(floatEqual(nodeBWorldPosition.y, 0));
  t.true(floatEqual(nodeBWorldPosition.z, 0));
  t.is(objectsChangedHandler.callCount, 1);
  t.true(arrayShallowEqual(objectsChangedHandler.getCall(0).args[0], [nodeB]));
  t.is(objectsChangedHandler.getCall(0).args[1], "position");
  t.is(onChangeBSpy.callCount, 1);
  t.is(onChangeBSpy.getCall(0).args[0], "position");

  editor.history.undo();

  nodeB.getWorldPosition(nodeBWorldPosition);

  t.true(floatEqual(nodeBWorldPosition.x, 0));
  t.true(floatEqual(nodeBWorldPosition.y, 0));
  t.true(floatEqual(nodeBWorldPosition.z, 0));
  t.is(objectsChangedHandler.callCount, 2);
  t.true(arrayShallowEqual(objectsChangedHandler.getCall(1).args[0], [nodeB]));
  t.is(objectsChangedHandler.getCall(1).args[1], "position");
  t.is(onChangeBSpy.callCount, 2);
  t.is(onChangeBSpy.getCall(1).args[0], "position");

  editor.setPosition(nodeB, new Vector3(1, 0, 0), TransformSpace.Local);

  nodeB.getWorldPosition(nodeBWorldPosition);

  t.true(floatEqual(nodeBWorldPosition.x, -1));
  t.true(floatEqual(nodeBWorldPosition.y, 0));
  t.true(floatEqual(nodeBWorldPosition.z, 0));
  t.is(objectsChangedHandler.callCount, 3);
  t.true(arrayShallowEqual(objectsChangedHandler.getCall(2).args[0], [nodeB]));
  t.is(objectsChangedHandler.getCall(2).args[1], "position");
  t.is(onChangeBSpy.callCount, 3);
  t.is(onChangeBSpy.getCall(2).args[0], "position");

  editor.history.undo();

  nodeB.getWorldPosition(nodeBWorldPosition);

  t.true(floatEqual(nodeBWorldPosition.x, 0));
  t.true(floatEqual(nodeBWorldPosition.y, 0));
  t.true(floatEqual(nodeBWorldPosition.z, 0));
  t.is(objectsChangedHandler.callCount, 4);
  t.true(arrayShallowEqual(objectsChangedHandler.getCall(3).args[0], [nodeB]));
  t.is(objectsChangedHandler.getCall(3).args[1], "position");
  t.is(onChangeBSpy.callCount, 4);
  t.is(onChangeBSpy.getCall(3).args[0], "position");
});

test("setPositionMultiple", t => {
  const editor = new Editor();
  editor.history.commandUpdatesEnabled = false;

  const objectsChangedHandler = sinon.spy();
  editor.addListener("objectsChanged", objectsChangedHandler);

  const onChangeBSpy = sinon.spy();
  const onChangeCSpy = sinon.spy();
  const onChangeDSpy = sinon.spy();

  const nodeA = new MockNode(editor);
  nodeA.rotation.set(0, Math.PI, 0);
  const nodeB = new MockNode(editor, { onChange: onChangeBSpy });
  const nodeC = new MockNode(editor, { onChange: onChangeCSpy });
  const nodeD = new MockNode(editor, { onChange: onChangeDSpy });

  editor.addObject(nodeA);
  editor.addObject(nodeB, nodeA);
  editor.addObject(nodeC, nodeA);
  editor.addObject(nodeD);

  const nodeWorldPosition = new Vector3();

  nodeA.getWorldPosition(nodeWorldPosition);

  t.true(floatEqual(nodeWorldPosition.x, 0));
  t.true(floatEqual(nodeWorldPosition.y, 0));
  t.true(floatEqual(nodeWorldPosition.z, 0));

  nodeD.getWorldPosition(nodeWorldPosition);

  t.true(floatEqual(nodeWorldPosition.x, 0));
  t.true(floatEqual(nodeWorldPosition.y, 0));
  t.true(floatEqual(nodeWorldPosition.z, 0));

  editor.setPositionMultiple([nodeA, nodeD], new Vector3(1, 0, 0), TransformSpace.World);

  nodeA.getWorldPosition(nodeWorldPosition);

  t.true(floatEqual(nodeWorldPosition.x, 1));
  t.true(floatEqual(nodeWorldPosition.y, 0));
  t.true(floatEqual(nodeWorldPosition.z, 0));

  nodeD.getWorldPosition(nodeWorldPosition);

  t.true(floatEqual(nodeWorldPosition.x, 1));
  t.true(floatEqual(nodeWorldPosition.y, 0));
  t.true(floatEqual(nodeWorldPosition.z, 0));

  editor.history.undo();

  nodeA.getWorldPosition(nodeWorldPosition);

  t.true(floatEqual(nodeWorldPosition.x, 0));
  t.true(floatEqual(nodeWorldPosition.y, 0));
  t.true(floatEqual(nodeWorldPosition.z, 0));

  nodeD.getWorldPosition(nodeWorldPosition);

  t.true(floatEqual(nodeWorldPosition.x, 0));
  t.true(floatEqual(nodeWorldPosition.y, 0));
  t.true(floatEqual(nodeWorldPosition.z, 0));

  editor.setPositionMultiple([nodeB, nodeD], new Vector3(1, 0, 0), TransformSpace.Local);

  nodeB.getWorldPosition(nodeWorldPosition);

  t.true(floatEqual(nodeWorldPosition.x, -1));
  t.true(floatEqual(nodeWorldPosition.y, 0));
  t.true(floatEqual(nodeWorldPosition.z, 0));

  nodeD.getWorldPosition(nodeWorldPosition);

  t.true(floatEqual(nodeWorldPosition.x, 1));
  t.true(floatEqual(nodeWorldPosition.y, 0));
  t.true(floatEqual(nodeWorldPosition.z, 0));

  editor.history.undo();

  nodeB.getWorldPosition(nodeWorldPosition);

  t.true(floatEqual(nodeWorldPosition.x, 0));
  t.true(floatEqual(nodeWorldPosition.y, 0));
  t.true(floatEqual(nodeWorldPosition.z, 0));

  nodeD.getWorldPosition(nodeWorldPosition);

  t.true(floatEqual(nodeWorldPosition.x, 0));
  t.true(floatEqual(nodeWorldPosition.y, 0));
  t.true(floatEqual(nodeWorldPosition.z, 0));
});

test("setPositionSelected", t => {
  const editor = new Editor();
  editor.history.commandUpdatesEnabled = false;

  const objectsChangedHandler = sinon.spy();
  editor.addListener("objectsChanged", objectsChangedHandler);

  const onChangeBSpy = sinon.spy();
  const onChangeCSpy = sinon.spy();
  const onChangeDSpy = sinon.spy();

  const nodeA = new MockNode(editor);
  nodeA.rotation.set(0, Math.PI, 0);
  const nodeB = new MockNode(editor, { onChange: onChangeBSpy });
  const nodeC = new MockNode(editor, { onChange: onChangeCSpy });
  const nodeD = new MockNode(editor, { onChange: onChangeDSpy });

  editor.addObject(nodeA);
  editor.addObject(nodeB, nodeA);
  editor.addObject(nodeC, nodeA);
  editor.addObject(nodeD);

  const nodeWorldPosition = new Vector3();

  nodeA.getWorldPosition(nodeWorldPosition);

  t.true(floatEqual(nodeWorldPosition.x, 0));
  t.true(floatEqual(nodeWorldPosition.y, 0));
  t.true(floatEqual(nodeWorldPosition.z, 0));

  nodeD.getWorldPosition(nodeWorldPosition);

  t.true(floatEqual(nodeWorldPosition.x, 0));
  t.true(floatEqual(nodeWorldPosition.y, 0));
  t.true(floatEqual(nodeWorldPosition.z, 0));

  editor.setSelection([nodeA, nodeD]);
  editor.setPositionSelected(new Vector3(1, 0, 0), TransformSpace.World);

  nodeA.getWorldPosition(nodeWorldPosition);

  t.true(floatEqual(nodeWorldPosition.x, 1));
  t.true(floatEqual(nodeWorldPosition.y, 0));
  t.true(floatEqual(nodeWorldPosition.z, 0));

  nodeD.getWorldPosition(nodeWorldPosition);

  t.true(floatEqual(nodeWorldPosition.x, 1));
  t.true(floatEqual(nodeWorldPosition.y, 0));
  t.true(floatEqual(nodeWorldPosition.z, 0));

  editor.history.undo();
  editor.history.undo();

  nodeA.getWorldPosition(nodeWorldPosition);

  t.true(floatEqual(nodeWorldPosition.x, 0));
  t.true(floatEqual(nodeWorldPosition.y, 0));
  t.true(floatEqual(nodeWorldPosition.z, 0));

  nodeD.getWorldPosition(nodeWorldPosition);

  t.true(floatEqual(nodeWorldPosition.x, 0));
  t.true(floatEqual(nodeWorldPosition.y, 0));
  t.true(floatEqual(nodeWorldPosition.z, 0));

  editor.setSelection([nodeB, nodeD]);
  editor.setPositionSelected(new Vector3(1, 0, 0), TransformSpace.Local);

  nodeB.getWorldPosition(nodeWorldPosition);

  t.true(floatEqual(nodeWorldPosition.x, -1));
  t.true(floatEqual(nodeWorldPosition.y, 0));
  t.true(floatEqual(nodeWorldPosition.z, 0));

  nodeD.getWorldPosition(nodeWorldPosition);

  t.true(floatEqual(nodeWorldPosition.x, 1));
  t.true(floatEqual(nodeWorldPosition.y, 0));
  t.true(floatEqual(nodeWorldPosition.z, 0));

  editor.history.undo();
  editor.history.undo();

  nodeB.getWorldPosition(nodeWorldPosition);

  t.true(floatEqual(nodeWorldPosition.x, 0));
  t.true(floatEqual(nodeWorldPosition.y, 0));
  t.true(floatEqual(nodeWorldPosition.z, 0));

  nodeD.getWorldPosition(nodeWorldPosition);

  t.true(floatEqual(nodeWorldPosition.x, 0));
  t.true(floatEqual(nodeWorldPosition.y, 0));
  t.true(floatEqual(nodeWorldPosition.z, 0));
});

test("translate", t => {
  const editor = new Editor();
  editor.history.commandUpdatesEnabled = false;

  const objectsChangedHandler = sinon.spy();
  editor.addListener("objectsChanged", objectsChangedHandler);

  const onChangeBSpy = sinon.spy();

  const nodeA = new MockNode(editor);
  nodeA.rotation.set(0, Math.PI, 0);
  const nodeB = new MockNode(editor, { onChange: onChangeBSpy });

  editor.addObject(nodeA);
  editor.addObject(nodeB, nodeA);

  const nodeBWorldPosition = new Vector3();

  nodeB.getWorldPosition(nodeBWorldPosition);

  t.true(floatEqual(nodeBWorldPosition.x, 0));
  t.true(floatEqual(nodeBWorldPosition.y, 0));
  t.true(floatEqual(nodeBWorldPosition.z, 0));

  editor.translate(nodeB, new Vector3(1, 0, 0), TransformSpace.World);

  nodeB.getWorldPosition(nodeBWorldPosition);

  t.true(floatEqual(nodeBWorldPosition.x, 1));
  t.true(floatEqual(nodeBWorldPosition.y, 0));
  t.true(floatEqual(nodeBWorldPosition.z, 0));
  t.is(objectsChangedHandler.callCount, 1);
  t.true(arrayShallowEqual(objectsChangedHandler.getCall(0).args[0], [nodeB]));
  t.is(objectsChangedHandler.getCall(0).args[1], "position");
  t.is(onChangeBSpy.callCount, 1);
  t.is(onChangeBSpy.getCall(0).args[0], "position");

  editor.history.undo();

  nodeB.getWorldPosition(nodeBWorldPosition);

  t.true(floatEqual(nodeBWorldPosition.x, 0));
  t.true(floatEqual(nodeBWorldPosition.y, 0));
  t.true(floatEqual(nodeBWorldPosition.z, 0));
  t.is(objectsChangedHandler.callCount, 2);
  t.true(arrayShallowEqual(objectsChangedHandler.getCall(1).args[0], [nodeB]));
  t.is(objectsChangedHandler.getCall(1).args[1], "position");
  t.is(onChangeBSpy.callCount, 2);
  t.is(onChangeBSpy.getCall(1).args[0], "position");

  editor.translate(nodeB, new Vector3(1, 0, 0), TransformSpace.Local);

  nodeB.getWorldPosition(nodeBWorldPosition);

  t.true(floatEqual(nodeBWorldPosition.x, -1));
  t.true(floatEqual(nodeBWorldPosition.y, 0));
  t.true(floatEqual(nodeBWorldPosition.z, 0));
  t.is(objectsChangedHandler.callCount, 3);
  t.true(arrayShallowEqual(objectsChangedHandler.getCall(2).args[0], [nodeB]));
  t.is(objectsChangedHandler.getCall(2).args[1], "position");
  t.is(onChangeBSpy.callCount, 3);
  t.is(onChangeBSpy.getCall(2).args[0], "position");

  editor.history.undo();

  nodeB.getWorldPosition(nodeBWorldPosition);

  t.true(floatEqual(nodeBWorldPosition.x, 0));
  t.true(floatEqual(nodeBWorldPosition.y, 0));
  t.true(floatEqual(nodeBWorldPosition.z, 0));
  t.is(objectsChangedHandler.callCount, 4);
  t.true(arrayShallowEqual(objectsChangedHandler.getCall(3).args[0], [nodeB]));
  t.is(objectsChangedHandler.getCall(3).args[1], "position");
  t.is(onChangeBSpy.callCount, 4);
  t.is(onChangeBSpy.getCall(3).args[0], "position");
});

test("translateMultiple", t => {
  const editor = new Editor();
  editor.history.commandUpdatesEnabled = false;

  const objectsChangedHandler = sinon.spy();
  editor.addListener("objectsChanged", objectsChangedHandler);

  const onChangeBSpy = sinon.spy();
  const onChangeCSpy = sinon.spy();
  const onChangeDSpy = sinon.spy();

  const nodeA = new MockNode(editor);
  nodeA.rotation.set(0, Math.PI, 0);
  const nodeB = new MockNode(editor, { onChange: onChangeBSpy });
  const nodeC = new MockNode(editor, { onChange: onChangeCSpy });
  const nodeD = new MockNode(editor, { onChange: onChangeDSpy });

  editor.addObject(nodeA);
  editor.addObject(nodeB, nodeA);
  editor.addObject(nodeC, nodeA);
  editor.addObject(nodeD);

  const nodeWorldPosition = new Vector3();

  nodeA.getWorldPosition(nodeWorldPosition);

  t.true(floatEqual(nodeWorldPosition.x, 0));
  t.true(floatEqual(nodeWorldPosition.y, 0));
  t.true(floatEqual(nodeWorldPosition.z, 0));

  nodeD.getWorldPosition(nodeWorldPosition);

  t.true(floatEqual(nodeWorldPosition.x, 0));
  t.true(floatEqual(nodeWorldPosition.y, 0));
  t.true(floatEqual(nodeWorldPosition.z, 0));

  editor.translateMultiple([nodeA, nodeD], new Vector3(1, 0, 0), TransformSpace.World);

  nodeA.getWorldPosition(nodeWorldPosition);

  t.true(floatEqual(nodeWorldPosition.x, 1));
  t.true(floatEqual(nodeWorldPosition.y, 0));
  t.true(floatEqual(nodeWorldPosition.z, 0));

  nodeD.getWorldPosition(nodeWorldPosition);

  t.true(floatEqual(nodeWorldPosition.x, 1));
  t.true(floatEqual(nodeWorldPosition.y, 0));
  t.true(floatEqual(nodeWorldPosition.z, 0));

  editor.history.undo();

  nodeA.getWorldPosition(nodeWorldPosition);

  t.true(floatEqual(nodeWorldPosition.x, 0));
  t.true(floatEqual(nodeWorldPosition.y, 0));
  t.true(floatEqual(nodeWorldPosition.z, 0));

  nodeD.getWorldPosition(nodeWorldPosition);

  t.true(floatEqual(nodeWorldPosition.x, 0));
  t.true(floatEqual(nodeWorldPosition.y, 0));
  t.true(floatEqual(nodeWorldPosition.z, 0));

  editor.translateMultiple([nodeB, nodeD], new Vector3(1, 0, 0), TransformSpace.Local);

  nodeB.getWorldPosition(nodeWorldPosition);

  t.true(floatEqual(nodeWorldPosition.x, -1));
  t.true(floatEqual(nodeWorldPosition.y, 0));
  t.true(floatEqual(nodeWorldPosition.z, 0));

  nodeD.getWorldPosition(nodeWorldPosition);

  t.true(floatEqual(nodeWorldPosition.x, 1));
  t.true(floatEqual(nodeWorldPosition.y, 0));
  t.true(floatEqual(nodeWorldPosition.z, 0));

  editor.history.undo();

  nodeB.getWorldPosition(nodeWorldPosition);

  t.true(floatEqual(nodeWorldPosition.x, 0));
  t.true(floatEqual(nodeWorldPosition.y, 0));
  t.true(floatEqual(nodeWorldPosition.z, 0));

  nodeD.getWorldPosition(nodeWorldPosition);

  t.true(floatEqual(nodeWorldPosition.x, 0));
  t.true(floatEqual(nodeWorldPosition.y, 0));
  t.true(floatEqual(nodeWorldPosition.z, 0));
});

test("translateSelected", t => {
  const editor = new Editor();
  editor.history.commandUpdatesEnabled = false;

  const objectsChangedHandler = sinon.spy();
  editor.addListener("objectsChanged", objectsChangedHandler);

  const onChangeBSpy = sinon.spy();
  const onChangeCSpy = sinon.spy();
  const onChangeDSpy = sinon.spy();

  const nodeA = new MockNode(editor);
  nodeA.rotation.set(0, Math.PI, 0);
  const nodeB = new MockNode(editor, { onChange: onChangeBSpy });
  const nodeC = new MockNode(editor, { onChange: onChangeCSpy });
  const nodeD = new MockNode(editor, { onChange: onChangeDSpy });

  editor.addObject(nodeA);
  editor.addObject(nodeB, nodeA);
  editor.addObject(nodeC, nodeA);
  editor.addObject(nodeD);

  const nodeWorldPosition = new Vector3();

  nodeA.getWorldPosition(nodeWorldPosition);

  t.true(floatEqual(nodeWorldPosition.x, 0));
  t.true(floatEqual(nodeWorldPosition.y, 0));
  t.true(floatEqual(nodeWorldPosition.z, 0));

  nodeD.getWorldPosition(nodeWorldPosition);

  t.true(floatEqual(nodeWorldPosition.x, 0));
  t.true(floatEqual(nodeWorldPosition.y, 0));
  t.true(floatEqual(nodeWorldPosition.z, 0));

  editor.setSelection([nodeA, nodeD]);
  editor.translateSelected(new Vector3(1, 0, 0), TransformSpace.World);

  nodeA.getWorldPosition(nodeWorldPosition);

  t.true(floatEqual(nodeWorldPosition.x, 1));
  t.true(floatEqual(nodeWorldPosition.y, 0));
  t.true(floatEqual(nodeWorldPosition.z, 0));

  nodeD.getWorldPosition(nodeWorldPosition);

  t.true(floatEqual(nodeWorldPosition.x, 1));
  t.true(floatEqual(nodeWorldPosition.y, 0));
  t.true(floatEqual(nodeWorldPosition.z, 0));

  editor.history.undo();
  editor.history.undo();

  nodeA.getWorldPosition(nodeWorldPosition);

  t.true(floatEqual(nodeWorldPosition.x, 0));
  t.true(floatEqual(nodeWorldPosition.y, 0));
  t.true(floatEqual(nodeWorldPosition.z, 0));

  nodeD.getWorldPosition(nodeWorldPosition);

  t.true(floatEqual(nodeWorldPosition.x, 0));
  t.true(floatEqual(nodeWorldPosition.y, 0));
  t.true(floatEqual(nodeWorldPosition.z, 0));

  editor.setSelection([nodeB, nodeD]);
  editor.translateSelected(new Vector3(1, 0, 0), TransformSpace.Local);

  nodeB.getWorldPosition(nodeWorldPosition);

  t.true(floatEqual(nodeWorldPosition.x, -1));
  t.true(floatEqual(nodeWorldPosition.y, 0));
  t.true(floatEqual(nodeWorldPosition.z, 0));

  nodeD.getWorldPosition(nodeWorldPosition);

  t.true(floatEqual(nodeWorldPosition.x, 1));
  t.true(floatEqual(nodeWorldPosition.y, 0));
  t.true(floatEqual(nodeWorldPosition.z, 0));

  editor.history.undo();
  editor.history.undo();

  nodeB.getWorldPosition(nodeWorldPosition);

  t.true(floatEqual(nodeWorldPosition.x, 0));
  t.true(floatEqual(nodeWorldPosition.y, 0));
  t.true(floatEqual(nodeWorldPosition.z, 0));

  nodeD.getWorldPosition(nodeWorldPosition);

  t.true(floatEqual(nodeWorldPosition.x, 0));
  t.true(floatEqual(nodeWorldPosition.y, 0));
  t.true(floatEqual(nodeWorldPosition.z, 0));
});

test("setRotation", t => {
  const editor = new Editor();
  editor.history.commandUpdatesEnabled = false;

  const objectsChangedHandler = sinon.spy();
  editor.addListener("objectsChanged", objectsChangedHandler);

  const onChangeBSpy = sinon.spy();

  const nodeA = new MockNode(editor);
  nodeA.rotation.set(0, Math.PI, 0);
  const nodeB = new MockNode(editor, { onChange: onChangeBSpy });

  editor.addObject(nodeA);
  editor.addObject(nodeB, nodeA);

  t.truthy(eulerEqual(nodeA.rotation, new Euler(0, Math.PI, 0)));
  const nodeBWorldQuaternion = new Quaternion();
  nodeB.getWorldQuaternion(nodeBWorldQuaternion);
  t.truthy(quaternionEqual(nodeBWorldQuaternion, new Quaternion(0, 1, 0, 0)));

  editor.setRotation(nodeB, new Euler(Math.PI / 2, 0, 0), TransformSpace.World);

  t.truthy(eulerEqual(nodeB.rotation, new Euler(Math.PI / 2, 0, Math.PI)));
  nodeB.getWorldQuaternion(nodeBWorldQuaternion);
  t.truthy(quaternionEqual(nodeBWorldQuaternion, new Quaternion(0.7071067811865476, 0, 0, 0.7071067811865476)));
  t.is(objectsChangedHandler.callCount, 1);
  t.true(arrayShallowEqual(objectsChangedHandler.getCall(0).args[0], [nodeB]));
  t.is(objectsChangedHandler.getCall(0).args[1], "rotation");
  t.is(onChangeBSpy.callCount, 1);
  t.is(onChangeBSpy.getCall(0).args[0], "rotation");

  editor.history.undo();

  t.truthy(eulerEqual(nodeB.rotation, new Euler(0, 0, 0)));
  nodeB.getWorldQuaternion(nodeBWorldQuaternion);
  t.truthy(quaternionEqual(nodeBWorldQuaternion, new Quaternion(0, 1, 0, 0)));
  t.is(objectsChangedHandler.callCount, 2);
  t.true(arrayShallowEqual(objectsChangedHandler.getCall(1).args[0], [nodeB]));
  t.is(objectsChangedHandler.getCall(1).args[1], "rotation");
  t.is(onChangeBSpy.callCount, 2);
  t.is(onChangeBSpy.getCall(1).args[0], "rotation");

  editor.setRotation(nodeB, new Euler(Math.PI / 2, 0, 0), TransformSpace.Local);

  t.truthy(eulerEqual(nodeB.rotation, new Euler(Math.PI / 2, 0, 0)));
  nodeB.getWorldQuaternion(nodeBWorldQuaternion);
  t.truthy(quaternionEqual(nodeBWorldQuaternion, new Quaternion(0, 0.7071067811865476, -0.7071067811865476, 0)));
  t.is(objectsChangedHandler.callCount, 3);
  t.true(arrayShallowEqual(objectsChangedHandler.getCall(2).args[0], [nodeB]));
  t.is(objectsChangedHandler.getCall(2).args[1], "rotation");
  t.is(onChangeBSpy.callCount, 3);
  t.is(onChangeBSpy.getCall(2).args[0], "rotation");

  editor.history.undo();

  t.truthy(eulerEqual(nodeB.rotation, new Euler(0, 0, 0)));
  nodeB.getWorldQuaternion(nodeBWorldQuaternion);
  t.truthy(quaternionEqual(nodeBWorldQuaternion, new Quaternion(0, 1, 0, 0)));
  t.is(objectsChangedHandler.callCount, 4);
  t.true(arrayShallowEqual(objectsChangedHandler.getCall(3).args[0], [nodeB]));
  t.is(objectsChangedHandler.getCall(3).args[1], "rotation");
  t.is(onChangeBSpy.callCount, 4);
  t.is(onChangeBSpy.getCall(3).args[0], "rotation");
});

test("setRotationMultiple", t => {
  const editor = new Editor();
  editor.history.commandUpdatesEnabled = false;

  const objectsChangedHandler = sinon.spy();
  editor.addListener("objectsChanged", objectsChangedHandler);

  const onChangeBSpy = sinon.spy();
  const onChangeCSpy = sinon.spy();

  const nodeA = new MockNode(editor);
  nodeA.rotation.set(0, Math.PI, 0);
  const nodeB = new MockNode(editor, { onChange: onChangeBSpy });
  const nodeC = new MockNode(editor, { onChange: onChangeCSpy });

  editor.addObject(nodeA);
  editor.addObject(nodeB, nodeA);
  editor.addObject(nodeC, nodeA);

  t.truthy(eulerEqual(nodeA.rotation, new Euler(0, Math.PI, 0)));
  const nodeBWorldQuaternion = new Quaternion();
  nodeB.getWorldQuaternion(nodeBWorldQuaternion);
  t.truthy(quaternionEqual(nodeBWorldQuaternion, new Quaternion(0, 1, 0, 0)));
  const nodeCWorldQuaternion = new Quaternion();
  nodeC.getWorldQuaternion(nodeCWorldQuaternion);
  t.truthy(quaternionEqual(nodeCWorldQuaternion, new Quaternion(0, 1, 0, 0)));

  editor.setRotationMultiple([nodeB, nodeC], new Euler(Math.PI / 2, 0, 0), TransformSpace.World);

  t.truthy(eulerEqual(nodeB.rotation, new Euler(Math.PI / 2, 0, Math.PI)));
  nodeB.getWorldQuaternion(nodeBWorldQuaternion);
  t.truthy(quaternionEqual(nodeBWorldQuaternion, new Quaternion(0.7071067811865476, 0, 0, 0.7071067811865476)));
  t.truthy(eulerEqual(nodeC.rotation, new Euler(Math.PI / 2, 0, Math.PI)));
  nodeC.getWorldQuaternion(nodeCWorldQuaternion);
  t.truthy(quaternionEqual(nodeCWorldQuaternion, new Quaternion(0.7071067811865476, 0, 0, 0.7071067811865476)));
  t.is(objectsChangedHandler.callCount, 1);
  t.true(arrayShallowEqual(objectsChangedHandler.getCall(0).args[0], [nodeB, nodeC]));
  t.is(objectsChangedHandler.getCall(0).args[1], "rotation");
  t.is(onChangeBSpy.callCount, 1);
  t.is(onChangeBSpy.getCall(0).args[0], "rotation");
  t.is(onChangeCSpy.callCount, 1);
  t.is(onChangeCSpy.getCall(0).args[0], "rotation");

  editor.history.undo();

  t.truthy(eulerEqual(nodeB.rotation, new Euler(0, 0, 0)));
  nodeB.getWorldQuaternion(nodeBWorldQuaternion);
  t.truthy(quaternionEqual(nodeBWorldQuaternion, new Quaternion(0, 1, 0, 0)));
  t.truthy(eulerEqual(nodeC.rotation, new Euler(0, 0, 0)));
  nodeC.getWorldQuaternion(nodeCWorldQuaternion);
  t.truthy(quaternionEqual(nodeCWorldQuaternion, new Quaternion(0, 1, 0, 0)));
  t.is(objectsChangedHandler.callCount, 2);
  t.true(arrayShallowEqual(objectsChangedHandler.getCall(1).args[0], [nodeB, nodeC]));
  t.is(objectsChangedHandler.getCall(1).args[1], "rotation");
  t.is(onChangeBSpy.callCount, 2);
  t.is(onChangeBSpy.getCall(1).args[0], "rotation");
  t.is(onChangeCSpy.callCount, 2);
  t.is(onChangeCSpy.getCall(1).args[0], "rotation");

  editor.setRotationMultiple([nodeB, nodeC], new Euler(Math.PI / 2, 0, 0), TransformSpace.Local);

  t.truthy(eulerEqual(nodeB.rotation, new Euler(Math.PI / 2, 0, 0)));
  nodeB.getWorldQuaternion(nodeBWorldQuaternion);
  t.truthy(quaternionEqual(nodeBWorldQuaternion, new Quaternion(0, 0.7071067811865476, -0.7071067811865476, 0)));
  t.truthy(eulerEqual(nodeC.rotation, new Euler(Math.PI / 2, 0, 0)));
  nodeC.getWorldQuaternion(nodeCWorldQuaternion);
  t.truthy(quaternionEqual(nodeCWorldQuaternion, new Quaternion(0, 0.7071067811865476, -0.7071067811865476, 0)));
  t.is(objectsChangedHandler.callCount, 3);
  t.true(arrayShallowEqual(objectsChangedHandler.getCall(2).args[0], [nodeB, nodeC]));
  t.is(objectsChangedHandler.getCall(2).args[1], "rotation");
  t.is(onChangeBSpy.callCount, 3);
  t.is(onChangeBSpy.getCall(2).args[0], "rotation");
  t.is(onChangeCSpy.callCount, 3);
  t.is(onChangeCSpy.getCall(2).args[0], "rotation");

  editor.history.undo();

  t.truthy(eulerEqual(nodeB.rotation, new Euler(0, 0, 0)));
  nodeB.getWorldQuaternion(nodeBWorldQuaternion);
  t.truthy(quaternionEqual(nodeBWorldQuaternion, new Quaternion(0, 1, 0, 0)));
  t.truthy(eulerEqual(nodeC.rotation, new Euler(0, 0, 0)));
  nodeC.getWorldQuaternion(nodeCWorldQuaternion);
  t.truthy(quaternionEqual(nodeCWorldQuaternion, new Quaternion(0, 1, 0, 0)));
  t.is(objectsChangedHandler.callCount, 4);
  t.true(arrayShallowEqual(objectsChangedHandler.getCall(3).args[0], [nodeB, nodeC]));
  t.is(objectsChangedHandler.getCall(3).args[1], "rotation");
  t.is(onChangeBSpy.callCount, 4);
  t.is(onChangeBSpy.getCall(3).args[0], "rotation");
  t.is(onChangeCSpy.callCount, 4);
  t.is(onChangeCSpy.getCall(3).args[0], "rotation");
});

test("setRotationSelected", t => {
  const editor = new Editor();
  editor.history.commandUpdatesEnabled = false;

  const objectsChangedHandler = sinon.spy();
  editor.addListener("objectsChanged", objectsChangedHandler);

  const onChangeBSpy = sinon.spy();
  const onChangeCSpy = sinon.spy();

  const nodeA = new MockNode(editor);
  nodeA.rotation.set(0, Math.PI, 0);
  const nodeB = new MockNode(editor, { onChange: onChangeBSpy });
  const nodeC = new MockNode(editor, { onChange: onChangeCSpy });

  editor.addObject(nodeA);
  editor.addObject(nodeB, nodeA);
  editor.addObject(nodeC, nodeA);

  t.truthy(eulerEqual(nodeA.rotation, new Euler(0, Math.PI, 0)));
  const nodeBWorldQuaternion = new Quaternion();
  nodeB.getWorldQuaternion(nodeBWorldQuaternion);
  t.truthy(quaternionEqual(nodeBWorldQuaternion, new Quaternion(0, 1, 0, 0)));
  const nodeCWorldQuaternion = new Quaternion();
  nodeC.getWorldQuaternion(nodeCWorldQuaternion);
  t.truthy(quaternionEqual(nodeCWorldQuaternion, new Quaternion(0, 1, 0, 0)));

  editor.setSelection([nodeB, nodeC]);
  editor.setRotationSelected(new Euler(Math.PI / 2, 0, 0), TransformSpace.World);

  t.truthy(eulerEqual(nodeB.rotation, new Euler(Math.PI / 2, 0, Math.PI)));
  nodeB.getWorldQuaternion(nodeBWorldQuaternion);
  t.truthy(quaternionEqual(nodeBWorldQuaternion, new Quaternion(0.7071067811865476, 0, 0, 0.7071067811865476)));
  t.truthy(eulerEqual(nodeC.rotation, new Euler(Math.PI / 2, 0, Math.PI)));
  nodeC.getWorldQuaternion(nodeCWorldQuaternion);
  t.truthy(quaternionEqual(nodeCWorldQuaternion, new Quaternion(0.7071067811865476, 0, 0, 0.7071067811865476)));
  t.is(objectsChangedHandler.callCount, 1);
  t.true(arrayShallowEqual(objectsChangedHandler.getCall(0).args[0], [nodeB, nodeC]));
  t.is(objectsChangedHandler.getCall(0).args[1], "rotation");
  t.is(onChangeBSpy.callCount, 1);
  t.is(onChangeBSpy.getCall(0).args[0], "rotation");
  t.is(onChangeCSpy.callCount, 1);
  t.is(onChangeCSpy.getCall(0).args[0], "rotation");

  editor.history.undo();
  editor.history.undo();

  t.truthy(eulerEqual(nodeB.rotation, new Euler(0, 0, 0)));
  nodeB.getWorldQuaternion(nodeBWorldQuaternion);
  t.truthy(quaternionEqual(nodeBWorldQuaternion, new Quaternion(0, 1, 0, 0)));
  t.truthy(eulerEqual(nodeC.rotation, new Euler(0, 0, 0)));
  nodeC.getWorldQuaternion(nodeCWorldQuaternion);
  t.truthy(quaternionEqual(nodeCWorldQuaternion, new Quaternion(0, 1, 0, 0)));
  t.is(objectsChangedHandler.callCount, 2);
  t.true(arrayShallowEqual(objectsChangedHandler.getCall(1).args[0], [nodeB, nodeC]));
  t.is(objectsChangedHandler.getCall(1).args[1], "rotation");
  t.is(onChangeBSpy.callCount, 2);
  t.is(onChangeBSpy.getCall(1).args[0], "rotation");
  t.is(onChangeCSpy.callCount, 2);
  t.is(onChangeCSpy.getCall(1).args[0], "rotation");

  editor.setSelection([nodeB, nodeC]);
  editor.setRotationSelected(new Euler(Math.PI / 2, 0, 0), TransformSpace.Local);

  t.truthy(eulerEqual(nodeB.rotation, new Euler(Math.PI / 2, 0, 0)));
  nodeB.getWorldQuaternion(nodeBWorldQuaternion);
  t.truthy(quaternionEqual(nodeBWorldQuaternion, new Quaternion(0, 0.7071067811865476, -0.7071067811865476, 0)));
  t.truthy(eulerEqual(nodeC.rotation, new Euler(Math.PI / 2, 0, 0)));
  nodeC.getWorldQuaternion(nodeCWorldQuaternion);
  t.truthy(quaternionEqual(nodeCWorldQuaternion, new Quaternion(0, 0.7071067811865476, -0.7071067811865476, 0)));
  t.is(objectsChangedHandler.callCount, 3);
  t.true(arrayShallowEqual(objectsChangedHandler.getCall(2).args[0], [nodeB, nodeC]));
  t.is(objectsChangedHandler.getCall(2).args[1], "rotation");
  t.is(onChangeBSpy.callCount, 3);
  t.is(onChangeBSpy.getCall(2).args[0], "rotation");
  t.is(onChangeCSpy.callCount, 3);
  t.is(onChangeCSpy.getCall(2).args[0], "rotation");

  editor.history.undo();
  editor.history.undo();

  t.truthy(eulerEqual(nodeB.rotation, new Euler(0, 0, 0)));
  nodeB.getWorldQuaternion(nodeBWorldQuaternion);
  t.truthy(quaternionEqual(nodeBWorldQuaternion, new Quaternion(0, 1, 0, 0)));
  t.truthy(eulerEqual(nodeC.rotation, new Euler(0, 0, 0)));
  nodeC.getWorldQuaternion(nodeCWorldQuaternion);
  t.truthy(quaternionEqual(nodeCWorldQuaternion, new Quaternion(0, 1, 0, 0)));
  t.is(objectsChangedHandler.callCount, 4);
  t.true(arrayShallowEqual(objectsChangedHandler.getCall(3).args[0], [nodeB, nodeC]));
  t.is(objectsChangedHandler.getCall(3).args[1], "rotation");
  t.is(onChangeBSpy.callCount, 4);
  t.is(onChangeBSpy.getCall(3).args[0], "rotation");
  t.is(onChangeCSpy.callCount, 4);
  t.is(onChangeCSpy.getCall(3).args[0], "rotation");
});

// TODO: Write tests for the remaining transform methods
// - rotateOnAxis
// - rotateOnAxisMultiple
// - rotateOnAxisSelected
// - rotateAround
// - rotateAroundMultiple
// - rotateAroundSelected
// - scale
// - scaleMultiple
// - scaleSelected
// - setScale
// - setScaleMultiple
// - setScaleSelected

test("setProperty", t => {
  const editor = new Editor();
  editor.history.commandUpdatesEnabled = false;

  const objectsChangedHandler = sinon.spy();
  editor.addListener("objectsChanged", objectsChangedHandler);

  const onChangeBSpy = sinon.spy();

  const nodeA = new MockNode(editor);
  const nodeB = new MockNode(editor, { onChange: onChangeBSpy });

  editor.addObject(nodeA);
  editor.addObject(nodeB, nodeA);

  nodeB.stringProperty = "before";
  nodeB.vector3Property = new Vector3();

  editor.setProperty(nodeB, "stringProperty", "after");

  t.is(nodeB.stringProperty, "after");
  t.is(objectsChangedHandler.callCount, 1);
  t.true(arrayShallowEqual(objectsChangedHandler.getCall(0).args[0], [nodeB]));
  t.is(objectsChangedHandler.getCall(0).args[1], "stringProperty");
  t.is(onChangeBSpy.callCount, 1);
  t.is(onChangeBSpy.getCall(0).args[0], "stringProperty");

  editor.history.undo();

  t.is(nodeB.stringProperty, "before");
  t.is(objectsChangedHandler.callCount, 2);
  t.true(arrayShallowEqual(objectsChangedHandler.getCall(1).args[0], [nodeB]));
  t.is(objectsChangedHandler.getCall(1).args[1], "stringProperty");
  t.is(onChangeBSpy.callCount, 2);
  t.is(onChangeBSpy.getCall(1).args[0], "stringProperty");

  const targetVector = new Vector3(1, 2, 3);

  editor.setProperty(nodeB, "vector3Property", targetVector);

  t.truthy(targetVector.equals(new Vector3(1, 2, 3)));
  t.truthy(nodeB.vector3Property.equals(new Vector3(1, 2, 3)));
  t.not(nodeB.vector3Property, targetVector);
  t.is(objectsChangedHandler.callCount, 3);
  t.true(arrayShallowEqual(objectsChangedHandler.getCall(0).args[0], [nodeB]));
  t.is(objectsChangedHandler.getCall(2).args[1], "vector3Property");
  t.is(onChangeBSpy.callCount, 3);
  t.is(onChangeBSpy.getCall(2).args[0], "vector3Property");

  editor.history.undo();

  t.truthy(targetVector.equals(new Vector3(1, 2, 3)));
  t.truthy(nodeB.vector3Property.equals(new Vector3(0, 0, 0)));
  t.not(nodeB.vector3Property, targetVector);
  t.is(objectsChangedHandler.callCount, 4);
  t.true(arrayShallowEqual(objectsChangedHandler.getCall(0).args[0], [nodeB]));
  t.is(objectsChangedHandler.getCall(3).args[1], "vector3Property");
  t.is(onChangeBSpy.callCount, 4);
  t.is(onChangeBSpy.getCall(3).args[0], "vector3Property");
});

test("setPropertyMultiple", t => {
  const editor = new Editor();
  editor.history.commandUpdatesEnabled = false;

  const objectsChangedHandler = sinon.spy();
  editor.addListener("objectsChanged", objectsChangedHandler);

  const onChangeASpy = sinon.spy();
  const onChangeBSpy = sinon.spy();

  const nodeA = new MockNode(editor, { onChange: onChangeASpy });
  const nodeB = new MockNode(editor, { onChange: onChangeBSpy });

  editor.addObject(nodeA);
  editor.addObject(nodeB, nodeA);

  nodeA.stringProperty = "beforeA";
  nodeA.vector3Property = new Vector3(1, 1, 1);

  nodeB.stringProperty = "beforeB";
  nodeB.vector3Property = new Vector3();

  editor.setPropertyMultiple([nodeA, nodeB], "stringProperty", "after");

  t.is(nodeA.stringProperty, "after");
  t.is(nodeB.stringProperty, "after");
  t.is(objectsChangedHandler.callCount, 1);
  t.true(arrayShallowEqual(objectsChangedHandler.getCall(0).args[0], [nodeA, nodeB]));
  t.is(objectsChangedHandler.getCall(0).args[1], "stringProperty");
  t.is(onChangeASpy.callCount, 1);
  t.is(onChangeASpy.getCall(0).args[0], "stringProperty");
  t.is(onChangeBSpy.callCount, 1);
  t.is(onChangeBSpy.getCall(0).args[0], "stringProperty");

  editor.history.undo();

  t.is(nodeA.stringProperty, "beforeA");
  t.is(nodeB.stringProperty, "beforeB");
  t.is(objectsChangedHandler.callCount, 2);
  t.true(arrayShallowEqual(objectsChangedHandler.getCall(1).args[0], [nodeA, nodeB]));
  t.is(objectsChangedHandler.getCall(1).args[1], "stringProperty");
  t.is(onChangeASpy.callCount, 2);
  t.is(onChangeASpy.getCall(1).args[0], "stringProperty");
  t.is(onChangeBSpy.callCount, 2);
  t.is(onChangeBSpy.getCall(1).args[0], "stringProperty");

  const targetVector = new Vector3(1, 2, 3);

  editor.setPropertyMultiple([nodeA, nodeB], "vector3Property", targetVector);

  t.truthy(targetVector.equals(new Vector3(1, 2, 3)));
  t.truthy(nodeA.vector3Property.equals(new Vector3(1, 2, 3)));
  t.truthy(nodeB.vector3Property.equals(new Vector3(1, 2, 3)));
  t.not(nodeB.vector3Property, targetVector);
  t.is(objectsChangedHandler.callCount, 3);
  t.true(arrayShallowEqual(objectsChangedHandler.getCall(0).args[0], [nodeA, nodeB]));
  t.is(objectsChangedHandler.getCall(2).args[1], "vector3Property");
  t.is(onChangeASpy.callCount, 3);
  t.is(onChangeASpy.getCall(2).args[0], "vector3Property");
  t.is(onChangeBSpy.callCount, 3);
  t.is(onChangeBSpy.getCall(2).args[0], "vector3Property");

  editor.history.undo();

  t.truthy(targetVector.equals(new Vector3(1, 2, 3)));
  t.truthy(nodeA.vector3Property.equals(new Vector3(1, 1, 1)));
  t.truthy(nodeB.vector3Property.equals(new Vector3(0, 0, 0)));
  t.not(nodeB.vector3Property, targetVector);
  t.is(objectsChangedHandler.callCount, 4);
  t.true(arrayShallowEqual(objectsChangedHandler.getCall(0).args[0], [nodeA, nodeB]));
  t.is(objectsChangedHandler.getCall(3).args[1], "vector3Property");
  t.is(onChangeASpy.callCount, 4);
  t.is(onChangeASpy.getCall(3).args[0], "vector3Property");
  t.is(onChangeBSpy.callCount, 4);
  t.is(onChangeBSpy.getCall(3).args[0], "vector3Property");
});

test("setPropertySelected", t => {
  const editor = new Editor();
  editor.history.commandUpdatesEnabled = false;

  const objectsChangedHandler = sinon.spy();
  editor.addListener("objectsChanged", objectsChangedHandler);

  const onChangeASpy = sinon.spy();
  const onChangeBSpy = sinon.spy();

  const nodeA = new MockNode(editor, { onChange: onChangeASpy });
  const nodeB = new MockNode(editor, { onChange: onChangeBSpy });

  editor.addObject(nodeA);
  editor.addObject(nodeB, nodeA);

  nodeA.stringProperty = "beforeA";
  nodeA.vector3Property = new Vector3(1, 1, 1);

  nodeB.stringProperty = "beforeB";
  nodeB.vector3Property = new Vector3();

  editor.setSelection([nodeA, nodeB]);
  editor.setPropertySelected("stringProperty", "after");

  t.is(nodeA.stringProperty, "after");
  t.is(nodeB.stringProperty, "after");
  t.is(objectsChangedHandler.callCount, 1);
  t.true(arrayShallowEqual(objectsChangedHandler.getCall(0).args[0], [nodeA, nodeB]));
  t.is(objectsChangedHandler.getCall(0).args[1], "stringProperty");
  t.is(onChangeASpy.callCount, 1);
  t.is(onChangeASpy.getCall(0).args[0], "stringProperty");
  t.is(onChangeBSpy.callCount, 1);
  t.is(onChangeBSpy.getCall(0).args[0], "stringProperty");

  editor.history.undo();
  editor.history.undo();

  t.is(nodeA.stringProperty, "beforeA");
  t.is(nodeB.stringProperty, "beforeB");
  t.is(objectsChangedHandler.callCount, 2);
  t.true(arrayShallowEqual(objectsChangedHandler.getCall(1).args[0], [nodeA, nodeB]));
  t.is(objectsChangedHandler.getCall(1).args[1], "stringProperty");
  t.is(onChangeASpy.callCount, 2);
  t.is(onChangeASpy.getCall(1).args[0], "stringProperty");
  t.is(onChangeBSpy.callCount, 2);
  t.is(onChangeBSpy.getCall(1).args[0], "stringProperty");

  const targetVector = new Vector3(1, 2, 3);

  editor.setSelection([nodeA, nodeB]);
  editor.setPropertySelected("vector3Property", targetVector);

  t.truthy(targetVector.equals(new Vector3(1, 2, 3)));
  t.truthy(nodeA.vector3Property.equals(new Vector3(1, 2, 3)));
  t.truthy(nodeB.vector3Property.equals(new Vector3(1, 2, 3)));
  t.not(nodeB.vector3Property, targetVector);
  t.is(objectsChangedHandler.callCount, 3);
  t.true(arrayShallowEqual(objectsChangedHandler.getCall(0).args[0], [nodeA, nodeB]));
  t.is(objectsChangedHandler.getCall(2).args[1], "vector3Property");
  t.is(onChangeASpy.callCount, 3);
  t.is(onChangeASpy.getCall(2).args[0], "vector3Property");
  t.is(onChangeBSpy.callCount, 3);
  t.is(onChangeBSpy.getCall(2).args[0], "vector3Property");

  editor.history.undo();
  editor.history.undo();

  t.truthy(targetVector.equals(new Vector3(1, 2, 3)));
  t.truthy(nodeA.vector3Property.equals(new Vector3(1, 1, 1)));
  t.truthy(nodeB.vector3Property.equals(new Vector3(0, 0, 0)));
  t.not(nodeB.vector3Property, targetVector);
  t.is(objectsChangedHandler.callCount, 4);
  t.true(arrayShallowEqual(objectsChangedHandler.getCall(0).args[0], [nodeA, nodeB]));
  t.is(objectsChangedHandler.getCall(3).args[1], "vector3Property");
  t.is(onChangeASpy.callCount, 4);
  t.is(onChangeASpy.getCall(3).args[0], "vector3Property");
  t.is(onChangeBSpy.callCount, 4);
  t.is(onChangeBSpy.getCall(3).args[0], "vector3Property");
});

test("setProperties", t => {
  const editor = new Editor();
  editor.history.commandUpdatesEnabled = false;

  const objectsChangedHandler = sinon.spy();
  editor.addListener("objectsChanged", objectsChangedHandler);

  const onChangeBSpy = sinon.spy();

  const nodeA = new MockNode(editor);
  const nodeB = new MockNode(editor, { onChange: onChangeBSpy });

  editor.addObject(nodeA);
  editor.addObject(nodeB, nodeA);

  nodeB.stringProperty = "before";
  nodeB.vector3Property = new Vector3();

  const targetVector = new Vector3(1, 2, 3);

  editor.setProperties(nodeB, { stringProperty: "after", vector3Property: targetVector });

  t.is(nodeB.stringProperty, "after");
  t.truthy(targetVector.equals(new Vector3(1, 2, 3)));
  t.truthy(nodeB.vector3Property.equals(new Vector3(1, 2, 3)));
  t.is(objectsChangedHandler.callCount, 1);
  t.true(arrayShallowEqual(objectsChangedHandler.getCall(0).args[0], [nodeB]));
  t.is(objectsChangedHandler.getCall(0).args[1], undefined);
  t.is(onChangeBSpy.callCount, 1);
  t.is(onChangeBSpy.getCall(0).args[0], undefined);

  editor.history.undo();

  t.is(nodeB.stringProperty, "before");
  t.truthy(targetVector.equals(new Vector3(1, 2, 3)));
  t.truthy(nodeB.vector3Property.equals(new Vector3(0, 0, 0)));
  t.not(nodeB.vector3Property, targetVector);
  t.is(objectsChangedHandler.callCount, 2);
  t.true(arrayShallowEqual(objectsChangedHandler.getCall(1).args[0], [nodeB]));
  t.is(objectsChangedHandler.getCall(1).args[1], undefined);
  t.is(onChangeBSpy.callCount, 2);
  t.is(onChangeBSpy.getCall(1).args[0], undefined);
});

test("setPropertiesMultiple", t => {
  const editor = new Editor();
  editor.history.commandUpdatesEnabled = false;

  const objectsChangedHandler = sinon.spy();
  editor.addListener("objectsChanged", objectsChangedHandler);

  const onChangeASpy = sinon.spy();
  const onChangeBSpy = sinon.spy();

  const nodeA = new MockNode(editor, { onChange: onChangeASpy });
  const nodeB = new MockNode(editor, { onChange: onChangeBSpy });

  editor.addObject(nodeA);
  editor.addObject(nodeB, nodeA);

  nodeA.stringProperty = "beforeA";
  nodeA.vector3Property = new Vector3(1, 1, 1);
  nodeB.stringProperty = "beforeB";
  nodeB.vector3Property = new Vector3();

  const targetVector = new Vector3(1, 2, 3);

  editor.setPropertiesMultiple([nodeA, nodeB], { stringProperty: "after", vector3Property: targetVector });

  t.is(nodeA.stringProperty, "after");
  t.truthy(nodeA.vector3Property.equals(new Vector3(1, 2, 3)));
  t.is(nodeB.stringProperty, "after");
  t.truthy(nodeB.vector3Property.equals(new Vector3(1, 2, 3)));
  t.truthy(targetVector.equals(new Vector3(1, 2, 3)));
  t.is(objectsChangedHandler.callCount, 1);
  t.true(arrayShallowEqual(objectsChangedHandler.getCall(0).args[0], [nodeA, nodeB]));
  t.is(objectsChangedHandler.getCall(0).args[1], undefined);
  t.is(onChangeASpy.callCount, 1);
  t.is(onChangeASpy.getCall(0).args[0], undefined);
  t.is(onChangeBSpy.callCount, 1);
  t.is(onChangeBSpy.getCall(0).args[0], undefined);

  editor.history.undo();

  t.is(nodeA.stringProperty, "beforeA");
  t.truthy(nodeA.vector3Property.equals(new Vector3(1, 1, 1)));
  t.not(nodeA.vector3Property, targetVector);
  t.is(nodeB.stringProperty, "beforeB");
  t.truthy(nodeB.vector3Property.equals(new Vector3(0, 0, 0)));
  t.not(nodeB.vector3Property, targetVector);
  t.truthy(targetVector.equals(new Vector3(1, 2, 3)));
  t.is(objectsChangedHandler.callCount, 2);
  t.true(arrayShallowEqual(objectsChangedHandler.getCall(1).args[0], [nodeA, nodeB]));
  t.is(objectsChangedHandler.getCall(1).args[1], undefined);
  t.is(onChangeASpy.callCount, 2);
  t.is(onChangeASpy.getCall(1).args[0], undefined);
  t.is(onChangeBSpy.callCount, 2);
  t.is(onChangeBSpy.getCall(1).args[0], undefined);
});

test("setPropertiesSelected", t => {
  const editor = new Editor();
  editor.history.commandUpdatesEnabled = false;

  const objectsChangedHandler = sinon.spy();
  editor.addListener("objectsChanged", objectsChangedHandler);

  const onChangeBSpy = sinon.spy();

  const nodeA = new MockNode(editor);
  const nodeB = new MockNode(editor, { onChange: onChangeBSpy });

  editor.addObject(nodeA);
  editor.addObject(nodeB, nodeA);

  nodeB.stringProperty = "before";
  nodeB.vector3Property = new Vector3();

  const targetVector = new Vector3(1, 2, 3);

  editor.setProperties(nodeB, { stringProperty: "after", vector3Property: targetVector });

  t.is(nodeB.stringProperty, "after");
  t.truthy(targetVector.equals(new Vector3(1, 2, 3)));
  t.truthy(nodeB.vector3Property.equals(new Vector3(1, 2, 3)));
  t.is(objectsChangedHandler.callCount, 1);
  t.true(arrayShallowEqual(objectsChangedHandler.getCall(0).args[0], [nodeB]));
  t.is(objectsChangedHandler.getCall(0).args[1], undefined);
  t.is(onChangeBSpy.callCount, 1);
  t.is(onChangeBSpy.getCall(0).args[0], undefined);

  editor.history.undo();

  t.is(nodeB.stringProperty, "before");
  t.truthy(targetVector.equals(new Vector3(1, 2, 3)));
  t.truthy(nodeB.vector3Property.equals(new Vector3(0, 0, 0)));
  t.not(nodeB.vector3Property, targetVector);
  t.is(objectsChangedHandler.callCount, 2);
  t.true(arrayShallowEqual(objectsChangedHandler.getCall(1).args[0], [nodeB]));
  t.is(objectsChangedHandler.getCall(1).args[1], undefined);
  t.is(onChangeBSpy.callCount, 2);
  t.is(onChangeBSpy.getCall(1).args[0], undefined);
});
