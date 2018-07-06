import BaseComponent from "./BaseComponent";
import { types } from "./utils";
import { loadScene } from "../SceneLoader";
import { gltfComponents } from "../ComponentRegistry";

export default class SceneReferenceComponent extends BaseComponent {
  static componentName = "scene-reference";

  static schema = [{ name: "src", type: types.file, default: "" }];

  _updateComponentProperty(propertyName, value) {
    super._updateComponentProperty(propertyName, value);

    if (propertyName === "src") {
      loadScene(value, gltfComponents, false)
        .then(scene => {
          scene.userData._dontShowInHierarchy = true;
          this._object.add(scene);
        })
        .catch(e => {
          console.error(e);
        });
    }
  }

  static inflate(node, props) {
    const { component } = this._getOrCreateComponent(node, props);
    Object.defineProperty(component, "_object", { enumerable: false, value: node });
    component._updateComponentProperty("src", props.src);
    return component;
  }
}
