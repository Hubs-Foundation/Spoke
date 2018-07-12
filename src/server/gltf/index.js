import path from "path";
import crypto from "crypto";
import fs from "fs-extra";

export default function hashFileName(resourcePath, content) {
  const { name, ext } = path.parse(resourcePath);
  const hash = crypto.createHash("md5");
  const digest = hash
    .update(content)
    .digest("hex")
    .substr(0, 10);

  if (ext === ".gltf") {
    return name + "-" + digest + ext;
  }

  return digest + ext;
}

export async function contentHashAndCopy(resourceArray, srcDir, destDir, move) {
  if (Array.isArray(resourceArray)) {
    for (const resource of resourceArray) {
      if (resource.uri) {
        const resourcePath = path.resolve(srcDir, resource.uri);
        const content = await fs.readFile(resourcePath);
        const fileName = hashFileName(resourcePath, content);
        const destResourcePath = path.join(destDir, fileName);

        if (move) {
          await fs.move(resourcePath, destResourcePath, {
            overwrite: true
          });
        } else {
          await fs.copy(resourcePath, destResourcePath, {
            overwrite: true
          });
        }

        resource.uri = fileName;
      }
    }
  }

  return resourceArray;
}
