import { useCallback } from "react";

export default function useOptionalParam(node, editor, componentName, propName, defaultValue) {
  return {
    onChange: useCallback(
      value => {
        editor.setPropertySelected(propName, value);
        editor.setPropertySelected("modifiedProperties", {
          [componentName]: {
            [propName]: true
          }
        });
      },
      [componentName, editor, propName]
    ),
    onReset: useCallback(() => {
      editor.setPropertySelected(propName, defaultValue);
      editor.setPropertySelected("modifiedProperties", {
        [componentName]: {
          [propName]: false
        }
      });
    }, [editor, propName, defaultValue, componentName]),
    reset:
      node[propName] !== defaultValue ||
      (node.modifiedProperties[componentName] ? node.modifiedProperties[componentName].includes(propName) : false)
  };
}
