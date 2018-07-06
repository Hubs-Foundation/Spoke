import React from "react";
import Editor from "../editor/Editor";
import { registerGLTFComponents } from "../editor/components";

const editor = new Editor();
window.editor = editor;
registerGLTFComponents();
editor.onComponentsRegistered();
const EditorContext = React.createContext(editor);

export function withEditor(Component) {
  return function EditorContextComponent(props) {
    return <EditorContext.Consumer>{editor => <Component {...props} editor={editor} />}</EditorContext.Consumer>;
  };
}
