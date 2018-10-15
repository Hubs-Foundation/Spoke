import Recast from "../vendor/recast/recast.js";

let recast = null;
Recast().then(r => {
  console.log("Recast WebAssembly module ready.");
  recast = r;
});

export function generateNavMesh(positions, indices) {
  if (!recast) {
    throw new Error("Recast module unavailable or not yet loaded.");
  }
  recast.loadArray(positions, indices);
  const objMesh = recast.build(
    0.25, // cellSize
    0.1, // cellHeight
    1.0, // agentHeight
    0.0001, // agentRadius
    0.5, // agentMaxClimb
    45, // agentMaxSlope
    4, // regionMinSize
    20, // regionMergeSize
    12, // edgeMaxLen
    1, // edgeMaxError
    3, // vertsPerPoly
    16, //detailSampleDist
    1 // detailSampleMaxError
  );
  // TODO; Dumb that recast returns an OBJ formatted string. We should have it return an array.
  return objMesh.split("@").reduce(
    (acc, line) => {
      line = line.trim();
      if (line.length === 0) return acc;
      const values = line.split(" ");
      if (values[0] === "v") {
        acc.navPosition[acc.navPosition.length] = Number(values[1]);
        acc.navPosition[acc.navPosition.length] = Number(values[2]);
        acc.navPosition[acc.navPosition.length] = Number(values[3]);
      } else if (values[0] === "f") {
        acc.navIndex[acc.navIndex.length] = Number(values[1]) - 1;
        acc.navIndex[acc.navIndex.length] = Number(values[2]) - 1;
        acc.navIndex[acc.navIndex.length] = Number(values[3]) - 1;
      } else {
        throw new Error(`Invalid objMesh line "${line}"`);
      }
      return acc;
    },
    { navPosition: [], navIndex: [] }
  );
}
