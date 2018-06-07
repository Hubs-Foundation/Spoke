import { PROJECTS_PATH } from "./index";
import { EventEmitter } from "eventemitter3";
import deepEqual from "fast-deep-equal";
const { OS } = Components.utils.import("resource://gre/modules/osfile.jsm");
import { getFileExtension, getDirectoryEntries, copyRecursive } from "./utils";

export default class Project extends EventEmitter {
  constructor(name, uri, icon) {
    super();

    this.uri = uri;
    this.path = OS.Path.fromFileURI(uri);
    this.name = name;
    this.iconPath = icon ? OS.Path.fromFileURI(icon) : null;
    this.icon = icon;

    this._checkHierarchyTimeout = null;
    this._fileHierarchy = null;
  }

  async getFileHierarchy(force) {
    if (this._fileHierarchy && !force) {
      return this._fileHierarchy;
    }

    async function buildProjectNode(filePath, name, ext, isDirectory, uri, lastModified) {
      if (!isDirectory) {
        return {
          name,
          ext,
          uri,
          isDirectory,
          lastModified
        };
      }

      const children = [];
      const files = [];

      const directoryEntries = await getDirectoryEntries(filePath);

      for (const childEntry of directoryEntries) {
        let childLastModified;

        if ("winLastWriteDate" in childEntry) {
          childLastModified = childEntry.winLastWriteDate;
        } else {
          childLastModified = await OS.File.stat(childEntry.path).lastModificationDate;
        }

        const childNode = await buildProjectNode(
          childEntry.path,
          childEntry.name,
          getFileExtension(childEntry.name),
          childEntry.isDir,
          OS.Path.toFileURI(childEntry.path),
          childLastModified
        );

        // children are visible in the tree view. Directories and gltf files can be expanded.
        if (childNode.isDirectory || childNode.ext === "gltf" || childNode.ext === "glb") {
          children.push(childNode);
        }

        files.push(childNode);
      }

      return {
        name,
        uri,
        children,
        files,
        isDirectory: true,
        lastModified
      };
    }

    const { lastModificationDate } = await OS.File.stat(this.path);

    this._fileHierarchy = await buildProjectNode(this.path, this.name, undefined, true, this.uri, lastModificationDate);

    return this._fileHierarchy;
  }

  addListener(event, callback) {
    super.addListener(event, callback);

    if (event === "hierarchychanged" && this._checkHierarchyTimeout === null) {
      this._checkHierarchyTimeout = setTimeout(this._checkHierarchy, 5000);
    }
  }

  removeListener(event, callback) {
    super.removeListener(event, callback);

    if (event === "hierarchychanged" && this.listenerCount(event) === 0) {
      clearTimeout(this._checkHierarchyTimeout);
      this._checkHierarchyTimeout = null;
    }
  }

  _checkHierarchy = () => {
    const oldHierarchy = this._fileHierarchy;
    const newHierarchy = this.getFileHierarchy(true);

    if (!deepEqual(oldHierarchy, newHierarchy)) {
      this.emit("hierarchychanged", this._fileHierarchy);
    }

    this._checkHierarchyTimeout = setTimeout(this._checkHierarchy, 5000);
  };

  close() {
    if (this.watcher) {
      this.watcher.close();
    }
  }

  static async createFromTemplate(name, templateUri, projectDirUri) {
    const templateDirPath = OS.Path.fromFileURI(templateUri);
    const baseProjectDir = projectDirUri ? OS.Path.fromFileURI(projectDirUri) : PROJECTS_PATH;
    const projectDirPath = OS.Path.join(baseProjectDir, name);
    const finalDestUri = OS.Path.toFileURI(projectDirPath);

    await OS.File.makeDir(projectDirPath, { ignoreExisting: true });
    await copyRecursive(templateDirPath, projectDirPath);

    const iconPath = OS.Path.join(projectDirPath, "thumbnail.png");
    const iconExists = await OS.File.exists(iconPath);
    const icon = iconExists ? OS.Path.toFileURI(iconPath) : null;

    return new Project(name, finalDestUri, icon);
  }

  static async open(uri) {
    const path = OS.Path.fromFileURI(uri);
    const name = OS.Path.basename(path);
    const iconPath = OS.Path.join(path, "thumbnail.png");
    const iconExists = await OS.File.exists(iconPath);
    const icon = iconExists ? OS.Path.toFileURI(iconPath) : null;
    return new Project(name, uri, icon);
  }
}
