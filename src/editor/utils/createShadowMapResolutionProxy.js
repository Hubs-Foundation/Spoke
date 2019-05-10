export default function createShadowMapResolutionProxy(light) {
  return new Proxy(light.shadow.mapSize, {
    set: (_target, propertyName, value) => {
      light.shadow.mapSize[propertyName] = value;

      // When we change the shadow map resolution, we need to destroy the texture
      // so that it actually resizes on the next render.
      if (light.shadow.map) {
        light.shadow.map.dispose();
        light.shadow.map = null;
      }

      return true;
    }
  });
}
