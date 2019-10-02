export function getComponents(object) {
  return (
    object.userData.gltfExtensions &&
    object.userData.gltfExtensions.MOZ_hubs_components &&
    object.userData.gltfExtensions.MOZ_hubs_components
  );
}

export function getComponent(object, componentName) {
  const components = getComponents(object);
  return components && components[componentName];
}
