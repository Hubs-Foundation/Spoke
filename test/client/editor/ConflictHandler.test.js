import ConflictHandler from "../../../src/client/editor/ConflictHandler";
import test from "ava";

test("Reused names are given an index", t => {
  const handler = new ConflictHandler();
  t.is("new", handler.addToDuplicateNameCounters("new"));
  t.is("new_1", handler.addToDuplicateNameCounters("new"));
  t.is("new_2", handler.addToDuplicateNameCounters("new"));
  t.is("foo", handler.addToDuplicateNameCounters("foo"));
});

test("Name can be reused if removed", t => {
  const handler = new ConflictHandler();
  t.is("new", handler.addToDuplicateNameCounters("new"));
  handler.removeFromDuplicateNameCounters("new");
  t.is("new", handler.addToDuplicateNameCounters("new"));
});

test("Indexed name can be reused if removed", t => {
  const handler = new ConflictHandler();
  t.is("foo_1", handler.addToDuplicateNameCounters("foo_1"));
  handler.removeFromDuplicateNameCounters("foo_1");
  t.is("foo_1", handler.addToDuplicateNameCounters("foo_1"));
});

test("Indexing works when previous name is removed and readded", t => {
  const handler = new ConflictHandler();
  t.is("new", handler.addToDuplicateNameCounters("new"));

  t.is("new_1", handler.addToDuplicateNameCounters("new"));
  handler.removeFromDuplicateNameCounters("new");

  t.is("new", handler.addToDuplicateNameCounters("new"));
  t.is("new_2", handler.addToDuplicateNameCounters("new"));
});

test("Name can be used if index is used first", t => {
  const handler = new ConflictHandler();
  t.is("new_1", handler.addToDuplicateNameCounters("new_1"));
  t.is("new", handler.addToDuplicateNameCounters("new"));
  t.is("new_2", handler.addToDuplicateNameCounters("new"));
});

test("Reuse should be disallowed even after indexed name is removed", t => {
  const handler = new ConflictHandler();
  t.is("foo", handler.addToDuplicateNameCounters("foo"));
  t.is("foo_1", handler.addToDuplicateNameCounters("foo_1"));
  handler.removeFromDuplicateNameCounters("foo_1");
  t.false(handler.isUniqueObjectName("foo"));
});

test("Indexing increments even after intermediate index is removed", t => {
  const handler = new ConflictHandler();
  t.is("foo", handler.addToDuplicateNameCounters("foo"));
  t.is("foo_1", handler.addToDuplicateNameCounters("foo"));
  handler.removeFromDuplicateNameCounters("foo_1");
  t.is("foo_2", handler.addToDuplicateNameCounters("foo"));
});
