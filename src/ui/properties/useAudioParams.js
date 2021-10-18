import { useCallback } from "react";
import { Defaults } from "../../editor/objects/AudioParams";

export default function useAudioParams(node, editor, sourceType, propName, scenePropName) {
  const targetPropName = (scenePropName && scenePropName) || propName;
  return {
    onChange: useCallback(value => editor.setPropertySelected(targetPropName, value), [editor, targetPropName]),
    onEnable: useCallback(value => editor.setPropertySelected("enabledProperties", { [targetPropName]: value }), [
      editor,
      targetPropName
    ]),
    enabled: node.enabledProperties[targetPropName],
    onReset: useCallback(() => editor.setPropertySelected(targetPropName, Defaults[sourceType][propName]), [
      editor,
      targetPropName,
      sourceType,
      propName
    ]),
    reset: node[targetPropName] !== Defaults[sourceType][propName]
  };
}
