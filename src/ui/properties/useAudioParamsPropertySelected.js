import { useCallback } from "react";
import { Defaults } from "../../editor/objects/AudioParams";

export function useAudioParamsPropertySelected(editor, sourceType, propName, scenePropName) {
  const targetPropName = (scenePropName && scenePropName) || propName;
  return [
    useCallback(value => editor.setPropertySelected(targetPropName, value), [editor, targetPropName]),
    useCallback(value => editor.setPropertySelected("enabledProperties", { [targetPropName]: value }), [
      editor,
      targetPropName
    ]),
    useCallback(() => editor.setPropertySelected(targetPropName, Defaults[sourceType][propName]), [
      editor,
      targetPropName,
      sourceType,
      propName
    ])
  ];
}
