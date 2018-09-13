const namePattern = new RegExp("(.*) \\d+$");
function nodesToTree(nodes) {
  if (!nodes) {
    return;
  }

  for (const [i, node] of nodes.entries()) {
    if (!node.userData) {
      createTreePath(node, 0, i, nodes);
    }
    if (node.userData._visited) {
      continue;
    }
    createTreePath(node, 0, i, nodes);
  }

  return nodes;
}

function createTreePath(node, layer, index, nodes) {
  if (!node.userData) {
    node.userData = {};
  }
  node.userData._visited = true;
  if (node.userData._path) {
    node.userData._path.push(index);
  } else {
    node.userData._path = [0, 0];
  }

  if (node.children) {
    for (const [i, index] of node.children.entries()) {
      const child = nodes[index];
      if (!child.userData) {
        child.userData = {};
      }
      child.userData._path = node.userData._path.slice(0);
      createTreePath(child, layer + 1, i, nodes);
    }
  }
}

function getNameWithoutIndex(name) {
  let cacheName = name;
  const match = namePattern.exec(name);
  if (match) {
    cacheName = match[1];
  }
  return cacheName;
}

export default class ConflictHandler {
  constructor() {
    this._conflicts = {
      missing: false,
      duplicate: false
    };
    this._updatedNodes = new Map();
    this._duplicateNameCounters = new Map();
  }

  findDuplicates = (node, layer, index) => {
    if (node.userData._path) {
      node.userData._path.push(index);
    } else {
      node.userData._path = [0];
    }

    if (node.name.length === 0) {
      // unnamed node
      this.setMissingStatus(true);
      this._generateTempName(node);
    }

    const name = node.name;

    if (this._duplicateNameCounters.has(name)) {
      const nameObj = this._duplicateNameCounters.get(name);
      nameObj.count++;
      node.userData._resolvedName = name + " " + nameObj.count;
      this._updatedNodes.set(this._hashTreePath(node.userData._path), node.userData._resolvedName);
    } else {
      this._duplicateNameCounters.set(name, { used: true, count: 0 });
      const cacheName = getNameWithoutIndex(name);
      if (name !== cacheName) {
        if (!this.isUniqueObjectName(cacheName)) {
          this._duplicateNameCounters.get(cacheName).count++;
        }
      }
    }

    if (node.children) {
      node.children.forEach((child, i) => {
        child.userData._path = node.userData._path.slice(0);
        this.findDuplicates(child, layer + 1, i);
      });
    }
  };

  setDuplicateStatus = newStatus => {
    this._conflicts.duplicate = newStatus;
  };

  setMissingStatus = newStatus => {
    this._conflicts.missing = newStatus;
  };

  getDuplicateStatus = () => {
    this._updateDuplicateStatus();
    return this._conflicts.duplicate;
  };

  getMissingStatus = () => {
    return this._conflicts.missing;
  };

  getConflictInfo = () => {
    return this._conflicts;
  };

  updateAllDuplicateStatus = scene => {
    scene.traverse(child => {
      if (child === scene) {
        return;
      }
      child.userData._duplicate = this.getDuplicateByName(child.name);
      child.userData._isDuplicateRoot = child.userData._duplicate;
    });
  };

  _updateDuplicateStatus = () => {
    for (const nameObj of this._duplicateNameCounters.values()) {
      if (nameObj.count > 0) {
        this.setDuplicateStatus(true);
        break;
      }
    }
  };

  updateNodesMissingStatus = scene => {
    this._updateNodesConflictInfoByProperty(scene, "_missing");
  };

  updateNodesDuplicateStatus = scene => {
    this._updateNodesConflictInfoByProperty(scene, "_duplicate");
  };

  _updateNodesConflictInfoByProperty = (scene, propertyName) => {
    scene.traverse(child => {
      if (child === scene) {
        return;
      }
      if (!child.userData._isMissingRoot && !child.userData._isDuplicateRoot) {
        child.userData[propertyName] = child.parent ? child.parent.userData[propertyName] : false;
      }
    });
  };

