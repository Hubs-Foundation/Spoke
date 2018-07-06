export const gltfComponents = new Map();

export function registerGLTFComponent(componentClass) {
  const { componentName } = componentClass;

  if (gltfComponents.has(componentName)) {
    throw new Error(`${componentName} already registered`);
  }

  gltfComponents.set(componentName, componentClass);
}
