import { Object3D } from "three";
import { GLTFLoader } from "../gltf/GLTFLoader";
import EditorNodeMixin from "./EditorNodeMixin";
import wayPointModelUrl from "../../assets/spawn-point.glb";
import eventToMessage from "../utils/eventToMessage";

let wayPointHelperModel = null;

export default class WayPointNode extends EditorNodeMixin(Object3D) {
  static legacyComponentName = "waypoint";

  static nodeName = "Way Point";

  static async load() {
    try {
      const { scene } = await new GLTFLoader(wayPointModelUrl).loadGLTF();

      scene.traverse(child => {
        if (child.isMesh) {
          child.layers.set(1);
        }
      });

      wayPointHelperModel = scene;
    } catch (error) {
      throw new Error(`Error loading WayPointNode helper with url: ${wayPointModelUrl}. ${eventToMessage(error)}`);
    }
  }

  constructor(editor) {
    super(editor);
    this.canBeSpawnPoint = false;
    this.canBeOccupied = false;
    this.canBeClicked = false;
    this.willDisableMotion = false;

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
        willDisableMotion: this.willDisableMotion
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
    return node;
  }

  prepareForExport() {
    super.prepareForExport();
    this.remove(this.helper);
    this.addGLTFComponent("waypoint", {
      canBeSpawnPoint: this.canBeSpawnPoint,
      canBeOccupied: this.canBeOccupied,
      canBeClicked: this.canBeClicked,
      willDisableMotion: this.willDisableMotion
    });
    this.addGLTFComponent("networked", {
      id: this.uuid
    });
  }
}
