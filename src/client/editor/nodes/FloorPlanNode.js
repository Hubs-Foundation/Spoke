import EditorNodeMixin from "./EditorNodeMixin";
import THREE from "../../vendor/three";
import FloorPlan from "../objects/FloorPlan";
import Recast from "../recast/recast.js";
import ModelNode from "./ModelNode";
import GroundPlaneNode from "./GroundPlaneNode";
import absoluteToRelativeURL from "../utils/absoluteToRelativeURL";

let recast = null;

function generateNavMesh(positions, indices, cellSize) {
  if (!recast) {
    throw new Error("Recast module unavailable or not yet loaded.");
  }
  recast.loadArray(positions, indices);
  const objMesh = recast.build(
    cellSize,
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

async function yieldFor(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateHeightfield(mesh) {
  mesh.geometry.computeBoundingBox();
  const size = new THREE.Vector3();
  mesh.geometry.boundingBox.getSize(size);

  const maxSide = Math.max(size.x, size.z);
  const distance = Math.max(0.25, Math.pow(maxSide, 1 / 2) / 10);
  const resolution = Math.ceil(maxSide / distance);

  const data = [];

  const down = new THREE.Vector3(0, -1, 0);
  const position = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();
  const intersections = [];

  const offsetX = -size.x / 2;
  const offsetZ = -size.z / 2;

  let min = Infinity;
  for (let z = 0; z < resolution; z++) {
    data[z] = [];
    for (let x = 0; x < resolution; x++) {
      position.set(offsetX + x * distance, size.y / 2, offsetZ + z * distance);
      raycaster.set(position, down);
      intersections.length = 0;
      raycaster.intersectObject(mesh, false, intersections);
      let val;
      if (intersections.length) {
        val = -intersections[0].distance + size.y / 2;
      } else {
        val = -size.y / 2;
      }
      data[z][x] = val;
      if (val < min) {
        min = data[z][x];
      }
    }
    // Yield the main thread periodically, so that the browser doesn't lock up
    await yieldFor(5);
  }

  const offset = new THREE.Vector3(-size.x / 2, min, -size.z / 2);

  // Cannon.js will be consuming this data and it doesn't like heightfields with negative heights.
  for (let z = 0; z < resolution; z++) {
    for (let x = 0; x < resolution; x++) {
      data[z][x] -= min;
    }
  }

  return { offset, distance, data };
}

export default class FloorPlanNode extends EditorNodeMixin(FloorPlan) {
  static nodeName = "Floor Plan";

  static shouldDeserialize(entityJson) {
    const gltfModelComponent = entityJson.components.find(c => c.name === "gltf-model");
    const navMeshComponent = entityJson.components.find(c => c.name === "nav-mesh");
    return gltfModelComponent && navMeshComponent;
  }

  static load() {
    // Recast() doesn't actually return a promise so we wrap it in one.
    return new Promise(resolve => {
      Recast().then(r => {
        recast = r;
        resolve();
      });
    });
  }

  static async deserialize(editor, json) {
    const node = await super.deserialize(editor, json);

    const { src } = json.components.find(c => c.name === "gltf-model").props;

    const absoluteURL = new URL(src, editor.sceneUri).href;
    await node.loadNavMesh(absoluteURL);

    const heightfield = json.components.find(c => c.name === "heightfield");

    if (heightfield) {
      node.heightfield = heightfield.props;
    }

    return node;
  }

  constructor(editor) {
    super(editor);
    this.navMeshSrc = null;
  }

  onSelect() {
    this.visible = true;
  }

  onDeselect() {
    this.visible = false;
  }

  async generate(scene) {
    const geometries = [];

    const modelNodes = scene.getNodesByType(ModelNode);

    const meshes = [];

    for (const node of modelNodes) {
      const model = node.model;

      if (!node.includeInFloorPlan || !model) {
        continue;
      }

      model.traverse(child => {
        if (child.isMesh) {
          meshes.push(child);
        }
      });
    }

    for (const mesh of meshes) {
      let geometry = mesh.geometry;
      let attributes = geometry.attributes;

      if (!geometry.isBufferGeometry) {
        geometry = new THREE.BufferGeometry().fromGeometry(geometry);
        attributes = geometry.attributes;
      }

      if (!attributes.position || attributes.position.itemSize !== 3) return;

      if (geometry.index) geometry = geometry.toNonIndexed();

      const cloneGeometry = new THREE.BufferGeometry();
      cloneGeometry.addAttribute("position", geometry.attributes.position.clone());
      cloneGeometry.applyMatrix(mesh.matrixWorld);
      geometry = cloneGeometry;

      geometries.push(geometry);
    }

    const finalGeos = [];
    let heightfield;

    if (geometries.length) {
      const geometry = THREE.BufferGeometryUtils.mergeBufferGeometries(geometries);

      const flippedGeometry = geometry.clone();

      const positions = flippedGeometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 9) {
        const x0 = positions[i];
        const y0 = positions[i + 1];
        const z0 = positions[i + 2];
        const offset = 6;
        positions[i] = positions[i + offset];
        positions[i + 1] = positions[i + offset + 1];
        positions[i + 2] = positions[i + offset + 2];
        positions[i + offset] = x0;
        positions[i + offset + 1] = y0;
        positions[i + offset + 2] = z0;
      }

      const finalGeo = THREE.BufferGeometryUtils.mergeBufferGeometries([geometry, flippedGeometry]);

      const position = finalGeo.attributes.position.array;
      const index = new Int32Array(position.length / 3);
      for (let i = 0; i < index.length; i++) {
        index[i] = i;
      }

      const box = new THREE.Box3().setFromBufferAttribute(finalGeo.attributes.position);
      const size = new THREE.Vector3();
      box.getSize(size);
      if (Math.max(size.x, size.y, size.z) > 2000) {
        throw new Error(
          `Scene is too large (${size.x.toFixed(3)} x ${size.y.toFixed(3)} x ${size.z.toFixed(3)}) ` +
            `to generate a floor plan.\n` +
            `You can un-check the "Include in Floor Plan" checkbox on models to exclude them from the floor plan.`
        );
      }
      const area = size.x * size.z;
      // Tuned to produce cell sizes from ~0.5 to ~1.5 for areas from ~200 to ~350,000.
      const cellSize = Math.pow(area, 1 / 3) / 50;
      const { navPosition, navIndex } = generateNavMesh(position, index, cellSize);

      const navGeo = new THREE.BufferGeometry();
      navGeo.setIndex(navIndex);
      navGeo.addAttribute("position", new THREE.Float32BufferAttribute(navPosition, 3));

      heightfield = await generateHeightfield(new THREE.Mesh(navGeo));

      finalGeos.push(navGeo);
    }

    const groundPlaneNode = scene.findNodeByType(GroundPlaneNode);

    if (groundPlaneNode) {
      const groundPlaneMesh = groundPlaneNode.mesh;
      const origGroundPlaneGeo = groundPlaneMesh.geometry;
      const groundPlaneGeo = new THREE.BufferGeometry();
      groundPlaneGeo.setIndex(origGroundPlaneGeo.index);
      groundPlaneGeo.addAttribute("position", origGroundPlaneGeo.attributes.position.clone());
      groundPlaneGeo.applyMatrix(groundPlaneMesh.matrixWorld);
      finalGeos.push(groundPlaneGeo);
    }

    if (finalGeos.length === 0) return;

    const finalNavGeo =
      finalGeos.length === 1 ? finalGeos[0] : THREE.BufferGeometryUtils.mergeBufferGeometries(finalGeos);

    const navMesh = new THREE.Mesh(finalNavGeo, new THREE.MeshBasicMaterial({ color: 0x0000ff }));

    this.heightfield = heightfield || null;
    this.setNavMesh(navMesh);

    return this;
  }

  async loadNavMesh(src) {
    try {
      const { scene } = await this.editor.gltfCache.get(src);
      const navMesh = scene.getObjectByProperty("type", "Mesh");
      this.navMeshSrc = src;
      this.setNavMesh(navMesh);
    } catch (e) {
      console.warn("Floor plan could not be loaded. Regenerating...");
      await this.editor.generateFloorPlan();
      return;
    }
  }

  copy(source, recursive) {
    super.copy(source, recursive);
    this.navMeshSrc = source.navMeshSrc;
    return this;
  }

  serialize(sceneUri) {
    const json = super.serialize();

    json.components.push({
      name: "gltf-model",
      props: {
        src: absoluteToRelativeURL(sceneUri, this.navMeshSrc)
      }
    });

    json.components.push({
      name: "nav-mesh",
      props: {}
    });

    if (this.heightfield) {
      json.components.push({
        name: "heightfield",
        props: this.heightfield
      });
    }

    return json;
  }

  prepareForExport() {
    const material = this.navMesh.material;
    material.transparent = true;
    material.opacity = 0;

    this.userData.gltfExtensions = {
      HUBS_components: {
        visible: { visible: false },
        "nav-mesh": {}
      }
    };

    if (this.heightfield) {
      this.userData.gltfExtensions.HUBS_components.heightfield = this.heightfield;
    }
  }
}
