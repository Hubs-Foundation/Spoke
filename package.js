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
  for (const platform of platforms) {
    const modules = glob.sync(`release/${platform}/*.node`);
    const executableName = `spoke-${platform}`;
    const executablePath = path.join(outputDir, appendExtension(executableName, platform));

    const zip = new JSZip();
    const spoke = zip.folder("Spoke");
    spoke.file(appendExtension("spoke", platform), readFilePromise(executablePath));
    for (const module of modules) {
      spoke.file(path.basename(module), readFilePromise(module));
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
