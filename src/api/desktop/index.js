const { OS } = Components.utils.import("resource://gre/modules/osfile.jsm");
const { FileUtils } = Components.utils.import("resource://gre/modules/FileUtils.jsm");
const { Services } = Components.utils.import("resource://gre/modules/Services.jsm", {});
const FilePicker = Components.classes["@mozilla.org/filepicker;1"];
const Process = Components.classes["@mozilla.org/process/util;1"];
import Project from "./Project";
import { getDirectoryEntries, writeJSONAtomic, readJSON, copyRecursive, getFileName } from "./utils";

export function uriToPath(path) {
  return OS.Path.fromFileURI(path);
}

export function pathToUri(path) {
  return OS.Path.toFileURI(path);
}

const APP_NAME = "Hubs Editor";
const EDITOR_DIRECTORY_PATH = OS.Path.join(OS.Constants.Path.homeDir, APP_NAME);
const TEMPLATES_PATH = OS.Path.join(EDITOR_DIRECTORY_PATH, "templates");
const PROJECTS_PATH = OS.Path.join(EDITOR_DIRECTORY_PATH, "projects");
const WORKSPACE_PATH = OS.Path.join(EDITOR_DIRECTORY_PATH, "workspace.json");
export const DEFAULT_PROJECT_DIR_URI = pathToUri(PROJECTS_PATH);

const DEFAULT_WORKSPACE = {
  recentProjects: []
};

let APP_DIR_PATH;
let RESOURCES_PATH;

export async function init() {
  // Get the Gecko Runtime Engine path
  const gredPath = Services.dirsvc.get("GreD", Components.interfaces.nsIFile).path;
  const webappPath = OS.Path.join(gredPath, "webapp");

  if (!(await OS.File.exists(webappPath))) {
    const WORK_DIR_PATH = Services.dirsvc.get("CurWorkD", Components.interfaces.nsIFile).path;
    APP_DIR_PATH = OS.Path.join(WORK_DIR_PATH, "desktop");
  } else {
    APP_DIR_PATH = webappPath;
  }

  RESOURCES_PATH = OS.Path.join(APP_DIR_PATH, "resources");

  if (!(await OS.File.exists(EDITOR_DIRECTORY_PATH))) {
    await OS.File.makeDir(EDITOR_DIRECTORY_PATH, { ignoreExisting: true });
    await copyRecursive(RESOURCES_PATH, EDITOR_DIRECTORY_PATH);
    await OS.File.makeDir(PROJECTS_PATH, { ignoreExisting: true });
    await writeJSONAtomic(WORKSPACE_PATH, DEFAULT_WORKSPACE, false);
  }
}

export async function getTemplateProjects() {
  const templateEntries = await getDirectoryEntries(TEMPLATES_PATH);

  const projects = [];

  for (const templateEntry of templateEntries) {
    if (templateEntry.isDir) {
      const templateURI = OS.Path.toFileURI(templateEntry.path);
      const project = await Project.open(templateURI);
      projects.push(project);
    }
  }

  return projects;
}

export async function getRecentProjects() {
  const { recentProjects } = await readJSON(WORKSPACE_PATH);

  const projects = [];

  for (const recentProjectPath of recentProjects) {
    try {
      const fileInfo = await OS.File.stat(recentProjectPath);

      if (fileInfo.isDir) {
        const recentProjectURI = OS.Path.toFileURI(fileInfo.path);
        const recentProject = await Project.open(recentProjectURI);
        projects.push(recentProject);
      }
    } catch (e) {
      // Skip missing project.
    }
  }

  return projects;
}

export async function openProject(projectUri) {
  return await Project.open(projectUri);
}

export async function createProjectFromTemplate(name, templateURI, projectDirUri) {
  return await Project.createFromTemplate(name, templateURI, projectDirUri);
}

export async function addRecentProject(projectDirUri) {
  const workspace = await readJSON(WORKSPACE_PATH);
  const recentProjects = workspace.recentProjects;

  const projectDirPath = OS.Path.fromFileURI(projectDirUri);
  const projectIndex = recentProjects.indexOf(projectDirPath);

  if (projectIndex !== -1) {
    recentProjects.splice(projectIndex, 1);
  }

  recentProjects.unshift(projectDirPath);

  workspace.recentProjects = recentProjects;

  await writeJSONAtomic(WORKSPACE_PATH, workspace, true);
}

export async function browseDirectory(options) {
  return new Promise(resolve => {
    const fp = FilePicker.createInstance(Components.interfaces.nsIFilePicker);

    fp.init(window, options.title, Components.interfaces.nsIFilePicker.modeGetFolder);

    fp.open(rv => {
      if (rv == Components.interfaces.nsIFilePicker.returnOK && fp.file) {
        resolve(OS.Path.toFileURI(fp.file.path));
      }

      resolve(null);
    });
  });
}

export function openFile(uri) {
  const file = new FileUtils.File(OS.Path.fromFileURI(uri));
  file.launch();
}

class ProcessObserver {
  constructor(process, resolve, reject) {
    this.process = process;
    this.resolve = resolve;
    this.reject = reject;

    Services.obs.addObserver(this, "quit-application-granted", false);
  }

  observe(subject, topic, data) {
    switch (topic) {
      case "process-finished":
        this.resolve(data);
        break;
      case "process-failed":
        this.reject(data);
        break;
      case "quit-application-granted":
        // Shut down any Node.js processes
        this.process.kill();
        break;
    }
  }
}

export async function runGLTFBundle(gltfUri, destDirUri) {
  const gltfPath = OS.Path.fromFileURI(gltfUri);
  const binPath = OS.Path.join(APP_DIR_PATH, "node_modules", ".bin");
  const nodePath = OS.Path.join(binPath, "node");
  const gltfBundlePath = OS.Path.join(binPath, "gltf-bundle");

  const name = getFileName(gltfPath);

  const bundleConfig = {
    name,
    version: "0.0.1",
    assets: [
      {
        name,
        src: "./" + name + ".gltf"
      }
    ]
  };

  const gltfDir = OS.Path.dirname(gltfPath);
  const bundleConfigPath = OS.Path.join(gltfDir, name + ".bundle.config.json");
  await writeJSONAtomic(bundleConfigPath, bundleConfig, true);

  const destDirPath = OS.Path.fromFileURI(destDirUri);

  const nodeExe = new FileUtils.File(nodePath);

  const gltfBundleProcess = Process.createInstance(Components.interfaces.nsIProcess);
  gltfBundleProcess.init(nodeExe);

  const args = [gltfBundlePath, gltfDir, "-o", destDirPath];

  return new Promise((resolve, reject) => {
    const observer = new ProcessObserver(process, resolve, reject);
    gltfBundleProcess.runAsync(args, args.length, observer);
  });
}
