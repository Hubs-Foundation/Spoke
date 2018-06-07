import ReactDOM from "react-dom";
import React from "react";
import EditorContainer from "./containers/EditorContainer";
import "./global.scss";
import { init } from "./api";

const rootEl = document.createElement("div");
rootEl.id = "app";
document.body.appendChild(rootEl);

init()
  .then(() => {
    ReactDOM.render(<EditorContainer />, rootEl);
  })
  .catch(e => {
    throw e;
  });
