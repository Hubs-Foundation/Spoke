import EditorNodeMixin from "./EditorNodeMixin";
import THREE from "../../vendor/three";
import FloorPlan from "../objects/FloorPlan";
import ModelNode from "./ModelNode";
import GroundPlaneNode from "./GroundPlaneNode";
import BoxColliderNode from "./BoxColliderNode";
import mergeMeshGeometries from "../utils/mergeMeshGeometries";
import RecastClient from "../recast/RecastClient";
import HeightfieldClient from "../heightfield/HeightfieldClient";
import SpawnPointNode from "../nodes/SpawnPointNode";

const recastClient = new RecastClient();
const heightfieldClient = new HeightfieldClient();

export default class FloorPlanNode extends EditorNodeMixin(FloorPlan) {
  static nodeName = "Floor Plan";

  static legacyComponentName = "floor-plan";

  static disableTransform = true;

  static canAddNode(editor) {
    return editor.scene.findNodeByType(FloorPlanNode) === null;
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
    this.heightfieldMesh = null;
  }

  onSelect() {
    if (this.navMesh) {
      this.navMesh.visible = true;
    }

    if (this.heightfieldMesh) {
      this.heightfieldMesh.visible = true;
    }
  }

  onDeselect() {
    if (this.navMesh) {
      this.navMesh.visible = false;
    }

    if (this.heightfieldMesh) {
      this.heightfieldMesh.visible = false;
    }
  }

  async generate(signal) {
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

    const walkableGeometry = mergeMeshGeometries(walkableMeshes);

    const box = new THREE.Box3().setFromBufferAttribute(walkableGeometry.attributes.position);
    const size = new THREE.Vector3();
    box.getSize(size);
    if (Math.max(size.x, size.y, size.z) > 2000) {
      throw new Error(
        `Scene is too large (${size.x.toFixed(3)} x ${size.y.toFixed(3)} x ${size.z.toFixed(3)}) ` +
          `to generate a floor plan.\n` +
          `You can un-check the "walkable" checkbox on models to exclude them from the floor plan.`
      );
    }

    const area = size.x * size.z;

    // Tuned to produce cell sizes from ~0.5 to ~1.5 for areas from ~200 to ~350,000.
    const cellSize = this.autoCellSize ? Math.pow(area, 1 / 3) / 50 : this.cellSize;

    const navGeometry = await recastClient.buildNavMesh(
      walkableGeometry,
      {
        cellSize,
        cellHeight: this.cellHeight,
        agentHeight: this.agentHeight,
        agentRadius: this.agentRadius,
        agentMaxClimb: this.agentMaxClimb,
        agentMaxSlope: this.agentMaxSlope,
        regionMinSize: this.regionMinSize
      },
      signal
    );

    const navMesh = new THREE.Mesh(
      navGeometry,
      new THREE.MeshBasicMaterial({ color: 0x0000ff, transparent: true, opacity: 0.2 })
    );

    this.setNavMesh(navMesh);

    if (this.editor.selected === this) {
      navMesh.visible = true;
    }

    const heightfieldGeometry = mergeMeshGeometries(collidableMeshes);

    const spawnPoints = this.editor.scene.getNodesByType(SpawnPointNode);

    let minY = Number.POSITIVE_INFINITY;
    for (let j = 0; j < spawnPoints.length; j++) {
      minY = Math.min(minY, spawnPoints[j].position.y);
    }

    const heightfield = await heightfieldClient.buildHeightfield(
      heightfieldGeometry,
      { minY: minY, agentHeight: this.agentHeight },
      signal
    );

    this.setHeightfield(heightfield);

    if (this.heightfieldMesh) {
      this.remove(this.heightfieldMesh);
    }

    if (!heightfield) {
      this.heightfieldMesh = null;
    } else {
      const segments = heightfield.data[0].length;
      const heightfieldMeshGeometry = new THREE.PlaneBufferGeometry(
        heightfield.width,
        heightfield.length,
        segments - 1,
        segments - 1
      );
      heightfieldMeshGeometry.rotateX(-Math.PI / 2);
      const vertices = heightfieldMeshGeometry.attributes.position.array;

      for (let i = 0, j = 0, l = vertices.length; i < l / 3; i++, j += 3) {
        vertices[j + 1] = heightfield.data[Math.floor(i / segments)][i % segments];
      }

      const heightfieldMesh = new THREE.Mesh(
        heightfieldMeshGeometry,
        new THREE.MeshBasicMaterial({ wireframe: true, color: 0xffff00 })
      );

      this.heightfieldMesh = heightfieldMesh;

      this.add(heightfieldMesh);

      this.heightfieldMesh.layers.set(1);
      heightfieldMesh.position.set(heightfield.offset.x, 0, heightfield.offset.z);

      if (this.editor.selected !== this) {
        this.heightfieldMesh.visible = false;
      }
    }

    return this;
  }

  copy(source, recursive) {
    super.copy(source, recursive);

    for (const child of source.children) {
      if (recursive && child !== source.heightfieldMesh) {
        this.add(child.clone());
      }
    }

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
