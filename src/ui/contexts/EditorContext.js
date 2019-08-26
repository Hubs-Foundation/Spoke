import React from "react";

export const EditorContext = React.createContext(null);

export const EditorContextProvider = EditorContext.Provider;

export function withEditor(Component) {
  return function EditorContextComponent(props) {
    return <EditorContext.Consumer>{editor => <Component {...props} editor={editor} />}</EditorContext.Consumer>;
  };
}
