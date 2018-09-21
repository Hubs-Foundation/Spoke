import BaseComponent from "./BaseComponent";

export default class NavMeshComponent extends BaseComponent {
  static componentName = "nav-mesh";

  static componentDescription = "Sets the walkable surface area in your scene.";

  static iconClassName = "fa-shoe-prints";

  static schema = [];
}
