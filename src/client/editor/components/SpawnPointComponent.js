import THREE from "../three";
import BaseComponent from "./BaseComponent";
import spawnPointIconUrl from "../../assets/spawn-point.png";

const spawnPointIcon = new THREE.TextureLoader().load(spawnPointIconUrl);

export default class SpawnPointComponent extends BaseComponent {
  static componentName = "spawn-point";

  static componentDescription =
    "A point where people will appear when they enter your scene.\nThe icon in your scene represents the actual size of an avatar.";

  static iconClassName = "fa-street-view";

  static schema = [];

  static async inflate(node, _props) {
    const spriteMaterial = new THREE.SpriteMaterial({ map: spawnPointIcon });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.layers.set(1);
    sprite.position.set(0, 0.5, 0);
    const component = await this._getOrCreateComponent(node, _props, sprite);
    node.add(sprite);
    return component;
  }
}
