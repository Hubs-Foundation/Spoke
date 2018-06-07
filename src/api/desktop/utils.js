const { OS } = Components.utils.import("resource://gre/modules/osfile.jsm");

export function getFileExtension(path) {
  const basename = OS.Path.basename(path);
  return basename.split(".").pop();
}

export async function getDirectoryEntries(path) {
  const iterator = new OS.File.DirectoryIterator(path);
  const entries = await iterator.nextBatch();
  iterator.close();
  return entries;
}

export async function copyRecursive(srcPath, destPath) {
  const entries = await getDirectoryEntries(srcPath);

  for (const entry of entries) {
    const entryDest = OS.Path.join(destPath, entry.name);

    if (entry.isDir) {
      await OS.File.makeDir(entryDest);
      await copyRecursive(entry.path, entryDest);
    } else {
      await OS.File.copy(entry.path, entryDest);
    }
  }
}

export async function writeTextAtomic(path, data, overwrite) {
  const encoder = new TextEncoder();
  const byteArray = encoder.encode(data);

  try {
    await OS.File.writeAtomic(path, byteArray, { tmpPath: path + ".tmp", noOverwrite: !overwrite });
  } catch (e) {
    if (overwrite) {
      throw new Error("Error writing file:" + path + " " + e.message);
    }
  }
}

export async function writeJSONAtomic(path, data, overwrite) {
  await writeTextAtomic(path, JSON.stringify(data), overwrite);
}

export async function readText(path) {
  const decoder = new TextDecoder();
  const byteArray = await OS.File.read(path);
  return decoder.decode(byteArray);
}

export async function readJSON(path) {
  const text = await readText(path);
  return JSON.parse(text);
}
