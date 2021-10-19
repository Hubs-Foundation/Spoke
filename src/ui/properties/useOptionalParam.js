import { useCallback } from "react";

export default function useOptionalParam(node, editor, componentName, propName, defaultValue) {
  return {
    onChange: useCallback(value => editor.setPropertySelected(propName, value), [editor, propName]),
    onEnable: useCallback(
      value =>
        editor.setPropertySelected("modifiedProperties", {
          [componentName]: {
            [propName]: value
          }
        }),
      [editor, componentName, propName]
    ),
    enabled: node.modifiedProperties[componentName] ? node.modifiedProperties[componentName][propName] : false,
    onReset: useCallback(() => editor.setPropertySelected(propName, defaultValue), [editor, propName, defaultValue]),
    reset: node[propName] !== defaultValue
  };
}
