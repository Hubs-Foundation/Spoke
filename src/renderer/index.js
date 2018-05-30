import ReactDOM from "react-dom";
import React from "react";
import EditorContainer from "./containers/EditorContainer";

const rootEl = document.createElement("div");
document.body.appendChild(rootEl);

ReactDOM.render(<EditorContainer />, rootEl);
