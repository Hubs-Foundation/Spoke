import { useCallback } from "react";

export default function useSetPropertySelected(editor, propName) {
  return useCallback(value => editor.setPropertySelected(propName, value), [editor, propName]);
}
