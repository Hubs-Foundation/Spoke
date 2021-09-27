import { useCallback } from "react";

export default function useEnablePropertySelected(editor, propName) {
  return [
    useCallback(value => editor.setPropertySelected(propName, value), [editor, propName]),
    useCallback(value => editor.setPropertySelected("enabledProperties", { [propName]: value }), [editor, propName])
  ];
}
