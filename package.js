// Builds a release archive for each platform, containing an executable for that platform
// that will run the server hosting the editor code as well as any native Node modules.
// Outputs the executables and archives into the /release directory.

const { exec } = require("pkg");
const util = require("util");
const glob = require("glob");
const fs = require("fs");
const path = require("path");
const JSZip = require("jszip");

function buildRelease(targets, outPath, opts) {
  const args = ["bin/spoke", "--config", ".pkg.json", "--target", targets.join(","), "--out-path", outPath];
  return exec(args.concat(opts));
}

function appendExtension(executableName, platform) {
  return platform === "win" ? `${executableName}.exe` : executableName;
}

const outputDir = "release";
const platforms = ["linux", "macos", "win"];
const targets = platforms.map(p => `node10-${p}-x64`);
const readFilePromise = util.promisify(fs.readFile);

buildRelease(targets, outputDir, process.argv.slice(2)).then(() => {
  // if we were really clever we could distinguish runtime dependencies from dev dependencies
  // and then just hoover up all runtime-required .node files in node_modules, but we aren't that clever
  const modules = glob.sync("node_modules/**/RecastCLI.node");
  for (const platform of platforms) {
    const executableName = `spoke-${platform}`;
    const executablePath = path.join(outputDir, appendExtension(executableName, platform));

    const zip = new JSZip();
    zip.file(appendExtension("spoke", platform), readFilePromise(executablePath));
    for (const module of modules) {
      zip.file(path.basename(module), readFilePromise(module));
    }

    const archivePath = path.join(outputDir, `${executableName}.zip`);
    const archiveStream = zip.generateNodeStream({
      type: "nodebuffer",
      streamFiles: true,
      compression: "DEFLATE",
      compressionOptions: {
        level: 5
      }
    });
    archiveStream.pipe(fs.createWriteStream(archivePath));
  }
});
