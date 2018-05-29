import ReactDOM from "react-dom";
import React from "react";

import ProjectWindow from "./windows/ProjectWindow";
import EditorWindow from "./windows/EditorWindow";
import ExportWindow from "./windows/ExportWindow";

const rootEl = document.createElement("div");
document.body.appendChild(rootEl);

ReactDOM.render(<ProjectWindow />, rootEl);
