import path from "path";
import fs from "fs-extra";
import watch from "node-watch";
import { pathToUri, uriToPath } from "./utils";
import EventEmitter from "events";
import { PROJECTS_PATH } from "./index";

export default class Project extends EventEmitter {
  constructor(uri) {
    super();

    this.uri = uri;
    this.path = uriToPath(uri);
    this.name = path.parse(this.path).name;
    const iconPath = path.join(this.path, "thumbnail.png");
    const iconExists = fs.existsSync(iconPath);
    this.iconPath = iconExists ? iconPath : null;
    this.icon = iconExists ? pathToUri(iconPath) : null;

    this.watcher = null;
    this._fileHierarchy = null;
  }

  getFileHierarchy() {
    if (this._fileHierarchy) {
      return this._fileHierarchy;
    }

    function buildProjectNode(filePath, name, ext, uri) {
      if (!fs.lstatSync(filePath).isDirectory()) {
        return {
          name,
          ext,
          uri,
          isDirectory: false
        };
      }

      const directory = fs.readdirSync(filePath);

      const children = [];
      const files = [];

      for (const childName of directory) {
        const childPath = path.join(filePath, childName);
        const childExt = path.parse(childName).ext;
        const childUri = pathToUri(childPath);
        const childNode = buildProjectNode(childPath, childName, childExt, childUri);

        // children are visible in the tree view. Directories and gltf files can be expanded.
        if (childNode.isDirectory || childNode.ext === ".gltf" || childNode.ext === ".glb") {
          children.push(childNode);
        }

        files.push(childNode);
      }

      return {
        name,
        uri,
        children,
        files,
        isDirectory: true
      };
    }

    this._fileHierarchy = buildProjectNode(this.path, this.name, undefined, this.uri);

    return this._fileHierarchy;
  }

  addListener(event, callback) {
    super.addListener(event, callback);

    if (event === "hierarchychanged" && this.watcher === null) {
      this.watcher = watch(this.path, { recursive: true }, this.onHierarchyChanged);
    }
  }

  removeListener(event, callback) {
    super.removeListener(event, callback);

    if (event === "hierarchychanged" && this.listenerCount(event) === 0) {
      this.watcher.close();
      this.watcher = null;
    }
  }

  onHierarchyChanged = (event, name) => {
    this._fileHierarchy = null;
    const fileHierarchy = this.getFileHierarchy();
    this.emit("hierarchychanged", event, name, fileHierarchy);
  };

  close() {
    if (this.watcher) {
      this.watcher.close();
    }
  }

  static async create(name, templateUri, projectDirUri) {
    const templateDirPath = uriToPath(templateUri);
    const projectDirPath = path.join(uriToPath(projectDirUri) || PROJECTS_PATH, name);

    await fs.copy(templateDirPath, projectDirPath);

    const iconPath = path.join(projectDirPath, "thumbnail.png");
    const iconExists = fs.existsSync(iconPath);

    return {
      name,
      uri: pathToUri(projectDirPath),
      icon: iconExists ? pathToUri(iconPath) : null
    };
  }
}
