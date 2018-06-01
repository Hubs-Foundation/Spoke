import React from "react";
import Editor from "../editor/Editor";

const editor = new Editor();
const EditorContext = React.createContext(editor);

export function withEditor(Component) {
  return function EditorContextComponent(props) {
    return <EditorContext.Consumer>{editor => <Component {...props} editor={editor} />}</EditorContext.Consumer>;
  };
}
