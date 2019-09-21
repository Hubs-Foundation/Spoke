import findObject from "../utils/findObject";

export function getKitPieceComponent(object) {
  return (
    object.userData.gltfExtensions &&
    object.userData.gltfExtensions.MOZ_hubs_components &&
    object.userData.gltfExtensions.MOZ_hubs_components["kit-piece"]
  );
}

export function isPiece(object, pieceId) {
  const component = getKitPieceComponent(object);
  return component && component.id == pieceId;
}

export function findKitPiece(object, pieceId) {
  return findObject(object, child => isPiece(child, pieceId));
}
