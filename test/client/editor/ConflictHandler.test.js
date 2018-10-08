import ConflictHandler from "../../../src/client/editor/ConflictHandler";
import test from "ava";

test("Reused names are given an index", t => {
  const handler = new ConflictHandler();
  t.is("new", handler.addToDuplicateNameCounters("new"));
  t.is("new 2", handler.addToDuplicateNameCounters("new"));
  t.is("new 3", handler.addToDuplicateNameCounters("new"));
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
  t.is("foo 2", handler.addToDuplicateNameCounters("foo 2"));
  handler.removeFromDuplicateNameCounters("foo 2");
  t.is("foo 2", handler.addToDuplicateNameCounters("foo 2"));
});

test("Indexing works when previous name is removed and readded", t => {
  const handler = new ConflictHandler();
  t.is("new", handler.addToDuplicateNameCounters("new"));

  t.is("new 2", handler.addToDuplicateNameCounters("new"));
  handler.removeFromDuplicateNameCounters("new");

  t.is("new", handler.addToDuplicateNameCounters("new"));
  t.is("new 3", handler.addToDuplicateNameCounters("new"));
});

test("Name can be used if index is used first", t => {
  const handler = new ConflictHandler();
  t.is("new 2", handler.addToDuplicateNameCounters("new 2"));
  t.is("new", handler.addToDuplicateNameCounters("new"));
  t.is("new 3", handler.addToDuplicateNameCounters("new"));
});

test("Reuse should be disallowed even after indexed name is removed", t => {
  const handler = new ConflictHandler();
  t.is("foo", handler.addToDuplicateNameCounters("foo"));
  t.is("foo 2", handler.addToDuplicateNameCounters("foo 2"));
  handler.removeFromDuplicateNameCounters("foo 2");
  t.false(handler.isUniqueObjectName("foo"));
});

test("Indexing increments even after intermediate index is removed", t => {
  const handler = new ConflictHandler();
  t.is("foo", handler.addToDuplicateNameCounters("foo"));
  t.is("foo 2", handler.addToDuplicateNameCounters("foo"));
  handler.removeFromDuplicateNameCounters("foo 2");
  t.is("foo 3", handler.addToDuplicateNameCounters("foo"));
});
