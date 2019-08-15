import test from "ava";
import getDetachedObjectsRoots from "../../../src/editor/utils/getDetachedObjectsRoots";
import MockNode from "../../helpers/MockNode";

test("getDetachedObjectsRoots", t => {
  const nodeA = new MockNode();
  nodeA.name = "NodeA";
  const nodeB = new MockNode();
  nodeB.name = "NodeB";
  const nodeC = new MockNode();
  nodeC.name = "NodeC";

  nodeA.add(nodeB);

  const objects1 = [nodeA, nodeB, nodeC];

  const result1 = getDetachedObjectsRoots(objects1);

  t.is(result1.length, 2);
  t.is(result1[0], nodeA);
  t.is(result1[1], nodeC);

  const objects2 = [nodeC, nodeB, nodeA];

  const result2 = getDetachedObjectsRoots(objects2);

  t.is(result2.length, 2);
  t.is(result2[0], nodeC);
  t.is(result2[1], nodeA);
});
