export function addIsHelperFlag(helperRoot) {
  helperRoot.traverse(child => {
    if (child.isMesh || child.isLine || child.isSprite) {
      child.isHelper = true;
    }
  });
}
