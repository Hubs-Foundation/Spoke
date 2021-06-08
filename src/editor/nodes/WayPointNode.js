import { Object3D } from "three";
import { GLTFLoader } from "../gltf/GLTFLoader";
import EditorNodeMixin from "./EditorNodeMixin";
import wayPointModelUrl from "../../assets/spawn-point.glb";

let wayPointHelperModel = null;

export default class WayPointNode extends EditorNodeMixin(Object3D) {
  static componentName = "waypoint";

  static nodeName = "Way Point";

  static async load() {
    const { scene } = await new GLTFLoader(wayPointModelUrl).loadGLTF();

    scene.traverse(child => {
      if (child.isMesh) {
        child.layers.set(1);
      }
    });

    wayPointHelperModel = scene;
  }

  constructor(editor) {
    super(editor);
    this.canBeSpawnPoint = false;
    this.canBeOccupied = false;
    this.canBeClicked = false;
    this.willDisableMotion = false;
    this.willDisableTeleporting = false;
    this.snapToNavMesh = false;
    this.willMaintainInitialOrientation = false;

    if (wayPointHelperModel) {
      this.helper = wayPointHelperModel.clone();
      this.add(this.helper);
    } else {
      console.warn("WayPointNode: helper model was not loaded before creating a new WayPointNode");
      this.helper = null;
    }
  }

  copy(source, recursive = true) {
    if (recursive) {
      this.remove(this.helper);
    }

    this.canBeSpawnPoint = source.canBeSpawnPoint;
    this.canBeOccupied = source.canBeOccupied;
    this.canBeClicked = source.canBeClicked;
    this.willDisableMotion = source.willDisableMotion;
    this.willDisableTeleporting = source.willDisableTeleporting;
    this.snapToNavMesh = source.snapToNavMesh;
    this.willMaintainInitialOrientation = source.willMaintainInitialOrientation;
    super.copy(source, recursive);

    if (recursive) {
      const helperIndex = source.children.findIndex(child => child === source.helper);

      if (helperIndex !== -1) {
        this.helper = this.children[helperIndex];
      }
    }

    return this;
  }

  serialize() {
    return super.serialize({
      waypoint: {
        canBeSpawnPoint: this.canBeSpawnPoint,
        canBeOccupied: this.canBeOccupied,
        canBeClicked: this.canBeClicked,
        willDisableMotion: this.willDisableMotion,
        willDisableTeleporting: this.willDisableTeleporting,
        snapToNavMesh: this.snapToNavMesh,
        willMaintainInitialOrientation: this.willMaintainInitialOrientation
      }
    });
  }

  static async deserialize(editor, json) {
    const node = await super.deserialize(editor, json);

    const waypoint = json.components.find(c => c.name === "waypoint");

    node.canBeSpawnPoint = waypoint.props.canBeSpawnPoint;
    node.canBeOccupied = waypoint.props.canBeOccupied;
    node.canBeClicked = waypoint.props.canBeClicked;
    node.willDisableMotion = waypoint.props.willDisableMotion;
    node.willDisableTeleporting = waypoint.props.willDisableTeleporting;
    node.snapToNavMesh = waypoint.props.snapToNavMesh;
    node.willMaintainInitialOrientation = waypoint.props.willMaintainInitialOrientation;
    return node;
  }

  prepareForExport() {
    super.prepareForExport();
    this.remove(this.helper);
    this.addGLTFComponent("waypoint", {
      canBeSpawnPoint: this.canBeSpawnPoint,
      canBeOccupied: this.canBeOccupied,
      canBeClicked: this.canBeClicked,
      willDisableMotion: this.willDisableMotion,
      willDisableTeleporting: this.willDisableTeleporting,
      snapToNavMesh: this.snapToNavMesh,
      willMaintainInitialOrientation: this.willMaintainInitialOrientation
    });
    this.addGLTFComponent("networked", {
      id: this.uuid
    });
  }
}
