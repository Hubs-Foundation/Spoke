import ReactDOM from "react-dom";
import React from "react";
import EditorContainer from "./ui/EditorContainer";
import "./global.scss";

const rootEl = document.createElement("div");
rootEl.id = "app";
document.body.appendChild(rootEl);

ReactDOM.render(<EditorContainer />, rootEl);
