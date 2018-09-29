import THREE from "../three";
import BaseComponent from "./BaseComponent";
import { types } from "./utils";

const planeGeo = new THREE.CircleBufferGeometry(4000, 32);
const planeMat = new THREE.MeshBasicMaterial();

export default class GroundPlaneComponent extends BaseComponent {
  static componentName = "ground-plane";

  static componentDescription = "A flat ground plane that extends into the distance.";

  static iconClassName = "fa-square-full";

  static schema = [{ name: "color", type: types.color, default: "#4F3622" }];

  async updateProperty(propertyName, value) {
    await super.updateProperty(propertyName, value);
    if (propertyName === "color") {
      this._object.material.color.set(value);
    }
  }

  static async inflate(node, props) {
    const obj = new THREE.Mesh(planeGeo, planeMat);
    obj.position.y = -0.05;
    obj.rotation.x = -Math.PI / 2;
    node.add(obj);
    const component = await this._getOrCreateComponent(node, props, obj);
    obj.userData._dontExport = false;
    return component;
  }
}
