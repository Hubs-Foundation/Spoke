import ReactDOM from "react-dom";
import React from "react";
import EditorContainer from "./ui/EditorContainer";
import Editor from "./editor/Editor";
import Project from "./editor/Project";
import qsTruthy from "./utils/qs-truthy.js";
import "./global.scss";

const rootEl = document.createElement("div");
rootEl.id = "app";
document.body.appendChild(rootEl);

const project = new Project();
const editor = new Editor(project);
window.editor = editor;

const uiMode = qsTruthy("advanced") ? "advanced" : "basic";

ReactDOM.render(<EditorContainer uiMode={uiMode} editor={editor} />, rootEl);
