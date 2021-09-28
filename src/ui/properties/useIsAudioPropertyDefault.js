import { useCallback } from "react";
import { Defaults } from "../../editor/objects/AudioParams";

export function useIsAudioPropertyDefault(node) {
  return useCallback(
    (propName, sourceType) => {
      return node[propName] === Defaults[sourceType][propName];
    },
    [node]
  );
}

export function useIsSceneAudioPropertyDefault(node) {
  return useCallback(
    (propName, scenePropName, sourceType) => {
      return node[scenePropName] === Defaults[sourceType][propName];
    },
    [node]
  );
}
