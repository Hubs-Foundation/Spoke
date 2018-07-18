export default class ConflictHandler {
  constructor() {
    this._conflicts = {
      missing: false,
      duplicate: false
    };
    this.duplicateList = {};
  }

  findDuplicates = (node, layer, index) => {
    if (node.userData._path) {
      node.userData._path.push(index);
    } else {
      node.userData._path = [0];
    }

    const name = node.name;
    this.duplicateList[name] = name in this.duplicateList ? this.duplicateList[name] + 1 : 1;
    if (this.duplicateList[name] > 1) {
      this.setDuplicateStatus(true);
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

  getDuplicateByName = name => {
    if (!(name in this.duplicateList)) {
      return false;
    }
    return this.duplicateList[name] > 1;
  };

  getMissingStatus = () => {
    return this._conflicts.missing;
  };

  getConflictInfo = () => {
    return this._conflicts;
  };

  updateAllDuplicateStatus = scene => {
    scene.traverse(child => {
      child.userData._duplicate = this.getDuplicateByName(child.name);
      child.userData._isDuplicateRoot = child.userData._duplicate;
    });
  };

  updateNodesMissingStatus = scene => {
    this.updateNodesConflictInfoByProperty(scene, "_missing");
  };

  updateNodesDuplicateStatus = scene => {
    this.updateNodesConflictInfoByProperty(scene, "_duplicate");
  };

  updateNodesConflictInfoByProperty = (scene, propertyName) => {
    scene.traverse(child => {
      if (child === scene) {
        return;
      }
      if (!child.userData._isMissingRoot && !child.userData._isDuplicateRoot) {
        child.userData[propertyName] = child.parent ? child.parent.userData[propertyName] : false;
      }
    });
  };

  checkResolvedMissinRoot = scene => {
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
}
