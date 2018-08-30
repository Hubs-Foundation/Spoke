import BaseComponent from "./BaseComponent";
import { types } from "./utils";

export default class SuperSpawnerComponent extends BaseComponent {
  static componentName = "super-spawner";

  static iconClassName = "fa-magic";

  static schema = [
    { name: "src", type: types.string, default: "" },
    { name: "useCustomSpawnPosition", type: types.boolean, default: false },
    { name: "spawnPosition", type: types.vector },
    // TODO: figure out how to serialize spawnRotation
    // { name: "useCustomSpawnRotation", type: types.boolean, default: false },
    // { name: "spawnRotation", type: types.euler },
    { name: "spawnCooldown", type: types.number, default: 1, min: 0 },
    { name: "centerSpawnedObject", type: types.boolean, default: false }
  ];
}
