// Builds an executable for each platform that will run the server hosting the editor code.
// Outputs the executables and archives into the /release directory.

const { exec } = require("pkg");

function buildRelease(targets, outPath, opts) {
  const args = ["bin/spoke", "--config", ".pkg.json", "--target", targets.join(","), "--out-path", outPath];
  return exec(args.concat(opts));
}

const outputDir = "release";
const platforms = ["linux", "macos", "win"];
const targets = platforms.map(p => `node10-${p}-x64`);

buildRelease(targets, outputDir, process.argv.slice(2));