  checkResolvedMissingRoot = scene => {
    let newStatus = false;
    const resolvedList = [];
    scene.traverse(child => {
      if (child.userData._isMissingRoot) {
        if (child.children.length > 0) {
          newStatus = true;
        } else {
          child.userData._isMissingRoot = false;
          child.userData._missing = false;
          resolvedList.push(child);
        }
      }
    });
    this.setMissingStatus(newStatus);
    return resolvedList;
  };

  _generateTempName = node => {
    const hashPath = this._hashTreePath(node.userData._path);
    node.name = "node_" + hashPath;
    this._updatedNodes.set(hashPath, node.name);
  };

  _hashTreePath = path => {
    // todo: maybe use different approaches to name unnamed nodes
    // currently use the tree path for each node
    return path.join("-");
  };

  // not used yet: should be used while the user modifies the name of the node that is inherited from the gltf.
  updateInheritedNodeName = (newName, node) => {
    const originalPath = this._hashTreePath(node.userData._path);
    node.name = newName;
    this._updatedNodes[originalPath] = newName;
  };

  getUpdatedNodeName = (path, oldName) => {
    const hashPath = this._hashTreePath(path);
    if (!this._updatedNodes.has(hashPath)) {
      return oldName;
    }
    return this._updatedNodes.get(hashPath);
  };

  updateNodeNames = nodes => {
    const nodeTree = nodesToTree(nodes);

    for (const node of nodeTree) {
      node.name = this.getUpdatedNodeName(node.userData._path, node.name);
      delete node.userData;
    }
  };

  isUpdateNeeded = () => {
    return Object.keys(this._updatedNodes).length > 0;
  };

  isUniqueObjectName = name => {
    const nameObj = this._duplicateNameCounters.get(name);
    return !nameObj || !nameObj.used;
  };

  updateDuplicateNameCounters = scene => {
    const tempNameSet = new Set();
    scene.traverse(child => {
      tempNameSet.add(child.name);
    });

    const duplicateNames = Array.from(this._duplicateNameCounters.keys());
    const difference = duplicateNames.filter(x => !tempNameSet.has(x));

    if (difference.length > 0) {
      for (const name of difference) {
        const nameObj = this._duplicateNameCounters.get(name);
        if (nameObj.count === 0) {
          this._duplicateNameCounters.delete(name);
        } else {
          nameObj.used = false;
        }
      }
    }
  };

  removeFromDuplicateNameCounters = name => {
    const cacheName = getNameWithoutIndex(name);
    const nameObj = this._duplicateNameCounters.get(name);
    if (nameObj === undefined) return;
    if (name === cacheName) {
      nameObj.used = false;
    } else {
      this._duplicateNameCounters.delete(name);
    }
  };

  addToDuplicateNameCounters = name => {
    const cacheName = getNameWithoutIndex(name);
    if (this.isUniqueObjectName(name)) {
      const nameObj = this._duplicateNameCounters.get(cacheName);
      if (name === cacheName) {
        if (nameObj) {
          nameObj.used = true;
        } else {
          this._duplicateNameCounters.set(cacheName, { used: true, count: 0 });
        }
      } else {
        this._duplicateNameCounters.set(name, { used: true, count: 0 });
      }
      return name;
    } else {
      let n = this._duplicateNameCounters.get(cacheName).count + 1;
      let newName = cacheName + " " + (n + 1);
      while (!this.isUniqueObjectName(newName)) {
        n += 1;
        newName = cacheName + " " + (n + 1);
      }
      this._duplicateNameCounters.get(cacheName).count = n;
      this._duplicateNameCounters.set(newName, { used: true });
      return newName;
    }
  };

  resolveConflicts = scene => {
    scene.traverse(child => {
      if (!this.isUniqueObjectName(child.name) && child.userData._resolvedName) {
        child.name = child.userData._resolvedName;
        delete child.userData._resolvedName;
      }
    });
  };
}
