import test from "ava";
import { createEditor } from "../../src/config";
import Api from "../../src/api/Api";
import GroupNode from "../../src/editor/nodes/GroupNode";

const editor = createEditor(new Api());

for (const nodeType of editor.nodeTypes) {
  test(`${nodeType.name}.prototype.clone(true)`, t => {
    const groundPlaneNode = new nodeType();
    const groupNode = new GroupNode();
    groundPlaneNode.add(groupNode);
    const clonedNode = groundPlaneNode.clone(true);

    t.is(groundPlaneNode.children.length, clonedNode.children.length);

    for (let i = 0; i < groundPlaneNode.children.length; i++) {
      t.is(groundPlaneNode.children[i].name, clonedNode.children[i].name);
    }
  });
}
