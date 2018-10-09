import BaseComponent from "./BaseComponent";
import GLTFModelComponent from "./GLTFModelComponent";
import { types } from "./utils";

function getAnimationClips(component) {
  const gltfModel = GLTFModelComponent.getComponent(component._node);

  const animations = [{ value: null, label: "None" }];

  if (gltfModel && gltfModel._object && gltfModel._object.animations) {
    const animationClips = gltfModel._object.animations;
    for (const clip of animationClips) {
      animations.push({ value: clip.name, label: clip.name });
    }
  }

  return animations;
}

export default class LoopAnimationComponent extends BaseComponent {
  static componentName = "loop-animation";

  static iconClassName = "fa-redo";

  static schema = [{ name: "clip", type: types.select, options: getAnimationClips, default: null }];
}
