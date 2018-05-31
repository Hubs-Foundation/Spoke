import electron from "electron";
import path from "path";
import fs from "fs-extra";

const DOCUMENTS_PATH = electron.remote.app.getPath("documents");
const APP_NAME = electron.remote.app.getName();
const EDITOR_DIRECTORY_PATH = path.join(DOCUMENTS_PATH, APP_NAME);
const TEMPLATES_PATH = path.join(EDITOR_DIRECTORY_PATH, "templates");
const PROJECTS_PATH = path.join(EDITOR_DIRECTORY_PATH, "projects");
const RECENT_PROJECTS_KEY = "recent-projects";

export function uriToPath(path) {
  return path.replace("file://", "");
}

export function pathToUri(path) {
  return "file://" + path;
}

export const isNative = true;

async function ensureEditorDirectory() {
  await fs.ensureDir(EDITOR_DIRECTORY_PATH);
  await fs.ensureDir(TEMPLATES_PATH);
  await fs.ensureDir(PROJECTS_PATH);
}

export const DEFAULT_PROJECT_DIR_URI = pathToUri(PROJECTS_PATH);

function getProjectObjects(projectPaths, ensure) {
  return projectPaths.reduce((acc, projectPath) => {
    if (ensure && !fs.existsSync(projectPath)) {
      return acc;
    }

    const iconPath = path.join(projectPath, "thumbnail.png");
    const iconExists = fs.existsSync(iconPath);

    acc.push({
      name: path.parse(projectPath).name,
      uri: pathToUri(projectPath),
      icon: iconExists ? pathToUri(iconPath) : null
    });

    return acc;
  }, []);
}

export async function getTemplates() {
  await ensureEditorDirectory();

  const templateDirs = await fs.readdir(TEMPLATES_PATH);

  const templatePaths = templateDirs
    .map(templateDir => path.join(TEMPLATES_PATH, templateDir))
    .filter(templatePath => fs.lstatSync(templatePath).isDirectory());

  return getProjectObjects(templatePaths);
}

export async function getRecentProjects() {
  const projectPaths = JSON.parse(localStorage.getItem(RECENT_PROJECTS_KEY)) || [];

  return getProjectObjects(projectPaths, true);
}

export async function addRecentProject(projectDirUri) {
  const projectDirPath = uriToPath(projectDirUri);

  const recentProjects = JSON.parse(localStorage.getItem(RECENT_PROJECTS_KEY)) || [];

  const projectIndex = recentProjects.indexOf(projectDirPath);

  if (projectIndex !== -1) {
    recentProjects.splice(projectIndex, 1);
  }

  recentProjects.unshift(projectDirPath);

  localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(recentProjects));
}

export async function createProject(name, templateUri, projectDirUri) {
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

export async function browseDirectory(options) {
  return new Promise(resolve => {
    electron.remote.dialog.showOpenDialog(
      undefined,
      {
        title: options.title,
        defaultPath: options.defaultPath,
        buttonLabel: options.buttonLabel,
        properties: ["openDirectory", "createDirectory"]
      },
      filePaths => {
        if (!filePaths || filePaths.length === 0) {
          resolve(null);
        } else {
          resolve(pathToUri(filePaths[0]));
        }
      }
    );
  });
}
