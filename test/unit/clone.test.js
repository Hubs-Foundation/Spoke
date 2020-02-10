import test from "ava";
import { createEditor } from "../../src/config";
import Api from "../../src/api/Api";
import GroupNode from "../../src/editor/nodes/GroupNode";
import SceneNode from "../../src/editor/nodes/SceneNode";

const editor = createEditor(new Api());

function diffSceneGraph(value, expected) {
  let output = "";

  output += "Actual:\n";

  if (value) {
    output += "  " + value.constructor.name + ' "' + value.name + '"\n';

    for (const child of value.children) {
      output += "    " + child.constructor.name + ' "' + child.name + '"\n';
    }
  } else {
    output += "  " + value + "\n";
  }

  output += "Expected:\n";

  if (expected) {
    output += "  " + expected.constructor.name + ' "' + expected.name + '"\n';

    for (const child of expected.children) {
      output += "    " + child.constructor.name + ' "' + child.name + '"\n';
    }
  } else {
    output += "  " + expected + "\n";
  }

  return output;
}

function nodeEqual(t, value, expected, skipProps = false) {
  const sceneGraphDiff = diffSceneGraph(value, expected);

  t.truthy(value, sceneGraphDiff);
  t.truthy(expected, sceneGraphDiff);

  const numChildren = value.children.length;
  const expectedChildren = expected.children.length;

  t.is(value.name, expected.name, `Names do not match: "${value.name}" vs "${expected.name}"\n\n${sceneGraphDiff}`);

  t.is(
    numChildren,
    expectedChildren,
    `Number of children do not match: ${numChildren} vs ${expectedChildren}\n\n${sceneGraphDiff}`
  );

  t.is(
    value.constructor.name,
    expected.constructor.name,
    `Types do not match: "${value.constructor.name}" vs "${expected.constructor.name}"\n\n${sceneGraphDiff}`
  );

  const valueSerialized = value.serialize();
  const expectedSerialized = expected.serialize();

  if (!skipProps) {
    // AVA's deepEqual uses Object.is for comparisons. This makes -0 !== 0 which happens in serialization so json stringify and compare instead.
    t.is(JSON.stringify(valueSerialized, undefined, 2), JSON.stringify(expectedSerialized, undefined, 2));
  }

  for (let i = 0; i < numChildren; i++) {
    const child = value.children[i];
    const expectedChild = expected.children[i];

    t.is(
      child.name,
      expectedChild.name,
      `Names do not match: "${child.name}" vs "${expectedChild.name}"\n\n${sceneGraphDiff}`
    );

    t.is(
      child.constructor.name,
      expectedChild.constructor.name,
      `Types do not match: "${child.constructor.name}" vs "${expectedChild.constructor.name}"\n\n${sceneGraphDiff}`
    );
  }
}

for (const nodeType of editor.nodeTypes) {
  test(`${nodeType.name}.prototype.clone(true)`, t => {
    const node = new nodeType(editor);
    const groupNode = new GroupNode(editor);
    node.add(groupNode);
    const clonedNode = node.clone(true);
    nodeEqual(t, clonedNode, node, nodeType === SceneNode);
  });
}
