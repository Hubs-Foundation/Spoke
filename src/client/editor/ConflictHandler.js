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
  const match = name.match(/(.*)_\d+$/);
  if (match) {
    cacheName = match[1];
  }
  return cacheName;
}

export default class ConflictHandler {
  constructor(scene) {
    this._conflicts = {
      missing: false,
      duplicate: false
    };
    this._scene = scene;
    this._duplicateList = {};
    this._updatedNodes = {};
    this._duplicateNameCounters = new Map();
  }

  findDuplicates = (node, layer, index) => {
    if (node.userData._path) {
      node.userData._path.push(index);
    } else {
      node.userData._path = [0];
    }
    node.userData._debounced = false;

    if (node.name.length === 0) {
      // unnamed node
      this._generateTempName(node);
    }

    const name = node.name;
    this.addToDuplicateNameCounters(name);

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

  getDuplicateByName = name => {
    if (!(name in this._duplicateList)) {
      return false;
    }
    return this._duplicateList[name] > 1;
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

  updateDuplicateStatus = () => {
    if (!this._scene) {
      return;
    }
    for (const value of this._duplicateNameCounters.values()) {
      if (value > 0) {
        this.setDuplicateStatus(true);
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
    this._updatedNodes[hashPath] = node.name;
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

  getUpdatedNodeName = path => {
    const hashPath = this._hashTreePath(path);
    if (!(hashPath in this._updatedNodes)) {
      return;
    }
    return this._updatedNodes[hashPath];
  };

  updateNodeNames = nodes => {
    const nodeTree = nodesToTree(nodes);

    for (const node of nodeTree) {
      node.name = this.getUpdatedNodeName(node.userData._path);
      delete node.userData;
    }
  };

  isUpdateNeeded = () => {
    return Object.keys(this._updatedNodes).length > 0;
  };

  isUniquieObjectName = name => {
    return !this._duplicateNameCounters.has(name);
  };

  updateDuplicateNameCounters = () => {
    const tempNameSet = new Set();
    this._scene.traverse(child => {
      const name = getNameWithoutIndex(child.name);
      tempNameSet.add(name);
    });

    const duplicateNameSet = new Set(this._duplicateNameCounters.keys());
    const difference = new Set([...duplicateNameSet].filter(x => !tempNameSet.has(x)));

    if (difference) {
      for (const name of difference.keys()) {
        this._duplicateNameCounters.delete(name);
      }
    }
  };

  addToDuplicateNameCounters = name => {
    const cacheName = getNameWithoutIndex(name);
    if (this.isUniquieObjectName(cacheName)) {
      this._duplicateNameCounters.set(cacheName, 0);
    } else {
      const n = this._duplicateNameCounters.get(cacheName) + 1;
      this._duplicateNameCounters.set(cacheName, n);
      return cacheName + "_" + n;
    }
    return cacheName;
  };

  resetDuplicateNameCounters = () => {
    this._duplicateNameCounters = new Map();
  };
}
