import { useCallback } from "react";
import { Defaults } from "../../editor/objects/AudioParams";

export function useAudioParamsPropertySelected(editor, sourceType, propName) {
  return [
    useCallback(value => editor.setPropertySelected(propName, value), [editor, propName]),
    useCallback(value => editor.setPropertySelected("enabledProperties", { [propName]: value }), [editor, propName]),
    useCallback(() => editor.setPropertySelected(propName, Defaults[sourceType][propName]), [
      editor,
      propName,
      sourceType
    ])
  ];
}

export function useSceneAudioParamsPropertySelected(editor, sourceType, propName, scenePropName) {
  return [
    useCallback(value => editor.setPropertySelected(scenePropName, value), [editor, scenePropName]),
    useCallback(value => editor.setPropertySelected("enabledProperties", { [scenePropName]: value }), [
      editor,
      scenePropName
    ]),
    useCallback(() => editor.setPropertySelected(scenePropName, Defaults[sourceType][propName]), [
      editor,
      propName,
      scenePropName,
      sourceType
    ])
  ];
}
