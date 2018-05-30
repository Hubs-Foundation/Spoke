import electron from "electron";
import path from "path";
import glob from "glob-promise";
import fs from "fs-extra";

const DOCUMENTS_PATH = electron.remote.app.getPath("documents");
const APP_NAME = electron.remote.app.getName();
const EDITOR_DIRECTORY_PATH = path.join(DOCUMENTS_PATH, APP_NAME);
const TEMPLATES_PATH = path.join(EDITOR_DIRECTORY_PATH, "templates");

export async function ensureEditorDirectory() {
  await fs.ensureDir(EDITOR_DIRECTORY_PATH);
  await fs.ensureDir(TEMPLATES_PATH);
}

export async function getTemplates() {
  await ensureEditorDirectory();

  const templatesGlob = path.join(TEMPLATES_PATH, "**", "*.template.gltf");
  const templatePaths = await glob(templatesGlob);

  return templatePaths.map(uri => {
    const { dir, name } = path.parse(uri);
    const iconPath = path.join(dir, name + ".png");
    const iconExists = fs.existsSync(iconPath);

    return {
      name: name.split(".template")[0],
      uri: "file://" + uri,
      icon: iconExists ? "file://" + iconPath : null
    };
  });
}
