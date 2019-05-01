import EditorNodeMixin from "./EditorNodeMixin";
import THREE from "../../vendor/three";
import FloorPlan from "../objects/FloorPlan";
import Recast from "../recast/recast.js";
import ModelNode from "./ModelNode";
import GroundPlaneNode from "./GroundPlaneNode";
import BoxColliderNode from "./BoxColliderNode";

let recast = null;

function mergeMeshGeometries(meshes) {
  const geometries = [];

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

  if (geometries.length === 0) {
    return new THREE.BufferGeometry();
  }

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

  return THREE.BufferGeometryUtils.mergeBufferGeometries([geometry, flippedGeometry]);
}

async function yieldFor(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateHeightfield(geometry) {
  geometry.computeBoundingBox();
  const size = new THREE.Vector3();
  geometry.boundingBox.getSize(size);
  const heightfieldMesh = new THREE.Mesh(geometry);

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
      raycaster.intersectObject(heightfieldMesh, false, intersections);
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

  if (data.length === 0) {
    return null;
  }

  return { offset, distance, data };
}

export default class FloorPlanNode extends EditorNodeMixin(FloorPlan) {
  static nodeName = "Floor Plan";

  static legacyComponentName = "floor-plan";

  static disableTransform = true;

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

    const {
      autoCellSize,
      cellSize,
      cellHeight,
      agentHeight,
      agentRadius,
      agentMaxClimb,
      agentMaxSlope,
      regionMinSize
    } = json.components.find(c => c.name === "floor-plan").props;

    node.autoCellSize = autoCellSize;
    node.cellSize = cellSize;
    node.cellHeight = cellHeight;
    node.agentHeight = agentHeight;
    node.agentRadius = agentRadius;
    node.agentMaxClimb = agentMaxClimb;
    node.agentMaxSlope = agentMaxSlope;
    node.regionMinSize = regionMinSize;

    return node;
  }

  constructor(editor) {
    super(editor);
    this.autoCellSize = true;
    this.cellSize = 0.166;
    this.cellHeight = 0.1;
    this.agentHeight = 1.7;
    this.agentRadius = 0.5;
    this.agentMaxClimb = 0.3;
    this.agentMaxSlope = 45;
    this.regionMinSize = 4;
  }

  onSelect() {
    if (this.navMesh) {
      this.navMesh.visible = true;
    }
  }

  onDeselect() {
    if (this.navMesh) {
      this.navMesh.visible = false;
    }
  }

  generateNavGeometry(geometry) {
    if (!recast) {
      throw new Error("Recast module unavailable or not yet loaded.");
    }

    if (!geometry.attributes.position || geometry.attributes.position.count === 0) {
      const emptyGeometry = new THREE.BufferGeometry();
      emptyGeometry.setIndex([]);
      emptyGeometry.addAttribute("position", new THREE.Float32BufferAttribute([], 3));
      return emptyGeometry;
    }

    const box = new THREE.Box3().setFromBufferAttribute(geometry.attributes.position);
    const size = new THREE.Vector3();
    box.getSize(size);
    if (Math.max(size.x, size.y, size.z) > 2000) {
      throw new Error(
        `Scene is too large (${size.x.toFixed(3)} x ${size.y.toFixed(3)} x ${size.z.toFixed(3)}) ` +
          `to generate a floor plan.\n` +
          `You can un-check the "walkable" checkbox on models to exclude them from the floor plan.`
      );
    }

    const positions = geometry.attributes.position.array;
    const indices = new Int32Array(positions.length / 3);
    for (let i = 0; i < indices.length; i++) {
      indices[i] = i;
    }

    recast.loadArray(positions, indices);

    const area = size.x * size.z;

    // Tuned to produce cell sizes from ~0.5 to ~1.5 for areas from ~200 to ~350,000.
    const cellSize = this.autoCellSize ? Math.pow(area, 1 / 3) / 50 : this.cellSize;

    const objMeshStr = recast.build(
      cellSize, // cellSize
      this.cellHeight, // cellHeight
      this.agentHeight,
      this.agentRadius,
      this.agentMaxClimb,
      this.agentMaxSlope,
      this.regionMinSize,
      20, // regionMergeSize
      12, // edgeMaxLen
      1, // edgeMaxError
      3, // vertsPerPoly
      16, // detailSampleDist
      1 // detailSampleMaxError
    );

    const navPositions = [];
    const navIndices = [];

    // TODO; Dumb that recast returns an OBJ formatted string. We should have it return an array.
    const objLines = objMeshStr.split("@");

    for (const line of objLines) {
      const trimmedLine = line.trim();

      if (trimmedLine.length === 0) {
        continue;
      }

      const values = trimmedLine.split(" ");

      if (values[0] === "v") {
        navPositions.push(Number(values[1]));
        navPositions.push(Number(values[2]));
        navPositions.push(Number(values[3]));
      } else if (values[0] === "f") {
        navIndices.push(Number(values[1] - 1));
        navIndices.push(Number(values[2] - 1));
        navIndices.push(Number(values[3] - 1));
      } else {
        throw new Error(`Invalid objMesh line "${line}"`);
      }
    }

    const navGeometry = new THREE.BufferGeometry();
    navGeometry.setIndex(navIndices);
    navGeometry.addAttribute("position", new THREE.Float32BufferAttribute(navPositions, 3));

    return navGeometry;
  }

  async generate() {
    const collidableMeshes = [];
    const walkableMeshes = [];

    const groundPlaneNode = this.editor.scene.findNodeByType(GroundPlaneNode);

    if (groundPlaneNode && groundPlaneNode.walkable) {
      walkableMeshes.push(groundPlaneNode.walkableMesh);
    }

    const modelNodes = this.editor.scene.getNodesByType(ModelNode);

    for (const node of modelNodes) {
      const model = node.model;

      if (!model || !(node.collidable || node.walkable)) {
        continue;
      }

      model.traverse(child => {
        if (child.isMesh) {
          if (node.collidable) {
            collidableMeshes.push(child);
          }

          if (node.walkable) {
            walkableMeshes.push(child);
          }
        }
      });
    }

    const boxColliderNodes = this.editor.scene.getNodesByType(BoxColliderNode);

    for (const node of boxColliderNodes) {
      if (node.walkable) {
        const helperMesh = node.helper.object;
        const boxColliderMesh = new THREE.Mesh(helperMesh.geometry, new THREE.MeshBasicMaterial());
        boxColliderMesh.applyMatrix(node.matrixWorld);
        boxColliderMesh.updateMatrixWorld();
        walkableMeshes.push(boxColliderMesh);
      }
    }

    await yieldFor(5);

    const walkableGeometry = mergeMeshGeometries(walkableMeshes);
    const walkableNavGeometry = this.generateNavGeometry(walkableGeometry);
    const navMesh = new THREE.Mesh(walkableNavGeometry, new THREE.MeshBasicMaterial({ color: 0x0000ff }));

    if (this.editor.selected !== this) {
      navMesh.visible = false;
    }

    this.setNavMesh(navMesh);

    const heightfieldGeometry = mergeMeshGeometries(collidableMeshes);
    const collidableNavGeometry = this.generateNavGeometry(heightfieldGeometry);
    this.heightfield = await generateHeightfield(collidableNavGeometry);

    return this;
  }

  copy(source, recursive) {
    super.copy(source, recursive);
    this.autoCellSize = source.autoCellSize;
    this.cellSize = source.cellSize;
    this.cellHeight = source.cellHeight;
    this.agentHeight = source.agentHeight;
    this.agentRadius = source.agentRadius;
    this.agentMaxClimb = source.agentMaxClimb;
    this.agentMaxSlope = source.agentMaxSlope;
    this.regionMinSize = source.regionMinSize;
    return this;
  }

  serialize() {
    return super.serialize({
      "floor-plan": {
        autoCellSize: this.autoCellSize,
        cellSize: this.cellSize,
        cellHeight: this.cellHeight,
        agentHeight: this.agentHeight,
        agentRadius: this.agentRadius,
        agentMaxClimb: this.agentMaxClimb,
        agentMaxSlope: this.agentMaxSlope,
        regionMinSize: this.regionMinSize
      }
    });
  }

  prepareForExport() {
    super.prepareForExport();
    const material = this.navMesh.material;
    material.transparent = true;
    material.opacity = 0;
    this.addGLTFComponent("visible", { visible: false });
    this.addGLTFComponent("nav-mesh", {});

    if (this.heightfield) {
      this.addGLTFComponent("heightfield", this.heightfield);
    }
  }
}
