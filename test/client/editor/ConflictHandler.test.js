const THREE = require("three");
import ConflictHandler from "../../../src/client/editor/ConflictHandler";
import test from "ava";

function objNamed(name) {
  const obj = new THREE.Object3D();
  obj.name = name;
  return obj;
}

test("Reused names are given an index", t => {
  const handler = new ConflictHandler();
  t.is("new", handler.addToDuplicateNameCounters(objNamed("new"), "new"));
  t.is("new 2", handler.addToDuplicateNameCounters(objNamed("new"), "new"));
  t.is("new 3", handler.addToDuplicateNameCounters(objNamed("new"), "new"));
  t.is("foo", handler.addToDuplicateNameCounters(objNamed("foo"), "foo"));
});

test("Name can be reused if removed", t => {
  const handler = new ConflictHandler();
  t.is("new", handler.addToDuplicateNameCounters(objNamed("new"), "new"));
  handler.removeFromDuplicateNameCounters(objNamed("new"), "new");
  t.is("new", handler.addToDuplicateNameCounters(objNamed("new"), "new"));
});

test("Indexed name can be reused if removed", t => {
  const handler = new ConflictHandler();
  t.is("foo 2", handler.addToDuplicateNameCounters(objNamed("foo 2"), "foo 2"));
  handler.removeFromDuplicateNameCounters(objNamed("foo 2"), "foo 2");
  t.is("foo 2", handler.addToDuplicateNameCounters(objNamed("foo 2"), "foo 2"));
});

test("Indexing works when previous name is removed and readded", t => {
  const handler = new ConflictHandler();
  t.is("new", handler.addToDuplicateNameCounters(objNamed("new"), "new"));

  t.is("new 2", handler.addToDuplicateNameCounters(objNamed("new"), "new"));
  handler.removeFromDuplicateNameCounters(objNamed("new"), "new");

  t.is("new", handler.addToDuplicateNameCounters(objNamed("new"), "new"));
  t.is("new 3", handler.addToDuplicateNameCounters(objNamed("new"), "new"));
});

test("Name can be used if index is used first", t => {
  const handler = new ConflictHandler();
  t.is("new 2", handler.addToDuplicateNameCounters(objNamed("new 2"), "new 2"));
  t.is("new", handler.addToDuplicateNameCounters(objNamed("new"), "new"));
  t.is("new 3", handler.addToDuplicateNameCounters(objNamed("new"), "new"));
});

test("Reuse should be disallowed even after indexed name is removed", t => {
  const handler = new ConflictHandler();
  t.is("foo", handler.addToDuplicateNameCounters(objNamed("foo"), "foo"));
  t.is("foo 2", handler.addToDuplicateNameCounters(objNamed("foo 2"), "foo 2"));
  handler.removeFromDuplicateNameCounters(objNamed("foo 2"), "foo 2");
  t.false(handler.isUniqueObjectName("foo"));
});

test("Indexing increments even after intermediate index is removed", t => {
  const handler = new ConflictHandler();
  t.is("foo", handler.addToDuplicateNameCounters(objNamed("foo"), "foo"));
  t.is("foo 2", handler.addToDuplicateNameCounters(objNamed("foo"), "foo"));
  handler.removeFromDuplicateNameCounters(objNamed("foo 2"), "foo 2");
  t.is("foo 3", handler.addToDuplicateNameCounters(objNamed("foo"), "foo"));
});

test("De-duplication works when name already ends with a number", t => {
  const handler = new ConflictHandler();
  t.is("foo 2", handler.addToDuplicateNameCounters(objNamed("foo 2"), "foo 2"));
  t.is("foo 2 2", handler.addToDuplicateNameCounters(objNamed("foo 2"), "foo 2"));
});
