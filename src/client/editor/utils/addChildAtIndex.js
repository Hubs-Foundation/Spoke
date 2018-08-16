export default function addChildAtIndex(parent, child, index) {
  parent.children.splice(index, 0, child);
  child.parent = parent;
}
