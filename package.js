// Builds a release archive for each platform, containing an executable for that platform
// that will run the server hosting the editor code.
// Outputs the executables and archives into the /release directory.

const { exec } = require("pkg");
const fs = require("fs");
const path = require("path");
const { ZipFile } = require("yazl");

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

buildRelease(targets, outputDir, process.argv.slice(2)).then(() => {
  for (const platform of platforms) {
    const executableName = `spoke-${platform}`;
    const executablePath = path.join(outputDir, appendExtension(executableName, platform));
    const archivePath = path.join(outputDir, `${executableName}.zip`);
    const archiveStream = fs.createWriteStream(archivePath);

    const zip = new ZipFile();
    zip.outputStream.pipe(archiveStream);
    zip.addFile(executablePath, appendExtension("spoke", platform), { mode: 33277 });
    zip.end();
  }
});
