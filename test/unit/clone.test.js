import test from "ava";

import GroupNode from "../../src/editor/nodes/GroupNode";
import GroundPlaneNode from "../../src/editor/nodes/GroundPlaneNode";

test("GroundPlaneNode.prototype.clone(true)", t => {
  const groundPlaneNode = new GroundPlaneNode();
  const groupNode = new GroupNode();
  groundPlaneNode.add(groupNode);
  const clonedNode = groundPlaneNode.clone(true);

  t.is(groundPlaneNode.children.length, clonedNode.children.length);

  for (let i = 0; i < groundPlaneNode.children.length; i++) {
    t.is(groundPlaneNode.children[i].name, clonedNode.children[i].name);
  }
});
